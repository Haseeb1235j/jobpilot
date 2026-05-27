require("dotenv").config()

const express = require("express")
const cors = require("cors")
const multer = require("multer")
const pdfParse = require("pdf-parse")
const mammoth = require("mammoth")
const Groq = require("groq-sdk")
const { Resend } = require("resend")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json({ limit: "20mb" }))

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB resume upload limit
  },
})

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-before-production"
const MONGODB_URI = process.env.MONGODB_URI || ""

let mongoReady = false

async function connectMongo() {
  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is missing. Auth/database routes will not work until you add it in .env.")
    return
  }

  try {
    await mongoose.connect(MONGODB_URI)
    mongoReady = true
    console.log("MongoDB connected")
  } catch (error) {
    mongoReady = false
    console.error("MongoDB connection failed:", error.message)
  }
}

connectMongo()

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetCodeHash: { type: String, default: "" },
    resetCodeExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, trim: true, default: "Untitled Resume" },
    template: { type: String, default: "modern" },
    resume: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
)

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: String,
    company: String,
    location: String,
    match: String,
    status: { type: String, default: "Saved" },
    date: String,
    note: String,
    url: String,
    description: String,
    externalSearchLinks: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
)

const User = mongoose.models.User || mongoose.model("User", userSchema)
const Resume = mongoose.models.Resume || mongoose.model("Resume", resumeSchema)
const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema)

function requireMongo(req, res, next) {
  if (!mongoReady) {
    return res.status(503).json({
      success: false,
      error: "Database is not connected. Add MONGODB_URI and restart the server.",
    })
  }
  next()
}

function signToken(user) {
  return jwt.sign({ userId: String(user._id), email: user.email }, JWT_SECRET, { expiresIn: "30d" })
}

function publicUser(user) {
  return { id: String(user._id), name: user.name || "", email: user.email }
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""

    if (!token) {
      return res.status(401).json({ success: false, error: "Login required." })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({ success: false, error: "User not found." })
    }

    req.user = user
    next()
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired login. Please login again." })
  }
}

const allowedCountries = [
  "au",
  "at",
  "be",
  "br",
  "ca",
  "fr",
  "de",
  "in",
  "it",
  "mx",
  "nl",
  "nz",
  "pl",
  "sg",
  "za",
  "es",
  "ch",
  "gb",
  "us",
]

function trimText(text = "", limit = 18000) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{4,}/g, "\n\n")
    .trim()
    .slice(0, limit)
}

function cleanJsonText(text = "") {
  const raw = String(text || "").trim()

  const codeBlock =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ||
    raw.match(/```([\s\S]*?)```/)?.[1]

  if (codeBlock) return codeBlock.trim()

  const objectMatch = raw.match(/\{[\s\S]*\}/)
  if (objectMatch) return objectMatch[0].trim()

  return raw
}


async function extractTextFromImageWithGroq(file) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing. Image document reading needs Groq Vision.")
  }

  const mime = file.mimetype || "image/png"
  const base64 = file.buffer.toString("base64")
  const dataUrl = `data:${mime};base64,${base64}`

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_VISION_MODEL || "llama-3.2-11b-vision-preview",
    temperature: 0.05,
    max_tokens: 2500,
    messages: [
      {
        role: "system",
        content:
          "You are a careful OCR/document reader for a career app. Extract all useful readable text from the image. Preserve names, phone numbers, email, dates, education, skills, certification details, ID numbers, addresses, and document labels. Return plain text only. Do not invent anything.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Read this uploaded document/image and extract all useful text for auto-filling a resume/profile." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  })

  return completion.choices?.[0]?.message?.content || ""
}

async function extractTextFromFile(file) {
  const fileName = file.originalname || "uploaded-file"
  const extension = fileName.split(".").pop().toLowerCase()
  const mime = file.mimetype || ""

  if (extension === "pdf" || mime.includes("pdf")) {
    const data = await pdfParse(file.buffer)
    const text = data.text || ""

    if (!text || text.trim().length < 10) {
      throw new Error(
        "This PDF looks scanned/image-only, so normal PDF text extraction cannot read it. Upload the scanned page as PNG/JPG for AI vision reading, or export the PDF as selectable text/OCR PDF."
      )
    }

    return text
  }

  if (
    extension === "docx" ||
    mime.includes("wordprocessingml") ||
    mime.includes("officedocument")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer })
    return result.value || ""
  }

  if (
    extension === "txt" ||
    extension === "csv" ||
    extension === "json" ||
    extension === "md" ||
    mime.includes("text") ||
    mime.includes("json")
  ) {
    return file.buffer.toString("utf8")
  }

  if (
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "webp" ||
    mime.startsWith("image/")
  ) {
    return await extractTextFromImageWithGroq(file)
  }

  if (extension === "mp4" || extension === "mov" || extension === "avi") {
    throw new Error(
      "Video upload is received, but video transcription is not enabled yet. Upload PDF, DOCX, TXT, CSV, JSON, or MD for now."
    )
  }

  throw new Error("Unsupported file type. Upload PDF, DOCX, TXT, CSV, JSON, or MD.")
}

function detectIntent(message = "", documentType = "chat") {
  const text = message.toLowerCase()

  if (
    text.includes("return only valid json") ||
    text.includes("json shape") ||
    text.includes("create a clean ats-friendly professional resume") ||
    text.includes("create a professional final resume")
  ) {
    return {
      docType: "resume-json",
      exportable: false,
      title: "Resume JSON",
    }
  }

  if (
    text.includes("resume") ||
    text.includes("cv") ||
    text.includes("make my resume") ||
    text.includes("generate my resume") ||
    text.includes("update my resume") ||
    text.includes("improve my resume") ||
    text.includes("ats")
  ) {
    return {
      docType: "resume",
      exportable: true,
      title: "Professional Resume",
    }
  }

  if (
    text.includes("cover letter") ||
    text.includes("application letter") ||
    text.includes("application email") ||
    text.includes("job email") ||
    text.includes("email for job") ||
    text.includes("mail for job")
  ) {
    return {
      docType: "letter",
      exportable: true,
      title: "Application Letter",
    }
  }

  if (
    text.includes("interview") ||
    text.includes("roadmap") ||
    text.includes("skill") ||
    text.includes("summarize") ||
    text.includes("summary") ||
    text.includes("analyze") ||
    text.includes("document") ||
    text.includes("extract") ||
    text.includes("linkedin")
  ) {
    return {
      docType: "guide",
      exportable: true,
      title: "AI Career Guide",
    }
  }

  if (documentType && documentType !== "chat") {
    return {
      docType: documentType,
      exportable: documentType !== "chat",
      title: documentType,
    }
  }

  return {
    docType: "chat",
    exportable: false,
    title: "Chat Reply",
  }
}

function buildCareerSystemPrompt({
  profile = {},
  selectedJob = null,
  searchPreferences = {},
  uploadedDocumentText = "",
  uploadedDocumentName = "",
  savedApplications = [],
}) {
  return `
You are JobPilot AI, a premium AI Resume Maker and Career Assistant.

Your job:
- Help users create professional, ATS-friendly, job-ready resumes.
- Help freshers create strong resumes without fake experience.
- Help experienced users tailor resumes to jobs.
- Help with cover letters, LinkedIn summaries, interviews, skills, job applications, and career planning.
- Behave like a smart ChatGPT-style career assistant.

CRITICAL RULES:
- Do not mix analysis with final resume when the user asks for final resume.
- If user asks for JSON, return ONLY valid JSON. No markdown. No explanation.
- Do not invent fake experience, fake company, fake salary, fake degree, fake certification, or fake dates.
- If information is missing, use empty string or empty array in JSON.
- For freshers, use education, skills, internships, projects, certifications, achievements, and practical learning.
- Use strong professional language.
- Use action verbs.
- Keep resumes clean, ATS-friendly, and truthful.
- Do not write "Not provided" in resume content.
- Do not create childish or weak content.
- Make project bullets strong and resume-ready.
- Keep final resume content polished and export-ready.

WHEN RETURNING RESUME JSON:
Return exactly this valid JSON shape:
{
  "personal": {
    "name": "",
    "role": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "",
  "objective": "",
  "skills": {
    "languages": "",
    "frontend": "",
    "backend": "",
    "database": "",
    "tools": "",
    "other": ""
  },
  "projects": [
    {
      "name": "",
      "tech": "",
      "link": "",
      "bullets": ["", "", ""]
    }
  ],
  "experience": [
    {
      "role": "",
      "company": "",
      "location": "",
      "duration": "",
      "bullets": ["", "", ""]
    }
  ],
  "internships": [
    {
      "role": "",
      "company": "",
      "location": "",
      "duration": "",
      "bullets": ["", "", ""]
    }
  ],
  "education": [
    {
      "degree": "",
      "institution": "",
      "location": "",
      "duration": "",
      "details": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "year": "",
      "link": ""
    }
  ],
  "achievements": [
    {
      "title": "",
      "description": ""
    }
  ],
  "languages": [
    {
      "name": "",
      "level": ""
    }
  ],
  "atsKeywords": ""
}

USER PROFILE:
Name: ${profile.name || ""}
Target Role: ${profile.role || ""}
Email: ${profile.email || ""}
Phone: ${profile.phone || ""}
Location: ${profile.location || ""}
LinkedIn: ${profile.linkedin || ""}
GitHub: ${profile.github || ""}
Portfolio: ${profile.portfolio || ""}
Summary: ${profile.summary || ""}
Technical Skills: ${profile.technicalSkills || profile.skills || ""}
Projects: ${profile.projects || ""}
Experience: ${profile.experience || ""}
Education: ${profile.education || ""}
Certifications: ${profile.certificationsText || ""}

SELECTED JOB:
Title: ${selectedJob?.title || ""}
Company: ${selectedJob?.company || ""}
Location: ${selectedJob?.location || ""}
Salary: ${selectedJob?.salary || ""}
Description: ${selectedJob?.description || ""}

SEARCH PREFERENCES:
Role: ${searchPreferences?.role || ""}
Location: ${searchPreferences?.location || ""}
Country: ${searchPreferences?.country || ""}
Experience: ${searchPreferences?.experience || ""}
Salary Range: ${searchPreferences?.salaryRange || ""}

UPLOADED DOCUMENT:
File Name: ${uploadedDocumentName || ""}
Document Text:
${uploadedDocumentText || "No uploaded document."}

Saved Applications Count: ${savedApplications?.length || 0}
`
}

async function callGroq(messages, options = {}) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env")
  }

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    messages,
    temperature: options.temperature ?? 0.35,
    max_tokens: options.max_tokens ?? 3500,
  })

  return (
    completion.choices?.[0]?.message?.content ||
    "Sorry, I could not generate a response."
  )
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "JobPilot backend is running",
    routes: [
      "/agent",
      "/chat",
      "/jobs",
      "/send-email",
      "/upload-document",
      "/health",
      "/auth/signup",
      "/auth/login",
      "/auth/forgot-password",
      "/auth/reset-password",
    ],
  })
})

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    groq: Boolean(process.env.GROQ_API_KEY),
    adzuna: Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    database: mongoReady,
  })
})


app.post("/auth/signup", requireMongo, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim()
    const email = String(req.body.email || "").trim().toLowerCase()
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters." })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, error: "An account already exists with this email." })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash })
    const token = signToken(user)

    res.json({ success: true, token, user: publicUser(user) })
  } catch (error) {
    console.error("SIGNUP ERROR:", error)
    res.status(500).json({ success: false, error: "Signup failed." })
  }
})

app.post("/auth/login", requireMongo, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase()
    const password = String(req.body.password || "")

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required." })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password." })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ success: false, error: "Invalid email or password." })
    }

    const token = signToken(user)
    res.json({ success: true, token, user: publicUser(user) })
  } catch (error) {
    console.error("LOGIN ERROR:", error)
    res.status(500).json({ success: false, error: "Login failed." })
  }
})

app.post("/auth/forgot-password", requireMongo, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase()

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required." })
    }

    const user = await User.findOne({ email })

    // Do not reveal whether an email exists in production.
    if (!user) {
      return res.json({
        success: true,
        message: "If this email has an account, a reset code was created. Check your email or backend terminal.",
      })
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    user.resetCodeHash = await bcrypt.hash(code, 10)
    user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
    await user.save()

    console.log(`PASSWORD RESET CODE for ${email}: ${code}`)

    let sentEmail = false
    if (process.env.RESEND_API_KEY && !String(process.env.RESEND_API_KEY).includes("123")) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: "JobPilot <onboarding@resend.dev>",
          to: email,
          subject: "Your JobPilot password reset code",
          html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>JobPilot password reset</h2><p>Your reset code is:</p><div style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</div><p>This code expires in 15 minutes.</p></div>`,
        })
        sentEmail = true
      } catch (emailError) {
        console.error("RESET EMAIL ERROR:", emailError.message)
      }
    }

    res.json({
      success: true,
      message: sentEmail
        ? "Reset code sent to your email."
        : "Reset code created. In local development, check your backend terminal or use the code shown here.",
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
    })
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error)
    res.status(500).json({ success: false, error: "Could not create reset code." })
  }
})

app.post("/auth/reset-password", requireMongo, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase()
    const code = String(req.body.code || "").trim()
    const password = String(req.body.password || "")

    if (!email || !code || !password) {
      return res.status(400).json({ success: false, error: "Email, reset code, and new password are required." })
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters." })
    }

    const user = await User.findOne({ email })
    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset code." })
    }

    if (new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
      user.resetCodeHash = ""
      user.resetCodeExpiresAt = null
      await user.save()
      return res.status(400).json({ success: false, error: "Reset code expired. Please request a new code." })
    }

    const ok = await bcrypt.compare(code, user.resetCodeHash)
    if (!ok) {
      return res.status(400).json({ success: false, error: "Invalid reset code." })
    }

    user.passwordHash = await bcrypt.hash(password, 12)
    user.resetCodeHash = ""
    user.resetCodeExpiresAt = null
    await user.save()

    res.json({ success: true, message: "Password reset successful. You can login with your new password." })
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error)
    res.status(500).json({ success: false, error: "Could not reset password." })
  }
})

app.get("/auth/me", requireMongo, requireAuth, async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})

app.get("/resumes", requireMongo, requireAuth, async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(50)
  res.json({
    success: true,
    resumes: resumes.map((item) => ({
      id: String(item._id),
      name: item.name,
      template: item.template,
      resume: item.resume,
      date: item.updatedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  })
})

app.post("/resumes", requireMongo, requireAuth, async (req, res) => {
  try {
    const name = String(req.body.name || "Untitled Resume").trim() || "Untitled Resume"
    const template = String(req.body.template || "modern")
    const resume = req.body.resume

    if (!resume || typeof resume !== "object") {
      return res.status(400).json({ success: false, error: "Resume data is required." })
    }

    const item = await Resume.create({ userId: req.user._id, name, template, resume })
    res.json({ success: true, resume: { id: String(item._id), name: item.name, template: item.template, resume: item.resume, date: item.updatedAt } })
  } catch (error) {
    console.error("SAVE RESUME ERROR:", error)
    res.status(500).json({ success: false, error: "Could not save resume." })
  }
})

app.put("/resumes/:id", requireMongo, requireAuth, async (req, res) => {
  try {
    const item = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { name: req.body.name, template: req.body.template, resume: req.body.resume } },
      { new: true }
    )

    if (!item) return res.status(404).json({ success: false, error: "Resume not found." })
    res.json({ success: true, resume: { id: String(item._id), name: item.name, template: item.template, resume: item.resume, date: item.updatedAt } })
  } catch (error) {
    res.status(500).json({ success: false, error: "Could not update resume." })
  }
})

app.delete("/resumes/:id", requireMongo, requireAuth, async (req, res) => {
  await Resume.deleteOne({ _id: req.params.id, userId: req.user._id })
  res.json({ success: true })
})

app.get("/applications", requireMongo, requireAuth, async (req, res) => {
  const applications = await Application.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(100)
  res.json({ success: true, applications: applications.map((item) => ({ ...item.toObject(), id: String(item._id) })) })
})

app.post("/applications", requireMongo, requireAuth, async (req, res) => {
  const body = req.body || {}
  const item = await Application.create({ ...body, userId: req.user._id })
  res.json({ success: true, application: { ...item.toObject(), id: String(item._id) } })
})

app.put("/applications/:id", requireMongo, requireAuth, async (req, res) => {
  const item = await Application.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { $set: req.body }, { new: true })
  if (!item) return res.status(404).json({ success: false, error: "Application not found." })
  res.json({ success: true, application: { ...item.toObject(), id: String(item._id) } })
})

app.delete("/applications/:id", requireMongo, requireAuth, async (req, res) => {
  await Application.deleteOne({ _id: req.params.id, userId: req.user._id })
  res.json({ success: true })
})

app.post("/upload-document", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded.",
      })
    }

    const rawText = await extractTextFromFile(req.file)
    const text = trimText(rawText, 22000)

    if (!text || text.length < 10) {
      return res.status(400).json({
        success: false,
        error:
          "I could not read useful text from this file. For scanned documents, upload PNG/JPG image or an OCR/selectable-text PDF.",
      })
    }

    res.json({
      success: true,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      text,
      chars: text.length,
      message: "Document uploaded successfully.",
    })
  } catch (error) {
    console.error("DOCUMENT UPLOAD ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: error.message || "Could not read uploaded document.",
    })
  }
})


app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "File too large. Please upload a resume under 50 MB.",
      })
    }
    return res.status(400).json({
      success: false,
      error: error.message || "Upload failed.",
    })
  }
  next(error)
})

app.post("/agent", async (req, res) => {
  try {
    const {
      message,
      profile = {},
      selectedJob = null,
      savedApplications = [],
      searchPreferences = {},
      documentType = "chat",
      uploadedDocument = null,
    } = req.body

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
      })
    }

    const intent = detectIntent(message, documentType)

    const uploadedDocumentText = uploadedDocument?.text
      ? trimText(uploadedDocument.text, 18000)
      : ""

    const systemPrompt = buildCareerSystemPrompt({
      profile,
      selectedJob,
      savedApplications,
      searchPreferences,
      uploadedDocumentText,
      uploadedDocumentName: uploadedDocument?.fileName || "",
    })

    const reply = await callGroq(
      [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      {
        temperature:
          intent.docType === "resume-json" || message.toLowerCase().includes("return only valid json")
            ? 0.18
            : 0.45,
        max_tokens:
          intent.docType === "resume-json" || message.toLowerCase().includes("return only valid json")
            ? 4200
            : 2600,
      }
    )

    let finalReply = reply

    if (
      intent.docType === "resume-json" ||
      message.toLowerCase().includes("return only valid json")
    ) {
      finalReply = cleanJsonText(reply)

      try {
        JSON.parse(finalReply)
      } catch (jsonError) {
        console.error("AI returned invalid JSON. Trying one repair attempt.")

        const repairPrompt = `
Fix this into valid JSON only. No markdown. No explanation.
It must match the resume JSON shape.
Bad response:
${reply}
`

        const repaired = await callGroq(
          [
            {
              role: "system",
              content:
                "You fix invalid JSON. Return only valid JSON. No markdown. No explanation.",
            },
            {
              role: "user",
              content: repairPrompt,
            },
          ],
          {
            temperature: 0.05,
            max_tokens: 4200,
          }
        )

        finalReply = cleanJsonText(repaired)
        JSON.parse(finalReply)
      }
    }

    res.json({
      success: true,
      reply: finalReply,
      docType: intent.docType,
      exportable: intent.exportable,
      title: intent.title,
      hasUploadedDocument: Boolean(uploadedDocumentText),
    })
  } catch (error) {
    console.error("AGENT ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      reply:
        "AI agent failed. Please check backend terminal logs and make sure GROQ_API_KEY is correct.",
      error: error.message,
    })
  }
})

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
      })
    }

    const reply = await callGroq(
      [
        {
          role: "system",
          content:
            "You are JobPilot AI, a friendly career assistant. Help with jobs, resumes, cover letters, documents, applications, interviews, and career planning.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      {
        temperature: 0.55,
        max_tokens: 1600,
      }
    )

    res.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error("CHAT ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: "Chat failed.",
      details: error.message,
    })
  }
})

app.get("/jobs", async (req, res) => {
  try {
    const role = req.query.role || "Frontend Developer"
    const location = req.query.location || ""
    const country = req.query.country || "in"
    const salaryRequired = req.query.salaryRequired === "true"
    const salaryMin = Number(req.query.salaryMin || 0)
    const salaryMax = Number(req.query.salaryMax || 0)

    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      return res.status(500).json({
        success: false,
        error: "Adzuna API keys are missing.",
      })
    }

    if (!allowedCountries.includes(country)) {
      return res.status(400).json({
        success: false,
        error:
          "This country is not supported by the current jobs API yet. Choose a supported country.",
        supportedCountries: allowedCountries,
      })
    }

    const params = new URLSearchParams({
      app_id: process.env.ADZUNA_APP_ID,
      app_key: process.env.ADZUNA_APP_KEY,
      results_per_page: "50",
      what: role,
      where: location,
      "content-type": "application/json",
    })

    if (salaryRequired && salaryMin > 0) {
      params.append("salary_min", String(salaryMin))
    }

    if (salaryRequired && salaryMax > 0) {
      params.append("salary_max", String(salaryMax))
    }

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Adzuna API failed.",
        details: data,
      })
    }

    const rawJobs = data.results || []

    const jobs = rawJobs
      .map((job) => {
        const salaryMinValue = job.salary_min || null
        const salaryMaxValue = job.salary_max || null
        const hasSalary = Boolean(salaryMinValue || salaryMaxValue)

        return {
          id: job.id,
          title: job.title || "Job title not listed",
          company: job.company?.display_name || "Company not listed",
          location: job.location?.display_name || "Location not listed",
          country,
          salaryMin: salaryMinValue,
          salaryMax: salaryMaxValue,
          salaryAvailable: hasSalary,
          salaryPredicted:
            job.salary_is_predicted === "1" || job.salary_is_predicted === 1,
          salary: hasSalary
            ? `${salaryMinValue ? salaryMinValue : ""}${
                salaryMinValue && salaryMaxValue ? " - " : ""
              }${salaryMaxValue ? salaryMaxValue : ""}`
            : "Salary not listed",
          description: job.description || "No description available",
          url: job.redirect_url || "",
          created: job.created || "",
          category: job.category?.label || "Job",
          source: "Adzuna",
        }
      })
      .filter((job) => {
        if (!salaryRequired) return true
        if (!job.salaryAvailable) return false

        const min = job.salaryMin || job.salaryMax || 0
        const max = job.salaryMax || job.salaryMin || 0

        if (salaryMin > 0 && max < salaryMin) return false
        if (salaryMax > 0 && min > salaryMax) return false

        return true
      })

    res.json({
      success: true,
      role,
      location,
      country,
      salaryRequired,
      salaryMin,
      salaryMax,
      totalFromApi: rawJobs.length,
      count: jobs.length,
      message:
        salaryRequired && jobs.length === 0
          ? "No salary-listed jobs found for this range/location."
          : "",
      jobs,
    })
  } catch (error) {
    console.error("JOBS ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: "Could not fetch jobs.",
      details: error.message,
    })
  }
})

app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing to, subject, or body.",
      })
    }

    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_123") {
      return res.status(400).json({
        success: false,
        error:
          "RESEND_API_KEY is missing or dummy. Use Gmail draft option or add a real Resend key.",
      })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data, error } = await resend.emails.send({
      from: "JobPilot <onboarding@resend.dev>",
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        ${String(body).replace(/\n/g, "<br />")}
      </div>`,
    })

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message || "Resend email failed.",
        details: error,
      })
    }

    res.json({
      success: true,
      message: "Email sent successfully.",
      id: data?.id,
    })
  } catch (error) {
    console.error("EMAIL SEND ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
    })
  }
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found.",
    path: req.path,
  })
})

app.listen(PORT, () => {
  console.log(`JobPilot backend running on http://localhost:${PORT}`)
})