import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pool from "./db.js";
import { Resend } from "resend";
import fs from "fs";
import sharp from 'sharp';
import path from 'path';

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const app = express();
const PORT = 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : "*";

app.use(cors({
  origin: allowedOrigins
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per 15 minutes
  message: { error: "Too many bug reports sent from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

app.post("/api/bug-report", apiLimiter, upload.single("image"), async (req, res) => {
  let attachmentFilePath = null;
  try {
    const {
      title,
      description,
      severity,
      category,
      email,
    } = req.body;
    
    const to = process.env.NOTIFICATION_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    // ✅ Validate required fields
    if (!title || !description)
      return res.status(400).json({ error: "Title and description are required" });

    if (title.length > 200)
      return res.status(400).json({ error: "Title must be less than 200 characters" });

    if (description.length > 5000)
      return res.status(400).json({ error: "Description must be less than 5000 characters" });

    if (email && email.length > 320)
      return res.status(400).json({ error: "Email must be less than 320 characters" });

    if (severity && severity.length > 50)
      return res.status(400).json({ error: "Severity is too long" });

    if (category && category.length > 50)
      return res.status(400).json({ error: "Category is too long" });

    if (!to || !resendApiKey)
      return res.status(500).json({ error: "Server is missing email configuration" });

    // ✅ Save to DB (Option A: Do not store image in DB permanently)
    const result = await pool.query(
      `INSERT INTO bug_reports (title, description, severity, category, email, image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, severity, category, email, null]
    );

    const newReport = result.rows[0];

    // ✅ Build email content (with XSS protection)
    const htmlContent = `
      <h2>🐞 New Bug Report Submitted</h2>
      <p><strong>Title:</strong> ${escapeHtml(title)}</p>
      <p><strong>Description:</strong> ${escapeHtml(description)}</p>
      <p><strong>Severity:</strong> ${escapeHtml(severity) || "Not specified"}</p>
      <p><strong>Category:</strong> ${escapeHtml(category) || "Not specified"}</p>
      <p><strong>Reporter Email:</strong> ${escapeHtml(email) || "Anonymous"}</p>
      <p><strong>Submitted at:</strong> ${new Date(
        newReport.created_at
      ).toLocaleString()}</p>
      ${
        req.file
          ? `<p><strong>Attached Screenshot:</strong></p><img src="cid:screenshot" alt="screenshot" style="max-width:500px;border-radius:8px;" />`
          : ""
      }
    `;

    // Always convert image to PNG
    let attachmentFilename = 'screenshot.png';
    if (req.file) {
      const pngPath = path.join('uploads', req.file.filename + '.png');
      await sharp(req.file.path)
        .png()
        .toFile(pngPath);
      attachmentFilePath = pngPath;
    }

    const attachments = attachmentFilePath
      ? [
          {
            filename: attachmentFilename,
            path: attachmentFilePath,
            content_id: 'screenshot',
          },
        ]
      : [];

    // ✅ Send via developer’s Resend key
    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "Bug Reporter <onboarding@resend.dev>",
      to,
      subject: `🐞 New Bug Report: ${title}`,
      html: htmlContent,
      attachments: attachments.map((file) => ({
        filename: file.filename,
        content: fs.readFileSync(file.path).toString("base64"),
      })),
    });

    res.status(201).json({
      message: "Bug report submitted and emailed successfully",
      report: newReport,
    });
  } catch (err) {
    console.error("Error processing bug report:", err);
    res.status(500).json({ error: "Failed to process bug report" });
  } finally {
    // ✅ Fix Storage Leak: Clean up BOTH the original file and the PNG
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    if (attachmentFilePath && fs.existsSync(attachmentFilePath)) {
      fs.unlinkSync(attachmentFilePath);
    }
  }
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description VARCHAR(5000) NOT NULL,
        severity VARCHAR(50),
        category VARCHAR(50),
        email VARCHAR(320),
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ Failed to initialize database:", err);
  }
};

initDb().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
});