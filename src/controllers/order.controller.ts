import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import type { Request, Response } from "express";
import { generateOrderNo } from "../utils/generateOrderNo.js";
import OrderModel from "../models/order.model.js";
import StoreModel from "../models/store.model.js";
import { configDotenv } from "dotenv";
import { OrderStatus } from "../constants.js";
import UserModel from "../models/user.model.js";
import AdminModel from "../models/admin.model.js";
configDotenv();

export const createOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { orderItems } = req.body;

    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (store.isOpen === false) {
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

    const orderNo = await generateOrderNo();

    const order = await OrderModel.create({
      userId,
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

export const getPendingOrders = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const orders = await OrderModel.find({ status: OrderStatus.PENDING }).populate("user", "name avatar").populate("orderItems.product", "name image foodType").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Pending orders fetched successfully",
      data: orders,
    });
  }
);

export const getMonthlyOrders = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { month, year, page = "1", limit = "10" } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (
      isNaN(monthNum) ||
      isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      isNaN(pageNum) ||
      isNaN(limitNum) ||
      pageNum < 1 ||
      limitNum < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month, year, page or limit",
      });
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0));

    const skip = (pageNum - 1) * limitNum;

    // Fetch orders with pagination
    const orders = await OrderModel.find({
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum).populate("user", "name avatar").populate("orderItems.product", "name image foodType");

    const totalOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    res.status(200).json({
      success: true,
      message: `Orders for ${monthNum}/${yearNum} fetched successfully`,
      data: orders,
      pagination: {
        totalOrders,
        currentPage: pageNum,
        totalPages: Math.ceil(totalOrders / limitNum),
        limit: limitNum,
      },
    });
  }
);

export const getOrderByDate = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { date, page = "1", limit = "10" } = req.params;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (!date || isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Date (YYYY-MM-DD), page, and limit are required",
      });
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const startOfDay = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate() + 1, 0, 0, 0));

    const orders = await OrderModel.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum).populate("user", "name avatar").populate("orderItems.product", "name image foodType");

    const totalOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    res.status(200).json({
      success: true,
      message: `Orders for ${date} fetched successfully`,
      data: orders,
      pagination: {
        totalOrders,
        currentPage: pageNum,
        totalPages: Math.ceil(totalOrders / limitNum),
        limit: limitNum,
      },
    });
  }
);

export const getOrdersByCustomerName = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { name } = req.query;
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "10", 10);

    if (!name || !name.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: "User name is required",
      });
    }

    const user = await UserModel.findOne({ name: name.toString().trim().toLocaleLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `No user found with name "${name}"`,
      });
    }

    const skip = (page - 1) * limit;

    const orders = await OrderModel.find({ user: user._id })
      .populate("user", "name username avatar") 
      .populate("orderItems.product", "name image foodType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await OrderModel.countDocuments({ user: user._id });

    res.status(200).json({
      success: true,
      message: `Orders for user "${name}" fetched successfully`,
      data: orders,
      pagination: {
        totalOrders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        limit,
      },
    });
  }
);

export const acceptOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
     const userId = req.userId;
    const  orderId  = req.params.id;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== OrderStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be accepted",
      });
    }

    order.status = OrderStatus.COOKING;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order accepted successfully",
    });
  }
);

export const rejectOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const orderId = req.params.id;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== OrderStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be rejected",
      });
    }

    order.status = OrderStatus.CANCELLED;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  }
);

export const markOrderAsDelivered = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { orderId } = req.params;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== OrderStatus.COOKING) {
      return res.status(400).json({
        success: false,
        message: "Only cooking orders can be marked as delivered",
      });
    }

    order.status = OrderStatus.DELIVERED;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as delivered successfully",
    });
  }
);