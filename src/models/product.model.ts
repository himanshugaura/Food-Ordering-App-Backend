import mongoose, { model, Schema } from "mongoose";
import type { IProducts } from "../types/type.js";
import { FoodType } from "../constants.js";

const ProductsSchema = new Schema<IProducts>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    foodType: {
      type: String,
      enum: Object.values(FoodType),
      required: true,
    },

    price: {
      type: Number,
      required: true,
      trim: true,
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    image: {
      publicId: {
        type: String,
        required: true,
      },

      url: {
        type: String,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const ProductModel = mongoose.models.Product || model("Product" , ProductsSchema);
export default ProductModel;