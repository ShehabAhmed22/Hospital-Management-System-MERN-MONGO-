import mongoose from "mongoose";
import type { Request, Response } from "express";
import { logActivity } from "../../../lib/activity";
import { inngest } from "../../../inngest/client";

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // to use current user, we need a middleware
    const currentUser = (req as any).user; // Assuming you have a middleware that attaches the user to the request object

    // Check permissions: A user can view their own profile,
    // or Admins/Medical staff can view patient profiles.
    if (currentUser.id !== id && currentUser.role === "patient") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");
    const user = await collection.findOne(
      { _id: queryId as mongoose.Types.ObjectId },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, ...customFields } = req.body; // Add fields you want to update

    const queryId =
      id?.length === 24 ? new mongoose.Types.ObjectId(id as string) : id;
    const collection = mongoose.connection.collection("user");

    const existingUser = await collection.findOne({
      _id: queryId as mongoose.Types.ObjectId,
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatePayload = {
      name,
      email,
      role,
      ...customFields,
    };

    // Remove undefined/null keys
    Object.keys(updatePayload).forEach(
      (key) =>
        (updatePayload[key] === undefined || updatePayload[key] === null) &&
        delete updatePayload[key],
    );

    // Update user
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id as string) }, // Convert string ID to ObjectId
      { $set: updatePayload },
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    // socket notification
    const io = req.app.get("io");
    if (io && result.modifiedCount > 0) {
      io.emit("notify_user_updated");
    }

    // activity log
    await logActivity(
      (req as any).user.id, // you can also use name but id is more reliable
      "Updated User",
      `User updated: ${id}`,
    );
    res.json({
      message: "User updated successfully",
      updatedUser: result,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchAllUsers = async (req: Request, res: Response) => {
  try {
    //  Pagination Params (Default: Page 1, Limit 10)
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;
    const filter: any = {};
    const role = req.query.role as string;

    // Only add role to filter if it exists and isn't empty/all
    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    // collection instance
    const collection = mongoose.connection.collection("user");
    // total count for pagination
    const totalUsers = await collection.countDocuments(filter);
    const users = await collection
      .find(
        filter, // 👈 Just pass the filter directly now
        {
          projection: {
            password: 0,
            headers: 0,
            emailVerified: 0,
          },
        },
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    res.json({
      res: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalData: totalUsers,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//admit
export const admitPatient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { admissionReason } = req.body;

    console.log("USER:", (req as any).user);
    console.log("ID:", id);
    console.log("BODY:", req.body);

    try {
      await inngest.send({
        name: "patient/admitted",
        data: { patientId: id, admissionReason },
      });
    } catch (inngestError) {
      console.error("INNGEST ERROR:", inngestError);
    }

    await logActivity(
      (req as any).user?.id || "unknown",
      "Admitted Patient",
      `Admitted patient ${id}`,
    );

    res.json({ message: "Patient admission requested successfully" });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
};
