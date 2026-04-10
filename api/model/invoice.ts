import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  patientId: string;
  polarCheckoutId?: string; // Links to Polar transaction
  status: "draft" | "pending_payment" | "paid";
  items: Array<{
    description: string; // e.g., "Chest X-Ray"
    quantity: number;
    unitPrice: number; // in cents (Polar uses cents)
    totalPrice: number;
  }>;
  totalAmount: number; // Sum of all items in cents
  createdAt: Date;
}

const InvoiceSchema = new Schema(
  {
    patientId: { type: String, required: true },
    polarCheckoutId: { type: String },
    status: {
      type: String,
      enum: ["draft", "pending_payment", "paid"],
      default: "draft",
    },
    items: [
      {
        description: String,
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
      },
    ],
    totalAmount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);
