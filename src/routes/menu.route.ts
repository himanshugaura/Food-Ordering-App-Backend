import express from "express"; 
import { addCategory, deleteCategory, deleteProduct, getAllCategories, getAllProducts, getCategoryById, getProductById, getProductsByCategory, getProductsByIds, updateCategory, updateProduct, uploadProduct } from "../controllers/menu.controller.js";
import { upload } from "../middlewares/upload.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const menuRouter = express.Router();

menuRouter.post(
  "/add/product",
  authMiddleware,            
  upload.single("image"),    
  uploadProduct              
);

menuRouter.post(
  "/add/category",
  authMiddleware,            
  upload.single("image"),    
  addCategory              
);

menuRouter.get("/get-categories" ,  getAllCategories);
menuRouter.get("/get-products" , getAllProducts); 
menuRouter.get("/get-product/:id" , authMiddleware , getProductById); 
menuRouter.get("/get-category/:id" , authMiddleware , getCategoryById);
menuRouter.get("/get-products-by-category/:id"  , getProductsByCategory);
menuRouter.delete("/delete/product/:id" , authMiddleware , deleteProduct);menuRouter.delete("/delete/category/:id" , authMiddleware , deleteCategory);
menuRouter.patch("/update/product/:id" , authMiddleware , upload.single("image") , updateProduct);
menuRouter.patch("/update/category/:id" , authMiddleware , upload.single("image") , updateCategory);
menuRouter.post("/get-products-by-ids" , getProductsByIds);

export default menuRouter;
