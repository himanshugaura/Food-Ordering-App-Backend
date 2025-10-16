import express from "express";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controllers/auth.user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile" , authMiddleware ,  getUserProfile)
userRouter.post("/logout" , authMiddleware , logoutUser);

export default userRouter;