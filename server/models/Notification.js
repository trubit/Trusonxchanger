import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type:   { type: String, enum: ["TRADE", "ORDER", "WALLET", "SYSTEM"], required: true },
    title:  { type: String, required: true, maxlength: 120 },
    message:{ type: String, required: true, maxlength: 500 },
    status: { type: String, enum: ["UNREAD", "READ"], default: "UNREAD" },
    meta:   { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
