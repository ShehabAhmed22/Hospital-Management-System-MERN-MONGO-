// inngest/client.ts
import { Inngest } from "inngest";

const eventKey = process.env.INNGEST_EVENT_KEY;

// ✅ Only treat it as configured if it looks like a real key
export const isInngestConfigured =
  !!eventKey &&
  eventKey.trim() !== "" &&
  eventKey !== "your_key_here" &&
  eventKey.startsWith("signkey-"); // Inngest keys always start with this prefix

export const inngest = new Inngest({
  id: "medflow-hms",
  ...(isInngestConfigured ? { eventKey } : {}),
});
