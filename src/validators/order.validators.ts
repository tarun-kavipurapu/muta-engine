import { z } from "zod";

export const razorpaySchema = z.object({
  razorpay_order_id: z.string().trim().nonempty("Razorpay order id is missing"),
  razorpay_payment_id: z
    .string()
    .trim()
    .nonempty("Razorpay payment id is missing"),
  razorpay_signature: z
    .string()
    .trim()
    .nonempty("Razorpay signature is missing"),
});
