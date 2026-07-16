import mongoose, { Document, Model, Schema } from "mongoose";

interface IBentoGridItem { id: string; title: string; subtitle: string; className: string; img: string; isVideo: boolean; icon: string; iconColor: string; color: string; }
interface IBentoGridConfig extends Document { items: IBentoGridItem[]; }
interface IBentoGridConfigModel extends Model<IBentoGridConfig> { getConfig(): Promise<IBentoGridConfig>; }

const itemSchema = new Schema<IBentoGridItem>(
  { id: { type: String, required: true }, title: { type: String, required: true }, subtitle: { type: String, required: true }, className: { type: String, required: true }, img: { type: String, default: "" }, isVideo: { type: Boolean, default: false }, icon: { type: String, required: true }, iconColor: { type: String, required: true }, color: { type: String, required: true } },
  { _id: false }
);
const schema = new Schema<IBentoGridConfig>({ items: [itemSchema] }, { timestamps: true });

const defaultItems: IBentoGridItem[] = [
  { id: "1", title: "Iconic Heroes", subtitle: "Legends Assemble", className: "md:col-span-1 md:row-span-2", img: "http://200.97.164.140/uploads/categories/chars-dead.avif", isVideo: false, icon: "Star", iconColor: "text-yellow-400", color: "#C41E3A" },
  { id: "2", title: "Holiday Bestsellers", subtitle: "Trending Now", className: "md:col-span-2 md:row-span-2", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314414/car_x8lshu.mp4", isVideo: true, icon: "Gift", iconColor: "text-purple-400", color: "#800080" },
  // No source image exists for these two — set a real one via the Bento Grid admin (Upload button).
  { id: "3", title: "Smart Play", subtitle: "Educational", className: "md:col-span-1 md:row-span-1", img: "", isVideo: false, icon: "Brain", iconColor: "text-blue-400", color: "#0066CC" },
  { id: "4", title: "Indoor Fun", subtitle: "Active Play", className: "md:col-span-1 md:row-span-1", img: "", isVideo: false, icon: "Music", iconColor: "text-pink-400", color: "#FF1493" },
  { id: "5", title: "Outdoor Adventure", subtitle: "Go Explore", className: "md:col-span-2 md:row-span-1", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314437/drone_fogxvc.mp4", isVideo: true, icon: "Rocket", iconColor: "text-orange-400", color: "#FF4500" },
  // No source image exists for this one — set a real one via the Bento Grid admin (Upload button).
  { id: "6", title: "Speed Zone", subtitle: "Race Ready", className: "md:col-span-1 md:row-span-1", img: "", isVideo: false, icon: "Zap", iconColor: "text-red-400", color: "#DC143C" },
  { id: "7", title: "Creative Studio", subtitle: "Arts & Crafts", className: "md:col-span-1 md:row-span-1", img: "http://200.97.164.140/uploads/categories/chars-barbie.avif", isVideo: false, icon: "Palette", iconColor: "text-teal-400", color: "#00CED1" },
  { id: "8", title: "Future Tech", subtitle: "Robotics & Coding", className: "md:col-span-2 md:row-span-1", img: "https://res.cloudinary.com/duh5z2zjr/video/upload/v1769314440/rc_zxsclo.mp4", isVideo: true, icon: "Bot", iconColor: "text-cyan-400", color: "#00B7FF" },
  { id: "9", title: "Family Games", subtitle: "Board Games", className: "md:col-span-2 md:row-span-1", img: "http://200.97.164.140/uploads/categories/chars-pokemon.avif", isVideo: false, icon: "Gamepad2", iconColor: "text-green-400", color: "#32CD32" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ items: defaultItems });
  return config;
};

// Recompile from the current schema on (re)load so schema edits take effect without
// a full server restart. In production the module loads once, so this is a no-op there.
if (mongoose.models.BentoGridConfig) mongoose.deleteModel("BentoGridConfig");
export default mongoose.model<IBentoGridConfig, IBentoGridConfigModel>("BentoGridConfig", schema);
