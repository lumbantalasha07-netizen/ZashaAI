import { type Lead, type InsertLead, type UpdateLead, leads } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      firstName: insertLead.firstName,
      lastName: insertLead.lastName ?? null,
      company: insertLead.company ?? null,
      website: insertLead.website ?? null,
      domain: insertLead.domain ?? null,
      profileUrl: insertLead.profileUrl ?? null,
      email: insertLead.email ?? null,
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
      firstName: insertLead.firstName,
      lastName: insertLead.lastName ?? null,
      company: insertLead.company ?? null,
      website: insertLead.website ?? null,
      domain: insertLead.domain ?? null,
      profileUrl: insertLead.profileUrl ?? null,
      email: insertLead.email ?? null,
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
    await db.delete(leads).where(eq(leads.id, id));
    return true;
  }

  async deleteAllLeads(): Promise<void> {
    await db.delete(leads);
  }
}

export const storage = new DatabaseStorage();
