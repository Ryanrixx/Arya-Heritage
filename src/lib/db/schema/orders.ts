import { pgEnum, pgTable, uuid, timestamp, numeric, integer, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { users } from './user';
import { guests } from './guest';
import { addresses } from './addresses';
import { productVariants } from './variants';

/**
 * pending    -> order row created, payment not yet confirmed (Razorpay order created)
 * paid       -> payment captured and verified (signature + webhook confirmed)
 * processing -> order is being packed/prepared for dispatch
 * shipped    -> handed to courier
 * delivered  -> delivered to customer
 * cancelled  -> cancelled before fulfillment (no successful payment, or pre-shipment cancellation)
 * failed     -> payment attempt failed and was not retried into a paid order
 * refunded   -> a paid order was later refunded (full or partial)
 */
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'refunded',
]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),

  status: orderStatusEnum('status').notNull().default('pending'),

  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingFee: numeric('shipping_fee', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),

  // Snapshot contact + shipping details at time of purchase. These are
  // intentionally flat columns (not just a foreign key into `addresses`) so
  // that guest checkouts work without a user account, and so historical
  // orders stay accurate even if a customer later edits or deletes a saved
  // address. `shippingAddressId` is kept as an optional link to a saved
  // address in the account address book, for signed-in customers who choose
  // to reuse or save one — it is not required to place an order.
  contactName: text('contact_name'),
  email: text('email'),
  phone: text('phone'),

  shippingLine1: text('shipping_line1'),
  shippingLine2: text('shipping_line2'),
  shippingCity: text('shipping_city'),
  shippingState: text('shipping_state'),
  shippingPostalCode: text('shipping_postal_code'),
  shippingCountry: text('shipping_country').default('India'),

  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id, { onDelete: 'set null' }),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id, { onDelete: 'set null' }),

  // The Razorpay Order is created once per checkout attempt and reused across
  // retried payment attempts for that same order (see `payments` table for
  // the individual payment attempts against it).
  razorpayOrderId: text('razorpay_order_id').unique(),
  receiptId: text('receipt_id').unique(),

  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productVariantId: uuid('product_variant_id').references(() => productVariants.id, { onDelete: 'restrict' }).notNull(),
  productName: text('product_name').notNull(),
  variantLabel: text('variant_label'),
  quantity: integer('quantity').notNull().default(1),
  priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  guest: one(guests, {
    fields: [orders.guestId],
    references: [guests.id],
  }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

const orderStatusValues = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'failed',
  'refunded',
] as const;

export const insertOrderSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  guestId: z.string().uuid().optional().nullable(),
  status: z.enum(orderStatusValues).optional(),
  subtotal: z.number(),
  shippingFee: z.number().optional(),
  totalAmount: z.number(),
  currency: z.string().optional(),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  shippingLine1: z.string().optional().nullable(),
  shippingLine2: z.string().optional().nullable(),
  shippingCity: z.string().optional().nullable(),
  shippingState: z.string().optional().nullable(),
  shippingPostalCode: z.string().optional().nullable(),
  shippingCountry: z.string().optional().nullable(),
  shippingAddressId: z.string().uuid().optional().nullable(),
  billingAddressId: z.string().uuid().optional().nullable(),
  razorpayOrderId: z.string().optional().nullable(),
  receiptId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectOrderSchema = insertOrderSchema.extend({
  id: z.string().uuid(),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;

export const insertOrderItemSchema = z.object({
  orderId: z.string().uuid(),
  productVariantId: z.string().uuid(),
  productName: z.string().min(1),
  variantLabel: z.string().optional().nullable(),
  quantity: z.number().int().min(1),
  priceAtPurchase: z.number(),
});
export const selectOrderItemSchema = insertOrderItemSchema.extend({
  id: z.string().uuid(),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;
