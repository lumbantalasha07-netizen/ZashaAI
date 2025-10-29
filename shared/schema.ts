import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Lead schema for CSV-based outreach campaigns
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  company: text("company"),
  website: text("website"),
  domain: text("domain"),
  hasWebsite: boolean("has_website").default(false).notNull(),
  profileUrl: text("profile_url"),
  email: text("email"),
  foundEmail: text("found_email"),
  emailConfidence: text("email_confidence"),
  enrichmentStatus: text("enrichment_status").default("pending").notNull(), // pending, enriched, failed, skipped
  sendStatus: text("send_status").default("pending").notNull(), // pending, sending, sent, failed
  subject: text("subject"),
  messageBody: text("message_body"),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  enrichmentStatus: true,
  sendStatus: true,
  sentAt: true,
});

export const updateLeadSchema = createInsertSchema(leads).omit({
  id: true,
}).partial();

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;

// Template type for email generation
export const emailTemplates = {
  hasWebsite: {
    type: "website_owners",
    name: "AI Automation for Existing Websites",
    description: "For businesses that already have a website",
  },
  noWebsite: {
    type: "no_website",
    name: "Website + AI Package",
    description: "For businesses without a website",
  },
} as const;

// CSV upload response
export type CsvUploadResponse = {
  success: boolean;
  leadsCount: number;
  leads: Lead[];
  errors?: string[];
};

// Bulk send request
export const bulkSendSchema = z.object({
  leadIds: z.array(z.string()).optional(),
  throttlePerSecond: z.number().min(1).max(10).default(2),
});

export type BulkSendRequest = z.infer<typeof bulkSendSchema>;

// Send status response
export type SendStatusResponse = {
  leadId: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
  sentAt?: string;
};
