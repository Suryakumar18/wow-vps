import mongoose, { Document, Schema } from "mongoose";

/*
 * Persistent notifications shown in the admin navbar bell. Web-push is fire-and-forget
 * (only reaches a browser that's subscribed and online); these rows are the durable
 * record so the admin can see what happened whenever they open the panel.
 */
export interface INotification extends Document {
  audience: "admin";        // reserved for future per-user notifications
  type: string;             // "order" | ...
  title: string;
  message: string;
  orderId?: string;
  url?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    audience: { type: String, default: "admin", index: true },
    type:     { type: String, default: "order" },
    title:    { type: String, required: true },
    message:  { type: String, default: "" },
    orderId:  { type: String, default: "" },
    url:      { type: String, default: "" },
    read:     { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);
