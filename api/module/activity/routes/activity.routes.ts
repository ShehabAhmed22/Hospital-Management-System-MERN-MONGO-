import express from "express";

const activityLogRouter = express.Router();

import { requireAuth } from "../../../middlewares/auth.middleware";
import {
  addActivityLog,
  getActivityLogs,
} from "../controller/activity.controller";
import { checkRole } from "../../../middlewares/checkRole";

// only admins can fetch logs
activityLogRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor"]),
  getActivityLogs,
);
activityLogRouter.post("/create", requireAuth, addActivityLog);

export default activityLogRouter;
