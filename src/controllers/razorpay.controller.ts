import type { Request, Response } from "express";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import OrderModel from "../models/order.model.js";
import crypto from "crypto";

// Keep minimal notes
interface RazorpayPaymentNotes {
  orderId: string; // Only minimal info needed
}

export const razorpayWebhook = asyncErrorHandler(async (req: Request, res: Response) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  const expectedSignature = req.headers["x-razorpay-signature"] as string | undefined;

  if (!expectedSignature) {
    return res.status(400).json({ success: false, message: "Missing signature header" });
  }

  // Use the RAW request body to compute HMAC. Fallback to stringifying if raw isn't present.
  const rawBody =
    (req as any).rawBody ||
    (req as any).bodyRaw ||
    (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

  const computedSignature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (computedSignature !== expectedSignature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

  // Handle successful capture
  if (event?.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const razorpayPaymentId = payment?.id;

    const notes = payment?.notes as RazorpayPaymentNotes | undefined;
    if (!notes?.orderId) {
      return res.status(400).json({ success: false, message: "Missing orderId in notes" });
    }

    const order = await OrderModel.findById(notes.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Update payment info
    order.isPaid = true;
    order.razorpayPaymentId = razorpayPaymentId ?? order.razorpayPaymentId;
    await order.save();
  }

  // Delete order when payment fails
  if (event?.event === "payment.failed") {
    const payment = event.payload?.payment?.entity;
    const notes = payment?.notes as RazorpayPaymentNotes | undefined;
    if (notes?.orderId) {
      const order = await OrderModel.findById(notes.orderId);
      if (order && !order.isPaid) {
        await order.deleteOne();
      }
    }
  }

  // Optionally, handle order.paid if you subscribe to it:
  if (event?.event === "order.paid") {
    const orderEntity = event.payload?.order?.entity;
    const notes = orderEntity?.notes as RazorpayPaymentNotes | undefined;
    if (notes?.orderId) {
      const order = await OrderModel.findById(notes.orderId);
      if (order) {
        order.isPaid = true;
        await order.save();
      }
    }
  }

  return res.status(200).json({ success: true });
});

export const verifyPayment = asyncErrorHandler(async (req: Request, res: Response) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body as {
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  };
  const secret = process.env.RAZORPAY_KEY_SECRET as string;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const order = await OrderModel.findOne({ razorpayOrderId: razorpay_order_id });
  if (order) {
    order.isPaid = true;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();
  }

  return res.json({
    success: true,
    message: "Payment verified",
    data: order ? { orderId: order._id, status: order.status, isPaid: order.isPaid } : null,
  });
});


export const cancelUnpaidOrder = asyncErrorHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, orderId } = req.body as { razorpayOrderId?: string; orderId?: string };

  let order = null;
  if (orderId) {
    order = await OrderModel.findById(orderId);
  } else if (razorpayOrderId) {
    order = await OrderModel.findOne({ razorpayOrderId });
  }

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.isPaid) {
    return res.status(400).json({ success: false, message: "Order already paid; cannot cancel" });
  }

  await OrderModel.findByIdAndDelete(order._id);
  return res.json({ success: true, message: "Unpaid order cancelled and deleted" });
});