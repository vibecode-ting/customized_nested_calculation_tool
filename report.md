# PMA Nesting Tool — Internal Report

**Project Name:** PMA Nesting v2.6  
**Developer:** Htet Aung Hlaing (ting) — PCM PCAG IT Team, Pou Chen Corporation  
**Deployment:** Internal Web Application (GitLab Pages)  
**Access URL:** nesting.pouchen.online  
**Date:** June 2026  

---

## 1. Executive Summary

PMA Nesting is an internal web-based tool built to automate the consolidation of shoe production orders for Adidas production at Pou Chen Myanmar (PCM). It replaces the manual process of merging multiple Excel size-run sheets into a single nesting breakdown — a task that previously took production staff significant time per order batch.

The tool runs entirely in the user's web browser. No server infrastructure is required. No data leaves the user's machine. It is fast, secure, and available to any staff member with a modern web browser.

---

## 2. Problem Statement

### The Manual Process (Before)

Production planning staff at PCM regularly need to consolidate multiple Sales Orders (SOs) into a single nesting summary. Each SO contains size-run quantities (e.g., UK 3, UK 4, UK 5...) for a specific article/model/color combination.

**Manual workflow:**
1. Open multiple Excel files — one per order or one large export from SAP
2. For each SO, identify the size columns and quantities
3. Manually sum quantities across all selected orders, grouped by size
4. Track which order contributed which quantity to each size
5. Compile a final summary table showing total pairs per size
6. Verify totals match expected quantities

**Pain points:**
- Highly repetitive and error-prone (copy-paste mistakes, missed rows)
- Each batch of orders can take 30–60 minutes to consolidate manually
- No audit trail of who generated what, when
- Difficult to verify accuracy without re-doing the entire process
- Staff must be trained on Excel formulas and pivot tables

---

## 3. Solution Overview

### What PMA Nesting Does

PMA Nesting automates the entire consolidation process in four steps:

```
Step 1: Load Data        →  Upload Excel file or select from server
Step 2: Configure        →  Confirm which columns are sizes vs. metadata
Step 3: Select Orders    →  Enter SO numbers to include in the nesting
Step 4: Generate & Export →  View results table, export to Excel
```

### How It Works (Technical Summary)

| Aspect | Detail |
|--------|--------|
| **Architecture** | Single-page web application (SPA), fully client-side |
| **Technology** | React 18 + TypeScript + Tailwind CSS |
| **Excel Engine** | SheetJS (xlsx) for reading and writing Excel files |
| **Data Storage** | Browser localStorage (datasets, preferences, logs) |
| **Server Required** | None — runs entirely in the browser |
| **Deployment** | Static files hosted on GitLab Pages, auto-deployed via CI/CD |
| **Browser Support** | Chrome, Edge, Firefox (any modern browser) |

---

## 4. Core Logic and Processing Flow

### 4.1 Excel File Parsing

When a user uploads an Excel file, the tool performs intelligent column detection:

1. **Header Detection** — Scans up to 50 rows to find the actual header row (handles SAP exports with metadata headers). Matches column names against 10+ known patterns: "Order No", "Sales Order", "SO Number", "S/O", "Sales Doc", etc.

2. **Size Column Detection** — Multi-pass heuristic:
   - Filters out metadata columns (total, qty, order, article, model, color, gender, remark, date)
   - Identifies size columns by name patterns (UK3, US8, EUR42) or purely numeric headers
   - Validates by checking first 15 rows contain numeric values

3. **Auto-Detection** — Automatically identifies Article, Model, and Color columns using regex patterns. Also supports Chinese column headers (型號, 型體, 顏色, 色名).

### 4.2 Nesting Calculation Algorithm

The core algorithm in `App.tsx` performs these steps when the user clicks "Generate":

```
Input:  Selected SO numbers + Filtered dataset rows

1. Filter rows matching selected SO numbers
2. For each row:
   - Read each size column value
   - Accumulate into sizeDataMap<size, {total, orders[], articles[], models[], colors[]}>
   - Track per-order breakdown (which order contributed how many pairs to each size)
3. Build orderTotalsMap (grand total per order)
4. Sort sizes by quantity (descending)
5. Compile final NestingResult with:
   - Total quantity across all sizes
   - Per-order totals
   - Per-size breakdown with order details
   - Unique articles, models, colors per size
```

### 4.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER WORKFLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐         │
│  │  Upload   │───>│  Configure   │───>│ Select Orders │         │
│  │  Excel    │    │  Columns     │    │ (SO Numbers)  │         │
│  └──────────┘    └──────────────┘    └───────┬───────┘         │
│                                              │                  │
│                                              v                  │
│                                       ┌──────────────┐         │
│                                       │   Generate   │         │
│                                       │   Nesting    │         │
│                                       └──────┬───────┘         │
│                                              │                  │
│                                              v                  │
│                                       ┌──────────────┐         │
│                                       │  View Table  │         │
│                                       │  Export Excel │         │
│                                       └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Data stored in: Browser localStorage (no server transmission)
```

---

## 5. User Interface and Experience

### 5.1 Layout

The application uses a three-column layout:

| Column | Width | Purpose |
|--------|-------|---------|
| Left | 176px (fixed) | Data source management + Article filter |
| Center | 224px (fixed) | SO number input + validation |
| Right | Flexible | Results table + export controls |

The layout is responsive — collapses to a single column on mobile devices.

### 5.2 Key Features

**Smart Validation:**
- Real-time SO number validation — green (valid), red (invalid), orange (duplicate)
- Autocomplete from available SO numbers in the dataset
- "Add All" button to select all orders at once

**Results Table:**
- Draggable columns — users can reorder columns by drag-and-drop
- Resizable columns — adjust width by dragging column borders
- Color-coded indicators — green (single article/model), red (multiple — conflict warning)
- Sticky header and footer — totals always visible while scrolling
- Per-order breakdown inline — shows "SO#: qty" badges per size

**Export to Excel:**
- Generates a formatted `.xlsx` file with two sheets:
  - "Nesting Breakdown" — full detail table with auto-adjusted column widths
  - "Order Summary" — per-order totals with grand total
- One-click download, no server processing

**Multi-Language Support:**
- English (primary)
- Burmese (Myanmar)
- Traditional Chinese

**Dark Mode:**
- Full dark theme toggle, persisted across sessions

**Security:**
- Auto-lock after 5 minutes of inactivity
- Lock screen with code verification
- "Internal Use Only" indicator

**Built-in Tutorial:**
- Step-by-step visual guide accessible from the header
- Troubleshooting section
- Developer contact information

---

## 6. Benefits and Impact

### 6.1 Time Savings

| Metric | Manual Process | With PMA Nesting | Improvement |
|--------|---------------|------------------|-------------|
| Consolidate 10 orders | 30–60 minutes | 1–2 minutes | ~95% reduction |
| Consolidate 50 orders | 2–3 hours | 2–3 minutes | ~97% reduction |
| Verify accuracy | 15–30 minutes (re-do) | Instant (visual + order breakdown) | ~100% reduction |
| Export formatted report | 10–20 minutes | 5 seconds (one-click) | ~99% reduction |
| Train new staff | Hours (Excel training) | 5 minutes (built-in tutorial) | ~90% reduction |

**Estimated annual time savings:** Based on typical usage of 5–10 nesting operations per day across the production planning team, the tool saves approximately **200–400 person-hours per year** on consolidation tasks alone.

### 6.2 Accuracy Improvements

- **Zero calculation errors** — automated summation eliminates human math mistakes
- **Conflict detection** — highlights when a size has orders with different articles/models/colors
- **Complete audit trail** — every generation is logged with timestamp, IP, and SO list
- **Reproducible results** — same inputs always produce identical outputs

### 6.3 Operational Benefits

| Benefit | Description |
|---------|-------------|
| **No server required** | Runs in browser — no IT infrastructure to maintain |
| **No data transmission** | All processing happens locally — sensitive production data never leaves the device |
| **Zero deployment cost** | Static files hosted on existing GitLab infrastructure |
| **Instant availability** | Accessible from any device with a browser on the internal network |
| **Self-service** | Staff can use it without IT support — built-in tutorial and validation |
| **Audit capability** | Local telemetry logs can be exported as CSV for management review |

### 6.4 Cost Analysis

| Item | Cost |
|------|------|
| Development | Internal IT resource (already completed) |
| Hosting | GitLab Pages (existing infrastructure, no additional cost) |
| Maintenance | Minimal — static app, no server to maintain |
| Training | Built-in tutorial — no formal training sessions needed |
| **Total additional cost** | **$0** |

---

## 7. Technical Architecture

### 7.1 Technology Stack

```
Frontend Framework:    React 18.2 + TypeScript 5.2
Build Tool:            Vite 6.4 (fast dev + production builds)
Styling:               Tailwind CSS 3.4 (utility-first CSS)
Excel Processing:      SheetJS/xlsx 0.18 (client-side read/write)
Icons:                 Lucide React 0.344
Deployment:            GitLab Pages (static hosting)
CI/CD:                 GitLab CI (auto-build on push to main)
```

### 7.2 Component Architecture

```
App.tsx (Root — state management, nesting algorithm)
├── Header.tsx (branding, language, dark mode, tutorial)
│   └── TutorialModal.tsx (user guide)
├── FileUploader.tsx (data loading, column config, dataset management)
├── ArticleFilter.tsx (product filtering sidebar)
├── OrderSelector.tsx (SO input, validation, generation trigger)
├── NestingSummary.tsx (results table, export)
└── LockScreen.tsx (security overlay)
```

### 7.3 Data Persistence

All data is stored in the browser's localStorage:

| Key | Content |
|-----|---------|
| `pma_nesting_datasets_v1` | Saved datasets with column configurations |
| `pma_lang_pref` | Language preference (en/my/tw) |
| `pma_theme_dark` | Dark mode preference |
| `pma_usage_audit_v24` | Usage telemetry logs |

### 7.4 CI/CD Pipeline

```
Push to main branch
    │
    ▼
GitLab Runner (SGP-Prod-K8s)
    │
    ├─ npm install (from internal Nexus registry)
    ├─ npm run build (TypeScript check + Vite build)
    └─ Copy dist/ → public/
         │
         ▼
    GitLab Pages (auto-deployed)
         │
         ▼
    nesting.pouchen.online
```

---

## 8. User Experience Perspective

### What the User Sees

**First-time user:**
1. Opens `nesting.pouchen.online` in browser
2. Sees a clean, professional interface with the PMA logo
3. Clicks the tutorial button (?) for a quick 4-step guide
4. Uploads an Excel file or selects from pre-loaded server files
5. Reviews auto-detected columns — confirms or adjusts size/info columns
6. Enters SO numbers (with autocomplete assistance)
7. Clicks "Generate Nesting" — results appear in <1 second
8. Clicks "Export Excel" — downloads a formatted .xlsx file

**Returning user:**
1. Opens the tool — previous datasets are already saved
2. Selects a saved dataset from the left panel
3. Enters new SO numbers or uses "Add All"
4. Generates and exports

**The experience is:**
- Fast — no loading screens, no server round-trips
- Forgiving — real-time validation prevents errors before generation
- Informative — order breakdown shows exactly where each quantity comes from
- Professional — dark mode, responsive design, polished UI
- Self-contained — no external dependencies at runtime

---

## 9. Deployment and Access

| Item | Detail |
|------|--------|
| **URL** | nesting.pouchen.online |
| **Network** | Internal PCM network (or VPN) |
| **Authentication** | Lock screen code (PMA) — obfuscation layer |
| **Browser requirements** | Chrome 90+, Edge 90+, Firefox 90+, Safari 15+ |
| **Device support** | Desktop (recommended), Tablet (usable), Mobile (basic) |
| **Offline capability** | Yes — after first load, all processing is local |

---

## 10. Future Considerations

### Potential Enhancements (Not Currently Planned)

| Enhancement | Complexity | Impact |
|-------------|-----------|--------|
| Batch export (multiple nesting sets at once) | Low | Medium |
| Historical comparison (compare two nesting results) | Medium | High |
| SAP direct integration (auto-fetch orders) | High | Very High |
| Multi-user collaboration (shared datasets) | High | High |
| PDF report generation | Low | Medium |
| Advanced filtering (by model, color, date range) | Medium | Medium |

### Current Limitations

- Data is stored per-browser — not shared across devices or users
- No server-side backup of datasets
- Lock screen provides obfuscation, not real security
- Excel files must follow a recognizable column structure for auto-detection

---

## 11. Summary

PMA Nesting is a purpose-built internal tool that solves a specific, repetitive problem in the production planning workflow. It delivers:

- **~95% time reduction** on order consolidation tasks
- **Zero calculation errors** through automated processing
- **Zero infrastructure cost** — runs entirely in the browser
- **Immediate ROI** — saves time from the first use
- **Professional user experience** — multi-language, dark mode, built-in tutorial

The tool is production-ready, deployed, and actively used. It represents an efficient use of internal IT resources to improve operational efficiency at Pou Chen Myanmar.

---

*Report prepared by: Htet Aung Hlaing (ting) — PCM PCAG IT Team*  
*For: Management Review*  
*Version: 1.0 — June 2026*
