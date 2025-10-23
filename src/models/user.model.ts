import mongoose, {
  Model,
  Schema,
  model,
  type HydratedDocument,
} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { IUser } from "../types/type.js";

type UserDocument = HydratedDocument<IUser>;
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET as string;

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      tolowercase: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
    avatar: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save hook to hash the password
UserSchema.pre("save", async function (next) {
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
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  if (!this.password) {
    throw new Error("Password not set on user document.");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT
UserSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Create and export the user model
const UserModel: Model<IUser> =
  mongoose.models.User || model<IUser>("User", UserSchema);
export default UserModel;
export type { UserDocument };
