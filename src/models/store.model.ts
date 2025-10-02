import mongoose, { Schema, model } from "mongoose";
import type { IStore } from "../types/type.js";

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      publicId: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    orderCounter: {
    type: Number,
    default: 0,
    }

  },
  { timestamps: true }
);


const StoreModel = mongoose.models.Store || model("Store", StoreSchema);
export default StoreModel;
