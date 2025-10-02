import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import AdminModel from "../models/admin.model.js";
import type { Request, Response } from "express";
import StoreModel from "../models/store.model.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

export const createStore = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { name, address } = req.body;
    const logo = req.file;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    if (!name || !address || !logo) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingStore = await StoreModel.findOne({ name });
    if (existingStore) {
      return res.status(409).json({
        success: false,
        message: "Store with this name already exists",
      });
    }

    const image = await uploadToCloudinary(logo.buffer, "store");
    if (!image.url || !image.publicId) {
      return res.status(500).json({
        success: false,
        message: "Logo upload failed",
      });
    }

    const store = await StoreModel.create({ name, address, logo: {url : image.url , publicId : image.publicId} });

    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: store,
    }); 
  }
);

export const getStoreDetails = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

   const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Store details fetched successfully",
      data: store,
    });
  }
);

export const updateStoreDetails = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    const { name, address } = req.body;
    const logo = req.file;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (name) store.name = name;
    if (address) store.address = address;
    
    if (logo) { 
      cloudinary.uploader.destroy(store.logo.publicId);
      const image = await uploadToCloudinary(logo.buffer, "store");
      store.logo = { url: image.url, publicId: image.publicId };
    }

    await store.save();

    res.status(200).json({
      success: true,
      message: "Store details updated successfully",
    });
  }
);

export const toggleStoreStatus = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    store.isOpen = !store.isOpen;
    await store.save();

    res.status(200).json({
      success: true,
      message: `Store is now ${store.isOpen ? "open" : "closed"}`,
    });
  }
);

export const resetOrderCounter = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    store.orderCounter = 0;
    await store.save();

    res.status(200).json({
      success: true,
      message: "Order counter reset successfully",
    });
  }
);

export const getStoreStatus = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const store = await StoreModel.findOne();
    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Store status fetched successfully",
      data: { isOpen: store.isOpen },
    });
  }
);