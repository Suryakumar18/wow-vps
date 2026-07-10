import mongoose, { Document, Model, Schema } from "mongoose";

const reviewSchema = new Schema({
  id: String, name: String, role: String, text: String, rating: Number, image: String,
  category: { type: String, default: "General" }, tags: [String],
  featured: { type: Boolean, default: false }, highlight: { type: Boolean, default: false }, date: String,
}, { _id: false });

interface IEnhancedTestimonialsConfig extends Document { reviews: object[]; hero: object; spotlight: object; cta: object; }
interface IEnhancedTestimonialsConfigModel extends Model<IEnhancedTestimonialsConfig> { getConfig(): Promise<IEnhancedTestimonialsConfig>; }

const schema = new Schema<IEnhancedTestimonialsConfig>({
  reviews: [reviewSchema],
  hero: {
    badge: { type: String, default: "The Gold Standard of Play" },
    title: { type: String, default: "Voices of " },
    titleHighlight: { type: String, default: "Wonder" },
    subtitle: { type: String, default: "At WOW Lifestyle, we don't just sell toys; we curate memories." },
  },
  spotlight: {
    badge: { type: String, default: "The Visionary" },
    quote: { type: String, default: '"Play is the highest form of research."' },
    description: { type: String, default: '"Every item in our shop is hand-vetted to ensure it sparks curiosity."' },
    name: { type: String, default: "Alexander V. Sterling" },
    role: { type: String, default: "Founder & CEO, WOW Lifestyle" },
    image: { type: String, default: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800" },
    stampText: { type: String, default: "Committed to Quality Since 2012" },
  },
  cta: { title: { type: String, default: "Your Story " }, titleHighlight: { type: String, default: "Awaits" }, buttonText: { type: String, default: "Share Your Experience" } },
}, { timestamps: true });

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ reviews: [
    { id: "1", name: "Sarah Jenkins", role: "Parent", text: "The 'Gold-Foil' wrapping was beautiful. WOW Lifestyle understands the magic of gifting.", rating: 5, image: "https://i.pravatar.cc/150?u=sarah", category: "Gifting", tags: ["Premium Packaging"], featured: true, highlight: true },
    { id: "2", name: "David Chen", role: "Enthusiast", text: "Their drone repair lab saved my custom FPV drone. Expert technicians.", rating: 5, image: "https://i.pravatar.cc/150?u=david", category: "Repairs", tags: ["Quick Service"] },
    { id: "3", name: "Marcus Thorne", role: "Hobbyist", text: "The selection of STEM toys is unmatched. Engineering principles through play.", rating: 5, image: "https://i.pravatar.cc/150?u=marcus", category: "Education", tags: ["STEM Learning"] },
    { id: "4", name: "Elena Rodriguez", role: "Collector", text: "Personal Shopper service was a godsend. Found the perfect age-appropriate gift.", rating: 5, image: "https://i.pravatar.cc/150?u=elena", category: "Shopping", tags: ["Bespoke"], featured: true },
  ]});
  return config;
};

export default (mongoose.models.EnhancedTestimonialsConfig as IEnhancedTestimonialsConfigModel) || mongoose.model<IEnhancedTestimonialsConfig, IEnhancedTestimonialsConfigModel>("EnhancedTestimonialsConfig", schema);
