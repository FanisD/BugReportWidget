# Bug Reporter Widget Project

A fullstack bug reporting widget with a draggable floating button UI (React + Vite) and a Node.js/Express backend, using PostgreSQL for storage and Resend for email delivery.

## Tech Stack & Tools
- **Frontend:** React 19, Vite
- **Backend:** Express 5, Node.js, Multer (file upload), Sharp (image to PNG conversion)
- **Database:** PostgreSQL
- **Email:** Resend (https://resend.com/) for transactional email delivery
- **Other Tools:**
  - `axios` (frontend requests)
  - `eslint` (linting)
  - `sharp` (converts all bug screenshot uploads to PNG for reliability)

## Prerequisites
- Node.js 18+
- NPM 9+
- PostgreSQL (running and accessible)
- Resend account for email API keys

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/your-bug-reporter-repo.git
cd your-bug-reporter-repo
```

### 2. Setup the Backend
```bash
cd bug-reporter-backend
npm install
```
- Create a PostgreSQL database (e.g. `bug_reporter`).
- Create the required table:
```sql
CREATE TABLE bug_reports (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT,
  category TEXT,
  email TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
- Configure the database connection in `db.js` (update user, password, host, DB name as needed).
- Start the backend:
```bash
node server.js
```

### 3. Setup the Frontend
```bash
cd ../bug-reporter
npm install
npm run dev
```
This runs the Vite React dev server (open `http://localhost:5173` by default).

---

## Environment Variables & Keys
You need to provide your [Resend](https://resend.com/) API key and the email address you want reports to send to. These are passed into the widget as props in `src/App.jsx`:
```jsx
<BugReportWidget
  to="your.email@example.com"
  resendApiKey="re_xxxxxxxx..."
/>
```
**Never commit real API keys to a public repository!**

If you want to keep secrets out of the codebase, you can use environment variables in the backend and a .env file (optionally use the `dotenv` package).

---

## Useful Scripts
**Frontend:**
- `npm run dev` – Run React app in development mode
- `npm run build` – Build production assets
- `npm run preview` – Locally preview production build

**Backend:**
- `node server.js` – Start Express API (default: http://localhost:5000)

---

## Features
- Draggable floating bug report button (bottom-right, touch/desktop)
- Expands into a styled modal with severity, category, email field, and screenshot upload
- All uploaded images are converted and sent as reliable PNG screenshots for best compatibility
- Emails include rich HTML + inline image
- All reports saved to PostgreSQL for admin review

---

## Troubleshooting
- Backend must be running for the frontend widget to POST reports.
- Ensure DB credentials and API keys are correct.
- Make sure you do not have outdated root-level `node_modules` or lock files outside your 2 main directories!
- Email sending issues? Check your Resend account & API key.

---

## Docker (Optional)
You can dockerize both frontend and backend for easy deployment (each should have its own Dockerfile and context).
- Useful for hosting on cloud providers.

---

## License
MIT – Use freely, but contributions/forks are always welcome!
