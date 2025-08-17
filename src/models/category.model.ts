import mongoose, { model, Schema } from "mongoose";
import type { ICategory } from "../types/type";

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

const CategoryModel = mongoose.models.Category || model("Category" , CategorySchema);
export default CategoryModel;