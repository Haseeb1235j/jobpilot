require("dotenv").config()

const express = require("express")
const cors = require("cors")
const Groq = require("groq-sdk")
const nodemailer = require("nodemailer")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

let chatHistory = [
  {
    role: "system",
    content: `
You are JobPilot AI, a smart career assistant.

Your job:
- Help users with resumes
- Help users find jobs
- Create cover letters
- Create follow-up emails
- Prepare interview questions
- Give skill roadmaps
- Give job application strategies

Formatting rules:
- Use clear headings
- Use bullet points
- Keep answers practical
- Do not give messy paragraphs
- Do not pretend you searched live internet unless real job data is provided
- Be friendly and helpful
`,
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
          content: `
You are JobPilot AI, a smart career assistant.

Your job:
- Help users with resumes
- Help users find jobs
- Create cover letters
- Create follow-up emails
- Prepare interview questions
- Give skill roadmaps
- Give job application strategies

Formatting rules:
- Use clear headings
- Use bullet points
- Keep answers practical
- Do not give messy paragraphs
- Do not pretend you searched live internet unless real job data is provided
- Be friendly and helpful
`,
        },
      ]

      return res.json({
        reply: "Chat memory cleared ✅",
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
      max_tokens: 900,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a reply."

    chatHistory.push({
      role: "assistant",
      content: reply,
    })

    if (chatHistory.length > 20) {
      chatHistory = [chatHistory[0], ...chatHistory.slice(-19)]
    }

    res.json({
      reply,
    })
  } catch (error) {
    console.error("Chat error:", error)

    res.status(500).json({
      reply:
        "Something went wrong with the AI chat. Please check the backend terminal.",
    })
  }
})

app.get("/jobs", async (req, res) => {
  try {
    const role = req.query.role || "frontend developer"
    const location = req.query.location || "india"
    const country = req.query.country || "in"

    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY

    if (!appId || !appKey) {
      return res.status(500).json({
        error: "Missing Adzuna API keys in .env file",
      })
    }

    const url = new URL(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1`
    )

    url.searchParams.append("app_id", appId)
    url.searchParams.append("app_key", appKey)
    url.searchParams.append("what", role)
    url.searchParams.append("where", location)
    url.searchParams.append("results_per_page", "10")
    url.searchParams.append("content-type", "application/json")

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()

      console.error("Adzuna API error:", errorText)

      return res.status(response.status).json({
        error: "Adzuna API request failed",
        details: errorText,
      })
    }

    const data = await response.json()

    const jobs = (data.results || []).map((job) => ({
      id: job.id,
      title: job.title || "No title",
      company: job.company?.display_name || "Unknown company",
      location: job.location?.display_name || location,
      salary:
        job.salary_min && job.salary_max
          ? `${Math.round(job.salary_min)} - ${Math.round(job.salary_max)}`
          : "Salary not listed",
      description: job.description || "No description available",
      url: job.redirect_url,
      created: job.created,
      category: job.category?.label || "General",
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
    console.error("Jobs route error:", error)

    res.status(500).json({
      error: "Something went wrong while searching jobs",
    })
  }
})

app.post("/send-email", async (req, res) => {
  try {
    const { to, subject, body } = req.body

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        error: "Missing EMAIL_USER or EMAIL_PASS in .env file",
      })
    }

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "To, subject, and body are required",
      })
    }

    const mailOptions = {
      from: `"JobPilot" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: body,
    }

    const info = await transporter.sendMail(mailOptions)

    res.json({
      success: true,
      message: "Email sent successfully ✅",
      messageId: info.messageId,
    })
  } catch (error) {
    console.error("Send email error:", error)

    res.status(500).json({
      success: false,
      error:
        "Failed to send email. Check backend terminal and Gmail app password.",
    })
  }
})

app.listen(PORT, () => {
  console.log(`JobPilot backend running on http://localhost:${PORT}`)
})