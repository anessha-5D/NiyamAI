# NiyamAI – Digital Correction & Approval Workspace

NiyamAI is a digital workspace designed to organize correction requests, track their progress, maintain correction history, and support a structured review and approval process. It aims to make correction management more transparent, organized, and easy to follow.

## 📌 Problem Statement

Correction and approval workflows can become difficult to manage when requests, feedback, status updates, and past revisions are scattered across different platforms or handled manually. This can lead to delays, confusion, and a lack of accountability.

NiyamAI aims to provide a centralized interface where correction records can be viewed, reviewed, tracked, and managed through a more structured workflow.

## 💡 Proposed Solution

NiyamAI provides a centralized correction workspace that presents correction records, detailed information, and correction history in an organized interface. The system is designed to make it easier for users to review individual records and understand their current status.

The project can be extended with role-based access, approval actions, notifications, and persistent backend storage to support a complete correction management workflow.



## ✨ Key Features

- **Correction Dashboard:** View correction records in an organized interface.

![NiyamAI Dashboard](Screenshots/dashboard.png.png)


- **Record Listing:** Browse available correction records.
- **Correction Details:** Open individual records to examine their information.
- **Correction History:** View correction history through a dedicated interface.
- **Status Tracking:** Organize correction requests according to their workflow status, where supported by the current implementation.
- **Toast Notifications:** Display interface feedback for supported user actions.
- **Reusable Components:** Separate UI components for record lists, correction details, history, and notifications.
- **Utility Functions:** Shared helpers for formatting and local data handling.


![NiyamAI Visual Audit](Screenshots/visualsaudit.png.png)


## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| React | Building the user interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| CSS | Styling and layout |
| JavaScript / TypeScript modules | Application logic and utilities |
| Git and GitHub | Version control and collaboration |

![NiyamAI Text Audit](Screenshots/textaudit.png.png)

## 📂 Project Structure

```text
NiyamAI/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── CorrectionDetail.tsx
│   │   ├── CorrectionHistory.tsx
│   │   ├── RecordList.tsx
│   │   └── Toast.tsx
│   ├── data/
│   │   └── sampleData.ts
│   ├── utils/
│   │   ├── format.ts
│   │   └── storage.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```


## ⚙️ Getting Started

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/diyawaja/NiyamAI.git
```

### 2. Navigate to the Project Folder

```bash
cd NiyamAI
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal to access the application.

### 5. Build for Production

```bash
npm run build
```

## 🔄 Application Workflow

1. Open the NiyamAI workspace.
2. Browse the available correction records.
3. Select a record to view its details.
4. Review the relevant correction information and history.
5. Use the available interface actions to manage or review the record.
6. Track the record through the workflow features currently implemented.

The exact actions and status transitions depend on the current application implementation.

## 🧩 Development Approach

The application follows a component-based frontend structure:

- **Components** separate major interface features.
- **Types** define shared TypeScript data structures.
- **Sample data** supports development and interface testing.
- **Utility modules** handle reusable formatting and storage-related operations.
- **CSS files** manage application-wide and component styling.

This structure makes the codebase easier to maintain and provides a foundation for integrating additional services.
![NiyamAI Analytics](Screenshots/analytics.png.png)

## 🚀 Future Scope

Potential improvements include:

- Backend API integration for correction requests.
- Database storage for records and revision history.
- User authentication and role-based permissions.
- Dedicated reviewer and approver workflows.
- Approval, rejection, and resubmission actions.
- Notifications for status changes.
- Audit logs and timestamps for accountability.
- Search, filtering, and sorting of correction records.
- Automated testing and deployment.
- Analytics for correction turnaround time and workflow efficiency.

These are proposed enhancements and should not be considered implemented unless added to the application.

## 🤝 Team Collaboration

NiyamAI is maintained using Git and GitHub to support collaborative development.

Recommended workflow:

1. Keep `main` as the stable integration branch.
2. Create a separate feature branch for each task.
3. Commit changes with descriptive messages.
4. Push feature branches to GitHub.
5. Open a pull request for review.
6. Merge changes into `main` after verification.

## 📄 License

A license has not yet been specified. Add an appropriate license before distributing the project under open-source terms.

## 👥 Contributors

Developed collaboratively by the NiyamAI project team.

---

**NiyamAI — Making correction workflows more organized, traceable, and transparent.**


![NiyamAI Brand Kit](Screenshots/brandkit.png.png)



## Improvements Delivered After Round 2

Following Round 2, NiyamAI was enhanced with three major improvements to strengthen data persistence, brand guideline processing, and compliance reporting.

### 1. Database Integration for Saving Audit Reports

- Integrated Supabase PostgreSQL for persistent storage of audit reports and correction records.
- Implemented Express REST API endpoints to create, retrieve, and update audit records.
- Added correction history tracking to maintain records of changes and review activities.
- Implemented automatic data loading when the application starts.
- Added a Saved Audits section to access previously generated audit reports.

### 2. PDF Brand Guidelines Upload and Search

- Integrated `pdfjs-dist` for extracting text from uploaded PDF documents.
- Added support for processing brand guidelines into structured rules.
- Organized extracted information into approved claims, prohibited claims, required disclaimers, brand terminology, and tone guidelines.
- Enabled users to inspect extracted document content and use the guidelines during content audits.
- Integrated uploaded PDF rules into the audit process to identify brand compliance issues.

### 3. Downloadable Audit Report with Compliance Summary

- Added a comprehensive audit summary report to the Publishing and Analytics module.
- Included compliance scores, detected violations, findings, and approval details.
- Organized audit results into a structured report for easier review.
- Added an option to download the report for documentation and sharing.

### Overall Impact

These improvements make NiyamAI more practical for brand compliance workflows by providing persistent audit records, easier access to brand guidelines, and downloadable compliance summaries.
