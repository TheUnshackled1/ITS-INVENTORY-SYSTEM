# 🗺️ System Feature Roadmap

> Strategic product vision and feature roadmap for the **ITS Inventory Management System**.

---

## 📋 Roadmap Overview

This roadmap outlines planned enhancements, feature additions, and architectural upgrades categorized by upcoming release milestones.

```
┌───────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
│     v1.0.0 (Released)     │───►│    v1.1.0 (Q3 2026)       │───►│    v2.0.0 (2027 Vision)    │
│  Full CRUD, Borrowing,    │    │  QR Scanning, Overdue     │    │  Mobile PWA, JWT API,     │
│  OTP Auth, Audit Trail    │    │  Emails, PDF Reports      │    │  Real-Time WebSockets     │
└───────────────────────────┘    └───────────────────────────┘    └───────────────────────────┘
```

---

## ✅ Released Milestones

### [v1.0.0] - Initial Production Release (Current)
- [x] **Inventory Management**: Side-drawer CRUD UI, location & status filters, SimpleDatatables.
- [x] **Bulk Import**: `.xlsx` and `.csv` spreadsheet parsing for bulk equipment creation.
- [x] **Borrowing Tracker**: Issue equipment, expected return date tracking, process returns, overdue escalation.
- [x] **Activity Log**: Field-level before/after JSON snapshot diffs and side-by-side diff modal.
- [x] **Security Portal**: Dual-panel sliding auth portal, 6-digit email OTP (120s lifespan), self-service password recovery (`email__iexact`), centered overlay alert modals.
- [x] **System Architecture**: Native Draw.io vector SVG diagrams (`architecture.drawio.svg`, `borrowing_lifecycle.drawio.svg`).

---

## 🎯 Short-Term Roadmap (`v1.1.0` — Q3 2026)

Focus: **Mobile Equipment Scanning, Automated Notifications & Reporting**

### 📷 1. QR Code & Barcode Scanner Integration
- **Asset Tag QR Generation**: Automatically generate printable QR code badges for each inventory asset tag.
- **Web Browser Scanner**: Integrated camera scanner in the web interface for instant equipment lookup via QR code scan.

### 📧 2. Automated Overdue Email Notifications
- **Background Cron Engine**: Scheduled daily task that scans for overdue equipment loans.
- **Automated Borrower Notices**: Direct email notifications sent to borrowers holding overdue equipment with return instructions.

### 📄 3. PDF Audit Report Generation
- **Exportable PDF Reports**: Generate official institutional inventory audit reports, equipment condition summaries, and borrowing receipts via ReportLab.
- **Custom Header Branding**: Include institutional logos, department names, and official signature blocks on PDF exports.

### 📊 4. Enhanced Data Export Controls
- **Multi-Format Export**: Direct one-click export buttons on inventory datatables for `.xlsx`, `.csv`, and `.pdf` formats.

---

## 🔮 Medium-Term Roadmap (`v1.2.0` — Q4 2026)

Focus: **Departmental Scoping & Asset Maintenance Workflows**

### 🏢 1. Multi-Department Role Access
- **Granular Permissions**: Role-based access control (RBAC) allowing MIS, ICT, Lab Administrators, and Department Heads tailored view/edit permissions.
- **Department-Scoped Inventory**: Filter equipment visibility by department or laboratory ownership.

### 🛠️ 2. Maintenance & Repair Ticket Workflow
- **Service Request Portal**: Log repair tickets for items in `Under Repair` status.
- **Vendor & Cost Tracking**: Record repair vendors, service dates, repair costs, and warranty claim histories.

### 💰 3. Financial Depreciation & Valuation
- **Straight-Line Depreciation Calculator**: Calculate current asset valuation based on acquisition date, purchase cost, and expected lifespan.

---

## 🚀 Long-Term Vision (`v2.0.0` — 2027)

Focus: **Mobile App, REST API & Real-Time Sync**

### 📱 1. Mobile Companion App (PWA)
- **Progressive Web App (PWA)**: Installable mobile web app with offline caching and native camera barcode scanning for audit walkthroughs.

### 🔑 2. JWT REST API Integration
- **Token-Based Authentication**: Public REST API for third-party institutional systems to query inventory levels and active borrowing records.

### ⚡ 3. Real-Time WebSockets Notifications
- **Instant In-App Alerts**: WebSockets (Django Channels) for real-time notification toasts when items are borrowed or returned.

---

## 💡 Suggesting New Features

Have an idea for a feature not listed here? Please open a **[Feature Request Issue](https://github.com/TheUnshackled1/ITS-INVENTORY-SYSTEM/issues/new?template=feature_request.md)**!
