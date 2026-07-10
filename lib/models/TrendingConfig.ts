import mongoose, { Document, Model, Schema } from "mongoose";

interface ITrendingConfig extends Document {
  sectionTitle: string;
  sectionSubtitle: string;
  badgeText: string;
  buttonText: string;
  isActive: boolean;
}

interface ITrendingConfigModel extends Model<ITrendingConfig> {
  getConfig(): Promise<ITrendingConfig>;
}

const schema = new Schema<ITrendingConfig>(
  {
    sectionTitle: { type: String, default: "Hot Drops" },
    sectionSubtitle: { type: String, default: "Discover the most coveted R/C and scale models dominating the community this week." },
    badgeText: { type: String, default: "Trending Now" },
    buttonText: { type: String, default: "EXPLORE ALL" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

export default (mongoose.models.TrendingConfig as ITrendingConfigModel) || mongoose.model<ITrendingConfig, ITrendingConfigModel>("TrendingConfig", schema);
