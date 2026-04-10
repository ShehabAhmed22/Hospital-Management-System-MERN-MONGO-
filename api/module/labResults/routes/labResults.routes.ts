import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware"; // Your Better Auth middleware
import { checkRole } from "../../../middlewares/checkRole"; // Your RBAC middleware
import {
  createLabResult,
  getPatientLabResults,
  updateLabResult,
} from "../controller/labResults.controller";

const labResultsRouter = Router();

// POST: Upload an X-Ray (Allowed for Lab Techs, Doctors, Admins)
labResultsRouter.post(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  createLabResult,
);

// GET: Fetch all X-Rays for a patient (Allowed for Medical Staff)
labResultsRouter.get(
  "/patient/:patientId",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "lab_tech"]),
  getPatientLabResults,
);

// PUT: Update X-Ray with AI Analysis or Doctor Notes
labResultsRouter.put(
  "/:id",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  updateLabResult,
);

export default labResultsRouter;
