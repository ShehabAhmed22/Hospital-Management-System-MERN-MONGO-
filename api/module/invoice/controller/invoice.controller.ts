import type { Request, Response } from "express";
import invoice from "../../../model/invoice";
import mongoose from "mongoose";

export const getMyActiveInvoice = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const activeInvoice = await invoice.findOne({
      patientId: currentUserId,
      status: { $in: ["draft", "pending_payment"] },
    });
    if (!activeInvoice) {
      return res.status(404).json({ message: "No active invoice found" });
    }
    res.status(200).json(activeInvoice);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBillingHistory = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const activeInvoice = await invoice.find({
      patientId: currentUserId,
      status: { $in: ["paid"] },
    });
    res.status(200).json(activeInvoice);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const allBilling = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const billings = await invoice
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await invoice.countDocuments();
    const collection = mongoose.connection.collection("user");
    const users = await collection
      .find(
        { role: "patient" },
        { projection: { password: 0, headers: 0, emailVerified: 0 } },
      )
      .toArray();

    const userMap = new Map<string, any>();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    const billingsWithUser = billings.map((billing) => {
      const user = userMap.get(billing.patientId.toString());
      return { ...billing, user: user || null };
    });

    res.json({
      res: billingsWithUser,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalData: count,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching billing history:", error);
    res.status(500).json({ message: "Failed to fetch billing history" });
  }
};

export const markInvoiceAsPaid = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userInvoice = await invoice.findById(id);
    if (!userInvoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (userInvoice.status === "paid") {
      return res.status(400).json({ message: "Invoice already paid" });
    }
    userInvoice.status = "paid";
    await userInvoice.save();
    res.json({ message: "Invoice marked as paid", invoice: userInvoice });
  } catch (error) {
    console.error("Error marking invoice as paid:", error);
    res.status(500).json({ message: "Failed to update invoice" });
  }
};
