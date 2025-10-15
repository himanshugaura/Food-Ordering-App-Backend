import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createStore, getOrderCounter, getStoreDetails, getStoreStatus, resetOrderCounter, toggleStoreStatus, updateStoreDetails } from "../controllers/store.controller.js";
import { upload } from "../middlewares/upload.js";

const storeRouter = express.Router();

storeRouter.post("/create" , authMiddleware , upload.single("image") , createStore);
storeRouter.get("/details" , authMiddleware , getStoreDetails);
storeRouter.patch("/update" , authMiddleware , upload.single("image") , updateStoreDetails);
storeRouter.patch("/toggle/status" , authMiddleware , toggleStoreStatus);
storeRouter.get("/order-counter" , authMiddleware , getOrderCounter);
storeRouter.patch("/reset/order-counter" , authMiddleware , resetOrderCounter);
storeRouter.get("/status" , authMiddleware , getStoreStatus);

export default storeRouter;