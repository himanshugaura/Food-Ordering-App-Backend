import express from "express"
import { changeAdminPassword, getAdminProfile, loginAdmin, logoutAdmin, registerAdmin } from "../controllers/auth.admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const adminAuthRouter = express.Router();

adminAuthRouter.post("/register", registerAdmin);
adminAuthRouter.post("/login", loginAdmin);
adminAuthRouter.post("/change-password", authMiddleware , changeAdminPassword);
adminAuthRouter.get("/profile", authMiddleware , getAdminProfile);
adminAuthRouter.post("/logout",authMiddleware, logoutAdmin)

export default adminAuthRouter