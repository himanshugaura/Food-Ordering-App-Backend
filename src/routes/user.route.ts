import express from "express";
import { getUserProfile, loginUser, logoutUser, registerUser } from "../controllers/auth.user.controller.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/profile" , getUserProfile)
userRouter.post("/logout" , logoutUser);

export default userRouter;