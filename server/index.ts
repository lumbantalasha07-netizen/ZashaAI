// server/index.ts

import express, { Request, Response } from "express";
import axios from "axios";

// Dummy DB query function (replace with your real DB call)
async function getLeadsFromDB() {
  // Example: fetch leads from your database
  // Replace this with your actual DB logic
  return [
    { email: "lumbantalasha07@gmail.com", name: "John" },
    { email: "example2@gmail.com", name: "Jane" },
  ];
}

// 🌐 n8n webhook URL
const N8N_WEBHOOK_URL =
  "https://zashad.app.n8n.cloud/webhook-test/3cbcc2ff-a261-42a7-91f0-e28bf98efaf8";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// -------------------------
// API: Send bulk emails from DB
// -------------------------
app.post("/api/send-bulk-emails", async (_req: Request, res: Response) => {
  try {
    // 1️⃣ Fetch leads from DB
    const leads = await getLeadsFromDB();

    if (!leads || leads.length === 0) {
      return res
        .status(400)
        .json({ message: "No leads found in the database" });
    }

    // 2️⃣ Prepare email template
    const payload = {
      leads,
      subject: "Quick question",
      text: "Hi there, let's talk business!",
      html: "<p>Hi there, let's talk business!</p>",
      from: "zashadigitalenterprises@gmail.com",
    };

    // 3️⃣ Send to n8n webhook
    const response = await axios.post(N8N_WEBHOOK_URL, payload);
    console.log("✅ Sent leads to n8n:", response.status);

    // 4️⃣ Respond
    res.json({
      success: true,
      totalLeads: leads.length,
      message: "Leads sent to n8n successfully",
    });
  } catch (err: any) {
    console.error("❌ Failed to send to n8n:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to send leads to n8n",
      error: err.message,
    });
  }
});

// -------------------------
// Start server
// -------------------------
const port = parseInt(process.env.PORT || "5000", 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});
