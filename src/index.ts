import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import dbConnect from "./config/database.js";
import cors from "cors";
import adminAuthRouter from "./routes/admin.routes.js";
import productRouter from "./routes/menu.route.js";
import orderRouter from "./routes/order.route.js";
import userRouter from "./routes/user.route.js";
import storeRouter from "./routes/store.route.js";
import razorpayRouter from "./routes/razorpay.route.js";
import { initSocket } from "./socket.js";
import http from "http";
async function startServer() {
  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 3030;
  const server = http.createServer(app);
  const whitelist = process.env.CORS_ORIGIN?.split(",").map(o => o.trim()) || ["http://localhost:3000"];

  // Middleware
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded());

  // DB connect
  await dbConnect();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);



  // Routes
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/user/auth", userRouter);
  app.use("/api/menu", productRouter);
  app.use("/api/order", orderRouter);
  app.use("/api/store", storeRouter);
 app.use ("/api", razorpayRouter);

  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
