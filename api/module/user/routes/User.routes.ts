import express from "express";

const userRouter = express.Router();

import {
  fetchAllUsers,
  getUserById,
  updateUser,
  admitPatient,
  // getPolarPortalLink,
} from "../controller/user.controller";
import { requireAuth } from "../../../middlewares/auth.middleware";
import { checkRole } from "../../../middlewares/checkRole";

userRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  fetchAllUsers,
);
userRouter.put(
  "/update/:id",
  requireAuth,
  // //   allowed roles: admin, doctor, nurse
  checkRole(["admin", "doctor", "nurse"]),
  updateUser,
);

// only admin and medical staff can update patient profiles
userRouter.get("/profile/:id", requireAuth, getUserById);
// test admit
userRouter.post(
  "/:id/admit",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  admitPatient,
);

// userRouter.get("/polar-portal/:userId", requireAuth, getPolarPortalLink);

// if :id route is first, it will catch all routes including /update/:id, so we need to put it after the /update/:id route
export default userRouter;
