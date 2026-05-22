import { useEffect, useMemo, useRef, useState } from "react"

const API_URL =
  import.meta.env.VITE_API_URL || "https://jobpilot-backend-mcv7.onrender.com"

const salaryRanges = [
  "Any Salary",
  "0 - 3 LPA",
  "3 - 6 LPA",
  "6 - 10 LPA",
  "10 - 15 LPA",
  "15 - 25 LPA",
  "25+ LPA",
]

const resumeTemplates = [
  {
    id: "ats-blue",
    name: "ATS Blue Line",
    description: "Clean ATS-friendly resume",
  },
  {
    id: "modern-sidebar",
    name: "Modern Sidebar",
    description: "Stylish sidebar resume",
  },
  {
    id: "elegant-minimal",
    name: "Elegant Minimal",
    description: "Premium minimal resume",
  },
]

const emptyProject = { name: "", description: "", tech: "", link: "" }
const emptyEducation = { degree: "", college: "", branch: "", year: "", score: "" }
const emptyExperience = {
  type: "Fresher",
  company: "",
  role: "",
  duration: "",
  description: "",
}
const emptyCertification = { name: "", issuer: "", year: "", link: "" }
const emptyAchievement = { title: "", description: "" }
const emptyLanguage = { name: "", level: "" }

const defaultProfile = {
  name: "Mohammad Haseeb",
  role: "Frontend Developer",
  email: "haaseebrahman21@gmail.com",
  phone: "+91 9666050726",
  location: "Hyderabad, Telangana, India",
  linkedin: "",
  github: "github.com/yourusername",
  portfolio: "github.com/yourusername",
  summary:
    "Motivated frontend developer with practical experience building responsive web applications using React, JavaScript, Tailwind CSS, Node.js, and APIs.",
  technicalSkills: "React, JavaScript, HTML, CSS, Tailwind CSS, Python, APIs",
  softSkills: "Communication, Problem Solving, Quick Learning, Teamwork",
  tools: "Git, GitHub, VS Code, Vercel, Render",
  educations: [{ degree: "B.Tech", college: "", branch: "", year: "", score: "" }],
  projects: [
    {
      name: "JobPilot AI Career Assistant",
      description:
        "Built an AI career assistant web app with real job search, application tracking, AI resume help, and Gmail-ready application sending.",
      tech: "React, Tailwind CSS, Node.js, Express, Groq AI, Adzuna API",
      link: "github.com/yourusername",
    },
    {
      name: "Portfolio Website",
      description:
        "Created a personal portfolio website to showcase skills, projects, and contact details.",
      tech: "React, Tailwind CSS",
      link: "",
    },
  ],
  experiences: [
    {
      type: "Fresher",
      company: "",
      role: "",
      duration: "",
      description:
        "Built practical projects to improve frontend development, backend integration, API usage, and deployment skills.",
    },
  ],
  certifications: [],
  achievements: [],
  languages: [
    { name: "English", level: "Good" },
    { name: "Hindi", level: "Good" },
    { name: "Telugu", level: "Native" },
  ],
  resumeStyle: "ATS Friendly",
  preferredLocation: "Hyderabad, Bangalore, Remote",
  expectedSalary: "",
  noticePeriod: "Immediate",
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function normalizeProfile(savedProfile) {
  const old = savedProfile || {}

  return {
    ...defaultProfile,
    ...old,
    educations:
      Array.isArray(old.educations) && old.educations.length
        ? old.educations
        : [
            {
              degree: old.degree || "B.Tech",
              college: old.college || "",
              branch: old.branch || "",
              year: old.graduationYear || "",
              score: old.cgpa || "",
            },
          ],
    projects:
      Array.isArray(old.projects) && old.projects.length
        ? old.projects
        : defaultProfile.projects,
    experiences:
      Array.isArray(old.experiences) && old.experiences.length
        ? old.experiences
        : defaultProfile.experiences,
    certifications:
      Array.isArray(old.certifications) && old.certifications.length
        ? old.certifications
        : [],
    achievements:
      Array.isArray(old.achievements) && old.achievements.length
        ? old.achievements
        : [],
    languages:
      Array.isArray(old.languages) && old.languages.length
        ? old.languages
        : defaultProfile.languages,
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function cleanFileName(name) {
  return String(name || "jobpilot-document")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
}

function getDocumentTitle(text, profile) {
  const lower = String(text || "").toLowerCase()

  if (
    lower.includes("professional summary") ||
    lower.includes("technical skills") ||
    lower.includes("education") ||
    lower.includes("projects") ||
    lower.includes("resume")
  ) {
    return `${profile?.name || "Candidate"} Resume`
  }

  if (
    lower.includes("dear hiring manager") ||
    lower.includes("cover letter") ||
    lower.includes("best regards")
  ) {
    return `${profile?.name || "Candidate"} Cover Letter`
  }

  return "JobPilot AI Response"
}

function markdownToProfessionalHtml(text) {
  let safe = escapeHtml(text || "")

  safe = safe
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />")

  return safe
}

function getProfessionalDocumentHtml(text, profile, template = "ats-blue") {
  const title = getDocumentTitle(text, profile)
  const body = markdownToProfessionalHtml(text)

  const contactLine = [
    profile?.email,
    profile?.phone,
    profile?.location,
    profile?.github,
    profile?.portfolio,
  ]
    .filter(Boolean)
    .join(" | ")

  if (template === "modern-sidebar") {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; background:#e5e7eb; font-family:Arial, Helvetica, sans-serif; color:#1f2937; }
    .page { max-width:900px; margin:24px auto; background:white; display:grid; grid-template-columns:245px 1fr; min-height:1080px; box-shadow:0 18px 45px rgba(0,0,0,0.12); }
    .hero { grid-column:1 / 3; background:#334155; color:white; padding:32px 42px; }
    .hero h1 { margin:0; font-size:32px; letter-spacing:2px; text-transform:uppercase; }
    .hero p { margin:6px 0 0; font-size:15px; text-transform:uppercase; }
    .sidebar { background:#e5e7eb; padding:34px 24px; border-right:1px solid #cbd5e1; }
    .main { padding:34px 42px; }
    h2 { color:#334155; font-size:15px; margin-top:22px; margin-bottom:10px; letter-spacing:3px; text-transform:uppercase; border-bottom:2px solid #64748b; padding-bottom:6px; }
    h3 { font-size:14px; margin-top:15px; color:#111827; }
    p, li { font-size:12.8px; line-height:1.58; }
    li { margin-left:17px; }
    .contact-item { font-size:12px; line-height:1.6; margin-bottom:7px; word-break:break-word; }
    strong { color:#111827; }
    @media print { body { background:white; } .page { margin:0; max-width:none; box-shadow:none; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <h1>${escapeHtml(profile?.name || "Candidate Name")}</h1>
      <p>${escapeHtml(profile?.role || "Target Role")}</p>
    </div>

    <aside class="sidebar">
      <h2>Contact</h2>
      <div class="contact-item">${escapeHtml(profile?.email || "Email not provided")}</div>
      <div class="contact-item">${escapeHtml(profile?.phone || "Phone not provided")}</div>
      <div class="contact-item">${escapeHtml(profile?.location || "Location not provided")}</div>
      <div class="contact-item">${escapeHtml(profile?.github || "GitHub not provided")}</div>
      <div class="contact-item">${escapeHtml(profile?.portfolio || "Portfolio not provided")}</div>

      <h2>Skills</h2>
      <p>${escapeHtml(profile?.technicalSkills || "Not provided")}</p>

      <h2>Tools</h2>
      <p>${escapeHtml(profile?.tools || "Not provided")}</p>

      <h2>Languages</h2>
      <p>${escapeHtml(
        Array.isArray(profile?.languages)
          ? profile.languages
              .map((lang) => `${lang.name}${lang.level ? ` - ${lang.level}` : ""}`)
              .join(", ")
          : "Not provided"
      )}</p>
    </aside>

    <main class="main">
      <p>${body}</p>
    </main>
  </div>
</body>
</html>`
  }

  if (template === "elegant-minimal") {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; background:#f8fafc; font-family:Georgia, "Times New Roman", serif; color:#222; }
    .page { max-width:860px; margin:24px auto; background:white; padding:48px 58px; border-radius:12px; box-shadow:0 18px 45px rgba(0,0,0,0.1); }
    .name { font-family:Arial, Helvetica, sans-serif; font-size:31px; letter-spacing:5px; text-transform:uppercase; font-weight:800; margin-bottom:6px; }
    .role { font-family:Arial, Helvetica, sans-serif; letter-spacing:3px; color:#6b7280; text-transform:uppercase; margin-bottom:20px; }
    .line { height:3px; background:#222; margin-bottom:22px; }
    .contact { font-family:Arial, Helvetica, sans-serif; font-size:12px; color:#4b5563; margin-bottom:22px; line-height:1.5; }
    h1 { display:none; }
    h2 { font-family:Arial, Helvetica, sans-serif; font-size:15px; letter-spacing:4px; text-transform:uppercase; margin-top:22px; margin-bottom:9px; color:#333; }
    h3 { font-family:Arial, Helvetica, sans-serif; font-size:14px; margin-top:14px; }
    p, li { font-size:13.2px; line-height:1.62; }
    li { margin-left:17px; }
    strong { color:#111; }
    @media print { body { background:white; } .page { margin:0; max-width:none; box-shadow:none; border-radius:0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="name">${escapeHtml(profile?.name || "Candidate Name")}</div>
    <div class="role">${escapeHtml(profile?.role || "Target Role")}</div>
    <div class="line"></div>
    <div class="contact">${escapeHtml(contactLine || "Contact details not provided")}</div>
    <p>${body}</p>
  </div>
</body>
</html>`
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#111827; }
    .page { max-width:850px; margin:24px auto; background:white; padding:44px 54px; border-radius:14px; box-shadow:0 18px 45px rgba(0,0,0,0.12); }
    .header { border-bottom:4px solid #1e6091; padding-bottom:13px; margin-bottom:22px; }
    .name { font-size:33px; color:#1e6091; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
    .role { font-size:15px; font-weight:700; color:#334155; margin-bottom:7px; }
    .contact { font-size:12px; color:#475569; line-height:1.5; }
    h1 { display:none; }
    h2 { font-size:15px; margin-top:22px; margin-bottom:9px; color:#1e6091; text-transform:uppercase; border-bottom:1px solid #9ca3af; padding-bottom:6px; }
    h3 { font-size:14px; margin-top:15px; color:#111827; }
    p, li { font-size:13.2px; line-height:1.58; }
    li { margin-left:17px; }
    strong { color:#111827; }
    @media print { body { background:white; } .page { box-shadow:none; margin:0; max-width:none; border-radius:0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="name">${escapeHtml(profile?.name || "Candidate Name")}</div>
      <div class="role">${escapeHtml(profile?.role || "Target Role")}</div>
      <div class="contact">${escapeHtml(contactLine || "Contact details not provided")}</div>
    </div>
    <p>${body}</p>
  </div>
</body>
</html>`
}

function MessageContent({ text }) {
  const parts = String(text || "").split(/```([\s\S]*?)```/g)

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code || "")
  }

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        const isCode = index % 2 === 1

        if (isCode) {
          const cleanCode = part.replace(/^[a-zA-Z0-9_-]+\n/, "")

          return (
            <div
              key={index}
              className="bg-[#020617] border border-white/10 rounded-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-xs text-gray-400">Code</span>
                <button
                  type="button"
                  onClick={() => copyCode(cleanCode)}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg"
                >
                  Copy
                </button>
              </div>

              <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                <code>{cleanCode}</code>
              </pre>
            </div>
          )
        }

        return (
          <p key={index} className="whitespace-pre-line leading-relaxed">
            {part}
          </p>
        )
      })}
    </div>
  )
}

function AccordionCard({
  id,
  title,
  description,
  count,
  children,
  openProfileSection,
  setOpenProfileSection,
  sectionStatus,
}) {
  const isOpen = openProfileSection === id
  const done = sectionStatus[id]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenProfileSection(isOpen ? "" : id)}
        className="w-full p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-left hover:bg-white/5 transition"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl">{isOpen ? "▾" : "▸"}</span>
            <h3 className="text-xl font-bold">{title}</h3>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                done
                  ? "bg-green-500/20 text-green-300"
                  : "bg-yellow-500/20 text-yellow-300"
              }`}
            >
              {done ? "Done" : "Needs info"}
            </span>
          </div>
          <p className="text-gray-400 mt-1 text-sm">{description}</p>
        </div>

        {count !== undefined && (
          <div className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300">
            {count}
          </div>
        )}
      </button>

      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function ArraySection({
  items,
  section,
  emptyItem,
  fields,
  updateArrayItem,
  addArrayItem,
  removeArrayItem,
  inputClass,
  textareaClass,
  title,
  allowEmptyRemove = false,
}) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-black/20 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold">
              {title} {index + 1}
            </h4>

            {(items.length > 1 || allowEmptyRemove) && (
              <button
                type="button"
                onClick={() => removeArrayItem(section, index)}
                className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200 text-sm"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {fields.map(([field, label, type]) => (
              <div key={field}>
                <label className="text-gray-400 text-sm">{label}</label>

                {type === "textarea" ? (
                  <textarea
                    value={item[field]}
                    onChange={(e) =>
                      updateArrayItem(section, index, field, e.target.value)
                    }
                    rows="4"
                    className={textareaClass}
                  />
                ) : (
                  <input
                    value={item[field]}
                    onChange={(e) =>
                      updateArrayItem(section, index, field, e.target.value)
                    }
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addArrayItem(section, emptyItem)}
        className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
      >
        + Add {title}
      </button>
    </div>
  )
}

function TemplateSelector({
  selectedResumeTemplate,
  setSelectedResumeTemplate,
}) {
  return (
    <div className="mb-4 bg-black/20 border border-white/10 rounded-2xl p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold">Choose Resume Template</h3>
          <p className="text-sm text-gray-400">
            Pick a professional style before exporting PDF or DOC.
          </p>
        </div>

        <span className="text-xs bg-purple-500/20 text-purple-200 px-3 py-1 rounded-full">
          Selected:{" "}
          {resumeTemplates.find((template) => template.id === selectedResumeTemplate)
            ?.name || "ATS Blue Line"}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {resumeTemplates.map((template) => (
          <button
            type="button"
            key={template.id}
            onClick={() => setSelectedResumeTemplate(template.id)}
            className={`text-left border rounded-2xl p-3 transition ${
              selectedResumeTemplate === template.id
                ? "border-purple-400 bg-purple-600/20"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-bold">{template.name}</p>
              {selectedResumeTemplate === template.id && (
                <span className="text-green-300 text-sm">✓</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">{template.description}</p>

            <div className="bg-white rounded-lg h-20 overflow-hidden">
              {template.id === "ats-blue" && (
                <div className="p-3">
                  <div className="h-3 bg-blue-700 w-3/4 mb-2"></div>
                  <div className="h-1 bg-blue-700 w-full mb-3"></div>
                  <div className="h-1 bg-gray-400 w-full mb-1"></div>
                  <div className="h-1 bg-gray-300 w-5/6 mb-1"></div>
                  <div className="h-1 bg-gray-300 w-4/6"></div>
                </div>
              )}

              {template.id === "modern-sidebar" && (
                <div className="flex h-full">
                  <div className="w-1/3 bg-gray-300 p-2">
                    <div className="h-7 w-7 rounded-full bg-white mb-2"></div>
                    <div className="h-1 bg-gray-600 w-full mb-1"></div>
                    <div className="h-1 bg-gray-500 w-4/5"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-5 bg-slate-700 mb-2"></div>
                    <div className="p-2">
                      <div className="h-1 bg-gray-500 w-3/4 mb-2"></div>
                      <div className="h-1 bg-gray-300 w-full mb-1"></div>
                      <div className="h-1 bg-gray-300 w-5/6"></div>
                    </div>
                  </div>
                </div>
              )}

              {template.id === "elegant-minimal" && (
                <div className="p-3">
                  <div className="h-2 bg-gray-800 w-3/4 mb-2"></div>
                  <div className="h-1 bg-gray-400 w-1/2 mb-3"></div>
                  <div className="h-1 bg-gray-900 w-full mb-3"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="h-1 bg-gray-500 w-4/5 mb-1"></div>
                      <div className="h-1 bg-gray-300 w-full"></div>
                    </div>
                    <div>
                      <div className="h-1 bg-gray-500 w-4/5 mb-1"></div>
                      <div className="h-1 bg-gray-300 w-full"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function App() {
  const [profile, setProfile] = useState(() =>
    normalizeProfile(safeParse(localStorage.getItem("jobpilot_profile"), null))
  )

  const [search, setSearch] = useState({
    role: "Frontend Developer",
    location: "India",
    experience: "Fresher",
    salaryRange: "Any Salary",
  })

  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobError, setJobError] = useState("")

  const [selectedJob, setSelectedJob] = useState(null)
  const [applicationPack, setApplicationPack] = useState(null)
  const [emailDraft, setEmailDraft] = useState(null)

  const [recipientEmail, setRecipientEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState("")

  const [savedApplications, setSavedApplications] = useState(() =>
    safeParse(localStorage.getItem("jobpilot_saved_applications"), [])
  )

  const [copied, setCopied] = useState("")

  const [aiMessages, setAiMessages] = useState(() =>
    safeParse(localStorage.getItem("jobpilot_ai_messages"), [
      {
        role: "ai",
        text: "Hi 👋 I am JobPilot AI. Fill your candidate details, then ask me to generate a professional resume, improve your skills, prepare for interviews, or write a job application email.",
      },
    ])
  )

  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [openProfileSection, setOpenProfileSection] = useState("personal")
  const [selectedResumeTemplate, setSelectedResumeTemplate] =
    useState("ats-blue")

  const aiChatRef = useRef(null)
  const aiInputRef = useRef(null)
  const typingIntervalRef = useRef(null)

  const inputClass =
    "w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 transition"
  const textareaClass =
    "w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 transition"

  useEffect(() => {
    localStorage.setItem("jobpilot_profile", JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(
      "jobpilot_saved_applications",
      JSON.stringify(savedApplications)
    )
  }, [savedApplications])

  useEffect(() => {
    localStorage.setItem("jobpilot_ai_messages", JSON.stringify(aiMessages))
  }, [aiMessages])

  useEffect(() => {
    aiChatRef.current?.scrollTo({
      top: aiChatRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [aiMessages, aiLoading])

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
    }
  }, [])

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const updateArrayItem = (section, index, field, value) => {
    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addArrayItem = (section, emptyItem) => {
    setProfile((prev) => ({
      ...prev,
      [section]: [...prev[section], { ...emptyItem }],
    }))
  }

  const removeArrayItem = (section, index) => {
    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }))
  }

  const isFilled = (value) => value && String(value).trim().length > 3

  const getSalaryRangeText = (range) => {
    if (range === "Any Salary") return "No specific salary preference"
    return range
  }

  const getSalaryScore = (job) => {
    if (search.salaryRange === "Any Salary") return 0

    const salaryText = `${job.salary || ""} ${job.description || ""}`.toLowerCase()
    const selected = search.salaryRange.toLowerCase()

    if (!salaryText || salaryText.includes("not listed")) return -3

    const salaryMap = {
      "0 - 3": ["0", "1", "2", "3"],
      "3 - 6": ["3", "4", "5", "6"],
      "6 - 10": ["6", "7", "8", "9", "10"],
      "10 - 15": ["10", "11", "12", "13", "14", "15"],
      "15 - 25": ["15", "18", "20", "25"],
      "25+": ["25", "30", "40", "50"],
    }

    for (const [range, numbers] of Object.entries(salaryMap)) {
      if (selected.includes(range.toLowerCase())) {
        return numbers.some((n) => salaryText.includes(n)) ? 8 : -5
      }
    }

    return 0
  }

  const projectsText = useMemo(() => {
    return profile.projects
      .filter((project) => project.name || project.description)
      .map(
        (project, index) =>
          `Project ${index + 1}: ${project.name}
Description: ${project.description}
Tech Stack: ${project.tech}
Link: ${project.link}`
      )
      .join("\n\n")
  }, [profile.projects])

  const educationText = useMemo(() => {
    return profile.educations
      .filter((edu) => edu.degree || edu.college)
      .map(
        (edu, index) =>
          `Education ${index + 1}: ${edu.degree}, ${edu.branch}, ${edu.college}, ${edu.year}, ${edu.score}`
      )
      .join("\n")
  }, [profile.educations])

  const experienceText = useMemo(() => {
    return profile.experiences
      .filter((exp) => exp.type || exp.description || exp.company)
      .map(
        (exp, index) =>
          `Experience ${index + 1}: ${exp.type}
Company: ${exp.company}
Role: ${exp.role}
Duration: ${exp.duration}
Description: ${exp.description}`
      )
      .join("\n\n")
  }, [profile.experiences])

  const certificationText = useMemo(() => {
    return profile.certifications
      .filter((cert) => cert.name)
      .map(
        (cert, index) =>
          `Certification ${index + 1}: ${cert.name}, ${cert.issuer}, ${cert.year}, ${cert.link}`
      )
      .join("\n")
  }, [profile.certifications])

  const achievementText = useMemo(() => {
    return profile.achievements
      .filter((ach) => ach.title || ach.description)
      .map(
        (ach, index) =>
          `Achievement ${index + 1}: ${ach.title} - ${ach.description}`
      )
      .join("\n")
  }, [profile.achievements])

  const languageText = useMemo(() => {
    return profile.languages
      .filter((lang) => lang.name)
      .map((lang) => `${lang.name}${lang.level ? ` - ${lang.level}` : ""}`)
      .join(", ")
  }, [profile.languages])

  const profileForAI = useMemo(() => {
    return {
      ...profile,
      skills: profile.technicalSkills,
      experience: experienceText,
      projects: projectsText,
      education: educationText,
      certificationsText: certificationText,
      achievementsText: achievementText,
      languagesText: languageText,
    }
  }, [
    profile,
    experienceText,
    projectsText,
    educationText,
    certificationText,
    achievementText,
    languageText,
  ])

  const sectionStatus = {
    personal:
      isFilled(profile.name) &&
      isFilled(profile.role) &&
      isFilled(profile.email) &&
      isFilled(profile.phone),
    summary: isFilled(profile.summary),
    skills: isFilled(profile.technicalSkills),
    education: profile.educations.some(
      (edu) => isFilled(edu.degree) && isFilled(edu.college)
    ),
    projects: profile.projects.some(
      (project) => isFilled(project.name) && isFilled(project.description)
    ),
    experience: profile.experiences.some((exp) => isFilled(exp.description)),
    certifications: profile.certifications.length > 0,
    achievements: profile.achievements.length > 0,
    languages: profile.languages.some((lang) => isFilled(lang.name)),
    preferences:
      isFilled(profile.resumeStyle) && isFilled(profile.preferredLocation),
  }

  const completedSections = Object.values(sectionStatus).filter(Boolean).length
  const totalSections = Object.keys(sectionStatus).length
  const profileScore = Math.round((completedSections / totalSections) * 100)

  const getMainProject = () => {
    return profile.projects.find((project) => project.name) || emptyProject
  }

  const calculateMatch = (job) => {
    const skills = profile.technicalSkills
      .toLowerCase()
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)

    const text = `${job.title || ""} ${job.description || ""}`.toLowerCase()
    let score = 40

    skills.forEach((skill) => {
      if (text.includes(skill)) score += 9
    })

    if (text.includes("react")) score += 6
    if (text.includes("javascript")) score += 6
    if (text.includes("frontend") || text.includes("front-end")) score += 6
    if (text.includes("html")) score += 3
    if (text.includes("css")) score += 3
    if (text.includes("api")) score += 3

    if (search.experience === "Fresher") {
      if (text.includes("senior")) score -= 18
      if (text.includes("5 years")) score -= 18
      if (text.includes("3 to 6 years")) score -= 12
    }

    score += getSalaryScore(job)

    if (score > 98) score = 98
    if (score < 35) score = 35

    return score
  }

  const rankedJobs = jobs
    .map((job) => ({ ...job, matchScore: calculateMatch(job) }))
    .sort((a, b) => b.matchScore - a.matchScore)

  const findJobs = async () => {
    setLoadingJobs(true)
    setJobError("")
    setJobs([])

    try {
      const role = encodeURIComponent(search.role)
      const location = encodeURIComponent(search.location)
      const res = await fetch(`${API_URL}/jobs?role=${role}&location=${location}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to load jobs")

      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Job loading error:", error)
      setJobError("Could not load jobs. Make sure backend is running.")
    }

    setLoadingJobs(false)
  }

  const buildApplicationPack = (job) => {
    const mainProject = getMainProject()

    const coverLetter = `Dear Hiring Manager,

I am excited to apply for the ${job.title} role at ${job.company}. My background in ${profile.technicalSkills} and my hands-on project work make me confident that I can contribute to this role.

One of my key projects is ${mainProject.name}, where I worked on ${mainProject.description}

I am interested in this opportunity because it matches my goal of growing as a ${profile.role}. My salary preference is ${getSalaryRangeText(search.salaryRange)}, but I am open to discussing compensation based on the role and growth opportunity.

Thank you for reviewing my application. I would be happy to discuss how my skills and projects match this position.

Best regards,
${profile.name}
${profile.email}
${profile.phone}
${profile.portfolio}`

    const resumeTips = `Resume improvements for this job:

1. Keep your target role close to "${job.title}".
2. Highlight these skills clearly: ${profile.technicalSkills}.
3. Add strong project points from: ${mainProject.name}.
4. Use keywords from the job description.
5. Add action words like Built, Developed, Integrated, Improved.
6. Keep resume clean and one page if applying as fresher.
7. Add portfolio/GitHub link near contact details.
8. Salary preference selected: ${search.salaryRange}.`

    return { coverLetter, resumeTips }
  }

  const buildEmailDraft = (job) => {
    const mainProject = getMainProject()

    return {
      subject: `Application for ${job.title} - ${profile.name}`,
      body: `Dear Hiring Manager,

I hope you are doing well.

I am writing to apply for the ${job.title} position at ${job.company}. I have experience working with ${profile.technicalSkills}, and I am interested in this opportunity because it matches my goal of growing as a ${profile.role}.

One of my key projects is ${mainProject.name}, where I gained practical experience in frontend development, backend integration, API usage, and deployment.

My salary preference is ${getSalaryRangeText(search.salaryRange)}, and I am open to discussing compensation based on the role, responsibilities, and growth opportunity.

Portfolio/GitHub: ${profile.portfolio}

Thank you for your time and consideration. I would be happy to discuss how my skills and projects match this opportunity.

Best regards,
${profile.name}
${profile.email}
${profile.phone}`,
    }
  }

  const applyWithAI = (job) => {
    const cleanJob = {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || "Salary not listed",
      category: job.category || "Real Job",
      url: job.url,
      description: job.description,
      match: `${job.matchScore}%`,
      status: "Ready",
      date: new Date().toLocaleDateString(),
      note: `Salary preference: ${search.salaryRange}`,
    }

    setSelectedJob(cleanJob)
    setApplicationPack(buildApplicationPack(cleanJob))
    setEmailDraft(buildEmailDraft(cleanJob))
    setRecipientEmail("")
    setEmailStatus("")

    setSavedApplications((prev) => {
      const exists = prev.some(
        (item) =>
          item.title === cleanJob.title &&
          item.company === cleanJob.company &&
          item.location === cleanJob.location
      )

      if (exists) return prev
      return [...prev, cleanJob]
    })

    setTimeout(() => scrollToSection("workspace"), 200)
  }

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text || "")
    setCopied(key)
    setTimeout(() => setCopied(""), 1500)
  }

  const exportMessageAsPdf = (text) => {
    const html = getProfessionalDocumentHtml(
      text,
      profile,
      selectedResumeTemplate
    )
    const printWindow = window.open("", "_blank")

    if (!printWindow) {
      alert("Popup blocked. Please allow popups and try again.")
      return
    }

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.focus()
      printWindow.print()
    }
  }

  const exportMessageAsDoc = (text) => {
    const html = getProfessionalDocumentHtml(
      text,
      profile,
      selectedResumeTemplate
    )
    const title = cleanFileName(getDocumentTitle(text, profile))

    const blob = new Blob([html], {
      type: "application/msword;charset=utf-8",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `${title}.doc`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  const getLatestAiMessage = () => {
    return [...aiMessages].reverse().find((msg) => msg.role === "ai" && msg.text)
  }

  const typeAiResponse = (reply) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)

    let index = 0
    const finalReply = String(reply || "")

    setAiMessages((prev) => [...prev, { role: "ai", text: "" }])

    typingIntervalRef.current = setInterval(() => {
      index += 4

      setAiMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "ai",
          text: finalReply.slice(0, index),
        }
        return updated
      })

      aiChatRef.current?.scrollTo({
        top: aiChatRef.current.scrollHeight,
        behavior: "smooth",
      })

      if (index >= finalReply.length) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
    }, 15)
  }

  const askAgent = async (messageText) => {
    const cleanMessage = messageText.trim()
    if (!cleanMessage) return

    setAiMessages((prev) => [...prev, { role: "user", text: cleanMessage }])
    setAiInput("")
    setAiLoading(true)

    setTimeout(() => {
      aiChatRef.current?.scrollTo({
        top: aiChatRef.current.scrollHeight,
        behavior: "smooth",
      })
    }, 50)

    try {
      const res = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: cleanMessage,
          profile: profileForAI,
          selectedJob,
          savedApplications,
          searchPreferences: {
            role: search.role,
            location: search.location,
            experience: search.experience,
            salaryRange: search.salaryRange,
            salaryPreference: getSalaryRangeText(search.salaryRange),
          },
        }),
      })

      const text = await res.text()
      let data

      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(
          `Backend returned non-JSON response. API URL used: ${API_URL}`
        )
      }

      if (!res.ok || !data.success) {
        throw new Error(data.reply || data.error || "AI agent failed")
      }

      setAiLoading(false)
      typeAiResponse(data.reply)
    } catch (error) {
      console.error("AI agent frontend error:", error)
      setAiLoading(false)
      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Sorry, AI failed: ${error.message}`,
        },
      ])
    } finally {
      setTimeout(() => aiInputRef.current?.focus(), 100)
    }
  }

  const quickAskAgent = (prompt) => {
    askAgent(prompt)
    setTimeout(() => scrollToSection("ai-agent"), 100)
  }

  const useLastAiAsEmail = () => {
    const lastAi = getLatestAiMessage()

    if (!lastAi) {
      setEmailStatus("No AI response found yet.")
      return
    }

    if (!selectedJob) {
      setEmailStatus("Please select a job first.")
      return
    }

    setEmailDraft({
      subject: `Application for ${selectedJob.title} - ${profile.name}`,
      body: lastAi.text,
    })

    setEmailStatus("AI response copied into email draft ✅")
    scrollToSection("workspace")
  }

  const openInGmail = () => {
    if (!selectedJob || !emailDraft) {
      setEmailStatus("Please select a job first.")
      return
    }

    if (!recipientEmail.trim()) {
      setEmailStatus("Please enter recipient email.")
      return
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientEmail.trim()
    )}&su=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(
      emailDraft.body
    )}`

    window.open(gmailUrl, "_blank")
    setEmailStatus("Gmail opened ✅ Review and click Send in Gmail.")

    setSavedApplications((prev) =>
      prev.map((job) =>
        selectedJob &&
        job.title === selectedJob.title &&
        job.company === selectedJob.company &&
        job.location === selectedJob.location
          ? {
              ...job,
              note: `Opened Gmail draft for ${recipientEmail}. Salary preference: ${search.salaryRange}`,
            }
          : job
      )
    )
  }

  const updateApplicationStatus = (index, status) => {
    setSavedApplications((prev) =>
      prev.map((job, i) => (i === index ? { ...job, status } : job))
    )
  }

  const removeApplication = (index) => {
    setSavedApplications((prev) => prev.filter((_, i) => i !== index))
  }

  const exportTrackerCSV = () => {
    if (savedApplications.length === 0) {
      alert("No applications to export.")
      return
    }

    const headers = [
      "Role",
      "Company",
      "Location",
      "Match",
      "Status",
      "Date",
      "Note",
      "Job Link",
    ]

    const rows = savedApplications.map((job) => [
      job.title,
      job.company,
      job.location,
      job.match,
      job.status,
      job.date,
      job.note || "",
      job.url || "",
    ])

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "jobpilot_applications.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  const clearTracker = () => {
    if (savedApplications.length === 0) {
      alert("Tracker is already empty.")
      return
    }

    if (!window.confirm("Are you sure you want to clear all saved applications?")) {
      return
    }

    setSavedApplications([])
    localStorage.removeItem("jobpilot_saved_applications")
  }

  const clearAiChat = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
      typingIntervalRef.current = null
    }

    setAiMessages([
      {
        role: "ai",
        text: "Chat cleared ✅ Ask me anything about resumes, skills, interviews, jobs, or applications.",
      },
    ])

    setTimeout(() => {
      aiChatRef.current?.scrollTo({
        top: aiChatRef.current.scrollHeight,
        behavior: "smooth",
      })
    }, 100)
  }

  const latestAi = getLatestAiMessage()
  const accordionProps = {
    openProfileSection,
    setOpenProfileSection,
    sectionStatus,
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <nav className="sticky top-0 z-50 bg-[#050816]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            onClick={() => scrollToSection("home")}
            className="text-3xl font-bold text-blue-400 cursor-pointer"
          >
            JobPilot 🚀
          </h1>

          <div className="hidden md:flex gap-6 text-gray-300">
            <button onClick={() => scrollToSection("jobs")} className="hover:text-white">
              Jobs
            </button>
            <button onClick={() => scrollToSection("ai-agent")} className="hover:text-white">
              AI
            </button>
            <button onClick={() => scrollToSection("workspace")} className="hover:text-white">
              Apply
            </button>
            <button onClick={() => scrollToSection("tracker")} className="hover:text-white">
              Tracker
            </button>
            <button onClick={() => scrollToSection("profile")} className="hover:text-white">
              Profile
            </button>
          </div>
        </div>
      </nav>

      <section id="home" className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-blue-400 font-semibold mb-3">
              AI Job Applying Assistant
            </p>

            <h2 className="text-5xl font-bold leading-tight mb-5">
              Build your profile. Ask AI. Apply smarter.
            </h2>

            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              JobPilot helps candidates create resume details, search jobs,
              generate professional resumes, improve skills, prepare for interviews,
              and open Gmail-ready job emails.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => scrollToSection("profile")}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-2xl font-semibold"
              >
                Fill Resume Details
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("ai-agent")}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-2xl font-semibold"
              >
                Ask JobPilot AI
              </button>

              <button
                type="button"
                onClick={() => scrollToSection("jobs")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-semibold"
              >
                Find Real Jobs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Profile Score" value={`${profileScore}%`} />
            <StatCard title="Jobs Found" value={jobs.length} />
            <StatCard title="Projects" value={profile.projects.length} />
            <StatCard title="Saved" value={savedApplications.length} />
          </div>
        </div>
      </section>

      <section id="ai-agent" className="max-w-7xl mx-auto px-6 py-10">
        <SectionHeader
          label="JobPilot AI Agent"
          title="Ask AI Anything"
          description="Generate resumes, improve skills, prepare for interviews, create job emails, and get personal career guidance."
        />

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 h-fit">
            <h3 className="text-2xl font-bold mb-4">Quick AI Actions</h3>

            <div className="space-y-3">
              <ActionButton
                color="purple"
                onClick={() =>
                  quickAskAgent(
                    "Generate a complete professional ATS-friendly resume using my candidate profile details. Format it cleanly with these sections: Contact Information, Professional Summary, Technical Skills, Tools, Education, Projects, Experience, Certifications, Achievements, Languages. Make it polished, truthful, and ready to export as PDF or Word. Do not add fake details. If important details are missing, write 'Not provided' instead of inventing."
                  )
                }
              >
                Generate Full Resume
              </ActionButton>

              <ActionButton
                color="gray"
                onClick={() =>
                  quickAskAgent(
                    "Check my candidate profile and tell me what resume details are missing or weak. Give exact improvements."
                  )
                }
              >
                Check Missing Details
              </ActionButton>

              <ActionButton
                color="blue"
                onClick={() =>
                  quickAskAgent(
                    "Create a personalized 30-day skill improvement roadmap for my target role based on my current skills, education, projects, and salary preference."
                  )
                }
              >
                Improve My Skills
              </ActionButton>

              <ActionButton
                color="green"
                onClick={() =>
                  quickAskAgent(
                    "Prepare me for interviews for my target role. Give common questions, strong sample answers, and practice advice based on my skills and projects."
                  )
                }
              >
                Interview Prep
              </ActionButton>

              <ActionButton
                color="pink"
                onClick={() =>
                  quickAskAgent(
                    "Generate a short professional application email for the selected job using my full candidate profile and salary preference. Make it human, clean, and not repetitive."
                  )
                }
              >
                Generate Email for Job
              </ActionButton>

              <ActionButton color="red" onClick={clearAiChat}>
                Clear AI Chat
              </ActionButton>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <TemplateSelector
              selectedResumeTemplate={selectedResumeTemplate}
              setSelectedResumeTemplate={setSelectedResumeTemplate}
            />

            {latestAi && (
              <div className="mb-4 bg-gradient-to-r from-purple-600/25 to-blue-600/25 border border-purple-400/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-purple-200 font-semibold">
                    Latest professional document is ready
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Copy it, export as PDF, or download as Word/DOC.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(latestAi.text, "latest-doc")}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    {copied === "latest-doc" ? "Copied ✅" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => exportMessageAsPdf(latestAi.text)}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Export PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => exportMessageAsDoc(latestAi.text)}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm font-semibold"
                  >
                    Export DOC
                  </button>
                </div>
              </div>
            )}

            <div
              ref={aiChatRef}
              className="h-[500px] overflow-y-auto space-y-4 pr-2 mb-4 scroll-smooth"
            >
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-2xl overflow-hidden leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600/20 border border-blue-400/20 ml-8"
                      : "bg-black/30 border border-white/10 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      {msg.role === "user" ? "You" : "JobPilot AI"}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, `chat-${index}`)}
                        className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        {copied === `chat-${index}` ? "Copied ✅" : "Copy"}
                      </button>

                      {msg.role === "ai" && (
                        <>
                          <button
                            type="button"
                            onClick={() => exportMessageAsPdf(msg.text)}
                            className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            PDF
                          </button>

                          <button
                            type="button"
                            onClick={() => exportMessageAsDoc(msg.text)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          >
                            DOC
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-5 text-gray-100">
                    <MessageContent text={msg.text} />
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mr-8">
                  <p className="text-gray-300">JobPilot AI is thinking...</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <textarea
                ref={aiInputRef}
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    askAgent(aiInput)
                  }
                }}
                placeholder="Ask JobPilot AI..."
                rows="3"
                className="bg-black/30 border border-white/10 rounded-2xl p-4 outline-none resize-none focus:border-purple-400 transition"
              />

              <button
                type="button"
                onClick={() => askAgent(aiInput)}
                disabled={aiLoading}
                className="bg-purple-600 hover:bg-purple-700 px-8 rounded-2xl font-semibold disabled:opacity-50"
              >
                {aiLoading ? "Thinking..." : "Ask AI"}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  const lastAi = getLatestAiMessage()
                  if (lastAi) copyToClipboard(lastAi.text, "ai")
                }}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
              >
                {copied === "ai" ? "Copied AI Response ✅" : "Copy Last AI Response"}
              </button>

              <button
                type="button"
                onClick={useLastAiAsEmail}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm"
              >
                Use Last AI Response as Email
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="jobs" className="max-w-7xl mx-auto px-6 py-10">
        <SectionHeader
          label="Step 1"
          title="Find Real Jobs"
          description="Search real jobs from your backend connected to Adzuna."
        />

        <div className="grid lg:grid-cols-5 gap-4 mb-6">
          <SearchBox label="Role">
            <input
              value={search.role}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, role: e.target.value }))
              }
              className={inputClass}
            />
          </SearchBox>

          <SearchBox label="Location">
            <input
              value={search.location}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, location: e.target.value }))
              }
              className={inputClass}
            />
          </SearchBox>

          <SearchBox label="Experience">
            <select
              value={search.experience}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, experience: e.target.value }))
              }
              className={inputClass}
            >
              <option>Fresher</option>
              <option>Internship</option>
              <option>0-1 Year</option>
              <option>1-2 Years</option>
              <option>2+ Years</option>
            </select>
          </SearchBox>

          <SearchBox label="Salary / CTC">
            <select
              value={search.salaryRange}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, salaryRange: e.target.value }))
              }
              className={inputClass}
            >
              {salaryRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </SearchBox>

          <button
            type="button"
            onClick={findJobs}
            disabled={loadingJobs}
            className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold disabled:opacity-50"
          >
            {loadingJobs ? "Searching..." : "Find Jobs"}
          </button>
        </div>

        {jobError && (
          <div className="bg-red-500/20 border border-red-400/20 text-red-200 rounded-2xl p-4 mb-6">
            {jobError}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rankedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white/5 border border-white/10 rounded-3xl p-5 hover:border-blue-500 transition"
            >
              <div className="flex justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <p className="text-gray-400 mt-1">{job.company}</p>
                </div>

                <span className="h-fit bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                  {job.matchScore}%
                </span>
              </div>

              <div className="space-y-2 text-gray-400 text-sm mb-4">
                <p>📍 {job.location}</p>
                <p>💰 {job.salary}</p>
                <p>🎚️ Preference: {search.salaryRange}</p>
                <p>🏷️ {job.category}</p>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed h-24 overflow-hidden mb-4">
                {job.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => window.open(job.url, "_blank")}
                  className="bg-white/10 hover:bg-white/20 py-3 rounded-xl"
                >
                  Open
                </button>

                <button
                  type="button"
                  onClick={() => applyWithAI(job)}
                  className="bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold"
                >
                  Apply AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="workspace" className="max-w-7xl mx-auto px-6 py-10">
        <SectionHeader
          label="Step 2"
          title="Application Workspace"
          description="Review selected job, copy materials, or open Gmail with a ready email."
        />

        {!selectedJob ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            Select a job using Apply AI.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 h-fit">
              <p className="text-blue-400 font-semibold mb-2">Selected Job</p>
              <h3 className="text-2xl font-bold mb-2">{selectedJob.title}</h3>
              <p className="text-gray-300 text-lg mb-4">{selectedJob.company}</p>

              <div className="space-y-2 text-gray-400">
                <p>📍 {selectedJob.location}</p>
                <p>💰 {selectedJob.salary}</p>
                <p>🎚️ Salary Preference: {search.salaryRange}</p>
                <p>🎯 {selectedJob.match} Match</p>
                <p>📌 Status: {selectedJob.status}</p>
              </div>

              <button
                type="button"
                onClick={() => window.open(selectedJob.url, "_blank")}
                className="w-full mt-5 bg-white/10 hover:bg-white/20 py-3 rounded-xl"
              >
                Open Job Page
              </button>
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <h3 className="text-2xl font-bold mb-4">Email Draft</h3>

                <label className="text-gray-400 text-sm">Recipient Email</label>
                <input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className={inputClass}
                />

                <label className="text-gray-400 text-sm mt-4 block">Subject</label>
                <input
                  value={emailDraft?.subject || ""}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className={inputClass}
                />

                <label className="text-gray-400 text-sm mt-4 block">Body</label>
                <textarea
                  value={emailDraft?.body || ""}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({ ...prev, body: e.target.value }))
                  }
                  rows="10"
                  className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-4 outline-none leading-relaxed focus:border-blue-400 transition"
                />

                <div className="grid md:grid-cols-3 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={openInGmail}
                    className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold"
                  >
                    Open in Gmail
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob((prev) => ({ ...prev, status: "Applied" }))
                      setSavedApplications((prev) =>
                        prev.map((job) =>
                          job.title === selectedJob.title &&
                          job.company === selectedJob.company &&
                          job.location === selectedJob.location
                            ? { ...job, status: "Applied" }
                            : job
                        )
                      )
                    }}
                    className="bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold"
                  >
                    Mark Applied
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedJob(null)
                      setApplicationPack(null)
                      setEmailDraft(null)
                      setRecipientEmail("")
                      setEmailStatus("")
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 py-3 rounded-xl font-semibold"
                  >
                    Clear
                  </button>
                </div>

                {emailStatus && (
                  <div className="mt-4 bg-white/10 border border-white/10 rounded-xl p-4">
                    {emailStatus}
                  </div>
                )}
              </div>

              {applicationPack && (
                <div className="grid md:grid-cols-2 gap-5">
                  <MiniCopyCard
                    title="Cover Letter"
                    text={applicationPack.coverLetter}
                    copied={copied}
                    copyKey="cover"
                    onCopy={copyToClipboard}
                  />

                  <MiniCopyCard
                    title="Resume Tips"
                    text={applicationPack.resumeTips}
                    copied={copied}
                    copyKey="tips"
                    onCopy={copyToClipboard}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section id="tracker" className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <SectionHeader
            label="Step 3"
            title="Application Tracker"
            description="Track jobs you prepared, emailed, or applied for."
            compact
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={exportTrackerCSV}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-semibold"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={clearTracker}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 px-5 py-3 rounded-2xl font-semibold text-red-200"
            >
              Clear Tracker
            </button>
          </div>
        </div>

        {savedApplications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center text-gray-400">
            No applications yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedApplications.map((job, index) => (
              <div
                key={`${job.title}-${job.company}-${job.location}-${index}`}
                className="bg-white/5 border border-white/10 rounded-3xl p-5"
              >
                <h3 className="text-xl font-bold">{job.title}</h3>
                <p className="text-gray-400 mt-1">{job.company}</p>

                <div className="space-y-2 text-gray-400 mt-4">
                  <p>📍 {job.location}</p>
                  <p>🎯 {job.match} Match</p>
                  <p>📅 {job.date}</p>
                  {job.note && <p>📝 {job.note}</p>}
                </div>

                <select
                  value={job.status}
                  onChange={(e) => updateApplicationStatus(index, e.target.value)}
                  className={inputClass}
                >
                  <option>Ready</option>
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Rejected</option>
                  <option>Selected</option>
                </select>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      const pack = buildApplicationPack(job)
                      setSelectedJob(job)
                      setApplicationPack(pack)
                      setEmailDraft(buildEmailDraft(job))
                      setRecipientEmail("")
                      setEmailStatus("")
                      scrollToSection("workspace")
                    }}
                    className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl"
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(job.url, "_blank")}
                    className="bg-white/10 hover:bg-white/20 py-3 rounded-xl"
                  >
                    Job
                  </button>

                  <button
                    type="button"
                    onClick={() => removeApplication(index)}
                    className="bg-red-500/20 hover:bg-red-500/30 py-3 rounded-xl"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="profile" className="max-w-7xl mx-auto px-6 py-10 pb-20">
        <SectionHeader
          label="Candidate Resume Details"
          title="Complete Your Profile"
          description="Open one section at a time, add multiple projects or experiences, and let AI generate professional results."
        />

        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-6">
          <div className="grid md:grid-cols-4 gap-4 items-center">
            <div>
              <p className="text-gray-400 text-sm">Profile Score</p>
              <h3 className="text-4xl font-bold mt-1">{profileScore}%</h3>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Completed Sections</p>
              <h3 className="text-3xl font-bold mt-1">
                {completedSections}/{totalSections}
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                quickAskAgent(
                  "Check my candidate profile and tell me what resume details are missing or weak. Give exact improvements."
                )
              }
              className="bg-white/10 hover:bg-white/20 py-3 rounded-2xl font-semibold"
            >
              Check Missing Details
            </button>

            <button
              type="button"
              onClick={() =>
                quickAskAgent(
                  "Generate a complete professional ATS-friendly resume using my candidate profile details. Format it cleanly with these sections: Contact Information, Professional Summary, Technical Skills, Tools, Education, Projects, Experience, Certifications, Achievements, Languages. Make it polished, truthful, and ready to export as PDF or Word. Do not add fake details. If important details are missing, write 'Not provided' instead of inventing."
                )
              }
              className="bg-purple-600 hover:bg-purple-700 py-3 rounded-2xl font-semibold"
            >
              Generate Resume with AI
            </button>
          </div>

          <div className="w-full bg-black/30 rounded-full h-3 mt-5 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${profileScore}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-4 h-fit sticky top-24">
            <h3 className="text-lg font-bold mb-3">Sections</h3>

            <div className="space-y-2">
              {[
                ["personal", "Personal"],
                ["summary", "Summary"],
                ["skills", "Skills"],
                ["education", "Education"],
                ["projects", "Projects"],
                ["experience", "Experience"],
                ["certifications", "Certifications"],
                ["achievements", "Achievements"],
                ["languages", "Languages"],
                ["preferences", "Preferences"],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setOpenProfileSection(id)}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-left transition ${
                    openProfileSection === id
                      ? "bg-blue-600 text-white"
                      : "bg-black/20 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  <span>{label}</span>
                  <span>{sectionStatus[id] ? "✅" : "○"}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AccordionCard
              id="personal"
              title="Personal Details"
              description="Basic identity and contact details."
              {...accordionProps}
            >
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  ["name", "Full Name"],
                  ["role", "Target Role"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["location", "Location"],
                  ["linkedin", "LinkedIn"],
                  ["github", "GitHub"],
                  ["portfolio", "Portfolio"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-gray-400 text-sm">{label}</label>
                    <input
                      value={profile[field]}
                      onChange={(e) => updateProfile(field, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </AccordionCard>

            <AccordionCard
              id="summary"
              title="Professional Summary"
              description="Short summary about the candidate."
              {...accordionProps}
            >
              <textarea
                value={profile.summary}
                onChange={(e) => updateProfile("summary", e.target.value)}
                rows="5"
                className={textareaClass}
              />
            </AccordionCard>

            <AccordionCard
              id="skills"
              title="Skills"
              description="Technical skills, soft skills, and tools."
              {...accordionProps}
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Technical Skills</label>
                  <textarea
                    value={profile.technicalSkills}
                    onChange={(e) =>
                      updateProfile("technicalSkills", e.target.value)
                    }
                    rows="5"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Soft Skills</label>
                  <textarea
                    value={profile.softSkills}
                    onChange={(e) => updateProfile("softSkills", e.target.value)}
                    rows="5"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Tools</label>
                  <textarea
                    value={profile.tools}
                    onChange={(e) => updateProfile("tools", e.target.value)}
                    rows="5"
                    className={textareaClass}
                  />
                </div>
              </div>
            </AccordionCard>

            <AccordionCard
              id="education"
              title="Education"
              description="Add one or more education records."
              count={`${profile.educations.length} item(s)`}
              {...accordionProps}
            >
              <ArraySection
                items={profile.educations}
                section="educations"
                emptyItem={emptyEducation}
                fields={[
                  ["degree", "Degree", "input"],
                  ["college", "College / University", "input"],
                  ["branch", "Branch / Course", "input"],
                  ["year", "Year", "input"],
                  ["score", "CGPA / Percentage", "input"],
                ]}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                inputClass={inputClass}
                textareaClass={textareaClass}
                title="Education"
              />
            </AccordionCard>

            <AccordionCard
              id="projects"
              title="Projects"
              description="Add portfolio projects with tech stack and links."
              count={`${profile.projects.length} item(s)`}
              {...accordionProps}
            >
              <ArraySection
                items={profile.projects}
                section="projects"
                emptyItem={emptyProject}
                fields={[
                  ["name", "Project Name", "input"],
                  ["link", "Project Link", "input"],
                  ["tech", "Tech Stack", "textarea"],
                  ["description", "Project Description", "textarea"],
                ]}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                inputClass={inputClass}
                textareaClass={textareaClass}
                title="Project"
              />
            </AccordionCard>

            <AccordionCard
              id="experience"
              title="Experience"
              description="Add internships, jobs, freelance, or practical experience."
              count={`${profile.experiences.length} item(s)`}
              {...accordionProps}
            >
              <div className="space-y-4">
                {profile.experiences.map((exp, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold">
                        Experience {index + 1}
                      </h4>
                      {profile.experiences.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem("experiences", index)}
                          className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-gray-400 text-sm">
                          Experience Type
                        </label>
                        <select
                          value={exp.type}
                          onChange={(e) =>
                            updateArrayItem(
                              "experiences",
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        >
                          <option>Fresher</option>
                          <option>Internship</option>
                          <option>Job</option>
                          <option>Freelance</option>
                        </select>
                      </div>

                      {[
                        ["company", "Company Name"],
                        ["role", "Role"],
                        ["duration", "Duration"],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="text-gray-400 text-sm">{label}</label>
                          <input
                            value={exp[field]}
                            onChange={(e) =>
                              updateArrayItem(
                                "experiences",
                                index,
                                field,
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                      ))}

                      <div className="md:col-span-2">
                        <label className="text-gray-400 text-sm">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "experiences",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows="5"
                          className={textareaClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addArrayItem("experiences", emptyExperience)}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Experience
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="certifications"
              title="Certifications"
              description="Add certifications, course completions, and credentials."
              count={`${profile.certifications.length} item(s)`}
              {...accordionProps}
            >
              <ArraySection
                items={profile.certifications}
                section="certifications"
                emptyItem={emptyCertification}
                fields={[
                  ["name", "Certification Name", "input"],
                  ["issuer", "Issued By", "input"],
                  ["year", "Year", "input"],
                  ["link", "Certificate Link", "input"],
                ]}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                inputClass={inputClass}
                textareaClass={textareaClass}
                title="Certification"
                allowEmptyRemove
              />
            </AccordionCard>

            <AccordionCard
              id="achievements"
              title="Achievements"
              description="Add awards, hackathons, academic or coding achievements."
              count={`${profile.achievements.length} item(s)`}
              {...accordionProps}
            >
              <ArraySection
                items={profile.achievements}
                section="achievements"
                emptyItem={emptyAchievement}
                fields={[
                  ["title", "Title", "input"],
                  ["description", "Description", "textarea"],
                ]}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                inputClass={inputClass}
                textareaClass={textareaClass}
                title="Achievement"
                allowEmptyRemove
              />
            </AccordionCard>

            <AccordionCard
              id="languages"
              title="Languages"
              description="Add languages and proficiency levels."
              count={`${profile.languages.length} item(s)`}
              {...accordionProps}
            >
              <ArraySection
                items={profile.languages}
                section="languages"
                emptyItem={emptyLanguage}
                fields={[
                  ["name", "Language", "input"],
                  ["level", "Level", "input"],
                ]}
                updateArrayItem={updateArrayItem}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                inputClass={inputClass}
                textareaClass={textareaClass}
                title="Language"
              />
            </AccordionCard>

            <AccordionCard
              id="preferences"
              title="Resume Preferences"
              description="Resume style and job preferences."
              {...accordionProps}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Resume Style</label>
                  <select
                    value={profile.resumeStyle}
                    onChange={(e) => updateProfile("resumeStyle", e.target.value)}
                    className={inputClass}
                  >
                    <option>ATS Friendly</option>
                    <option>Fresher Resume</option>
                    <option>Professional Resume</option>
                    <option>Modern Resume</option>
                  </select>
                </div>

                {[
                  ["preferredLocation", "Preferred Job Location"],
                  ["expectedSalary", "Expected Salary"],
                  ["noticePeriod", "Notice Period"],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-gray-400 text-sm">{label}</label>
                    <input
                      value={profile[field]}
                      onChange={(e) => updateProfile(field, e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </AccordionCard>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
      <p className="text-gray-400">{title}</p>
      <h3 className="text-4xl font-bold mt-2">{value}</h3>
    </div>
  )
}

function SectionHeader({ label, title, description, compact = false }) {
  return (
    <div className={compact ? "" : "mb-8"}>
      <p className="text-blue-400 font-semibold mb-2">{label}</p>
      <h2 className="text-4xl font-bold mb-3">{title}</h2>
      <p className="text-gray-400 text-lg">{description}</p>
    </div>
  )
}

function SearchBox({ label, children }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <label className="text-gray-400 text-sm">{label}</label>
      {children}
    </div>
  )
}

function ActionButton({ color, onClick, children }) {
  const colors = {
    purple: "bg-purple-600 hover:bg-purple-700",
    gray: "bg-white/10 hover:bg-white/20",
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
    pink: "bg-pink-600 hover:bg-pink-700",
    red: "bg-red-500/20 hover:bg-red-500/30 text-red-100",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full ${colors[color]} py-3 px-4 rounded-xl text-left font-semibold`}
    >
      {children}
    </button>
  )
}

function MiniCopyCard({ title, text, copied, copyKey, onCopy }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <button
          type="button"
          onClick={() => onCopy(text, copyKey)}
          className="bg-white/10 px-3 py-1 rounded-lg text-sm"
        >
          {copied === copyKey ? "Copied ✅" : "Copy"}
        </button>
      </div>
      <p className="text-gray-300 text-sm whitespace-pre-line max-h-72 overflow-y-auto">
        {text}
      </p>
    </div>
  )
}

export default App