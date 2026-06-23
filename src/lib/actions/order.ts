"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  productVariants,
  products,
  sizes,
  colors,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getRazorpayClient, getRazorpayPublicKeyId } from "@/lib/payments/razorpay/client";
import { rupeesToPaise } from "@/lib/payments/money";
import { brand } from "@/config/brand";
import { z } from "zod";
import type { CartItem } from "@/store/cart";

// ── Input validation ──────────────────────────────────────────────────────────

const ContactSchema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().min(5, "Address line 1 required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  postalCode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
});

export type CheckoutContact = z.infer<typeof ContactSchema>;

export interface CreateOrderInput {
  contact: CheckoutContact;
  cartItems: CartItem[];
  userId?: string | null;
  guestId?: string | null;
}

export interface CreateOrderResult {
  ok: true;
  orderId: string;
  razorpayOrderId: string;
  amount: number;       // rupees
  amountPaise: number;
  currency: string;
  keyId: string;        // RAZORPAY_KEY_ID (safe to send to browser)
  receiptId: string;
  contactName: string;
  email: string;
  phone: string;
}

// ── Action ────────────────────────────────────────────────────────────────────

export async function createCheckoutOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  // 1. Validate contact
  const contactParsed = ContactSchema.safeParse(input.contact);
  if (!contactParsed.success) {
    const msgs = contactParsed.error.issues.map((e: { message: string }) => e.message).join("; ");
    throw new Error(`Validation: ${msgs}`);
  }
  const contact = contactParsed.data;

  if (!input.cartItems.length) {
    throw new Error("Cart is empty");
  }

  // 2. Fetch current variant prices/stock from DB (never trust client prices)
  const variantIds = input.cartItems.map((i) => i.variantId);
  const variantRows = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      price: productVariants.price,
      salePrice: productVariants.salePrice,
      inStock: productVariants.inStock,
      productId: productVariants.productId,
      productName: products.name,
      sizeName: sizes.name,
      colorName: colors.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .where(inArray(productVariants.id, variantIds));

  const variantMap = new Map(variantRows.map((v) => [v.id, v]));

  // 3. Validate stock + compute totals at server prices
  let subtotal = 0;
  const validatedItems: Array<{
    variantId: string;
    productName: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
  }> = [];

  for (const cartItem of input.cartItems) {
    const variant = variantMap.get(cartItem.variantId);
    if (!variant) {
      throw new Error(`Product variant ${cartItem.variantId} no longer exists`);
    }
    if (variant.inStock < cartItem.quantity) {
      throw new Error(
        `"${variant.productName}" is out of stock (requested ${cartItem.quantity}, available ${variant.inStock})`
      );
    }
    const unitPrice = Number(variant.salePrice ?? variant.price);
    subtotal += unitPrice * cartItem.quantity;
    validatedItems.push({
      variantId: variant.id,
      productName: variant.productName,
      variantLabel: `${variant.sizeName} – ${variant.colorName}`,
      quantity: cartItem.quantity,
      unitPrice,
    });
  }

  const shippingFee =
    subtotal >= brand.freeShippingThreshold ? 0 : brand.standardShippingFee;
  const totalAmount = subtotal + shippingFee;

  // 4. Create our internal pending order
  const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const [order] = await db
    .insert(orders)
    .values({
      userId: input.userId ?? null,
      guestId: input.guestId ?? null,
      status: "pending",
      subtotal: String(subtotal),
      shippingFee: String(shippingFee),
      totalAmount: String(totalAmount),
      currency: brand.currency,
      contactName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      shippingLine1: contact.line1,
      shippingLine2: contact.line2 ?? null,
      shippingCity: contact.city,
      shippingState: contact.state,
      shippingPostalCode: contact.postalCode,
      shippingCountry: "India",
      receiptId,
    })
    .returning();

  // 5. Insert order items
  await db.insert(orderItems).values(
    validatedItems.map((item) => ({
      orderId: order.id,
      productVariantId: item.variantId,
      productName: item.productName,
      variantLabel: item.variantLabel,
      quantity: item.quantity,
      priceAtPurchase: String(item.unitPrice),
    }))
  );

  // 6. Create Razorpay order (server-side, key secret never leaves here)
  const rzp = getRazorpayClient();
  const rzpOrder = await rzp.orders.create({
    amount: rupeesToPaise(totalAmount),
    currency: brand.currency,
    receipt: receiptId,
    notes: {
      orderId: order.id,
      customer: contact.fullName,
    },
  });

  // 7. Persist the Razorpay order id on our order
  await db
    .update(orders)
    .set({ razorpayOrderId: rzpOrder.id, updatedAt: new Date() })
    .where(eq(orders.id, order.id));

  return {
    ok: true,
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: totalAmount,
    amountPaise: rupeesToPaise(totalAmount),
    currency: brand.currency,
    keyId: getRazorpayPublicKeyId(),
    receiptId,
    contactName: contact.fullName,
    email: contact.email,
    phone: contact.phone,
  };
}

// ── Order lookup (used on confirmation pages) ─────────────────────────────────

export interface OrderSummary {
  id: string;
  status: string;
  totalAmount: number;
  currency: string;
  contactName: string | null;
  email: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  createdAt: Date;
  items: Array<{
    productName: string;
    variantLabel: string | null;
    quantity: number;
    priceAtPurchase: number;
  }>;
}

export async function getOrderSummary(orderId: string): Promise<OrderSummary | null> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return {
    id: order.id,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    contactName: order.contactName,
    email: order.email,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    createdAt: order.createdAt,
    items: items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantLabel,
      quantity: i.quantity,
      priceAtPurchase: Number(i.priceAtPurchase),
    })),
  };
}
