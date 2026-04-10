import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId; // Who did it?
  action: string; // "Created Exam", "Registered Student"
  details?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    details: String,
  },
  { timestamps: true },
);

export default mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
