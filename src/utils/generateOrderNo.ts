import StoreModel from "../models/store.model.js";

/**
 * Generates a new order number for a given store
 * and increments the store's orderCounter atomically
 * @returns 
 */
export async function generateOrderNo(): Promise<number> {
  const store = await StoreModel.findOneAndUpdate(
    { $inc: { orderCounter: 1 } }, 
    { new: true }                    
  );

  if (!store) throw new Error("Store not found");

  return store.orderCounter; 
}
