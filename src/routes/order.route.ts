import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { acceptOrder, createCashOrder, createOnlineOrder, getAllAcceptedOrders, getMonthlyOrders, getMonthlyStats, getOrderByDate, getOrdersByCustomer, getOrdersByCustomerName, getPendingOrderByUser, getPendingOrders, markOrderAsDelivered, rejectOrder } from "../controllers/order.controller.js";

const orderRouter = express.Router();

orderRouter.post("/place/cash" , authMiddleware  , createCashOrder);
orderRouter.post("/place/online" , authMiddleware , createOnlineOrder);
orderRouter.get("/pending" , authMiddleware , getPendingOrders);
orderRouter.get("/accepted" , authMiddleware , getAllAcceptedOrders);
orderRouter.get("/user/pending" , authMiddleware , getPendingOrderByUser);
orderRouter.get("/user/all" , authMiddleware , getOrdersByCustomer);
orderRouter.post("/accept/:id" , authMiddleware , acceptOrder );
orderRouter.post("/reject/:id" , authMiddleware , rejectOrder );
orderRouter.post("/delivered/:id" , authMiddleware , markOrderAsDelivered );
orderRouter.get("search/monthly" , authMiddleware , getMonthlyOrders );
orderRouter.get("/search/date" , authMiddleware , getOrderByDate );
orderRouter.get("/stats/monthly" , authMiddleware , getMonthlyStats );
orderRouter.get("/search/name" , authMiddleware , getOrdersByCustomerName );




export default orderRouter;