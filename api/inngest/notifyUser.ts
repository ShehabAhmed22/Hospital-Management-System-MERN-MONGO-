import { getIO } from "../lib/socket";
import Notification from "../model/notification";

export const notifyUsers = async (
  doctorId: string,
  nurseId: string,
  title: string,
  message: string,
  link: string,
  type: "system" | "assignment" | "lab_result" | "alert",
) => {
  // 1. Create DB Notification for the Doctor
  await Notification.create({
    user: doctorId,
    title,
    message,
    type,
    link,
  });

  // 2. Create DB Notification for the Nurse
  await Notification.create({
    user: nurseId,
    title,
    message,
    type,
    link,
  });

  //later // 3. Emit a Socket event specifically to update their Bell Icon instantly!
  getIO().emit(`new_notification_${doctorId}`);
  getIO().emit(`new_notification_${nurseId}`);
};
