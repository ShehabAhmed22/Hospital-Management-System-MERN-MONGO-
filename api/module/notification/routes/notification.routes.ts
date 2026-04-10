import { Router } from "express";
import Notification from "../../../model/notification";
import { requireAuth } from "../../../middlewares/auth.middleware";

const notificationRouter = Router();

notificationRouter.get("/", requireAuth, async (req, res) => {
  try {
    const currentUserId = (req as any).user.id;
    const notifications = await Notification.find({ user: currentUserId })
      .sort({ createdAt: -1 })
      .limit(20); // Only get the 20 most recent

    const unreadCount = await Notification.countDocuments({
      user: currentUserId,
      isRead: false,
    });
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

notificationRouter.post("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default notificationRouter;
