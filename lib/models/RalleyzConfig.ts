import mongoose, { Document, Model, Schema } from "mongoose";

interface IRalleyzItem { id: number; title: string; subtitle: string; location: string; description: string; bg: string; }
interface IRalleyzConfig extends Document { items: IRalleyzItem[]; }
interface IRalleyzConfigModel extends Model<IRalleyzConfig> { getConfig(): Promise<IRalleyzConfig>; }

const itemSchema = new Schema<IRalleyzItem>(
  { id: { type: Number, required: true }, title: { type: String, required: true, default: "New Vehicle" }, subtitle: { type: String, required: true, default: "New Subtitle" }, location: { type: String, required: true, default: "New Location" }, description: { type: String, required: true, default: "Description goes here..." }, bg: { type: String, required: true, default: "http://200.97.164.140/uploads/categories/chars-bg1.avif" } },
  { _id: false }
);

const schema = new Schema<IRalleyzConfig>({ items: [itemSchema] }, { timestamps: true });

const defaultItems: IRalleyzItem[] = [
  { id: 1, title: "Big Volt Rover", subtitle: "Remote Control Car", location: "Off-Road Series", description: "Tucked away in the Switzerland Alps, Saint Antonien offers an idyllic retreat.", bg: "http://200.97.164.140/uploads/categories/chars-bg1.avif" },
  { id: 2, title: "Land Rover", subtitle: "Range Rover SUV", location: "Luxury Edition", description: "A cultural treasure trove with historic shrines and temples.", bg: "http://200.97.164.140/uploads/categories/chars-bg2.avif" },
  { id: 3, title: "X-Spray Monster", subtitle: "2.4 GHz Racer", location: "Speedster", description: "The journey from the vibrant souks of Marrakech to the tranquil sands.", bg: "http://200.97.164.140/uploads/categories/chars-bg3.avif" },
  { id: 4, title: "Twisted Stunt", subtitle: "Remote Control Car", location: "Stunt Zone", description: "Yosemite National Park is a sanctuary for those who seek the sublime.", bg: "http://200.97.164.140/uploads/categories/chars-bg4.avif" },
  { id: 5, title: "Undcad Off Roader", subtitle: "4x4 RC Truck", location: "Mountain", description: "Famous for its strong winds and sandy shores.", bg: "http://200.97.164.140/uploads/categories/chars-bg5.avif" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ items: defaultItems });
  return config;
};

export default (mongoose.models.RalleyzConfig as IRalleyzConfigModel) || mongoose.model<IRalleyzConfig, IRalleyzConfigModel>("RalleyzConfig", schema);
