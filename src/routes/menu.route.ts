import express from "express"; 
import { addCategory, getAllCategories, getAllProducts, uploadProduct } from "../controllers/menu.controller.js";
import { upload } from "../middlewares/upload.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const menuRouter = express.Router();

menuRouter.post(
  "/upload",
  authMiddleware,            
  upload.single("image"),    
  uploadProduct              
);

menuRouter.post(
  "/add-category",
  authMiddleware,            
  upload.single("image"),    
  addCategory              
);

menuRouter.get("/get-categories" , getAllCategories);
menuRouter.get("/get-products" , getAllProducts);

export default menuRouter;
