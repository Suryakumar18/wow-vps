import mongoose, { Document, Model, Schema } from "mongoose";

interface IShopByAgeItem { id: string; label: string; sub: string; img: string; gradient: string; icon: string; }
interface IShopByAgeConfig extends Document { items: IShopByAgeItem[]; }
interface IShopByAgeConfigModel extends Model<IShopByAgeConfig> { getConfig(): Promise<IShopByAgeConfig>; }

const itemSchema = new Schema<IShopByAgeItem>(
  { id: { type: String, required: true }, label: { type: String, required: true }, sub: { type: String, required: true }, img: { type: String, required: true }, gradient: { type: String, required: true }, icon: { type: String, required: true } },
  { _id: false }
);
const schema = new Schema<IShopByAgeConfig>({ items: [itemSchema] }, { timestamps: true });

const defaultItems: IShopByAgeItem[] = [
  { id: "1", label: "0-18 Months", sub: "Infant Care", img: "http://200.97.164.140/uploads/categories/chars-masha.avif", gradient: "from-pink-500 to-rose-600", icon: "Baby" },
  { id: "2", label: "18-36 Months", sub: "Toddler Fun", img: "http://200.97.164.140/uploads/categories/chars-mickey.avif", gradient: "from-cyan-500 to-blue-600", icon: "Star" },
  { id: "3", label: "3-5 Years", sub: "Preschool", img: "http://200.97.164.140/uploads/categories/chars-pokemon.avif", gradient: "from-amber-400 to-orange-600", icon: "Building2" },
  { id: "4", label: "5-7 Years", sub: "Action Hero", img: "http://200.97.164.140/uploads/categories/chars-spiderman.avif", gradient: "from-red-600 to-red-800", icon: "Zap" },
  { id: "5", label: "7-9 Years", sub: "Dreamers", img: "http://200.97.164.140/uploads/categories/chars-barbie.avif", gradient: "from-fuchsia-500 to-purple-600", icon: "Sparkles" },
  // No source image exists for these two — set a real one via the Shop By Age admin (Upload button).
  { id: "6", label: "9-12 Years", sub: "Racers", img: "", gradient: "from-orange-500 to-red-600", icon: "Gauge" },
  { id: "7", label: "12-14 Years", sub: "Speed Freak", img: "", gradient: "from-slate-800 to-black", icon: "Trophy" },
  { id: "8", label: "14-16 Years", sub: "Wizardry", img: "http://200.97.164.140/uploads/categories/chars-harrypotter.avif", gradient: "from-purple-800 to-indigo-900", icon: "Wand2" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ items: defaultItems });
  return config;
};

export default (mongoose.models.ShopByAgeConfig as IShopByAgeConfigModel) || mongoose.model<IShopByAgeConfig, IShopByAgeConfigModel>("ShopByAgeConfig", schema);
