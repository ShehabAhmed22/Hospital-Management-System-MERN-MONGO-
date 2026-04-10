import type { Request, Response } from "express";
import ActivityLog from "../../../model/activityLog";
import { logActivity } from "../../../lib/activity";
import mongoose from "mongoose";

// Controller to add an activity log
export const addActivityLog = async (req: Request, res: Response) => {
  try {
    const { userId, action, details } = req.body;
    await logActivity(userId, action, details);
    res.status(201).json({ message: "Activity logged successfully" });
  } catch (error) {
    console.error("Error adding activity log:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Controller to fetch activity logs for a user
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    // parse pagination parameters
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    // fetch activity logs
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 }) // sort by most recent
      .skip(skip)
      .limit(limit)
      .lean();

    // get total count for pagination
    const totalLogs = await ActivityLog.countDocuments();

    // get user details for each log
    const collection = mongoose.connection.collection("user");
    const users = await collection.find().toArray();
    // create a map of userId to user details for easy lookup
    const userMap = new Map<string, any>();
    users.forEach((user) => {
      userMap.set(user._id.toString(), user);
    });

    // attach user details to each log
    const logsWithUserDetails = logs.map((log) => {
      const user = userMap.get(log.user.toString());
      return {
        ...log,
        user: user ? user : null,
      };
    });

    // total pages for pagination
    const totalPages = Math.ceil(totalLogs / limit);

    // return logs with pagination info
    res.json({
      res: logsWithUserDetails,
      pagination: {
        currentPage: page,
        totalPages,
        totalData: totalLogs,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
