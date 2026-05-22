require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { Resend } = require("resend")
const Groq = require("groq-sdk")

const app = express()

app.use(cors())
app.use(express.json({ limit: "10mb" }))

const PORT = process.env.PORT || 5000

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const resend = new Resend(process.env.RESEND_API_KEY)

let chatHistory = [
  {
    role: "system",
    content:
      "You are JobPilot AI, a friendly career assistant. Help users with jobs, resumes, cover letters, applications, interview preparation, and career planning. Be friendly and helpful.",
  },
]

app.get("/", (req, res) => {
  res.json({
    message: "JobPilot backend is running",
    routes: ["/chat", "/jobs", "/send-email"],
  })
})

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      })
    }

    if (message.toLowerCase().includes("clear memory")) {
      chatHistory = [
        {
          role: "system",
          content:
            "You are JobPilot AI, a friendly career assistant. Help users with jobs, resumes, cover letters, applications, interview preparation, and career planning. Be friendly and helpful.",
        },
      ]

      return res.json({
        reply: "Memory cleared ✅",
      })
    }

    chatHistory.push({
      role: "user",
      content: message,
    })

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: chatHistory,
      temperature: 0.7,
      max_tokens: 800,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    chatHistory.push({
      role: "assistant",
      content: reply,
    })

    if (chatHistory.length > 20) {
      chatHistory = [chatHistory[0], ...chatHistory.slice(-18)]
    }

    res.json({ reply })
  } catch (error) {
    console.error("❌ CHAT ERROR:")
    console.error(error)

    res.status(500).json({
      error: "Chat failed",
      details: error.message,
    })
  }
})

app.get("/jobs", async (req, res) => {
  try {
    const role = req.query.role || "frontend developer"
    const location = req.query.location || "india"

    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      return res.status(500).json({
        success: false,
        error: "Adzuna API keys are missing",
      })
    }

    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${
      process.env.ADZUNA_APP_ID
    }&app_key=${
      process.env.ADZUNA_APP_KEY
    }&results_per_page=10&what=${encodeURIComponent(
      role
    )}&where=${encodeURIComponent(location)}&content-type=application/json`

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.error("❌ ADZUNA ERROR:")
      console.error(data)

      return res.status(response.status).json({
        success: false,
        error: "Adzuna API failed",
        details: data,
      })
    }

    const jobs = (data.results || []).map((job) => ({
      id: job.id,
      title: job.title || "Job title not listed",
      company: job.company?.display_name || "Company not listed",
      location: job.location?.display_name || "Location not listed",
      salary:
        job.salary_min && job.salary_max
          ? `${job.salary_min} - ${job.salary_max}`
          : "Salary not listed",
      description: job.description || "No description available",
      url: job.redirect_url,
      created: job.created,
      category: job.category?.label || "IT Jobs",
      source: "Adzuna",
    }))

    res.json({
      success: true,
      role,
      location,
      count: jobs.length,
      jobs,
    })
  } catch (error) {
    console.error("❌ JOBS ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: "Could not fetch jobs",
      details: error.message,
    })
  }
})

app.post("/send-email", async (req, res) => {
  try {
    console.log("📩 Resend email request received")

    const { to, subject, body } = req.body

    if (!to || !subject || !body) {
      console.log("❌ Missing email fields")

      return res.status(400).json({
        success: false,
        error: "Missing to, subject, or body",
      })
    }

    if (!process.env.RESEND_API_KEY) {
      console.log("❌ Missing RESEND_API_KEY in Render environment")

      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY is missing",
      })
    }

    console.log("📨 Sending email with Resend to:", to)

    const { data, error } = await resend.emails.send({
      from: "JobPilot <onboarding@resend.dev>",
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        ${body.replace(/\n/g, "<br />")}
      </div>`,
    })

    if (error) {
      console.error("❌ RESEND ERROR:")
      console.error(error)

      return res.status(500).json({
        success: false,
        error: error.message || "Resend email failed",
        details: error,
      })
    }

    console.log("✅ Email sent with Resend:", data)

    res.json({
      success: true,
      message: "Email sent successfully",
      id: data?.id,
    })
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code || "UNKNOWN_ERROR",
    })
  }
})

app.listen(PORT, () => {
  console.log(`JobPilot backend running on http://localhost:${PORT}`)
})