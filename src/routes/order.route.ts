import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { acceptOrder, createOrder, getMonthlyOrders, getOrderByDate, getOrdersByCustomerName, getPendingOrders, markOrderAsDelivered, rejectOrder } from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place" , authMiddleware  , createOrder);
orderRouter.get("/pending" , authMiddleware , getPendingOrders);
orderRouter.post("/accept/:id" , authMiddleware , acceptOrder );
orderRouter.post("/reject/:id" , authMiddleware , rejectOrder );
orderRouter.post("/delivered/:id" , authMiddleware , markOrderAsDelivered );
orderRouter.get("search/monthly" , authMiddleware , getMonthlyOrders );
orderRouter.get("search/date" , authMiddleware , getOrderByDate );
orderRouter.get("search/name" , authMiddleware , getOrdersByCustomerName );




export default orderRouter;