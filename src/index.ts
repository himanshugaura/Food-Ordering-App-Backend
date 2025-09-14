import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import dbConnect from "./config/database.js";
import cors from "cors";
import adminAuthRouter from "./routes/admin.routes.js";
import productRouter from "./routes/menu.route.js";
async function startServer() {
  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 3030;
  const whitelist = process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"];

  // Middleware
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded());

  // DB connect
  await dbConnect();


  // Production CORS setup
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || whitelist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  // Admin Routes
  app.use("/api/admin/auth", adminAuthRouter);
  app.use("/api/menu", productRouter);


  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV} mode`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
