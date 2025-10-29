import { type Lead, type InsertLead, type UpdateLead } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lead management
  createLead(lead: InsertLead): Promise<Lead>;
  createLeads(leads: InsertLead[]): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  getAllLeads(): Promise<Lead[]>;
  updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined>;
  updateLeads(updates: { id: string; data: UpdateLead }[]): Promise<Lead[]>;
  deleteLead(id: string): Promise<boolean>;
  deleteAllLeads(): Promise<void>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;

  constructor() {
    this.leads = new Map();
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      enrichmentStatus: "pending",
      sendStatus: "pending",
      hasWebsite: insertLead.hasWebsite ?? false,
      subject: null,
      messageBody: null,
      errorMessage: null,
      sentAt: null,
    };
    this.leads.set(id, lead);
    return lead;
  }

  async createLeads(insertLeads: InsertLead[]): Promise<Lead[]> {
    const leads: Lead[] = [];
    for (const insertLead of insertLeads) {
      const lead = await this.createLead(insertLead);
      leads.push(lead);
    }
    return leads;
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getAllLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async updateLead(id: string, updates: UpdateLead): Promise<Lead | undefined> {
    const lead = this.leads.get(id);
    if (!lead) return undefined;

    const updatedLead: Lead = { ...lead, ...updates };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async updateLeads(updates: { id: string; data: UpdateLead }[]): Promise<Lead[]> {
    const results: Lead[] = [];
    for (const { id, data } of updates) {
      const updated = await this.updateLead(id, data);
      if (updated) results.push(updated);
    }
    return results;
  }

  async deleteLead(id: string): Promise<boolean> {
    return this.leads.delete(id);
  }

  async deleteAllLeads(): Promise<void> {
    this.leads.clear();
  }
}

export const storage = new MemStorage();
