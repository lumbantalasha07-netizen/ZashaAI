import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { z } from "zod";
import { storage } from "./storage";
import { insertLeadSchema, bulkSendSchema, type Lead, type InsertLead } from "@shared/schema";
import { findValidEmail, generateEmailPatterns, verifyEmailWithMailboxlayer } from "./emailVerifier";

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
        console.log("CSV Columns found:", Object.keys(records[0] as Record<string, unknown>));
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

      // Create leads first
      const createdLeads = await storage.createLeads(insertLeads);

      // Process only first 5 rows for testing
      const leadsToProcess = createdLeads.slice(0, 5);
      console.log(`Processing first ${leadsToProcess.length} leads for email enrichment`);

      // Enrich emails via Mailboxlayer and generate templates
      const leadsWithMessages = await Promise.all(
        leadsToProcess.map(async (lead) => {
          let updatedLead = lead;

          if (!lead.email && lead.firstName && lead.domain) {
            console.log(`Looking up email for ${lead.firstName} ${lead.lastName || ""} at ${lead.domain}`);
            
            const { foundEmail, verificationResults } = await findValidEmail(
              lead.firstName,
              lead.lastName || "",
              lead.domain
            );

            if (foundEmail) {
              console.log(`✓ Found valid email: ${foundEmail}`);
              updatedLead = await storage.updateLead(lead.id, {
                foundEmail: foundEmail,
                enrichmentStatus: "enriched",
              }) || lead;
            } else {
              console.log(`✗ No valid email found (tested ${verificationResults.length} patterns)`);
              await storage.updateLead(lead.id, {
                enrichmentStatus: "failed",
                errorMessage: `No valid email found among ${verificationResults.length} tested patterns`,
              });
            }
          } else if (lead.email) {
            await storage.updateLead(lead.id, {
              enrichmentStatus: "skipped",
            });
          }

          const template = generateEmailTemplate(updatedLead);
          return storage.updateLead(updatedLead.id, {
            subject: template.subject,
            messageBody: template.body,
          });
        })
      );

      // Mark remaining leads as pending enrichment
      const remainingLeads = createdLeads.slice(5);
      if (remainingLeads.length > 0) {
        console.log(`${remainingLeads.length} leads remaining (not processed in test mode)`);
      }

      console.log(`Created ${leadsWithMessages.length} leads with email enrichment and generated messages`);

      res.json({
        success: true,
        leadsCount: createdLeads.length,
        processedCount: leadsWithMessages.length,
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

  // Test email validation endpoint (Mailboxlayer)
  app.get("/api/test-email-validation", async (_req, res) => {
    try {
      const allLeads = await storage.getAllLeads();
      const testLeads = allLeads.slice(0, 5);

      console.log("\n=== Email Validation Test Results ===");
      console.log(`Testing ${testLeads.length} leads with Mailboxlayer\n`);

      const results = [];

      for (const lead of testLeads) {
        console.log(`\n${lead.firstName} ${lead.lastName || ""} (${lead.company || "No company"})`);
        console.log(`  Domain: ${lead.domain || "No domain"}`);

        if (!lead.domain || !lead.firstName) {
          console.log(`  ⚠ Skipped: Missing required data`);
          results.push({
            leadId: lead.id,
            name: `${lead.firstName} ${lead.lastName || ""}`,
            company: lead.company,
            domain: lead.domain,
            skipped: true,
            reason: "Missing domain or first name",
          });
          continue;
        }

        const emailPatterns = generateEmailPatterns(
          lead.firstName,
          lead.lastName || "",
          lead.domain
        );

        console.log(`  Generated ${emailPatterns.length} email patterns:`);
        emailPatterns.forEach((pattern) => {
          console.log(`    - ${pattern.pattern}: ${pattern.email}`);
        });

        const { foundEmail, verificationResults } = await findValidEmail(
          lead.firstName,
          lead.lastName || "",
          lead.domain
        );

        console.log(`\n  Verification Results:`);
        verificationResults.forEach((result, idx) => {
          const status = result.valid
            ? "✓ VALID"
            : result.error
            ? `✗ ERROR: ${result.error}`
            : `✗ Invalid (SMTP: ${result.smtpCheck}, Score: ${result.score})`;
          console.log(`    ${idx + 1}. ${result.email} - ${status}`);
        });

        if (foundEmail) {
          console.log(`\n  ✅ Chosen Valid Email: ${foundEmail}`);
          
          await storage.updateLead(lead.id, {
            foundEmail: foundEmail,
            enrichmentStatus: "enriched",
          });
        } else {
          console.log(`\n  ❌ No valid email found`);
        }

        results.push({
          leadId: lead.id,
          name: `${lead.firstName} ${lead.lastName || ""}`,
          company: lead.company,
          domain: lead.domain,
          emailPatterns: emailPatterns.map((p) => p.email),
          verificationResults: verificationResults.map((r) => ({
            email: r.email,
            valid: r.valid,
            score: r.score,
            smtpCheck: r.smtpCheck,
            error: r.error,
          })),
          chosenEmail: foundEmail,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("\n=================================\n");

      res.json({
        success: true,
        totalLeads: allLeads.length,
        testedCount: testLeads.length,
        results,
      });
    } catch (error) {
      console.error("Error in test-email-validation:", error);
      res.status(500).json({
        error: "Failed to test email validation",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Test email lookup endpoint
  app.get("/api/test-email-lookup", async (_req, res) => {
    try {
      const allLeads = await storage.getAllLeads();

      const testResults = allLeads.slice(0, 5).map(lead => ({
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        company: lead.company,
        domain: lead.domain,
        originalEmail: lead.email,
        foundEmail: lead.foundEmail,
        emailConfidence: lead.emailConfidence,
        enrichmentStatus: lead.enrichmentStatus,
        errorMessage: lead.errorMessage,
      }));

      console.log("\n=== Email Lookup Test Results ===");
      testResults.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.firstName} ${result.lastName} (${result.company})`);
        console.log(`   Domain: ${result.domain}`);
        console.log(`   Original Email: ${result.originalEmail || "None"}`);
        console.log(`   Found Email: ${result.foundEmail || "None"}`);
        console.log(`   Confidence: ${result.emailConfidence || "N/A"}`);
        console.log(`   Status: ${result.enrichmentStatus}`);
        if (result.errorMessage) {
          console.log(`   Error: ${result.errorMessage}`);
        }
      });
      console.log("\n=================================\n");

      res.json({
        success: true,
        totalLeads: allLeads.length,
        testResults,
      });
    } catch (error) {
      console.error("Error in test-email-lookup:", error);
      res.status(500).json({
        error: "Failed to retrieve test results",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
