export enum OrderStatus {
  PENDING = "PENDING",       // Order placed, awaiting store confirmation
  COOKING = "COOKING",       // Order accepted, being prepared
  DELIVERED = "DELIVERED",   // Order completed and given to customer
  CANCELLED = "CANCELLED"    // Order cancelled
}


export enum FoodType {
  Veg = "VEG",
  NonVeg = "NON VEG"
}

export enum PaymentMethod {
  Cash = "CASH",
  Online = "ONLINE"
}