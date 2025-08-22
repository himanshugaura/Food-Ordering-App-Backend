import type { Request, Response } from "express";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import UserModel from "../models/user.model.js";

export const registerUser = asyncErrorHandler(
  async (req: Request, res: Response ) => {
    const {phone, password } = req.body; 

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const existingUser = await UserModel.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this phone already exists",
      });
    }     
    const user = await UserModel.create({ phone, password });
    const token = user.generateJWT();

     res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  }
);

export const loginUser = asyncErrorHandler(
  async (req: Request, res: Response ) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

  const user = await UserModel.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = user.generateJWT();

     res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
    });
  }
);

export const logoutUser = asyncErrorHandler(
  async (req: Request, res: Response ) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  }
);

export const getUserProfile = asyncErrorHandler(
  async (req: Request, res: Response ) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data : user,
    });
  }
);

export const updateUserProfile = asyncErrorHandler(
  async (req: Request, res: Response ) => {     
    const userId = req.userId;
    const { phone, password } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (phone) user.phone = phone;
    if (password) user.password = password; 

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  }
);

export const deleteUserAccount = asyncErrorHandler(
  async (req: Request, res: Response ) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await UserModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  }
);

