import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import AdminModel from "../models/admin.model.js";
import type { Request, Response } from "express";

export const registerAdmin = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { name, username, password } = req.body;
    const userId = req.userId;

    const isAdmin = AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }
    
    if (!name || !username || !password ) {
      return res.status(400).json({
        success: false,
        message: "Name, username, password  are required",
      });
    }

    const existingAdmin = await AdminModel.findOne({ username });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this username already exists",
      });
    }

    await AdminModel.create({ name, username, password });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
    });
  }
);

export const loginAdmin = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }
    const admin = await AdminModel.findOne({ username });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    admin.toObject();
    delete admin.password;
    const token = admin.generateJWT();
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "Admin logged in successfully",
      data: admin,
    });
  }
);

export const getAdminProfile = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.userId;

    const admin = await AdminModel.findById(adminId).select("-password");
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  }
);

export const logoutAdmin = asyncErrorHandler(
  async (req: Request, res: Response) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  }
);

export const changeAdminPassword = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const adminId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new passwords are required",
      });
    }

    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  }
);
