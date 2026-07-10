import mongoose, { Document, Model, Schema } from "mongoose";

interface IContactConfig extends Document { title: string; subtitle: string; email: string; phone: string; address: string; hoursWeekday: string; hoursSaturday: string; hoursSunday: string; }
interface IContactConfigModel extends Model<IContactConfig> { getConfig(): Promise<IContactConfig>; }

const schema = new Schema<IContactConfig>({
  title: { type: String, default: "Get in Touch" },
  subtitle: { type: String, default: "We'd love to hear from you. Contact us for any queries." },
  email: { type: String, default: "contact@wowlifestyle.com" },
  phone: { type: String, default: "+91 98765 43210" },
  address: { type: String, default: "123 Lifestyle Street, Mumbai, India 400001" },
  hoursWeekday: { type: String, default: "9:00 AM - 8:00 PM" },
  hoursSaturday: { type: String, default: "10:00 AM - 6:00 PM" },
  hoursSunday: { type: String, default: "Closed" },
}, { timestamps: true });

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

export default (mongoose.models.ContactConfig as IContactConfigModel) || mongoose.model<IContactConfig, IContactConfigModel>("ContactConfig", schema);
