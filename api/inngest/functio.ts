import mongoose from "mongoose";
import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notifyUsers } from "./notifyUser";
import labResults from "../model/labResult";
import invoice from "../model/invoice";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

export const admitPatient = inngest.createFunction(
  { id: "admit-patient", triggers: [{ event: "patient/admitted" }] },
  async ({ event, step }) => {
    // get data
    const { patientId, admissionReason } = event.data;
    // user collection
    const collection = mongoose.connection.collection("user");

    //  setp1: Fetch data(patient, doctors, nurses(available))
    const data = await step.run("fetch-hospital-data", async () => {
      // patient
      const patient = await collection.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
      });
      // doctors and nurses
      const doctors = await collection
        .find({ role: "doctor", status: "active" })
        .toArray();
      const nurses = await collection
        .find({ role: "nurse", status: "active" })
        .toArray();
      return { patient, doctors, nurses };
    });

    // throw error if no patient,doctor(s) and nurse(s) found
    if (
      !data.patient ||
      data.doctors.length === 0 ||
      data.nurses.length === 0
    ) {
      throw new NonRetriableError(
        "Missing patient or active staff to complete triage.",
      );
    }

    // step2: ask gemini ai to assign staff based on their roles/specialization
    const aiAssignment = await step.run("ai-triage", async () => {
      // model
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      //  patient data
      const patientDataStr = `Age: ${data.patient!.age}, Gender: ${data.patient!.gender}, History: ${data.patient!.medicalHistory}. Issue: ${admissionReason}`;
      // doctor data
      const doctorDataStr = data.doctors
        .map(
          (d) =>
            `ID: ${d._id.toString()}, Name: ${d.name}, Spec: ${d.specialization}, Dept: ${d.department}`,
        )
        .join("\n");
      // nurse data
      const nurseDataStr = data.nurses
        .map(
          (n) =>
            `ID: ${n._id.toString()}, Name: ${n.name}, Dept: ${n.department}`,
        )
        .join("\n");

      // prompt
      const prompt = `
        You are an expert Hospital Triage AI. Match this patient with the best Doctor and Nurse.
        PATIENT: ${patientDataStr}
        AVAILABLE DOCTORS: ${doctorDataStr}
        AVAILABLE NURSES: ${nurseDataStr}
        
        Respond ONLY with a valid JSON object:
        {
          "doctorId": "id",
          "doctorName": "name",
          "nurseId": "id",
          "nurseName": "name",
          "reasoning": "Clinical reasoning for this assignment."
        }
      `;
      // results
      const result = await model.generateContent(prompt);
      // result in text format
      const text = result.response.text();
      // Clean up markdown just in case Gemini adds ```json
      const cleanJson = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanJson);
    });

    // step 3:update patient record with assigned doctor and nurse
    const updatedPatient = await step.run("update-database", async () => {
      // payload
      const updatePayload = {
        admitted: true,
        status: "admitted",
        admissionReason,
        assignedDoctorId: aiAssignment.doctorId,
        assignedDoctorName: aiAssignment.doctorName,
        assignedNurseId: aiAssignment.nurseId,
        assignedNurseName: aiAssignment.nurseName,
        triageReasoning: aiAssignment.reasoning,
      };
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(patientId) },
        { $set: updatePayload },
      );
      // Return the updated document
      return await collection.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
      });
    });

    // later we will notify doctor and nurse
    // create notification
    // for testing copy doctor and nurse id
    await step.run("send-notification", async () => {
      await notifyUsers(
        aiAssignment.doctorId,
        aiAssignment.nurseId,
        "Patient Assigned",
        `You have been assigned to a new patient: ${updatedPatient?.name}`,
        `/patient/${patientId}`,
        "assignment",
      );
    });
    return { success: true, aiAssignment, updatedPatient };
  },
);

export const analyzeXRayJob = inngest.createFunction(
  { id: "analyze-xray", triggers: [{ event: "labResult/created" }] },
  async ({ event, step }) => {
    const { labResultId, imageUrl, bodyPart } = event.data;

    // STEP 1: Download the image and convert to Base64 (Gemini requires this)
    const imageBase64 = await step.run("fetch-image", async () => {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    });

    // STEP 2: Call Google Gemini Vision
    const aiAnalysis = await step.run("call-gemini", async () => {
      // gemini-1.5-flash is fast and excellent at multimodal (image) tasks
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });

      const prompt = `You are an expert AI radiologist. Analyze this ${bodyPart} x-ray image. Provide a structured response: \n1. Key Findings\n2. Potential Abnormalities\n3. Summary.\nKeep it clinical, concise, and end with a disclaimer.`;

      const imageParts = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg", // Assuming JPEG/PNG
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      return result.response.text();
    });

    // STEP 3: Update the Database
    const updatedLab = await step.run("update-db", async () => {
      const updatedLabResult = await labResults
        .findByIdAndUpdate(
          labResultId,
          { aiAnalysis, status: "analyzed" },
          { new: true },
        )
        .lean(); // Use lean() since we are going to modify the object

      if (!updatedLabResult) {
        throw new NonRetriableError("Lab result not found");
      }

      // 2. Manually fetch the Patient from the 'user' collection
      const patient = await mongoose.connection.collection("user").findOne(
        { _id: new mongoose.Types.ObjectId(updatedLabResult.patient) },
        { projection: { password: 0, emailVerified: 0 } }, // Exclude sensitive fields
      );

      // 3. Attach the patient data to the result (mimicking populate)
      const resultWithPatient = {
        ...updatedLabResult,
        patient: patient || null, // Replace the ID with the actual user object
      };

      // Now you can use it or send it
      return resultWithPatient;
    });

    // STEP 4: Notify Frontend & Assigned Staff
    await step.run("send-notification", async () => {
      await notifyUsers(
        updatedLab?.patient?.assignedDoctorId.toString() || "",
        updatedLab?.patient?.assignedNurseId.toString() || "",
        "Lab Result Analyzed",
        `Your lab result for ${updatedLab?.testType} has been analyzed.`,
        `/patients`,
        "lab_result",
      );
    });
    // later socket.io
  },
);

export const addChargeToInvoice = inngest.createFunction(
  { id: "add-medical-charge", triggers: [{ event: "billing/charge.added" }] },
  async ({ event, step }) => {
    const { patientId, description, priceInCents } = event.data;
    if (!patientId || !priceInCents) {
      throw new NonRetriableError("Missing required charge information.");
    }

    let inv = await invoice.findOne({ patientId, status: "draft" });
    await step.run("create invoice", async () => {
      // 1. Find the active draft invoice or create a new one
      if (!inv) {
        inv = new invoice({ patientId, items: [], totalAmount: 0 });
      }

      // 2. Add the itemized charge
      inv.items.push({
        description,
        quantity: 1,
        unitPrice: priceInCents,
        totalPrice: priceInCents,
      });
      // 3. Recalculate Total
      inv.totalAmount += priceInCents;
      await inv.save();
    });

    return { success: true, invoiceId: inv?._id.toString() };
  },
);
