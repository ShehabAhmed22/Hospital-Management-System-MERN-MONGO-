import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI || "");
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:8080",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:5173"],
  emailAndPassword: { enabled: true },
  plugins: [
    admin({
      defaultRole: "patient",
      adminRole: ["admin", "superadmin"],
    }),
  ],
  user: {
    additionalFields: {
      specialization: { type: "string", required: false },
      department: { type: "string", required: false },
      gender: { type: "string", required: false },
      bloodgroup: { type: "string", required: false },
      medicalHistory: { type: "string", required: false },
      age: { type: "string", required: false },
      status: { type: "string", required: false, defaultValue: "active" },
      prescriptions: { type: "string[]", required: false },
      appointments: { type: "string[]" },
    },
  },
});
