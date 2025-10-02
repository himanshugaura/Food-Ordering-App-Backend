import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import type { Request, Response } from "express";
import { generateOrderNo } from "../utils/generateOrderNo.js";
import OrderModel from "../models/order.model.js";
import StoreModel from "../models/store.model.js";

export const createOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const storeId = req.storeId;
    const { orderItems } = req.body;

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if(store.isOpen === false){
      return res.status(403).json({
        success: false,
        message: "Store is currently closed. Cannot place order.",
      });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const orderNo = await generateOrderNo(storeId!);

    const order = await OrderModel.create({
      userId,
      storeId,
      orderNo,
      orderItems,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  }
);
