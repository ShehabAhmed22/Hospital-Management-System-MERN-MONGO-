import mongoose, { Schema, Document } from "mongoose";

export interface ILabResult extends Document {
  patient: mongoose.Types.ObjectId;
  uploadedBy: string; // Doctor or Lab Tech ID
  testType: string; // e.g., 'X-Ray', 'MRI', 'Blood Test'
  bodyPart?: string; // e.g., 'Chest', 'Left Knee'
  imageUrl?: string; // The UTApi URL
  aiAnalysis?: string; // AI generated text
  doctorNotes?: string; // Human doctor's conclusion
  status: "pending" | "analyzed" | "reviewed";
  createdAt: Date;
  updatedAt: Date;
}

const LabResultSchema: Schema = new Schema(
  {
    patient: { type: Schema.Types.ObjectId, ref: "user" },
    uploadedBy: { type: String, required: true },
    testType: { type: String, required: true, default: "X-Ray" },
    bodyPart: { type: String },
    imageUrl: { type: String },

    // AI & Notes
    aiAnalysis: { type: String, default: "Pending Analysis..." },
    doctorNotes: { type: String },

    // Workflow Status
    status: {
      type: String,
      enum: ["pending", "analyzed", "reviewed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model<ILabResult>("LabResult", LabResultSchema);
