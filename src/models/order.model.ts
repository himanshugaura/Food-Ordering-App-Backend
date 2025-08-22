import mongoose, { model, Schema, Types } from "mongoose";
import type { IOrders } from "../types/type.js";
import { OrderStatus, PaymentMethod } from "../constants.js";

const OrdersSchema = new Schema<IOrders>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          trim: true,
        },

        price: {
          type: Number,
          required: true,
          trim: true,
        },
      },
    ],

    orderNo: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
      default: OrderStatus.Pending,
    },

    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.Cash,
    },

    isPaid: { 
        type: Boolean, 
        required : true,
        default: false 
    },
  },
  { timestamps: true }
);

const OrderModel =
  mongoose.models.Order || model("Order", OrdersSchema);
export default OrderModel;
