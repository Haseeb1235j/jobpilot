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

const requiredProfileFields = [
  ["name", "Full Name"],
  ["role", "Target Role"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["portfolio", "Portfolio / GitHub"],
]

const getMissingProfileFields = (profile = {}) => {
  return requiredProfileFields
    .filter(([key]) => !profile[key] || String(profile[key]).trim().length < 4)
    .map(([, label]) => label)
}

const isResumeRequest = (message = "") => {
  const text = message.toLowerCase()
  return (
    text.includes("resume") ||
    text.includes("cv") ||
    text.includes("generate my resume") ||
    text.includes("make my resume")
  )
}

const isApplicationEmailRequest = (message = "") => {
  const text = message.toLowerCase()
  return (
    text.includes("application email") ||
    text.includes("job email") ||
    text.includes("email for this job") ||
    text.includes("apply email") ||
    text.includes("mail for this job")
  )
}

app.get("/", (req, res) => {
  res.json({
    message: "JobPilot backend is running",
    routes: ["/chat", "/agent", "/jobs", "/send-email"],
  })
})

app.post("/agent", async (req, res) => {
  try {
    const { message, profile, selectedJob, savedApplications, searchPreferences } =
      req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        reply: "AI key is missing in backend environment.",
      })
    }

    const missingFields = getMissingProfileFields(profile)

    if (isResumeRequest(message) && missingFields.length > 0) {
      return res.json({
        success: true,
        reply: `I can generate a professional resume, but I need a few details first.

Please complete these fields in the Profile section:

${missingFields.map((field) => `- ${field}`).join("\n")}

After filling them, ask me again: "Generate my resume".`,
      })
    }

    if (isApplicationEmailRequest(message) && !selectedJob) {
      return res.json({
        success: true,
        reply: `I can generate a professional job application email, but first select a job.

Please do this:

1. Go to Find Real Jobs
2. Click Apply AI on any job
3. Then ask me: "Generate email for this job"`,
      })
    }

    const systemPrompt = `
You are JobPilot AI, a professional AI career agent.

Your job is to help users with:
- Resume generation
- Resume improvement
- Cover letters
- Job application emails
- Interview preparation
- Skill improvement plans
- Career roadmaps
- Project ideas
- Job search strategy

Important behavior rules:
1. Be personal and practical.
2. Do not give generic low-quality answers.
3. Use the user's profile details when available.
4. If the user asks for resume/application but profile details are missing, ask them to complete the profile.
5. If generating a resume, make it clean, ATS-friendly, and professional.
6. If generating an email, make it short, clear, human, and not repetitive.
7. If giving a skill plan, make it step-by-step and realistic.
8. If preparing interviews, include questions, strong answers, and practice advice.
9. Do not claim fake experience.
10. Improve the wording professionally, but stay truthful to the user's details.
11. Use simple formatting with clear headings.
12. If salary data is not available in a job, say salary is not listed. Do not invent salary.

User Profile:
Name: ${profile?.name || "Not provided"}
Target Role: ${profile?.role || "Not provided"}
Email: ${profile?.email || "Not provided"}
Phone: ${profile?.phone || "Not provided"}
Portfolio/GitHub: ${profile?.portfolio || "Not provided"}
Skills: ${profile?.skills || profile?.technicalSkills || "Not provided"}
Experience: ${profile?.experience || "Not provided"}
Projects: ${profile?.projects || "Not provided"}

Selected Job:
Title: ${selectedJob?.title || "No selected job"}
Company: ${selectedJob?.company || "No selected company"}
Location: ${selectedJob?.location || "No selected location"}
Salary: ${selectedJob?.salary || "Not listed"}
Description: ${selectedJob?.description || "No job description available"}

Search Preferences:
Role: ${searchPreferences?.role || "Not provided"}
Location: ${searchPreferences?.location || "Not provided"}
Country: ${searchPreferences?.country || "Not provided"}
Experience: ${searchPreferences?.experience || "Not provided"}
Salary Range: ${searchPreferences?.salaryRange || "Not provided"}

Saved Applications Count: ${savedApplications?.length || 0}
`

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 1600,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    res.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error("❌ AGENT ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      reply: "AI agent failed. Please check backend logs.",
      error: error.message,
    })
  }
})

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing",
      })
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "You are JobPilot AI, a friendly career assistant. Help users with jobs, resumes, cover letters, applications, interview preparation, and career planning.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

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
    const role = req.query.role || "Frontend Developer"
    const location = req.query.location || ""
    const country = req.query.country || "in"
    const salaryRequired = req.query.salaryRequired === "true"
    const salaryMin = Number(req.query.salaryMin || 0)
    const salaryMax = Number(req.query.salaryMax || 0)

    if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
      return res.status(500).json({
        success: false,
        error: "Adzuna API keys are missing",
      })
    }

    const allowedCountries = [
      "in",
      "us",
      "gb",
      "ca",
      "au",
      "de",
      "fr",
      "nz",
      "za",
      "br",
      "pl",
      "at",
    ]

    const safeCountry = allowedCountries.includes(country) ? country : "in"

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

    const url = `https://api.adzuna.com/v1/api/jobs/${safeCountry}/search/1?${params.toString()}`

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
          country: safeCountry,
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
      country: safeCountry,
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
    const { to, subject, body } = req.body

    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: "Missing to, subject, or body",
      })
    }

    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY is missing",
      })
    }

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