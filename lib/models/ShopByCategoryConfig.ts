import mongoose, { Document, Model, Schema } from "mongoose";

interface IShopByCategoryItem { id: string; title: string; img: string; color: string; accent: string; icon: string; count: number; description: string; badge: string; }
interface IShopByCategoryConfig extends Document { items: IShopByCategoryItem[]; }
interface IShopByCategoryConfigModel extends Model<IShopByCategoryConfig> { getConfig(): Promise<IShopByCategoryConfig>; }

const itemSchema = new Schema<IShopByCategoryItem>(
  { id: { type: String, required: true }, title: { type: String, required: true }, img: { type: String, required: true }, color: { type: String, required: true }, accent: { type: String, required: true }, icon: { type: String, required: true }, count: { type: Number, required: true }, description: { type: String, required: true }, badge: { type: String, required: true } },
  { _id: false }
);
const schema = new Schema<IShopByCategoryConfig>({ items: [itemSchema] }, { timestamps: true });

const defaultItems: IShopByCategoryItem[] = [
  // No source image exists for this one — set a real one via the Categories admin (Upload button).
  { id: "vehicles", title: "Vehicles & Tracksets", img: "", color: "from-red-600 to-rose-900", accent: "text-red-500", icon: "CarFront", count: 42, description: "Remote control & diecast models", badge: "Trending" },
  { id: "art", title: "Art & Craft", img: "http://200.97.164.140/uploads/categories/chars-barbie.avif", color: "from-purple-600 to-indigo-900", accent: "text-purple-500", icon: "Palette", count: 36, description: "Creative kits & painting sets", badge: "Creative" },
  // No source image exists for this one — set a real one via the Categories admin (Upload button).
  { id: "collectors", title: "Collectors Edition", img: "", color: "from-amber-500 to-orange-800", accent: "text-amber-500", icon: "Trophy", count: 18, description: "Limited edition premium models", badge: "Exclusive" },
  { id: "puzzles", title: "Games & Puzzles", img: "http://200.97.164.140/uploads/categories/chars-pokemon.avif", color: "from-emerald-500 to-green-800", accent: "text-emerald-500", icon: "Gamepad2", count: 27, description: "Strategy games & brain teasers", badge: "Fun" },
  { id: "dolls", title: "Premium Dolls", img: "http://200.97.164.140/uploads/categories/chars-princess.avif", color: "from-pink-500 to-rose-700", accent: "text-pink-500", icon: "Gift", count: 31, description: "Fashion dolls & playsets", badge: "Popular" },
  { id: "educational", title: "STEM & Learning", img: "http://200.97.164.140/uploads/categories/chars-avengers.avif", color: "from-blue-500 to-cyan-700", accent: "text-blue-500", icon: "Brain", count: 24, description: "Science kits & educational toys", badge: "Smart" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ items: defaultItems });
  return config;
};

export default (mongoose.models.ShopByCategoryConfig as IShopByCategoryConfigModel) || mongoose.model<IShopByCategoryConfig, IShopByCategoryConfigModel>("ShopByCategoryConfig", schema);
