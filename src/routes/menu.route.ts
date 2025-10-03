import express from "express"; 
import { addCategory, deleteProduct, getAllCategories, getAllProducts, getProductsByCategory, updateProduct, uploadProduct } from "../controllers/menu.controller.js";
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

menuRouter.get("/get-categories" , authMiddleware , getAllCategories);
menuRouter.get("/get-products" , authMiddleware , getAllProducts);
menuRouter.get("/get-products-by-category/:id" , authMiddleware , getProductsByCategory);
menuRouter.delete("/delete/product/:id" , authMiddleware , deleteProduct);
menuRouter.patch("/update/product/:id" , authMiddleware , upload.single("image") , updateProduct);

export default menuRouter;
