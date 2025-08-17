import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { IAdmin } from "../types/type.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash the password
AdminSchema.pre("save", async function (next) {
  // Only hash the password if it is present and modified
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// Method to compare passwords
AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (!this.password) {
    throw new Error("Password not set on user document.");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
AdminSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const AdminModel = mongoose.models.Admin || model("Admin", AdminSchema);
export default AdminModel;
