import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICartItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  label: string;
  firstName: string;
  lastName?: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  fullname: string;
  email: string;
  mobilenumber?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: "user" | "moderator" | "admin";
  cart: ICartItem[];
  wishlist: mongoose.Types.ObjectId[];
  addresses: IAddress[];
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const addressSchema = new Schema<IAddress>({
  label: { type: String, default: "Home", trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, default: "", trim: true },
  address: { type: String, required: true, trim: true },
  apartment: { type: String, default: "", trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pinCode: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  country: { type: String, default: "India", trim: true },
  isDefault: { type: Boolean, default: false },
});

const cartItemSchema = new Schema<ICartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>({
  fullname: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId;
    },
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobilenumber: { type: String, sparse: true, default: null },
  password: {
    type: String,
    required: function (this: IUser) {
      return !this.googleId;
    },
  },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
  cart: { type: [cartItemSchema], default: [], select: false },
  wishlist: { type: [{ type: Schema.Types.ObjectId, ref: "Product" }], default: [], select: false },
  addresses: { type: [addressSchema], default: [], select: false },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidate: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", userSchema);
