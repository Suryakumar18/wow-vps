import mongoose, { Document, Model, Schema } from "mongoose";

const featuredArticleSchema = new Schema({
  category: { type: String, default: "Heritage & History" },
  title: { type: String, default: "A Dream Fulfilled: From a Cornish Shop to the World's Finest" },
  excerpt: { type: String, default: "In 1760, William Hamley set out to create 'the best toy shop in the world'." },
  author: { type: String, default: "WOW Lifestyle Publishing" },
  date: { type: String, default: "Feb 02, 2026" },
  readTime: { type: String, default: "15 min read" },
  image: { type: String, default: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&w=2000&q=80" },
  stats: {
    years: { type: String, default: "265+" },
    stores: { type: String, default: "170+" },
    countries: { type: String, default: "40+" },
    smiles: { type: String, default: "5M+" },
  },
}, { _id: false });

const articleSchema = new Schema({ id: String, category: String, title: String, image: String, date: String, excerpt: String, icon: String }, { _id: false });
const testimonialSchema = new Schema({ id: String, name: String, role: String, content: String, rating: Number, location: String }, { _id: false });
const timelineSchema = new Schema({ id: String, year: String, event: String, highlight: Boolean }, { _id: false });

interface IBlogLifestyleConfig extends Document { featuredArticle: object; articles: object[]; testimonials: object[]; timeline: object[]; }
interface IBlogLifestyleConfigModel extends Model<IBlogLifestyleConfig> { getConfig(): Promise<IBlogLifestyleConfig>; }

const schema = new Schema<IBlogLifestyleConfig>({
  featuredArticle: { type: featuredArticleSchema, default: () => ({}) },
  articles: [articleSchema],
  testimonials: [testimonialSchema],
  timeline: [timelineSchema],
}, { timestamps: true });

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({
    articles: [
      { id: "1", category: "Global Magic", title: "Spreading the Joy: How 170 Global Shops Unite Children", image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1600&q=80", date: "Jan 28, 2026", excerpt: "From London to Prague to Mumbai, witness the magical experience of live toy demos.", icon: "Globe2" },
      { id: "2", category: "The Experience", title: "A Delightful Experience: Why Interactive Play is Our Core", image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad55?auto=format&fit=crop&w=1600&q=80", date: "Jan 25, 2026", excerpt: "Adults get the rare chance to be children again, interacting with favorite characters.", icon: "Smile" },
    ],
    testimonials: [
      { id: "t1", name: "Priya Sharma", role: "Mother & Educator", content: "The heritage collection brought back childhood memories while creating new ones for my kids.", rating: 5, location: "Mumbai" },
      { id: "t2", name: "Arjun Mehta", role: "Toy Collector", content: "The authenticity and quality of their limited edition collectibles is unmatched in India.", rating: 5, location: "Delhi" },
    ],
    timeline: [
      { id: "tl1", year: "1760", event: "William Hamley opens 'Noah's Ark' in Cornwall", highlight: true },
      { id: "tl2", year: "2023", event: "WOW Lifestyle launches in India with 12 stores", highlight: false },
      { id: "tl3", year: "2026", event: "170+ stores across 40 countries", highlight: true },
    ],
  });
  return config;
};

export default (mongoose.models.BlogLifestyleConfig as IBlogLifestyleConfigModel) || mongoose.model<IBlogLifestyleConfig, IBlogLifestyleConfigModel>("BlogLifestyleConfig", schema);
