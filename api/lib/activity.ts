import ActivityLog from "../model/activityLog";

export const logActivity = async (
  userId: string,
  action: string,
  details: string,
) => {
  try {
    await ActivityLog.create({ user: userId, action, details });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
