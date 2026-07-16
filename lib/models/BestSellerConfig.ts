import mongoose, { Document, Model, Schema } from "mongoose";

interface IBestSellerItem { id: string; name: string; img: string; color: string; }
interface IBestSellerConfig extends Document { items: IBestSellerItem[]; }
interface IBestSellerConfigModel extends Model<IBestSellerConfig> { getConfig(): Promise<IBestSellerConfig>; }

const itemSchema = new Schema<IBestSellerItem>(
  { id: { type: String, required: true }, name: { type: String, required: true }, img: { type: String, default: "" }, color: { type: String, required: true } },
  { _id: false }
);
const schema = new Schema<IBestSellerConfig>({ items: [itemSchema] }, { timestamps: true });

const defaultItems: IBestSellerItem[] = [
  { id: "1", name: "Jasco Bear Muffler", img: "http://200.97.164.140/uploads/categories/chars-masha.avif", color: "#831843" },
  { id: "2", name: "Hamleys Activity Ball", img: "http://200.97.164.140/uploads/categories/chars-pokemon.avif", color: "#713f12" },
  { id: "3", name: "Marvel Avengers Set", img: "http://200.97.164.140/uploads/categories/chars-avengers.avif", color: "#7f1d1d" },
  // No source image exists for these two — set a real one via the Top Picks admin (Upload button).
  { id: "4", name: "Hot Wheels Monster", img: "", color: "#1e3a8a" },
  { id: "5", name: "Super Rigs Transporter", img: "", color: "#0f172a" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ items: defaultItems });
  return config;
};

// Recompile from the current schema on (re)load so schema edits take effect without
// a full server restart. In production the module loads once, so this is a no-op there.
if (mongoose.models.BestSellerConfig) mongoose.deleteModel("BestSellerConfig");
export default mongoose.model<IBestSellerConfig, IBestSellerConfigModel>("BestSellerConfig", schema);
