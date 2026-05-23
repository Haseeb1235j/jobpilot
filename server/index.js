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

const detectIntent = (message = "", documentType = "chat") => {
  const text = String(message || "").toLowerCase()

  const wantsResume =
    text.includes("resume") ||
    text.includes("cv") ||
    text.includes("add this in resume") ||
    text.includes("add that in resume") ||
    text.includes("put this in resume") ||
    text.includes("update my resume") ||
    text.includes("improve my resume") ||
    text.includes("make my resume")

  const wantsLetter =
    text.includes("cover letter") ||
    text.includes("application letter") ||
    text.includes("job email") ||
    text.includes("email for job") ||
    text.includes("email for this job") ||
    text.includes("mail for job") ||
    text.includes("mail for this job") ||
    text.includes("application email") ||
    text.includes("apply email")

  const wantsGuide =
    text.includes("roadmap") ||
    text.includes("interview") ||
    text.includes("prepare") ||
    text.includes("improve my skills") ||
    text.includes("skill improvement") ||
    text.includes("learning plan")

  if (documentType === "resume" || wantsResume) {
    return {
      docType: "resume",
      exportable: true,
      title: "Professional Resume",
      intent: "resume",
    }
  }

  if (documentType === "letter" || wantsLetter) {
    return {
      docType: "letter",
      exportable: true,
      title: "Application Letter",
      intent: "letter",
    }
  }

  if (documentType === "guide" || wantsGuide) {
    return {
      docType: "guide",
      exportable: true,
      title: "Career Guide",
      intent: "guide",
    }
  }

  return {
    docType: "chat",
    exportable: false,
    title: "Chat Response",
    intent: "chat",
  }
}

const isApplicationEmailRequest = (message = "") => {
  return detectIntent(message, "chat").intent === "letter"
}

app.get("/", (req, res) => {
  res.json({
    message: "JobPilot backend is running",
    routes: ["/chat", "/agent", "/jobs", "/send-email"],
  })
})

app.post("/agent", async (req, res) => {
  try {
    const {
      message,
      profile = {},
      selectedJob,
      savedApplications = [],
      searchPreferences = {},
      documentType = "chat",
    } = req.body

    if (!message) {
      return res.status(400).json({
        success: false,
        reply: "Please enter a message.",
        docType: "chat",
        exportable: false,
        title: "Error",
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        reply: "AI key is missing in backend environment.",
        docType: "chat",
        exportable: false,
        title: "AI Setup Error",
      })
    }

    const detected = detectIntent(message, documentType)
    const missingFields = getMissingProfileFields(profile)

    if (detected.intent === "letter" && !selectedJob) {
      return res.json({
        success: true,
        reply: `I can write a professional job application email, but first select a job.

Go to Find Real Jobs, click Apply AI on a job, then ask me to generate the email for that selected job.`,
        docType: "chat",
        exportable: false,
        title: "Select a Job First",
      })
    }

    const systemPrompt = `
You are JobPilot AI, a helpful career assistant inside a job application web app.

Your job is to respond like ChatGPT: understand the user's real intention, answer naturally, and only create export-ready documents when the user clearly asks for a resume, letter, email, roadmap, interview prep, or other long document.

CURRENT INTENT:
- intent: ${detected.intent}
- docType: ${detected.docType}
- exportable: ${detected.exportable}

CRITICAL RULES:
1. Normal small questions must be answered like chat. Do not create a big document for casual questions.
2. If user asks "describe my strength", answer with a clean useful sentence or short paragraph, not a resume export.
3. If user asks for resume/CV or says "add this in resume", produce a COMPLETE resume, not only one project section.
4. If user asks to improve/write a project and add it in resume, create the complete resume and include the improved project inside PROJECTS.
5. If user clearly asks only for a project description/section, then write only that section.
6. Never print "Not provided" in resume output. Skip empty fields.
7. Never invent fake degree, fake company, fake certification, fake job experience, fake salary, or fake links.
8. Never repeat the same section twice.
9. Never repeat greetings/signatures/contact details.
10. Use strong professional wording, but keep it truthful.
11. If code is requested, use markdown code blocks.
12. For application emails, write one short professional email only.
13. For interview prep, give questions, sample answers, and practice tips.
14. For skill roadmap, give a practical step-by-step plan.
15. If salary is missing from a job, say salary is not listed. Do not invent salary.

RESPONSE STYLE:
- Be clear and useful.
- Avoid unnecessary headings for small chat answers.
- Use headings only when helpful.
- For resumes, use clean ATS-friendly headings.
- For emails/letters, do not over-explain; just give the usable content.

RESUME FORMAT WHEN RESUME IS REQUESTED:
${profile?.name || ""}
${profile?.phone || ""}${profile?.email ? " | " + profile.email : ""}
${profile?.linkedin || ""}${profile?.github ? " | " + profile.github : ""}
${profile?.location || ""}

PROFESSIONAL SUMMARY
3-4 lines using only available details.

TECHNICAL SKILLS
Group skills clearly.

PROJECTS
For every available project:
Project Name
- Strong bullet point
- Strong bullet point
- Strong bullet point
- Impact/outcome if available

EDUCATION
Use only available education details.

EXPERIENCE
Use only real experience, internship, freelance, or project experience.

CERTIFICATIONS
Use only available certifications.

STRENGTHS
Use available soft skills.

DECLARATION
Include only if suitable for an Indian fresher resume.

USER PROFILE:
Name: ${profile?.name || ""}
Target Role: ${profile?.role || ""}
Email: ${profile?.email || ""}
Phone: ${profile?.phone || ""}
Location: ${profile?.location || ""}
LinkedIn: ${profile?.linkedin || ""}
GitHub: ${profile?.github || ""}
Portfolio: ${profile?.portfolio || ""}
Summary: ${profile?.summary || ""}
Technical Skills: ${profile?.technicalSkills || profile?.skills || ""}
Soft Skills: ${profile?.softSkills || ""}
Tools: ${profile?.tools || ""}
Education: ${profile?.education || ""}
Experience: ${profile?.experience || ""}
Projects: ${profile?.projects || ""}
Certifications: ${profile?.certificationsText || ""}
Achievements: ${profile?.achievementsText || ""}
Languages: ${profile?.languagesText || ""}

MISSING PROFILE FIELDS:
${missingFields.length ? missingFields.join(", ") : "None"}

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
      temperature: detected.intent === "chat" ? 0.65 : 0.35,
      max_tokens: detected.intent === "chat" ? 900 : 2600,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    res.json({
      success: true,
      reply,
      docType: detected.docType,
      exportable: detected.exportable,
      title: detected.title,
    })
  } catch (error) {
    console.error("AGENT ERROR:")
    console.error(error)

    res.status(500).json({
      success: false,
      reply: "AI agent failed. Please check backend logs.",
      error: error.message,
      docType: "chat",
      exportable: false,
      title: "AI Error",
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
      temperature: 0.6,
      max_tokens: 1000,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    res.json({ reply })
  } catch (error) {
    console.error("CHAT ERROR:")
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
      console.error("ADZUNA ERROR:")
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
    console.error("JOBS ERROR:")
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
      console.error("RESEND ERROR:")
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
    console.error("EMAIL SEND ERROR:")
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