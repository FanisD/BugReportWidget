# Bug Reporter Widget Project

A fullstack bug reporting widget with a draggable floating button UI (React + Vite) and a Node.js/Express backend. 
It uses PostgreSQL for tracking bug reports and Resend for transactional email delivery.

## Tech Stack & Tools
- **Frontend:** React 19, Vite (configured in Library Mode for NPM distribution)
- **Backend:** Express 5, Node.js, Multer (file upload), Sharp (image to PNG conversion)
- **Database:** PostgreSQL
- **Email:** Resend (https://resend.com/) for transactional email delivery
- **Deployment:** Docker & Docker Compose for the backend API

---

## Quick Start (Production / Self-Hosting)

The easiest way to host the backend is using the included Docker Compose configuration.

### 1. Setup the Backend (Docker)
1. Clone the repository and enter the backend directory:
   ```bash
   git clone https://github.com/FanisD/BugReportWidget.git
   cd BugReportWidget/bug-reporter-backend
   ```
2. Make a copy of the `.env.example` file and rename it to `.env`. Fill in your real API keys:
   ```env
   RESEND_API_KEY=re_123456789...
   NOTIFICATION_EMAIL=your.email@example.com
   ALLOWED_ORIGINS=https://your-website.com
   ```
3. Start the API and PostgreSQL database:
   ```bash
   docker-compose up -d
   ```
   *(The backend will automatically create the `bug_reports` table on its first startup).*

### 2. Using the Frontend Widget
The frontend is structured as a publishable NPM package. Once published, you can install it into any React app:

```bash
npm install bug-reporter
```

Then drop the widget into your application:
```jsx
import { BugReportWidget } from 'bug-reporter';
import 'bug-reporter/style.css';

function App() {
  return (
    <div>
      <BugReportWidget apiUrl="https://api.yourwebsite.com/api/bug-report" />
    </div>
  )
}
```

---

## 🛠️ Local Development

If you want to edit the widget code or run it locally without Docker:

### Backend Development
```bash
cd bug-reporter-backend
npm install
```
- Ensure PostgreSQL is running locally.
- Set `DATABASE_URL` in your `.env` file (e.g. `postgres://user:pass@localhost:5432/bug_reporter`).
- Run the server: `node server.js`

### Frontend Development (Playground)
We kept a local testing environment in the `bug-reporter` folder so you can test changes visually before building the library.
```bash
cd bug-reporter
npm install
npm run dev
```
*(Open `http://localhost:5173` to view the widget playground).*

To build the library for NPM distribution:
```bash
npm run build
```
This will compile the widget into the `dist/` folder.

---

## Security & Features
- **No API Key Leaks:** All API keys are securely stored on the backend in the `.env` file.
- **XSS Protection:** All user inputs are strictly escaped before being injected into HTML emails.
- **Ephemeral Storage Safe:** Uploaded screenshots are sent as email attachments and immediately deleted from the server to prevent disk storage leaks. Images are NOT stored in the database.
- **Rate Limiting:** Protects against spam by limiting each IP to 10 bug reports per 15 minutes.
- **CORS Configured:** You can strict-lock the widget to only accept requests from your domain via `ALLOWED_ORIGINS`.

---

## License
MIT – Use freely, but contributions/forks are always welcome!
