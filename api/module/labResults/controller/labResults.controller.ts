// controllers/labResults.controller.ts
import type { Request, Response } from "express";
import LabResult from "../../../model/labResult";
import { inngest, isInngestConfigured } from "../../../inngest/client";
import { logActivity } from "../../../lib/activity";

export const createLabResult = async (req: Request, res: Response) => {
  try {
    const { patientId, testType, bodyPart, imageUrl } = req.body;
    const currentUserId = (req as any).user?.id;

    if (!patientId || !testType || !bodyPart || !imageUrl) {
      return res.status(400).json({
        message:
          "Missing required fields: patientId, testType, bodyPart, imageUrl",
        received: { patientId, testType, bodyPart, imageUrl: !!imageUrl },
      });
    }

    const newLabResult = await LabResult.create({
      patient: patientId,
      testType,
      bodyPart,
      imageUrl,
      status: "pending",
      uploadedBy: currentUserId,
    });

    const io = req.app.get("io");
    if (io) io.emit("lab_result_added");

    if (testType === "X-Ray") {
      // ✅ Inngest events are fire-and-forget — never let them crash the request
      if (isInngestConfigured) {
        Promise.all([
          inngest.send({
            name: "labResult/created",
            data: {
              labResultId: newLabResult._id.toString(),
              imageUrl: newLabResult.imageUrl,
              bodyPart: newLabResult.bodyPart,
            },
          }),
          inngest.send({
            name: "billing/charge.added",
            data: {
              patientId: newLabResult.patient,
              description: `Radiology: ${newLabResult.bodyPart} X-Ray Analysis`,
              priceInCents: 15000,
            },
          }),
        ]).catch((err) => {
          // ✅ Log but never throw — the lab result is already saved
          console.error("⚠️ Inngest dispatch failed (non-fatal):", err.message);
        });
      } else {
        console.warn("⚠️ Inngest not configured — skipping event dispatch");
      }

      await logActivity(
        currentUserId,
        "Uploaded Lab Result",
        `Uploaded ${testType} for ${bodyPart}`,
      );
    }

    // ✅ Always respond — Inngest failure won't reach here
    res.status(201).json(newLabResult);
  } catch (error) {
    console.error("Error creating lab result:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPatientLabResults = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const results = await LabResult.find({ patient: patientId }).sort({
      createdAt: -1,
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching lab results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateLabResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { aiAnalysis, doctorNotes, status } = req.body;

    const updatedResult = await LabResult.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(aiAnalysis !== undefined && { aiAnalysis }),
          ...(doctorNotes !== undefined && { doctorNotes }),
          ...(status !== undefined && { status }),
        },
      },
      { new: true },
    );

    if (!updatedResult) {
      return res.status(404).json({ message: "Lab result not found" });
    }

    const io = req.app.get("io");
    if (io) io.emit("lab_result_updated", updatedResult);

    await logActivity(
      (req as any).user.id,
      "Updated Lab Result",
      `Updated lab result ${id} with status ${status || "N/A"}`,
    );

    res.status(200).json(updatedResult);
  } catch (error) {
    console.error("Error updating lab result:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
