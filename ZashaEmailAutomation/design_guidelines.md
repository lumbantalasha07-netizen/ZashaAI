# Design Guidelines: Zasha Outreach Automator

## Design Approach

**Selected Approach:** Design System (Material Design) with utility-focused modifications

**Justification:** This is a productivity tool focused on efficiency and data management. Material Design provides clear visual hierarchy for forms, tables, and action buttons while maintaining the requested clean, modern aesthetic.

**Key Principles:**
- Clarity over decoration - every element serves the workflow
- Information density balanced with breathing room
- Progressive disclosure - show data as it's processed
- Status feedback at every step

## Core Design Elements

### A. Typography

**Font Family:** 
- Primary: Inter (Google Fonts) - clean, readable at all sizes
- Monospace: JetBrains Mono - for email previews and code-like content

**Hierarchy:**
- Page Title (H1): text-3xl font-bold (Zasha Outreach Automator)
- Section Headers (H2): text-xl font-semibold 
- Subsections (H3): text-lg font-medium
- Body Text: text-base font-normal
- Helper Text: text-sm text-gray-600
- Table Headers: text-sm font-semibold uppercase tracking-wide

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3

**Container Strategy:**
- Main dashboard: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Cards/Panels: Full width within container
- Forms: max-w-2xl when standalone

**Grid System:**
- Single column layout for primary workflow
- Two-column for status panels (uploaded count / processed count)
- Table spans full width with horizontal scroll on mobile

### C. Component Library

**1. Dashboard Container**
- Full-height layout with header, main content area, footer
- Header: Sticky top bar with app title and status indicators
- Main: Vertical flow of workflow sections
- Footer: "Built by Zasha" centered, text-sm, subtle styling

**2. Workflow Sections (Cards)**
Each step in a distinct card with:
- Card wrapper: rounded-lg border shadow-sm bg-white
- Section number badge: rounded-full with step number
- Section title and description
- Action area with clear CTAs

**3. File Upload Component**
- Dropzone style: dashed border, center-aligned text
- "Choose File" button + drag-and-drop area
- File name display after selection with remove option
- Upload progress indicator (linear bar)

**4. Data Table**
- Sticky header row with sort indicators
- Alternating row colors for readability (subtle)
- Fixed column widths for: Name (200px), Company (180px), Email (240px)
- Flexible width for: Message Preview
- Status column with colored badges (gray: pending, green: success, red: failed)
- Row actions: Preview button (eye icon), Edit button (pencil icon)

**5. Buttons**
Primary Actions:
- "Process CSV" button: Large, prominent (px-6 py-3)
- "Send All Emails" button: Large, with confirmation modal trigger

Secondary Actions:
- "Preview" / "Edit": Smaller (px-3 py-2), icon + text
- "Upload": Medium size (px-4 py-2.5)

Button States:
- Default: Solid with good contrast
- Hover: Slight darkening
- Loading: Spinner icon + "Processing..." text
- Disabled: Reduced opacity with cursor-not-allowed

**6. Status Indicators**
- Stats Cards: Grid of 2-4 cards showing counts
  - Total Leads: Large number with label
  - Emails Found: Number + percentage
  - Sent Successfully: Green accent
  - Failed: Red accent
- Real-time progress: Linear progress bar during processing
- Toast notifications: Top-right corner for actions completed

**7. Message Preview Panel**
- Modal overlay for full message preview
- Split view: Subject line (bold) + Body (preserves line breaks)
- Edit mode: Textarea inputs for subject and body
- Actions: Save, Cancel, Send Test

**8. Forms**
Input Fields:
- Label above input: text-sm font-medium mb-1
- Input styling: Bordered, rounded, focus ring
- Helper text below: text-xs text-gray-500
- Error states: Red border + error message in red

Environment Setup Section:
- Collapsible panel for API key inputs
- Password-type inputs with "show/hide" toggle
- "Test Connection" buttons next to each API key field

### D. Information Architecture

**Page Flow:**
1. Header (always visible)
2. Environment Status Banner (if keys not configured)
3. Upload Section (Step 1)
4. Processing Controls (Step 2) - appears after upload
5. Results Table (Step 3) - appears after processing
6. Send Controls (Step 4) - appears when results ready
7. Footer

**Responsive Behavior:**
- Desktop (lg+): All sections visible, table scrolls horizontally if needed
- Tablet (md): Maintain vertical flow, condense table columns
- Mobile (base): Stack all elements, convert table to card list

### E. Micro-interactions

**Minimal Animation Strategy:**
- Section reveals: Fade-in (300ms) when data loads
- Button clicks: Subtle scale (95%) on active
- Table row hover: Background color change (no animation)
- Progress bars: Smooth width transitions
- No page transitions, no elaborate effects

**Loading States:**
- CSV Processing: Linear progress bar + "Processing X of Y leads..."
- Email Sending: Per-row spinner in status column
- Button loading: Replace text with spinner

## Special Components

**Email Template Preview Cards:**
For the two template types, show example cards side by side:
- Card with icon (website icon vs. no-website icon)
- Template name: "Website Owners" / "No Website"
- Sample message excerpt (3 lines max)
- "Used for X leads" count

**Confirmation Modal:**
Before "Send All":
- Warning icon
- "You're about to send X emails"
- Breakdown: X to leads with websites, Y to leads without
- Checkbox: "I've reviewed the message templates"
- "Cancel" and "Confirm & Send" buttons

## Visual Style Notes

Per user request: Clean modern look with the specified light color palette. All layout decisions prioritize workflow efficiency and data clarity. Components use subtle shadows and borders for depth rather than heavy visual treatments. Typography hierarchy ensures scannability of large data sets.