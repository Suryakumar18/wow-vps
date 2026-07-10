import mongoose, { Document, Model, Schema } from "mongoose";

interface IHero extends Document {
  badgeText: string;
  title: string;
  titleGradient: string;
  description: string;
  primaryButtonText: string;
  secondaryButtonText: string;
  carImages: string[];
  brands: { name: string; src: string }[];
}

interface IHeroModel extends Model<IHero> {
  getConfig(): Promise<IHero>;
}

const heroSchema = new Schema<IHero>(
  {
    badgeText: { type: String, required: true, default: "OFFICIAL F1 COLLECTOR SERIES" },
    title: { type: String, required: true, default: "Race Ready." },
    titleGradient: { type: String, required: true, default: "Miniature Speed." },
    description: { type: String, required: true, default: "Experience the thrill of the track with our ultra-realistic, precision-engineered diecast Formula 1 collection." },
    primaryButtonText: { type: String, required: true, default: "Shop Collection" },
    secondaryButtonText: { type: String, required: true, default: "View Gallery" },
    carImages: [{ type: String, trim: true }],
    brands: [{ name: { type: String, required: true, trim: true }, src: { type: String, required: true, trim: true } }],
  },
  { timestamps: true }
);

heroSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    // No bundled placeholder assets exist — add real ones via the Hero admin page.
    config = await this.create({ carImages: [], brands: [] });
  }
  return config;
};

export default (mongoose.models.Hero as IHeroModel) || mongoose.model<IHero, IHeroModel>("Hero", heroSchema);
