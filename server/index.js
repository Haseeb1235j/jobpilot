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
    text.includes("add this in resume") ||
    text.includes("add that in resume") ||
    text.includes("put this in resume") ||
    text.includes("update my resume") ||
    text.includes("improve my resume") ||
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
    const {
      message,
      profile,
      selectedJob,
      savedApplications,
      searchPreferences,
      documentType,
    } = req.body

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

    const messageLower = message.toLowerCase()

    const userWantsCompleteResume =
      isResumeRequest(message) &&
      !messageLower.includes("only project section") &&
      !messageLower.includes("only summary") &&
      !messageLower.includes("only skills")

    if (userWantsCompleteResume && missingFields.length > 0) {
      return res.json({
        success: true,
        reply: `Some details are missing, but I will still create a clean resume using only the available information.

Missing details you can improve later:
${missingFields.map((field) => `- ${field}`).join("\n")}

Now here is a clean resume using the details currently available:

${profile?.name || ""}
${profile?.phone || ""}${profile?.email ? " | " + profile.email : ""}
${profile?.linkedin || ""}${profile?.github ? " | " + profile.github : ""}
${profile?.location || ""}

PROFESSIONAL SUMMARY
${profile?.summary || `Motivated ${profile?.role || "candidate"} with practical skills in ${profile?.skills || profile?.technicalSkills || "software development"} and a strong interest in building real-world projects and growing professionally.`}

TECHNICAL SKILLS
${profile?.skills || profile?.technicalSkills || ""}

PROJECTS
${profile?.projects || "Add your project details in the profile section to make this stronger."}

EDUCATION
${profile?.education || ""}

STRENGTHS
${profile?.softSkills || "Quick learner, problem solving, teamwork, communication"}

DECLARATION
I hereby declare that the above information is true to the best of my knowledge.

Best regards,
${profile?.name || ""}`,
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
- Project descriptions
- Job search strategy

IMPORTANT BEHAVIOR RULES:

1. Understand user intent like ChatGPT.
2. Do not answer too literally if the user's meaning is clear.
3. If the user asks something related to resume/CV, always think:
   "Should this become a complete resume or a resume section?"
4. If user says:
   - "write about my project and add it in resume"
   - "describe my project for resume"
   - "add this project in my resume"
   Then create a COMPLETE resume and include the improved project inside the PROJECTS section.
5. Do NOT create only a project document unless the user clearly says:
   - "only write project section"
   - "only project description"
6. Never repeat the same section twice.
7. Never repeat greetings, signatures, or contact details.
8. Never print "Not provided" in resume output.
9. If a field is missing, skip it quietly.
10. Never invent fake degree, fake experience, fake company, fake certification, or fake salary.
11. Improve wording professionally but stay truthful.
12. Use clean, job-ready formatting.
13. If user asks for resume, make it ATS-friendly and complete.
14. If user asks for email, write one short professional email only.
15. If user asks for cover letter, write one clean cover letter only.
16. If user asks for skill improvement, give a practical step-by-step roadmap.
17. If user asks for interview prep, give questions, sample answers, and practice advice.
18. If user asks for code, use markdown code blocks.
19. If salary data is missing, say salary is not listed. Do not invent salary.

RESUME FORMAT WHEN RESUME IS REQUESTED:

${profile?.name || ""}
${profile?.phone || ""}${profile?.email ? " | " + profile.email : ""}
${profile?.linkedin || ""}${profile?.github ? " | " + profile.github : ""}
${profile?.location || ""}

PROFESSIONAL SUMMARY
Write a strong 3-4 line summary using only real available details.

TECHNICAL SKILLS
Group skills clearly.

PROJECTS
For every project:
Project Name
- Strong bullet point
- Strong bullet point
- Strong bullet point
- Impact / outcome if available

EDUCATION
Use only available education details.

EXPERIENCE
Use only real experience, internship, freelance, or project experience.

CERTIFICATIONS
Use only available certifications.

STRENGTHS
Use available soft skills.

DECLARATION
Include only if suitable for Indian fresher resume.

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

Document Type Requested By Frontend: ${documentType || "response"}
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
      temperature: 0.45,
      max_tokens: 2200,
    })

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response."

    res.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error("AGENT ERROR:")
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