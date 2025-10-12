import AdminModel from "../models/admin.model.js";
import ProductModel from "../models/product.model.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import type { Request, Response } from "express";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";
import CategoryModel from "../models/category.model.js";

export const uploadProduct = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    
    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin)
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });

    const { name, description, categoryId, price, foodType } = req.body;
    
    if (!name || !description || !categoryId || !price || !foodType) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "products"
    );
    
    const product = await ProductModel.create({
      name,
      description,
      category: categoryId,
      price: Number(price),
      foodType,
      image: { url, publicId },
    });

    await product.populate("category");
    
    res.status(201).json({
      success: true,
      message: "Product uploaded successfully",
      data : product
    });
  }
);

export const addCategory = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "category"
    );

    const newCategory = await CategoryModel.create({
      name,
      image: {
        url,
        publicId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: newCategory,
    });
  }
);

export const getAllCategories = asyncErrorHandler(
  async (req: Request, res: Response) => {
      const categories = await CategoryModel.find();
      
      res.status(200).json(
        {
          message : "Fetched All Categories Successfully",
          success : true,
          data : categories
        }
      )
  }
);

export const getCategoryById = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const category = await CategoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category fetched successfully",
      data: category,
    });
  }
);

export const deleteCategory = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const category = await CategoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.image?.publicId) {
      await cloudinary.uploader.destroy(category.image.publicId);
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  }
);
export const getAllProducts = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const products = await ProductModel.find().populate("category").sort({ createdAt : -1 });

    res.status(200).json({ 
      message : "Fetched All Products Successfully",
      success : true,
      data : products
    });
  }
);

export const deleteProduct = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const productId = req.params.id;

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await cloudinary.uploader.destroy(product.image.publicId);

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  }
);

export const updateProduct = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const productId = req.params.id;
    const product = await ProductModel.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { name, description, price, category, foodType } = req.body;

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (foodType) product.foodType = foodType;

    if (req.file) {
      if (product.image?.publicId) {
        await cloudinary.uploader.destroy(product.image.publicId);
      }

      const { url, publicId } = await uploadToCloudinary(
        req.file.buffer,
        "products"
      );

      product.image = {
        url,
        publicId,
      };
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  }
);

export const updateCategory = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;

    const isAdmin = await AdminModel.findById(userId);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access Denied",
      });
    }

    const categoryId = req.params.id;
    const category = await CategoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { name } = req.body;

    if (name) category.name = name;

    if (req.file) {
      if (category.image?.publicId) {
        await cloudinary.uploader.destroy(category.image.publicId);
      }

      const { url, publicId } = await uploadToCloudinary(
        req.file.buffer,
        "category"
      );

      category.image = {
        url,
        publicId,
      };
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: category,
    });
  }
);

export const getProductsByCategory = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const categoryId = req.params.id;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const products = await ProductModel.find({ category: categoryId }).populate("category");

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  }
);

export const getProductById = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await ProductModel.findById(productId).populate("category");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  }
);
