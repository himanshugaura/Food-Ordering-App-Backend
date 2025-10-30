import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import type { Request, Response } from "express";
import { generateOrderNo } from "../utils/generateOrderNo.js";
import OrderModel from "../models/order.model.js";
import StoreModel from "../models/store.model.js";
import { configDotenv } from "dotenv";
import { OrderStatus, PaymentMethod } from "../constants.js";
import UserModel from "../models/user.model.js";
import AdminModel from "../models/admin.model.js";
import ProductModel from "../models/product.model.js";
import { razorpayInstance } from "../config/razorpay.js";
import { emitPlaceOrder } from "../socket.js";
configDotenv();
async function createOrderHandler({
  userId,
  orderItems,
  paymentMethod,
}: {
  userId: string;
  orderItems: any[];
  paymentMethod: PaymentMethod;
}) {
  const store = await StoreModel.findOne();
  if (!store?.isOpen) {
    throw new Error("Store is currently closed. Cannot place order.");
  }

  if (!orderItems?.length) {
    throw new Error("Order items are required.");
  }

  const orderItemsWithPrice = await Promise.all(
    orderItems.map(async (item) => {
      const product = await ProductModel.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);
      return {
        product: item.product,
        quantity: item.quantity,
        price: product.price,
      };
    })
  );

  const totalAmount = orderItemsWithPrice.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const orderNo = await generateOrderNo();
  const order = await OrderModel.create({
    user: userId,
    orderNo,
    orderItems: orderItemsWithPrice.map(({ product, quantity }) => ({
      product,
      quantity,
    })),
    totalAmount,
    paymentMethod,
    isPaid: false,
    status: OrderStatus.PENDING,
  });

  let razorpayOrderId: string | undefined;
  if (paymentMethod === PaymentMethod.Online) {
    const rOrder = await razorpayInstance.orders.create({
      amount: totalAmount * 100,
      currency: "INR",
      receipt: `rec_${orderNo}`,
      notes: {
        orderId: order._id.toString(),
      },
    });
    order.razorpayOrderId = rOrder.id;
    razorpayOrderId = rOrder.id;
    await order.save();
  }

  return { order, razorpayOrderId, totalAmount };
}

export const createCashOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { orderItems } = req.body;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { order } = await createOrderHandler({
      userId,
      orderItems,
      paymentMethod: PaymentMethod.Cash,
    });

    const populatedOrder = await OrderModel.findById(order._id)
  .populate("user", "name avatar")
  .populate("orderItems.product", "name image foodType price");

emitPlaceOrder(populatedOrder);



    return res.status(201).json({
      success: true,
      message: "Cash order placed successfully.",
      data: { orderId: order._id, orderNo: order.orderNo },
    });
  } 
);

export const createOnlineOrder = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { orderItems } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { order, razorpayOrderId, totalAmount } = await createOrderHandler({
      userId,
      orderItems,
      paymentMethod: PaymentMethod.Online,
    });

    const populatedOrder = await OrderModel.findById(order._id)
  .populate("user", "name avatar")
  .populate("orderItems.product", "name image foodType price");

emitPlaceOrder(populatedOrder);

    return res.status(201).json({
      success: true,
      message: "Online order created successfully.",
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        razorpayOrderId,
        totalAmount,
      },
    });
  }
);

export const getPendingOrders = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const orders = await OrderModel.find({ status: OrderStatus.PENDING })
      .populate("user", "name avatar")
      .populate("orderItems.product", "name image foodType price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Pending orders fetched successfully",
      data: orders,
    });
  }
);
export const getMonthlyOrders = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { month, page = "1", limit = "10" } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month required",
      });
    }

    const monthNum = parseInt(month as string);
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const yearNum = new Date().getUTCFullYear(); 

    if (
      isNaN(monthNum) ||
      monthNum < 1 ||
      monthNum > 12 ||
      isNaN(pageNum) ||
      isNaN(limitNum) ||
      pageNum < 1 ||
      limitNum < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month, page, or limit",
      });
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0));

    const skip = (pageNum - 1) * limitNum;

    const orders = await OrderModel.find({
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("user", "name avatar")
      .populate("orderItems.product", "name image foodType");

    const totalOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      status: OrderStatus.DELIVERED,
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

export const getMonthlyStats = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Month is required",
      });
    }

    const monthNum = parseInt(month as string);
    const yearNum = new Date().getUTCFullYear(); 

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month value",
      });
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0));

    const totalOrdersCreated = await OrderModel.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
    });

    const totalDeliveredOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startDate, $lt: endDate },
      status: OrderStatus.DELIVERED,
    });

    const revenueAgg = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          status: OrderStatus.DELIVERED,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue =
      revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      message: `Monthly stats for ${monthNum}/${yearNum} fetched successfully`,
      data: {
        totalOrders: totalOrdersCreated,
        ordersDelivered: totalDeliveredOrders,
        totalRevenue: totalRevenue,
      },
    });
  }
);


export const getOrderByDate = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { date, page = "1", limit = "10" } = req.params;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (
      !date ||
      isNaN(pageNum) ||
      isNaN(limitNum) ||
      pageNum < 1 ||
      limitNum < 1
    ) {
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

    const startOfDay = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate(),
        0,
        0,
        0
      )
    );
    const endOfDay = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate() + 1,
        0,
        0,
        0
      )
    );

    const orders = await OrderModel.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("user", "name avatar")
      .populate("orderItems.product", "name image foodType");

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

    const user = await UserModel.findOne({
      name: name.toString().trim().toLocaleLowerCase(),
    });
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
    const orderId = req.params.id;

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

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.COOKING) {
      return res.status(400).json({
        success: false,
        message: "Only  pending / cooking orders can be rejected",
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
    const orderId  = req.params.id;

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
    order.isPaid = true;
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as delivered successfully",
    });
  }
);

export const getPendingOrderByUser = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const order = await OrderModel.find({
      user: userId,
      status: { $in: [OrderStatus.PENDING , OrderStatus.COOKING ] },
    }).populate("orderItems.product", "name image foodType price").sort({ createdAt: -1 });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No pending order found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pending order fetched successfully",
      data: order,
    });
  }
);

  export const getOrdersByCustomer = asyncErrorHandler(
    async (req: Request, res: Response) => {
      const userId = req.userId;

      const month = parseInt(req.query.month as string); 
      const currentYear = new Date().getFullYear();

      if (isNaN(month) || month < 1 || month > 12) {
        res.status(400).json({
          success: false,
          message: "Invalid month parameter",
        });
        return;
      }

      const startDate = new Date(currentYear, month - 1, 1);
      const endDate = new Date(currentYear, month, 1);

      const orders = await OrderModel.find({
        user: userId,
        createdAt: { $gte: startDate, $lt: endDate },
        status: { $nin: [OrderStatus.PENDING ,   OrderStatus.COOKING]},
      })
        .populate("user", "name username avatar")
        .populate("orderItems.product", "name image foodType price")
        .sort({ createdAt: -1 });
      
      res.status(200).json({
        success: true,
        message: `Orders fetched successfully`,
        data: orders,
      });
    }
  );

export const getAllAcceptedOrders = asyncErrorHandler(
  async (req: Request, res: Response) => {

    const orders = await OrderModel.find({
      status:  OrderStatus.COOKING 
    })
      .populate("user", "name username avatar")
      .populate("orderItems.product", "name image foodType price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `Accepted orders fetched successfully`,
      data: orders,
    });
  }
);