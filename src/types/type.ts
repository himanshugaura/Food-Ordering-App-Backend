import { Document, Types } from 'mongoose';
import type { FoodType, OrderStatus, PaymentMethod } from '../constants';

export interface IUser extends Document {
  name: string;
  phone: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateJWT(): string;
}

export interface IAdmin extends Document {
  name: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateJWT(): string;
}

export interface IOrderItem {
  product: Types.ObjectId;   
  quantity: number;          
  price: number;             
}

export interface IOrders extends Document {
  user: Types.ObjectId;
  orderItems: IOrderItem[];  
  orderNo: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod : PaymentMethod;
  isPaid : Boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProducts extends Document {
  name: string;
  description: string;
  foodType: FoodType;
  price: number;
  category: Types.ObjectId;
  image: {
    publicId: string;
    url: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory extends Document {
  name: string;
  product : Types.ObjectId[];
  image : {
    publicId : string,
    url : string,
  };
  createdAt: Date,
  updatedAt : Date,
}