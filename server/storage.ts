import { type Lead, type InsertLead, type UpdateLead, leads } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
    connectionString = `https://${projectRef}.supabase.co/rest/v1/`;
  }
}

if (!connectionString) {
  throw new Error("DATABASE_URL or VITE_SUPABASE_URL environment variable is required");
}

const sql = neon(connectionString);
const db = drizzle(sql);

export interface IStorage {
  createLead(lead: InsertLead): Promise<Lead>;
  createLeads(leads: InsertLead[]): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined>;
  updateLeads(updates: { id: string; data: UpdateLead }[]): Promise<Lead[]>;
  deleteLead(id: string): Promise<boolean>;
  deleteAllLeads(): Promise<void>;
}

export class SupabaseStorage implements IStorage {
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      enrichmentStatus: "pending",
      sendStatus: "pending",
      hasWebsite: insertLead.hasWebsite ?? false,
      foundEmail: null,
      emailConfidence: null,
      subject: null,
      messageBody: null,
      errorMessage: null,
      sentAt: null,
      createdAt: new Date(),
    };

    await db.insert(leads).values(lead);
    return lead;
  }

  async createLeads(insertLeads: InsertLead[]): Promise<Lead[]> {
    const leadsToInsert: Lead[] = insertLeads.map(insertLead => ({
      ...insertLead,
      id: randomUUID(),
      enrichmentStatus: "pending",
      sendStatus: "pending",
      hasWebsite: insertLead.hasWebsite ?? false,
      foundEmail: null,
      emailConfidence: null,
      subject: null,
      messageBody: null,
      errorMessage: null,
      sentAt: null,
      createdAt: new Date(),
    }));

    await db.insert(leads).values(leadsToInsert);
    return leadsToInsert;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    return result[0];
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads);
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined> {
    await db.update(leads).set(updates).where(eq(leads.id, id));
    return await this.getLead(id);
  }

  async updateLeads(updatesList: { id: string; data: UpdateLead }[]): Promise<Lead[]> {
    const results: Lead[] = [];
    for (const { id, data } of updatesList) {
      const updated = await this.updateLead(id, data);
      if (updated) results.push(updated);
    }
    return results;
  }

  async deleteLead(id: string): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  async deleteAllLeads(): Promise<void> {
    await db.delete(leads);
  }
}

export const storage = new SupabaseStorage();
