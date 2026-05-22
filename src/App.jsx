import { useEffect, useRef, useState } from "react"

const API_URL =
  import.meta.env.VITE_API_URL || "https://jobpilot-backend-mcv7.onrender.com"

console.log("JOBPILOT API URL:", API_URL)

const emptyProject = { name: "", description: "", tech: "", link: "" }

const emptyEducation = {
  degree: "",
  college: "",
  branch: "",
  year: "",
  score: "",
}

const emptyExperience = {
  type: "Fresher",
  company: "",
  role: "",
  duration: "",
  description: "",
}

const emptyCertification = {
  name: "",
  issuer: "",
  year: "",
  link: "",
}

const emptyAchievement = {
  title: "",
  description: "",
}

const emptyLanguage = {
  name: "",
  level: "",
}

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

  educations: [
    {
      degree: "B.Tech",
      college: "",
      branch: "",
      year: "",
      score: "",
    },
  ],

  projects: [
    {
      name: "JobPilot AI Career Assistant",
      description:
        "Built an AI career assistant web app with real job search, application tracking, AI resume help, and Gmail-based application sending.",
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

function normalizeProfile(savedProfile) {
  const old = savedProfile || {}

  return {
    ...defaultProfile,
    ...old,

    educations:
      Array.isArray(old.educations) && old.educations.length > 0
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
      Array.isArray(old.projects) && old.projects.length > 0
        ? old.projects
        : [
            {
              name: old.project1Name || "JobPilot AI Career Assistant",
              description:
                old.project1Description ||
                "Built an AI career assistant web app with real job search, application tracking, AI resume help, and Gmail-based application sending.",
              tech:
                old.project1Tech ||
                "React, Tailwind CSS, Node.js, Express, Groq AI, Adzuna API",
              link: old.project1Link || old.portfolio || "",
            },
            {
              name: old.project2Name || "Portfolio Website",
              description:
                old.project2Description ||
                "Created a personal portfolio website to showcase skills, projects, and contact details.",
              tech: old.project2Tech || "React, Tailwind CSS",
              link: old.project2Link || "",
            },
          ],

    experiences:
      Array.isArray(old.experiences) && old.experiences.length > 0
        ? old.experiences
        : [
            {
              type: old.experienceType || "Fresher",
              company: old.companyName || "",
              role: old.experienceRole || "",
              duration: old.experienceDuration || "",
              description:
                old.experienceDescription ||
                old.experience ||
                "Built practical projects to improve frontend development, backend integration, API usage, and deployment skills.",
            },
          ],

    certifications:
      Array.isArray(old.certifications) && old.certifications.length > 0
        ? old.certifications
        : [],

    achievements:
      Array.isArray(old.achievements) && old.achievements.length > 0
        ? old.achievements
        : [],

    languages:
      Array.isArray(old.languages) && old.languages.length > 0
        ? old.languages
        : defaultProfile.languages,
  }
}

function App() {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("jobpilot_profile")
    return saved ? normalizeProfile(JSON.parse(saved)) : defaultProfile
  })

  const [search, setSearch] = useState({
    role: "Frontend Developer",
    location: "India",
    experience: "Fresher",
  })

  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobError, setJobError] = useState("")

  const [selectedJob, setSelectedJob] = useState(null)
  const [applicationPack, setApplicationPack] = useState(null)
  const [emailDraft, setEmailDraft] = useState(null)

  const [recipientEmail, setRecipientEmail] = useState("")
  const [emailStatus, setEmailStatus] = useState("")

  const [savedApplications, setSavedApplications] = useState(() => {
    const saved = localStorage.getItem("jobpilot_saved_applications")
    return saved ? JSON.parse(saved) : []
  })

  const [copied, setCopied] = useState("")

  const [aiMessages, setAiMessages] = useState(() => {
    const saved = localStorage.getItem("jobpilot_ai_messages")
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "ai",
            text: "Hi 👋 I am JobPilot AI. Fill your candidate details, then ask me to generate a professional resume, improve your skills, prepare for interviews, or write a job application email.",
          },
        ]
  })

  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [openProfileSection, setOpenProfileSection] = useState("personal")

  const aiChatRef = useRef(null)
  const aiInputRef = useRef(null)
  const profileScrollRef = useRef(0)

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
    if (!aiChatRef.current) return

    aiChatRef.current.scrollTo({
      top: aiChatRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [aiMessages, aiLoading])

  const inputClass =
    "w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 transition"
  const textareaClass =
    "w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none focus:border-blue-400 transition"

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const updateProfile = (field, value) => {
    profileScrollRef.current = window.scrollY

    setProfile((prev) => ({ ...prev, [field]: value }))

    requestAnimationFrame(() => {
      window.scrollTo({
        top: profileScrollRef.current,
        behavior: "auto",
      })
    })
  }

  const updateArrayItem = (section, index, field, value) => {
    profileScrollRef.current = window.scrollY

    setProfile((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))

    requestAnimationFrame(() => {
      window.scrollTo({
        top: profileScrollRef.current,
        behavior: "auto",
      })
    })
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

  const projectsText = profile.projects
    .filter((project) => project.name || project.description)
    .map(
      (project, index) =>
        `Project ${index + 1}: ${project.name}
Description: ${project.description}
Tech Stack: ${project.tech}
Link: ${project.link}`
    )
    .join("\n\n")

  const educationText = profile.educations
    .filter((edu) => edu.degree || edu.college)
    .map(
      (edu, index) =>
        `Education ${index + 1}: ${edu.degree}, ${edu.branch}, ${edu.college}, ${edu.year}, ${edu.score}`
    )
    .join("\n")

  const experienceText = profile.experiences
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

  const certificationText = profile.certifications
    .filter((cert) => cert.name)
    .map(
      (cert, index) =>
        `Certification ${index + 1}: ${cert.name}, ${cert.issuer}, ${cert.year}, ${cert.link}`
    )
    .join("\n")

  const achievementText = profile.achievements
    .filter((ach) => ach.title || ach.description)
    .map(
      (ach, index) =>
        `Achievement ${index + 1}: ${ach.title} - ${ach.description}`
    )
    .join("\n")

  const languageText = profile.languages
    .filter((lang) => lang.name)
    .map((lang) => `${lang.name}${lang.level ? ` - ${lang.level}` : ""}`)
    .join(", ")

  const profileForAI = {
    ...profile,
    skills: profile.technicalSkills,
    experience: experienceText,
    projects: projectsText,
    education: educationText,
    certificationsText: certificationText,
    achievementsText: achievementText,
    languagesText: languageText,
  }

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

      const res = await fetch(
        `${API_URL}/jobs?role=${role}&location=${location}`
      )

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to load jobs")

      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Job loading error:", error)
      setJobError("Could not load jobs. Make sure backend is running.")
    }

    setLoadingJobs(false)
  }

  const getMainProject = () => {
    return profile.projects.find((project) => project.name) || emptyProject
  }

  const buildApplicationPack = (job) => {
    const mainProject = getMainProject()

    const coverLetter = `Dear Hiring Manager,

I am excited to apply for the ${job.title} role at ${job.company}. My background in ${profile.technicalSkills} and my hands-on project work make me confident that I can contribute to this role.

One of my key projects is ${mainProject.name}, where I worked on ${mainProject.description}

I am interested in this opportunity because it matches my goal of growing as a ${profile.role}. I am motivated, quick to learn, and ready to contribute with strong effort and practical skills.

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
7. Add portfolio/GitHub link near contact details.`

    return {
      coverLetter,
      resumeTips,
    }
  }

  const buildEmailDraft = (job) => {
    const mainProject = getMainProject()

    return {
      subject: `Application for ${job.title} - ${profile.name}`,
      body: `Dear Hiring Manager,

I hope you are doing well.

I am writing to apply for the ${job.title} position at ${job.company}. I have experience working with ${profile.technicalSkills}, and I am interested in this opportunity because it matches my goal of growing as a ${profile.role}.

One of my key projects is ${mainProject.name}, where I gained practical experience in frontend development, backend integration, API usage, and deployment.

I am a quick learner, motivated to improve, and excited to contribute to your team.

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
      note: "",
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          profile: profileForAI,
          selectedJob,
          savedApplications,
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

      setAiMessages((prev) => [...prev, { role: "ai", text: data.reply }])

      setTimeout(() => {
        aiChatRef.current?.scrollTo({
          top: aiChatRef.current.scrollHeight,
          behavior: "smooth",
        })
      }, 100)
    } catch (error) {
      console.error("AI agent frontend error:", error)

      setAiMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: `Sorry, AI failed: ${error.message}`,
        },
      ])
    } finally {
      setAiLoading(false)

      setTimeout(() => {
        aiInputRef.current?.focus()
      }, 100)
    }
  }

  const quickAskAgent = (prompt) => {
    askAgent(prompt)
    setTimeout(() => scrollToSection("ai-agent"), 100)
  }

  const useLastAiAsEmail = () => {
    const lastAi = [...aiMessages].reverse().find((msg) => msg.role === "ai")

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
              note: `Opened Gmail draft for ${recipientEmail}`,
            }
          : job
      )
    )
  }

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(""), 1500)
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

  const AccordionCard = ({ id, title, description, count, children }) => {
    const isOpen = openProfileSection === id
    const done = sectionStatus[id]

    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <button
          onClick={() => setOpenProfileSection(isOpen ? "" : id)}
          className="w-full p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left hover:bg-white/5 transition"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isOpen ? "▾" : "▸"}</span>
              <h3 className="text-2xl font-bold">{title}</h3>
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
            <p className="text-gray-400 mt-2">{description}</p>
          </div>

          {count !== undefined && (
            <div className="bg-black/30 border border-white/10 rounded-2xl px-4 py-2 text-sm text-gray-300">
              {count}
            </div>
          )}
        </button>

        {isOpen && <div className="px-6 pb-6">{children}</div>}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <nav className="sticky top-0 z-50 bg-[#050816]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <h1
            onClick={() => scrollToSection("home")}
            className="text-3xl font-bold text-blue-400 cursor-pointer"
          >
            JobPilot 🚀
          </h1>

          <div className="hidden md:flex gap-6 text-gray-300">
            <button
              onClick={() => scrollToSection("jobs")}
              className="hover:text-white"
            >
              Jobs
            </button>
            <button
              onClick={() => scrollToSection("ai-agent")}
              className="hover:text-white"
            >
              AI
            </button>
            <button
              onClick={() => scrollToSection("workspace")}
              className="hover:text-white"
            >
              Apply
            </button>
            <button
              onClick={() => scrollToSection("tracker")}
              className="hover:text-white"
            >
              Tracker
            </button>
            <button
              onClick={() => scrollToSection("profile")}
              className="hover:text-white"
            >
              Profile
            </button>
          </div>
        </div>
      </nav>

      <section id="home" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-blue-400 font-semibold mb-4">
              AI Job Applying Assistant
            </p>

            <h2 className="text-6xl font-bold leading-tight mb-6">
              Build your profile. Ask AI. Apply smarter.
            </h2>

            <p className="text-gray-400 text-xl leading-relaxed mb-8">
              JobPilot helps candidates create resume details, search jobs,
              generate professional resumes, improve skills, prepare for
              interviews, and open Gmail-ready job emails.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollToSection("profile")}
                className="bg-green-600 hover:bg-green-700 px-7 py-4 rounded-2xl font-semibold"
              >
                Fill Resume Details
              </button>

              <button
                onClick={() => scrollToSection("ai-agent")}
                className="bg-purple-600 hover:bg-purple-700 px-7 py-4 rounded-2xl font-semibold"
              >
                Ask JobPilot AI
              </button>

              <button
                onClick={() => scrollToSection("jobs")}
                className="bg-blue-600 hover:bg-blue-700 px-7 py-4 rounded-2xl font-semibold"
              >
                Find Real Jobs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Profile Score</p>
              <h3 className="text-5xl font-bold mt-3">{profileScore}%</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Jobs Found</p>
              <h3 className="text-5xl font-bold mt-3">{jobs.length}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Projects</p>
              <h3 className="text-5xl font-bold mt-3">
                {profile.projects.length}
              </h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Saved</p>
              <h3 className="text-5xl font-bold mt-3">
                {savedApplications.length}
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section id="ai-agent" className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-purple-400 font-semibold mb-3">
            JobPilot AI Agent
          </p>
          <h2 className="text-5xl font-bold mb-4">Ask AI Anything</h2>
          <p className="text-gray-400 text-lg">
            Generate resumes, improve skills, prepare for interviews, create job
            emails, and get personal career guidance using your candidate
            details.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
            <h3 className="text-2xl font-bold mb-5">Quick AI Actions</h3>

            <div className="space-y-3">
              <button
                onClick={() =>
                  quickAskAgent(
                    "Generate my professional ATS-friendly resume using all my candidate profile details. Make it clean, truthful, strong, and suitable for my target role. Include summary, skills, education, projects, experience, certifications, achievements, and languages if available."
                  )
                }
                className="w-full bg-purple-600 hover:bg-purple-700 py-3 px-4 rounded-xl text-left font-semibold"
              >
                Generate Full Resume
              </button>

              <button
                onClick={() =>
                  quickAskAgent(
                    "Check my candidate profile and tell me what resume details are missing or weak. Give exact improvements."
                  )
                }
                className="w-full bg-white/10 hover:bg-white/20 py-3 px-4 rounded-xl text-left font-semibold"
              >
                Check Missing Details
              </button>

              <button
                onClick={() =>
                  quickAskAgent(
                    "Create a personalized 30-day skill improvement roadmap for my target role based on my current skills, education, and projects."
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 px-4 rounded-xl text-left font-semibold"
              >
                Improve My Skills
              </button>

              <button
                onClick={() =>
                  quickAskAgent(
                    "Prepare me for interviews for my target role. Give common questions, strong sample answers, and practice advice based on my skills and projects."
                  )
                }
                className="w-full bg-green-600 hover:bg-green-700 py-3 px-4 rounded-xl text-left font-semibold"
              >
                Interview Prep
              </button>

              <button
                onClick={() =>
                  quickAskAgent(
                    "Generate a short professional application email for the selected job using my full candidate profile. Make it human, clean, and not repetitive."
                  )
                }
                className="w-full bg-pink-600 hover:bg-pink-700 py-3 px-4 rounded-xl text-left font-semibold"
              >
                Generate Email for Job
              </button>

              <button
                onClick={clearAiChat}
                className="w-full bg-red-500/20 hover:bg-red-500/30 py-3 px-4 rounded-xl text-left font-semibold text-red-200"
              >
                Clear AI Chat
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
            <div
              ref={aiChatRef}
              className="h-[520px] overflow-y-auto space-y-4 pr-2 mb-5 scroll-smooth"
            >
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-4 whitespace-pre-line leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600/20 border border-blue-400/20 ml-10"
                      : "bg-black/30 border border-white/10 mr-10"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                    {msg.role === "user" ? "You" : "JobPilot AI"}
                  </p>
                  <p className="text-gray-100">{msg.text}</p>
                </div>
              ))}

              {aiLoading && (
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 mr-10">
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
                onClick={() => askAgent(aiInput)}
                disabled={aiLoading}
                className="bg-purple-600 hover:bg-purple-700 px-8 rounded-2xl font-semibold disabled:opacity-50"
              >
                {aiLoading ? "Thinking..." : "Ask AI"}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => {
                  const lastAi = [...aiMessages]
                    .reverse()
                    .find((msg) => msg.role === "ai")
                  if (lastAi) copyToClipboard(lastAi.text, "ai")
                }}
                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
              >
                {copied === "ai"
                  ? "Copied AI Response ✅"
                  : "Copy Last AI Response"}
              </button>

              <button
                onClick={useLastAiAsEmail}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm"
              >
                Use Last AI Response as Email
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="jobs" className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-blue-400 font-semibold mb-3">Step 1</p>
          <h2 className="text-5xl font-bold mb-4">Find Real Jobs</h2>
          <p className="text-gray-400 text-lg">
            Search real jobs from your backend connected to Adzuna.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-gray-400 text-sm">Role</label>
            <input
              value={search.role}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, role: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-gray-400 text-sm">Location</label>
            <input
              value={search.location}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, location: e.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-gray-400 text-sm">Experience</label>
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
          </div>

          <button
            onClick={findJobs}
            disabled={loadingJobs}
            className="bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold disabled:opacity-50"
          >
            {loadingJobs ? "Searching..." : "Find Jobs"}
          </button>
        </div>

        {jobError && (
          <div className="bg-red-500/20 border border-red-400/20 text-red-200 rounded-2xl p-5 mb-8">
            {jobError}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rankedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-blue-500 transition"
            >
              <div className="flex justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{job.title}</h3>
                  <p className="text-gray-400 mt-2">{job.company}</p>
                </div>

                <span className="h-fit bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">
                  {job.matchScore}%
                </span>
              </div>

              <div className="space-y-2 text-gray-400 text-sm mb-5">
                <p>📍 {job.location}</p>
                <p>💰 {job.salary}</p>
                <p>🏷️ {job.category}</p>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed h-28 overflow-hidden mb-5">
                {job.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(job.url, "_blank")}
                  className="bg-white/10 hover:bg-white/20 py-3 rounded-xl"
                >
                  Open
                </button>

                <button
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

      <section id="workspace" className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-blue-400 font-semibold mb-3">Step 2</p>
          <h2 className="text-5xl font-bold mb-4">Application Workspace</h2>
          <p className="text-gray-400 text-lg">
            Review the selected job, copy materials, or open Gmail with the
            email ready.
          </p>
        </div>

        {!selectedJob ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-gray-400">
            Select a job using Apply AI.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
              <p className="text-blue-400 font-semibold mb-3">Selected Job</p>
              <h3 className="text-3xl font-bold mb-3">{selectedJob.title}</h3>
              <p className="text-gray-300 text-xl mb-5">
                {selectedJob.company}
              </p>

              <div className="space-y-3 text-gray-400">
                <p>📍 {selectedJob.location}</p>
                <p>💰 {selectedJob.salary}</p>
                <p>🎯 {selectedJob.match} Match</p>
                <p>📌 Status: {selectedJob.status}</p>
              </div>

              <button
                onClick={() => window.open(selectedJob.url, "_blank")}
                className="w-full mt-6 bg-white/10 hover:bg-white/20 py-3 rounded-xl"
              >
                Open Job Page
              </button>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h3 className="text-2xl font-bold mb-4">Email Draft</h3>

                <label className="text-gray-400 text-sm">Recipient Email</label>
                <input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className={inputClass}
                />

                <label className="text-gray-400 text-sm mt-4 block">
                  Subject
                </label>
                <input
                  value={emailDraft.subject}
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
                  value={emailDraft.body}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      body: e.target.value,
                    }))
                  }
                  rows="12"
                  className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-4 outline-none leading-relaxed focus:border-blue-400 transition"
                />

                <div className="grid md:grid-cols-3 gap-4 mt-5">
                  <button
                    onClick={openInGmail}
                    className="bg-blue-600 hover:bg-blue-700 py-4 rounded-xl font-semibold"
                  >
                    Open in Gmail
                  </button>

                  <button
                    onClick={() => {
                      setSelectedJob((prev) => ({
                        ...prev,
                        status: "Applied",
                      }))
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
                    className="bg-green-600 hover:bg-green-700 py-4 rounded-xl font-semibold"
                  >
                    Mark Applied
                  </button>

                  <button
                    onClick={() => {
                      setSelectedJob(null)
                      setApplicationPack(null)
                      setEmailDraft(null)
                      setRecipientEmail("")
                      setEmailStatus("")
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 py-4 rounded-xl font-semibold"
                  >
                    Clear
                  </button>
                </div>

                {emailStatus && (
                  <div className="mt-5 bg-white/10 border border-white/10 rounded-xl p-4">
                    {emailStatus}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold">Cover Letter</h3>
                    <button
                      onClick={() =>
                        copyToClipboard(applicationPack.coverLetter, "cover")
                      }
                      className="bg-white/10 px-3 py-1 rounded-lg text-sm"
                    >
                      {copied === "cover" ? "Copied ✅" : "Copy"}
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-line max-h-80 overflow-y-auto">
                    {applicationPack.coverLetter}
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold">Resume Tips</h3>
                    <button
                      onClick={() =>
                        copyToClipboard(applicationPack.resumeTips, "tips")
                      }
                      className="bg-white/10 px-3 py-1 rounded-lg text-sm"
                    >
                      {copied === "tips" ? "Copied ✅" : "Copy"}
                    </button>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-line max-h-80 overflow-y-auto">
                    {applicationPack.resumeTips}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section id="tracker" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 mb-10">
          <div>
            <p className="text-blue-400 font-semibold mb-3">Step 3</p>
            <h2 className="text-5xl font-bold mb-4">Application Tracker</h2>
            <p className="text-gray-400 text-lg">
              Track jobs you prepared, emailed, or applied for.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportTrackerCSV}
              className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-semibold"
            >
              Export CSV
            </button>

            <button
              onClick={clearTracker}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 px-5 py-3 rounded-2xl font-semibold text-red-200"
            >
              Clear Tracker
            </button>
          </div>
        </div>

        {savedApplications.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-gray-400">
            No applications yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedApplications.map((job, index) => (
              <div
                key={`${job.title}-${job.company}-${job.location}-${index}`}
                className="bg-white/5 border border-white/10 rounded-3xl p-6"
              >
                <h3 className="text-2xl font-bold">{job.title}</h3>
                <p className="text-gray-400 mt-2">{job.company}</p>

                <div className="space-y-2 text-gray-400 mt-5">
                  <p>📍 {job.location}</p>
                  <p>🎯 {job.match} Match</p>
                  <p>📅 {job.date}</p>
                  {job.note && <p>📝 {job.note}</p>}
                </div>

                <select
                  value={job.status}
                  onChange={(e) =>
                    updateApplicationStatus(index, e.target.value)
                  }
                  className={inputClass}
                >
                  <option>Ready</option>
                  <option>Applied</option>
                  <option>Interview</option>
                  <option>Rejected</option>
                  <option>Selected</option>
                </select>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <button
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
                    onClick={() => window.open(job.url, "_blank")}
                    className="bg-white/10 hover:bg-white/20 py-3 rounded-xl"
                  >
                    Job
                  </button>

                  <button
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

      <section id="profile" className="max-w-7xl mx-auto px-6 py-16 pb-28">
        <div className="mb-10">
          <p className="text-blue-400 font-semibold mb-3">
            Candidate Resume Details
          </p>
          <h2 className="text-5xl font-bold mb-4">Complete Your Profile</h2>
          <p className="text-gray-400 text-lg">
            Open one section at a time, add multiple projects or experiences,
            and let AI generate professional results.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-5 items-center">
            <div>
              <p className="text-gray-400 text-sm">Profile Score</p>
              <h3 className="text-5xl font-bold mt-2">{profileScore}%</h3>
            </div>

            <div>
              <p className="text-gray-400 text-sm">Completed Sections</p>
              <h3 className="text-4xl font-bold mt-2">
                {completedSections}/{totalSections}
              </h3>
            </div>

            <button
              onClick={() =>
                quickAskAgent(
                  "Check my candidate profile and tell me what resume details are missing or weak. Give exact improvements."
                )
              }
              className="bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-semibold"
            >
              Check Missing Details
            </button>

            <button
              onClick={() =>
                quickAskAgent(
                  "Generate my professional ATS-friendly resume using all my candidate profile details. Make it clean, truthful, strong, and suitable for my target role."
                )
              }
              className="bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-semibold"
            >
              Generate Resume with AI
            </button>
          </div>

          <div className="w-full bg-black/30 rounded-full h-3 mt-6 overflow-hidden">
            <div
              className="bg-green-500 h-3 rounded-full transition-all"
              style={{ width: `${profileScore}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 h-fit sticky top-28">
            <h3 className="text-xl font-bold mb-4">Sections</h3>

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

          <div className="space-y-5">
            <AccordionCard
              id="personal"
              title="Personal Details"
              description="Basic identity and contact details."
            >
              <div className="grid md:grid-cols-2 gap-5">
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
            >
              <div className="grid md:grid-cols-3 gap-5">
                <div>
                  <label className="text-gray-400 text-sm">
                    Technical Skills
                  </label>
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
                    onChange={(e) =>
                      updateProfile("softSkills", e.target.value)
                    }
                    rows="5"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm">
                    Tools / Technologies
                  </label>
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
            >
              <div className="space-y-5">
                {profile.educations.map((edu, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Education {index + 1}
                      </h4>
                      {profile.educations.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("educations", index)}
                          className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      {[
                        ["degree", "Degree"],
                        ["college", "College / University"],
                        ["branch", "Branch / Course"],
                        ["year", "Year"],
                        ["score", "CGPA / Percentage"],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="text-gray-400 text-sm">
                            {label}
                          </label>
                          <input
                            value={edu[field]}
                            onChange={(e) =>
                              updateArrayItem(
                                "educations",
                                index,
                                field,
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addArrayItem("educations", emptyEducation)}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Education
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="projects"
              title="Projects"
              description="Add portfolio projects with tech stack and links."
              count={`${profile.projects.length} item(s)`}
            >
              <div className="space-y-5">
                {profile.projects.map((project, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Project {index + 1}
                      </h4>
                      {profile.projects.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("projects", index)}
                          className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-gray-400 text-sm">
                          Project Name
                        </label>
                        <input
                          value={project.name}
                          onChange={(e) =>
                            updateArrayItem(
                              "projects",
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm">
                          Project Link
                        </label>
                        <input
                          value={project.link}
                          onChange={(e) =>
                            updateArrayItem(
                              "projects",
                              index,
                              "link",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm">
                          Tech Stack
                        </label>
                        <textarea
                          value={project.tech}
                          onChange={(e) =>
                            updateArrayItem(
                              "projects",
                              index,
                              "tech",
                              e.target.value
                            )
                          }
                          rows="4"
                          className={textareaClass}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm">
                          Project Description
                        </label>
                        <textarea
                          value={project.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "projects",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows="4"
                          className={textareaClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addArrayItem("projects", emptyProject)}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Project
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="experience"
              title="Experience"
              description="Add internships, jobs, freelance, or practical experience."
              count={`${profile.experiences.length} item(s)`}
            >
              <div className="space-y-5">
                {profile.experiences.map((exp, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Experience {index + 1}
                      </h4>
                      {profile.experiences.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("experiences", index)}
                          className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
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
                          <label className="text-gray-400 text-sm">
                            {label}
                          </label>
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
                        <label className="text-gray-400 text-sm">
                          Description
                        </label>
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
            >
              <div className="space-y-5">
                {profile.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Certification {index + 1}
                      </h4>
                      <button
                        onClick={() =>
                          removeArrayItem("certifications", index)
                        }
                        className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      {[
                        ["name", "Certification Name"],
                        ["issuer", "Issued By"],
                        ["year", "Year"],
                        ["link", "Certificate Link"],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="text-gray-400 text-sm">
                            {label}
                          </label>
                          <input
                            value={cert[field]}
                            onChange={(e) =>
                              updateArrayItem(
                                "certifications",
                                index,
                                field,
                                e.target.value
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    addArrayItem("certifications", emptyCertification)
                  }
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Certification
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="achievements"
              title="Achievements"
              description="Add awards, hackathons, academic or coding achievements."
              count={`${profile.achievements.length} item(s)`}
            >
              <div className="space-y-5">
                {profile.achievements.map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Achievement {index + 1}
                      </h4>
                      <button
                        onClick={() => removeArrayItem("achievements", index)}
                        className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-gray-400 text-sm">Title</label>
                        <input
                          value={achievement.title}
                          onChange={(e) =>
                            updateArrayItem(
                              "achievements",
                              index,
                              "title",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm">
                          Description
                        </label>
                        <textarea
                          value={achievement.description}
                          onChange={(e) =>
                            updateArrayItem(
                              "achievements",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows="4"
                          className={textareaClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() =>
                    addArrayItem("achievements", emptyAchievement)
                  }
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Achievement
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="languages"
              title="Languages"
              description="Add languages and proficiency levels."
              count={`${profile.languages.length} item(s)`}
            >
              <div className="space-y-5">
                {profile.languages.map((language, index) => (
                  <div
                    key={index}
                    className="bg-black/20 border border-white/10 rounded-2xl p-5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold">
                        Language {index + 1}
                      </h4>
                      {profile.languages.length > 1 && (
                        <button
                          onClick={() => removeArrayItem("languages", index)}
                          className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-xl text-red-200"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-gray-400 text-sm">
                          Language
                        </label>
                        <input
                          value={language.name}
                          onChange={(e) =>
                            updateArrayItem(
                              "languages",
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-gray-400 text-sm">Level</label>
                        <input
                          value={language.level}
                          onChange={(e) =>
                            updateArrayItem(
                              "languages",
                              index,
                              "level",
                              e.target.value
                            )
                          }
                          placeholder="Native / Good / Fluent"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addArrayItem("languages", emptyLanguage)}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                >
                  + Add Language
                </button>
              </div>
            </AccordionCard>

            <AccordionCard
              id="preferences"
              title="Resume Preferences"
              description="Resume style and job preferences."
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-gray-400 text-sm">Resume Style</label>
                  <select
                    value={profile.resumeStyle}
                    onChange={(e) =>
                      updateProfile("resumeStyle", e.target.value)
                    }
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

export default App