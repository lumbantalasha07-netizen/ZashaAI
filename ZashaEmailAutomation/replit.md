# Zasha Outreach Automator

## Overview
A full-stack email outreach automation platform that streamlines lead management and personalized email campaigns. Upload CSV files with lead data, automatically generate personalized messages based on whether prospects have websites, and send bulk emails via Sendinblue with proper rate limiting.

## Project Status
**Current State:** MVP Complete - Full-stack application with CSV upload, message generation, and bulk email sending

**Last Updated:** October 29, 2025

## Features

### Core Functionality
- **CSV Upload & Processing**: Drag-and-drop interface for uploading lead data (first_name, last_name, company, website, domain, has_website, profile_url, email)
- **Automatic Message Generation**: Two personalized templates based on website presence
  - Template 1 (Has Website): AI automation pitch for existing websites
  - Template 2 (No Website): Website + AI package pitch
- **Lead Management**: View, edit, and delete leads with real-time updates
- **Message Preview & Editing**: Review and customize messages before sending
- **Bulk Email Sending**: Send campaigns via Sendinblue with throttling and progress tracking
- **Real-time Status Tracking**: Monitor send status (pending, sending, sent, failed) for each lead

### Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI components
- **Backend**: Node.js, Express, TypeScript
- **Email Service**: Sendinblue (Brevo) API
- **Storage**: In-memory storage (MemStorage)
- **Data Processing**: CSV parsing with csv-parse

## Project Architecture

### Data Model
```typescript
Lead {
  id: string
  firstName: string
  lastName: string
  company: string
  website: string
  domain: string
  hasWebsite: boolean
  profileUrl: string
  email: string
  enrichmentStatus: "pending" | "enriched" | "failed" | "skipped"
  sendStatus: "pending" | "sending" | "sent" | "failed"
  subject: string
  messageBody: string
  errorMessage: string
  sentAt: timestamp
}
```

### API Endpoints
- `GET /api/leads` - Fetch all leads
- `GET /api/leads/:id` - Fetch single lead
- `POST /api/leads/upload` - Upload CSV and create leads
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `POST /api/leads/:id/send-test` - Send test email
- `POST /api/leads/send-bulk` - Send bulk emails
- `DELETE /api/leads` - Delete all leads

### Message Templates

**Template 1: Has Website**
```
Subject: Quick idea for [Company]
Body: Hi [FirstName], noticed [Company]'s site — quick idea to add AI automation 
that increases online orders and cuts staff time.

We build a small automation (menu + chatbot + order routing) that typically lifts 
online conversions in 30 days. Interested in a 15-minute demo next week?

— Lumba Ntalasha, CEO of Zasha
```

**Template 2: No Website**
```
Subject: Build a modern site + AI for [Company]
Body: Hi [FirstName], I scraped your profile — I can build a modern website for 
[Company] and add simple AI automations (chat/order/booking) so you start taking 
more orders online.

I can show a one-plane plan and estimate in 15 minutes. When works best for a quick call?

— Lumba Ntalasha, CEO of Zasha
```

## Environment Variables

Required secrets (add via Replit Secrets):
```bash
SENDINBLUE_API_KEY=xkeysib-...  # Your Sendinblue API key
FROM_EMAIL=zashadigitalenterprises@gmail.com  # Sender email address
SENDER_NAME=Lumba Ntalasha, CEO of Zasha  # Sender name
```

Optional:
```bash
PORT=3000  # Server port (default: 3000)
```

## Design System

### Colors
- **Primary**: Light Blue (`hsl(206 100% 50%)`) - Used for CTAs, branding, accents
- **Background**: Light gray (`hsl(210 5% 98%)`)
- **Card**: Slightly elevated (`hsl(210 5% 96%)`)
- **Status Colors**:
  - Success/Sent: Green (`bg-green-600`)
  - Failed: Red (`bg-red-600/destructive`)
  - Pending: Gray (`bg-secondary`)

### Typography
- **Font Family**: Inter (primary), JetBrains Mono (code/email previews)
- **Hierarchy**: H1 (3xl bold) → H2 (xl semibold) → Body (base) → Helper (sm)

### Component Standards
- **Spacing**: p-6 or p-8 for cards, gap-6 or gap-8 for sections
- **Borders**: Subtle borders with small radius (rounded-lg)
- **Shadows**: Minimal, subtle elevation (shadow-sm)
- **Interactions**: Hover states with slight elevation

## User Workflow

1. **Upload CSV**: Drag and drop or browse for CSV file with lead data
2. **Review Leads**: View uploaded leads in table, see generated messages
3. **Edit as Needed**: Click edit to modify email addresses or message content
4. **Preview Messages**: Click eye icon to see full message preview
5. **Send Campaign**: Click "Send All Emails" and confirm to start bulk send
6. **Monitor Progress**: Watch real-time status updates as emails are sent

## CSV Format

Expected columns (case-insensitive):
- `first_name` or `firstName` - Required
- `last_name` or `lastName` - Optional
- `company` or `Company` - Required for personalization
- `website` - Optional
- `domain` - Optional
- `has_website` - Boolean (true/false/1/0) or auto-detected from website/domain
- `profile_url` or `profileUrl` - Optional
- `email` - Optional (can be added manually later)

Example CSV:
```csv
first_name,last_name,company,website,domain,has_website,email
John,Doe,Acme Corp,https://acme.com,acme.com,true,john@acme.com
Jane,Smith,Beta LLC,,,false,jane@beta.com
```

## Recent Changes
- **2025-10-29**: Initial MVP implementation
  - Created schema and data models for leads
  - Built complete frontend with Dashboard, CSV upload, leads table, modals
  - Implemented backend API with CSV parsing, message generation, Sendinblue integration
  - Added rate limiting for bulk sends (configurable throttle)
  - Designed light blue theme with clean, modern interface
  - **Testing & Polish**:
    - Added comprehensive `data-testid` attributes to all interactive elements (buttons, inputs) and display elements (text, status badges) for automated testing
    - Implemented real-time bulk send progress tracking with polling (fetches lead status every second during send)
    - Added loading states with spinner for initial data fetch
    - Fixed modal closing bug - ConfirmSendModal now properly closes after successful bulk send
    - All features tested and architect-approved

## User Preferences
- **Design**: Clean, modern look with light colors (white + light blue)
- **Email Service**: Sendinblue (Brevo) for sending
- **Sender**: Lumba Ntalasha, CEO of Zasha
- **Branding**: "Built by Zasha" in footer

## Known Limitations
- In-memory storage (data lost on server restart)
- No authentication/user management
- No email open/click tracking
- No drip campaigns or scheduling
- Basic error handling for failed sends

## Future Enhancements
- PostgreSQL database for persistence
- Campaign analytics dashboard
- Email scheduling and drip campaigns
- A/B testing for subject lines
- Reply detection and management
- Lead segmentation and tagging
- Apify integration for email enrichment (optional)
