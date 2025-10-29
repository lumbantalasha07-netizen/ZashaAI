import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { storage } from "./storage";
import { insertLeadSchema, bulkSendSchema, type Lead, type InsertLead } from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

// Sendinblue configuration
const SENDINBLUE_API_KEY = process.env.SENDINBLUE_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "zashadigitalenterprises@gmail.com";
const SENDER_NAME = process.env.SENDER_NAME || "Lumba Ntalasha, CEO of Zasha";

// Message template generator
function generateEmailTemplate(lead: Partial<InsertLead>): { subject: string; body: string } {
  const firstName = lead.firstName || "there";
  const company = lead.company || "your business";
  const hasWebsite = lead.hasWebsite ?? false;

  if (hasWebsite) {
    return {
      subject: `Quick idea for ${company}`,
      body: `Hi ${firstName}, noticed ${company}'s site — quick idea to add AI automation that increases online orders and cuts staff time.\n\nWe build a small automation (menu + chatbot + order routing) that typically lifts online conversions in 30 days. Interested in a 15-minute demo next week?\n\n— ${SENDER_NAME}`,
    };
  } else {
    return {
      subject: `Build a modern site + AI for ${company}`,
      body: `Hi ${firstName}, I scraped your profile — I can build a modern website for ${company} and add simple AI automations (chat/order/booking) so you start taking more orders online.\n\nI can show a one-page plan and estimate in 15 minutes. When works best for a quick call?\n\n— ${SENDER_NAME}`,
    };
  }
}

// Send email via Sendinblue
async function sendEmailViaSendinblue(to: string, subject: string, body: string): Promise<boolean> {
  if (!SENDINBLUE_API_KEY) {
    throw new Error("Sendinblue API key not configured");
  }

  const htmlContent = body.split("\n").map(line => `<p>${line}</p>`).join("");

  const response = await fetch("https://api.sendinblue.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": SENDINBLUE_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: SENDER_NAME,
        email: FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Sendinblue error:", error);
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  return true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all leads
  app.get("/api/leads", async (_req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get single lead
  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  // Upload CSV and create leads
  app.post("/api/leads/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Remove UTF-8 BOM if present
      let csvContent = req.file.buffer.toString("utf-8");
      if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
      }

      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Also handle BOM in the parser
        relax_quotes: true, // Be more lenient with quotes
        relax_column_count: true, // Allow inconsistent column counts
      });

      console.log(`Processing ${records.length} leads from CSV`);
      
      // Log the first record to see what columns we have
      if (records.length > 0) {
        console.log("CSV Columns found:", Object.keys(records[0]));
        console.log("First record sample:", records[0]);
      }

      const insertLeads: InsertLead[] = records.map((record: any) => {
        // Try multiple possible column name variations
        const firstName = record.first_name || record.firstName || record.First_Name || record['First Name'] || record.name || record.Name || record.fullName || record.full_name || "";
        const lastName = record.last_name || record.lastName || record.Last_Name || record['Last Name'] || "";
        const company = record.company || record.Company || record.business_name || record.businessName || record.Business_Name || record['Business Name'] || "";
        const website = record.website || record.Website || record.domain || record.Domain || record.url || record.URL || record.websiteUrl || "";
        const email = record.email || record.Email || record.e_mail || record.E_mail || record['E-mail'] || record.emailAddress || "";
        const profileUrl = record.profile_url || record.profileUrl || record.Profile_URL || record['Profile URL'] || record.instagram || record.instagramUrl || "";
        
        const hasWebsite = record.has_website === "true" || 
                          record.has_website === "1" || 
                          record.hasWebsite === "true" ||
                          !!website ||
                          !!record.website ||
                          !!record.domain;

        return {
          firstName,
          lastName,
          company,
          website,
          domain: record.domain || website || "",
          hasWebsite,
          profileUrl,
          email,
        };
      });

      // Create leads and generate messages
      const createdLeads = await storage.createLeads(insertLeads);

      // Generate email templates for all leads
      const leadsWithMessages = await Promise.all(
        createdLeads.map(async (lead) => {
          const template = generateEmailTemplate(lead);
          return storage.updateLead(lead.id, {
            subject: template.subject,
            messageBody: template.body,
          });
        })
      );

      console.log(`Created ${leadsWithMessages.length} leads with generated messages`);

      res.json({
        success: true,
        leadsCount: leadsWithMessages.length,
        leads: leadsWithMessages.filter(Boolean) as Lead[],
      });
    } catch (error) {
      console.error("Error processing CSV:", error);
      res.status(500).json({ 
        error: "Failed to process CSV",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update lead
  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const updates = req.body;
      const updatedLead = await storage.updateLead(req.params.id, updates);
      
      if (!updatedLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json(updatedLead);
    } catch (error) {
      console.error("Error updating lead:", error);
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  // Delete lead
  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteLead(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lead:", error);
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  // Send test email to single lead
  app.post("/api/leads/:id/send-test", async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (!lead.email) {
        return res.status(400).json({ error: "Lead has no email address" });
      }

      if (!lead.subject || !lead.messageBody) {
        return res.status(400).json({ error: "Lead has no message template" });
      }

      await sendEmailViaSendinblue(lead.email, lead.subject, lead.messageBody);

      console.log(`Test email sent to ${lead.email}`);

      res.json({ success: true, message: "Test email sent" });
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ 
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Bulk send emails
  app.post("/api/leads/send-bulk", async (req, res) => {
    try {
      const { throttlePerSecond = 2 } = bulkSendSchema.parse(req.body);
      const delayMs = Math.ceil(1000 / throttlePerSecond);

      const allLeads = await storage.getAllLeads();
      const leadsToSend = allLeads.filter(
        (lead) => lead.email && lead.subject && lead.messageBody && lead.sendStatus === "pending"
      );

      console.log(`Starting bulk send for ${leadsToSend.length} leads`);

      let successCount = 0;
      let failCount = 0;

      for (const lead of leadsToSend) {
        try {
          // Update status to sending
          await storage.updateLead(lead.id, { sendStatus: "sending" });

          // Send email
          await sendEmailViaSendinblue(lead.email!, lead.subject!, lead.messageBody!);

          // Update status to sent
          await storage.updateLead(lead.id, {
            sendStatus: "sent",
            sentAt: new Date(),
          });

          successCount++;
          console.log(`✓ Sent email to ${lead.email} (${lead.firstName} ${lead.lastName})`);

          // Throttle
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } catch (error) {
          // Update status to failed
          await storage.updateLead(lead.id, {
            sendStatus: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          });

          failCount++;
          console.error(`✗ Failed to send to ${lead.email}:`, error);
        }
      }

      console.log(`Bulk send complete: ${successCount} sent, ${failCount} failed`);

      res.json({
        success: true,
        total: leadsToSend.length,
        successCount,
        failCount,
      });
    } catch (error) {
      console.error("Error in bulk send:", error);
      res.status(500).json({ 
        error: "Failed to send bulk emails",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete all leads (for testing)
  app.delete("/api/leads", async (_req, res) => {
    try {
      await storage.deleteAllLeads();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting all leads:", error);
      res.status(500).json({ error: "Failed to delete leads" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
