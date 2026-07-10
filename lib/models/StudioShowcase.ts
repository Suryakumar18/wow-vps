import mongoose, { Document, Model, Schema } from "mongoose";

interface IStudioConfig extends Document {
  title: string;
  subtitle: string;
  badgeText: string;
  highlightText: string;
  buttonText: string;
  isActive: boolean;
  autoCycleDuration: number;
  theme: "dark" | "light";
}

interface IStudioConfigModel extends Model<IStudioConfig> {
  getConfig(): Promise<IStudioConfig>;
}

export interface IStudioVideo extends Document {
  title: string;
  description?: string;
  videoId: number;
  src: string;
  color: string;
  rating: string;
  category: string;
  order: number;
  isActive: boolean;
}

const studioConfigSchema = new Schema<IStudioConfig>(
  {
    title: { type: String, required: true, default: "STUDIO SHOWCASE" },
    subtitle: { type: String, required: true, default: "Watch our premium vintage models in action." },
    badgeText: { type: String, required: true, default: "Live Exhibit" },
    highlightText: { type: String, required: true, default: "SHOWCASE" },
    buttonText: { type: String, required: true, default: "View All" },
    isActive: { type: Boolean, default: true },
    autoCycleDuration: { type: Number, default: 5000 },
    theme: { type: String, enum: ["dark", "light"], default: "dark" },
  },
  { timestamps: true }
);

studioConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

const studioVideoSchema = new Schema<IStudioVideo>(
  {
    title: { type: String, required: true },
    description: String,
    videoId: { type: Number, required: true, unique: true },
    src: { type: String, required: true },
    color: { type: String, required: true, default: "#C41E3A" },
    rating: { type: String, required: true, default: "9.5" },
    category: { type: String, required: true, default: "Vintage Collection" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StudioShowcase = (mongoose.models.StudioShowcase as IStudioConfigModel) || mongoose.model<IStudioConfig, IStudioConfigModel>("StudioShowcase", studioConfigSchema);
export const StudioVideo = mongoose.models.StudioVideo || mongoose.model<IStudioVideo>("StudioVideo", studioVideoSchema);
