// server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import pool from "./db.js";
import { Resend } from "resend";
import fs from "fs";
import sharp from 'sharp';
import path from 'path';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

app.post("/api/bug-report", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      severity,
      category,
      email,
      to,
      resendApiKey,
    } = req.body;
    const image = req.file ? req.file.filename : null;

    // ✅ Validate required fields
    if (!title || !description)
      return res.status(400).json({ error: "Title and description are required" });

    if (!to)
      return res.status(400).json({ error: "Missing destination email" });

    if (!resendApiKey || !resendApiKey.startsWith("re_"))
      return res.status(400).json({ error: "Missing or invalid Resend API key" });

    // ✅ Save to DB
    const result = await pool.query(
      `INSERT INTO bug_reports (title, description, severity, category, email, image)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, severity, category, email, image]
    );

    const newReport = result.rows[0];

    // ✅ Build email content
    const htmlContent = `
      <h2>🐞 New Bug Report Submitted</h2>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Severity:</strong> ${severity || "Not specified"}</p>
      <p><strong>Category:</strong> ${category || "Not specified"}</p>
      <p><strong>Reporter Email:</strong> ${email || "Anonymous"}</p>
      <p><strong>Submitted at:</strong> ${new Date(
        newReport.created_at
      ).toLocaleString()}</p>
      ${
        image
          ? `<p><strong>Attached Screenshot:</strong></p><img src="cid:screenshot" alt="screenshot" style="max-width:500px;border-radius:8px;" />`
          : ""
      }
    `;

    // Always convert image to PNG
    let attachmentFilePath = null;
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

    // Clean up temp PNG after sending
    if (attachmentFilePath && fs.existsSync(attachmentFilePath)) {
      fs.unlinkSync(attachmentFilePath);
    }

    res.status(201).json({
      message: "Bug report submitted and emailed successfully",
      report: newReport,
    });
  } catch (err) {
    console.error("Error processing bug report:", err);
    res.status(500).json({ error: "Failed to process bug report" });
  }
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));