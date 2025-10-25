import express from "express";
import {
  verifyPayment,
  razorpayWebhook,
  cancelUnpaidOrder,
} from "../controllers/razorpay.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const razorpayRouter = express.Router();

razorpayRouter.post("/payment/verify", authMiddleware, verifyPayment
);
razorpayRouter.post("/webhook",express.raw({ type: "application/json" }), razorpayWebhook);
razorpayRouter.post("/order/cancel", authMiddleware, cancelUnpaidOrder);

export default razorpayRouter;
