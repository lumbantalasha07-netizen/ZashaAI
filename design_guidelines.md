# Design Guidelines: Cold Outreach Automation Dashboard

## Design Approach

**Selected Approach:** Design System - Material Design 3
**Justification:** This utility-focused application prioritizes data clarity, workflow efficiency, and professional credibility. Material Design 3 provides robust patterns for data-dense interfaces, form handling, and action-driven workflows essential for lead management tools.

**Key Design Principles:**
1. **Clarity First:** Every element serves the core workflow of upload → process → send
2. **Data Transparency:** Full visibility into lead status, email content, and actions
3. **Confident Actions:** Clear, trustworthy CTAs for high-stakes operations (sending emails)
4. **Progressive Disclosure:** Show complexity only when needed

---

## Typography System

**Primary Font:** Inter (via Google Fonts)
**Secondary Font:** Roboto Mono (for data/email addresses)

**Hierarchy:**
- **Dashboard Title:** 32px/40px, font-weight 700, letter-spacing -0.5px
- **Section Headers:** 24px/32px, font-weight 600
- **Table Headers:** 14px/20px, font-weight 600, uppercase, letter-spacing 0.5px
- **Body/Table Data:** 15px/24px, font-weight 400
- **Email Preview Text:** 14px/22px, font-weight 400
- **Metadata/Counts:** 13px/20px, font-weight 500
- **Button Text:** 15px/20px, font-weight 600

---

## Layout System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (within components): 2, 4
- Component padding: 6, 8
- Section spacing: 12, 16
- Major section breaks: 24

**Container Structure:**
- Main container: `max-w-7xl mx-auto px-6 py-8`
- Card containers: `p-6` on desktop, `p-4` on mobile
- Table cells: `px-4 py-3`

**Grid System:**
- Single column on mobile (< 768px)
- Two-column layout for upload/preview sections on tablet+ (≥ 768px)
- Full-width table on all viewports with horizontal scroll if needed

---

## Component Library

### 1. Dashboard Header
**Layout:** Fixed top bar, full-width
- Logo/App name on left (text-based: "Zasha Outreach Automation")
- User indicator on right showing sender: "Sending as: Lumba Ntalasha (CEO)"
- Subtle bottom border for separation
- Height: 64px
- Padding: px-6

### 2. Upload Section
**Layout:** Prominent card at top of main content
- Drag-and-drop zone with dashed border (4px, rounded-lg)
- File input button as fallback
- Upload icon (cloud-upload from Heroicons)
- Instructions: "Upload CSV with leads (Name, Company, Domain columns required)"
- File name display when selected
- Upload progress indicator (linear bar below zone when processing)
- Padding: 12 on all sides

### 3. Stats Overview Bar
**Layout:** Horizontal strip below upload, before table
- Four stat cards in grid (grid-cols-2 md:grid-cols-4)
- Each card shows: Label (13px), Number (28px bold), Icon
- Stats: Total Leads, Emails Found, Ready to Send, Sent
- Gap: 4 between cards
- Individual card padding: 4

### 4. Leads Data Table
**Layout:** Full-width responsive table with card wrapper
- Sticky header row (position: sticky, top: 64px to account for nav)
- Columns: Checkbox, Name, Company, Domain, Email Status, Subject Preview, Actions
- Row height: min-h-16 for comfortable scanning
- Alternating row treatment for readability
- Cell padding: px-4 py-3
- Email addresses in Roboto Mono
- Status badges (pill-shaped, 8px padding horizontal, 4px vertical)

**Table Features:**
- Select all checkbox in header
- Individual row checkboxes for batch operations
- "Email Status" column shows: Searching (spinner), Found (check icon), Not Found (x icon), Sent (paper plane icon)
- "Actions" column: Preview button (eye icon), individual send (only for processed leads)
- Empty state: Centered message "Upload a CSV to begin" with upload icon (48px size)

### 5. Email Preview Modal
**Layout:** Centered overlay (max-w-3xl)
- Header: Lead name + company, close button (X)
- Preview area divided into two sections:
  - Email metadata: To, From, Subject (each row with label + value)
  - Email body: Full HTML preview with proper typography, scrollable if long
- Footer: "Edit" and "Send Now" buttons
- Padding: 6 throughout, 8 for body section
- Backdrop: Semi-transparent overlay

### 6. Action Bar
**Layout:** Sticky bottom bar on mobile, inline on desktop
- Desktop: Positioned below stats bar, above table
- Mobile: Fixed bottom (bottom-0, z-10)
- Contains primary actions in row:
  - "Process Leads" button (primary, disabled until CSV uploaded)
  - "Send All" button (primary destructive style, disabled until leads processed)
  - "Send Selected" button (secondary, only enabled when checkboxes selected)
  - Lead count indicator: "X leads selected"
- Padding: 4, gap between buttons: 3

**Button Specifications:**
- Height: 44px (comfortable touch target)
- Padding: px-6
- Border radius: 8px
- Primary buttons: Full treatment with icon prefix (paper plane for send actions)
- Disabled state: Reduced opacity (0.5), not-allowed cursor
- Icons: 20px from Heroicons

### 7. Processing Status Panel
**Layout:** Appears as overlay card (top-right corner) during operations
- Shows current operation: "Processing leads..." or "Sending emails..."
- Progress: X of Y complete
- Linear progress bar
- Cancel button for long operations
- Width: 320px
- Padding: 6
- Elevation/shadow treatment

### 8. Notification System
**Layout:** Toast notifications (top-right corner)
- Success: "CSV uploaded successfully", "Emails sent to X leads"
- Error: "Upload failed", "Email sending failed for X leads"
- Warning: "X leads have no email found"
- Auto-dismiss after 5 seconds, manual close option
- Stack vertically with 3 gap
- Width: 360px
- Padding: 4

### 9. Configuration Panel (Collapsible)
**Layout:** Optional expansion panel below stats
- Collapsed by default: "Settings" with chevron icon
- Expanded shows:
  - Email template customization toggle
  - Pitch type selection (Website needed vs. AI only)
  - Sender verification status
- Padding: 6 when expanded

---

## Responsive Behavior

**Mobile (< 768px):**
- Stack upload and preview sections vertically
- Horizontal scroll for table (with scroll indicator shadow)
- Action bar fixed to bottom
- Stats in 2x2 grid
- Simplified table (hide preview column, show via row tap)

**Tablet (768px - 1024px):**
- Two-column layout for upload/stats
- Full table visible
- Action bar inline above table

**Desktop (> 1024px):**
- Optimal data density
- All columns visible
- Comfortable spacing throughout

---

## Interaction Patterns

**Primary Workflow:**
1. Upload CSV → Immediate validation feedback
2. Auto-display uploaded data in table
3. "Process Leads" becomes enabled → Click initiates email lookup
4. Progress updates in real-time for each lead
5. Review previews (click any row or preview icon)
6. Select leads (checkboxes) or use "Send All"
7. Confirmation modal before sending
8. Success feedback with sent count

**Micro-interactions:**
- Button loading states (spinner replaces icon during processing)
- Row hover treatment (subtle lift or highlight)
- Checkbox animations (smooth check transition)
- Status icon transitions (fade in when status updates)
- Modal entry/exit (scale from center, 200ms duration)

---

## Images

**Hero Section:** No hero image needed - this is a functional dashboard, not a marketing page

**Icons:** Heroicons via CDN (outline style for most UI, solid for status indicators)
- Upload: cloud-arrow-up
- Success: check-circle
- Error: x-circle
- Processing: arrow-path (spinning)
- Send: paper-airplane
- Preview: eye
- Settings: cog-6-tooth

---

## Accessibility

**Form Controls:**
- All inputs have visible labels
- File upload announces selection to screen readers
- Table headers properly associated with data cells
- Focus indicators on all interactive elements (2px solid outline, offset 2px)

**Keyboard Navigation:**
- Tab order: Upload → Process button → Table rows → Send buttons
- Enter key activates preview from table row focus
- Escape closes modals
- Arrow keys navigate table cells when focused

**ARIA Labels:**
- Progress indicators announce percentage
- Status changes announce to screen readers
- Batch actions announce selection count
- Loading states communicate operation in progress

---

This design creates a professional, efficient dashboard that prioritizes the core workflow while maintaining clarity and trustworthiness for a business-critical email automation tool.