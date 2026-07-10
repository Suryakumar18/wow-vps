import mongoose, { Document, Model, Schema } from "mongoose";

const retailItemSchema = new Schema({ id: String, name: String, category: String, price: String, originalPrice: String, discount: String, stock: String, rating: String, sales: String, icon: String }, { _id: false });
const wholesaleItemSchema = new Schema({ id: String, name: String, category: String, price: String, moq: String, margin: String, delivery: String, rating: String, orders: String, icon: String }, { _id: false });
const perkSchema = new Schema({ title: String, desc: String }, { _id: false });
const offerSchema = new Schema({ badgeText: String, discountPercentage: String, title: String, description: String, perk1: perkSchema, perk2: perkSchema, perk3: perkSchema, buttonText: String, terms: String }, { _id: false });

interface IServicesConfig extends Document { retailProducts: object[]; wholesaleProducts: object[]; retailOffer: object; wholesaleOffer: object; }
interface IServicesConfigModel extends Model<IServicesConfig> { getConfig(): Promise<IServicesConfig>; }

const schema = new Schema<IServicesConfig>({ retailProducts: [retailItemSchema], wholesaleProducts: [wholesaleItemSchema], retailOffer: offerSchema, wholesaleOffer: offerSchema }, { timestamps: true });

const defaultRetail = [
  { id: "1", name: "Ferrari F1 Ultimate Collector", category: "Diecast Models", price: "₹12,499", originalPrice: "₹16,999", discount: "26%", stock: "In Stock", rating: "4.8", sales: "1.2k", icon: "🚗" },
  { id: "2", name: "AI Smart Companion Bot", category: "Educational Tech", price: "₹8,999", originalPrice: "₹11,499", discount: "22%", stock: "Limited", rating: "4.9", sales: "845", icon: "🤖" },
  { id: "3", name: "Magic Artist Studio Pro", category: "Arts & Crafts", price: "₹5,499", originalPrice: "₹7,999", discount: "31%", stock: "In Stock", rating: "4.7", sales: "2.3k", icon: "🎨" },
];
const defaultWholesale = [
  { id: "1", name: "Speed Champions Bulk Pack", category: "Vehicles (100 units)", price: "₹2,49,999", moq: "50 units", margin: "45% margin", delivery: "7 days", rating: "4.9", orders: "45", icon: "📦" },
  { id: "2", name: "Educational STEM Kit Pallet", category: "Learning Toys (200 units)", price: "₹3,75,000", moq: "100 units", margin: "52% margin", delivery: "10 days", rating: "4.8", orders: "32", icon: "🧠" },
  { id: "3", name: "Seasonal Festival Collection", category: "Gift Sets (150 units)", price: "₹1,89,999", moq: "75 units", margin: "48% margin", delivery: "5 days", rating: "4.9", orders: "67", icon: "🎁" },
];
const defaultRetailOffer = { badgeText: "EXCLUSIVE OFFER", discountPercentage: "25", title: "OFF FOR RETAIL CUSTOMERS", description: "Special discount on all retail purchases", perk1: { title: "Minimum Purchase", desc: "₹5,000" }, perk2: { title: "Valid Until", desc: "Dec 31, 2024" }, perk3: { title: "Free Gift", desc: "Premium Wrapping Included" }, buttonText: "APPLY 25% DISCOUNT", terms: "*Terms & Conditions apply. Valid on select products." };
const defaultWholesaleOffer = { badgeText: "VOLUME DISCOUNT", discountPercentage: "50", title: "OFF FOR BUSINESS PARTNERS", description: "Maximum discount on bulk purchases", perk1: { title: "Minimum Order", desc: "200+ Units" }, perk2: { title: "Free Shipping", desc: "Pan India Delivery" }, perk3: { title: "Dedicated Support", desc: "Account Manager Included" }, buttonText: "APPLY 50% DISCOUNT", terms: "*Valid on orders above ₹5,00,000. Limited time offer." };

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ retailProducts: defaultRetail, wholesaleProducts: defaultWholesale, retailOffer: defaultRetailOffer, wholesaleOffer: defaultWholesaleOffer });
  return config;
};

export default (mongoose.models.ServicesConfig as IServicesConfigModel) || mongoose.model<IServicesConfig, IServicesConfigModel>("ServicesConfig", schema);
