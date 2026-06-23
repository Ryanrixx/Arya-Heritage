import { pgEnum, pgTable, timestamp, uuid, text, numeric, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { orders } from './orders';

/**
 * Payment system: Razorpay (cards, UPI/Google Pay, netbanking, wallets) + Cash on Delivery.
 * Stripe/PayPal have been fully removed — this project targets the Indian market only.
 *
 * Status values intentionally mirror Razorpay's own payment lifecycle so webhook
 * events can be mapped 1:1 without translation:
 *  created    -> Razorpay order created, checkout not yet attempted
 *  authorized -> payment authorized (rare to see directly; auto-captured by default)
 *  captured   -> payment successfully captured (this is "paid")
 *  failed     -> payment attempt failed (insufficient funds, cancelled UPI intent, etc.)
 *  refunded   -> payment was later refunded (full or partial, see amountRefunded)
 */
export const paymentMethodEnum = pgEnum('payment_method', ['razorpay', 'cod']);
export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  method: paymentMethodEnum('method').notNull(),
  status: paymentStatusEnum('status').notNull().default('created'),

  // Razorpay identifiers. An order can have multiple payment attempts (e.g. a
  // failed UPI attempt followed by a successful card attempt), so these live
  // on the payment row rather than the order row.
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),

  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('INR'),

  failureReason: text('failure_reason'),
  failureCode: text('failure_code'),

  refundId: text('refund_id'),
  amountRefunded: numeric('amount_refunded', { precision: 10, scale: 2 }),

  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  // Postgres unique indexes treat every NULL as distinct, so this only
  // constrains rows that actually have a Razorpay payment id (COD rows,
  // which leave it null, are unaffected). This is what makes payment
  // confirmation safely idempotent under concurrent webhook + client calls —
  // see lib/payments/razorpay/fulfillment.ts.
  razorpayPaymentIdUniq: uniqueIndex('payments_razorpay_payment_id_uniq').on(t.razorpayPaymentId),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const insertPaymentSchema = z.object({
  orderId: z.string().uuid(),
  method: z.enum(['razorpay', 'cod']),
  status: z.enum(['created', 'authorized', 'captured', 'failed', 'refunded']).optional(),
  razorpayOrderId: z.string().optional().nullable(),
  razorpayPaymentId: z.string().optional().nullable(),
  razorpaySignature: z.string().optional().nullable(),
  amount: z.number(),
  currency: z.string().optional(),
  failureReason: z.string().optional().nullable(),
  failureCode: z.string().optional().nullable(),
  refundId: z.string().optional().nullable(),
  amountRefunded: z.number().optional().nullable(),
  paidAt: z.date().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectPaymentSchema = insertPaymentSchema.extend({
  id: z.string().uuid(),
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type SelectPayment = z.infer<typeof selectPaymentSchema>;
