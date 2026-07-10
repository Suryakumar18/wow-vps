import mongoose, { Document, Model, Schema } from "mongoose";

interface IReviewItem { id: string; name: string; rating: number; text: string; date: string; avatar: string; }
interface IPhotoItem { id: string; url: string; }
interface IReviewConfig extends Document { reviews: IReviewItem[]; photos: IPhotoItem[]; }
interface IReviewConfigModel extends Model<IReviewConfig> { getConfig(): Promise<IReviewConfig>; }

const reviewItemSchema = new Schema<IReviewItem>(
  { id: { type: String, required: true }, name: { type: String, required: true }, rating: { type: Number, required: true }, text: { type: String, required: true }, date: { type: String, required: true }, avatar: { type: String, required: true } },
  { _id: false }
);
const photoItemSchema = new Schema<IPhotoItem>({ id: { type: String, required: true }, url: { type: String, required: true } }, { _id: false });
const schema = new Schema<IReviewConfig>({ reviews: [reviewItemSchema], photos: [photoItemSchema] }, { timestamps: true });

// No bundled avatar images exist — reviews with a blank avatar fall back to
// a generic user icon (see ReviewSection.tsx). Set a real one via the admin.
const defaultReviews: IReviewItem[] = [
  { id: "1", name: "Alex Chen", rating: 5, text: "The detail on the F1 model is absolutely insane! Worth every penny.", date: "2 days ago", avatar: "" },
  { id: "2", name: "Sarah J.", rating: 5, text: "My son hasn't stopped playing with the drone. Battery life is surprising!", date: "1 week ago", avatar: "" },
  { id: "3", name: "Mike Ross", rating: 4, text: "Fast shipping, great packaging. The vintage car collection is a must-have.", date: "3 days ago", avatar: "" },
  { id: "4", name: "Emily D.", rating: 5, text: "Best customer service I've experienced. They replaced a missing part instantly.", date: "Yesterday", avatar: "" },
  { id: "5", name: "Chris P.", rating: 5, text: "The 3D view on the website really helped me choose. Product looks exactly like the video.", date: "2 weeks ago", avatar: "" },
];

const defaultPhotos: IPhotoItem[] = [
  { id: "p1", url: "http://200.97.164.140/uploads/categories/chars-dead.avif" },
  { id: "p5", url: "http://200.97.164.140/uploads/categories/chars-spiderman.avif" },
];

schema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({ reviews: defaultReviews, photos: defaultPhotos });
  return config;
};

export default (mongoose.models.ReviewConfig as IReviewConfigModel) || mongoose.model<IReviewConfig, IReviewConfigModel>("ReviewConfig", schema);
