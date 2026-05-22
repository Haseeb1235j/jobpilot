import { useEffect, useState } from "react"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

function App() {
  const defaultProfile = {
    name: "Mohammad Haseeb",
    role: "Frontend Developer",
    email: "haseeb@example.com",
    phone: "+91 XXXXX XXXXX",
    portfolio: "github.com/yourusername",
    skills: "React, JavaScript, Tailwind CSS, Python, APIs",
    experience:
      "Built JobPilot, an AI career assistant web app with React, Tailwind CSS, Node.js backend, real job search, application tracker, and email sending system.",
    projects: "JobPilot AI Career Assistant, Portfolio Website, Resume Builder App",
  }

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("jobpilot_profile")
    return saved ? JSON.parse(saved) : defaultProfile
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
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState("")

  const [savedApplications, setSavedApplications] = useState(() => {
    const saved = localStorage.getItem("jobpilot_saved_applications")
    return saved ? JSON.parse(saved) : []
  })

  const [copied, setCopied] = useState("")

  useEffect(() => {
    localStorage.setItem("jobpilot_profile", JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    localStorage.setItem(
      "jobpilot_saved_applications",
      JSON.stringify(savedApplications)
    )
  }, [savedApplications])

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  const updateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const calculateMatch = (job) => {
    const skills = profile.skills
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to load jobs")
      }

      setJobs(data.jobs || [])
    } catch (error) {
      console.error("Job loading error:", error)
      setJobError("Could not load jobs. Make sure backend is running.")
    }

    setLoadingJobs(false)
  }

  const buildApplicationPack = (job) => {
    const coverLetter = `Dear Hiring Manager,

I am excited to apply for the ${job.title} role at ${job.company}. My background in ${profile.skills} and my hands-on project work make me confident that I can contribute to this role.

I have built projects such as ${profile.projects}. My experience includes ${profile.experience}

I am interested in this opportunity because it matches my goal of growing as a ${profile.role}. I am motivated, quick to learn, and ready to contribute with strong effort and practical skills.

Thank you for reviewing my application. I would be happy to discuss how my skills and projects match this position.

Best regards,
${profile.name}
${profile.email}
${profile.phone}
${profile.portfolio}`

    const recruiterMessage = `Hi,

I came across the ${job.title} opening at ${job.company}, and I am interested in applying.

I have skills in ${profile.skills}, and I have built projects like ${profile.projects}. I would be grateful if you could review my profile for this opportunity.

Portfolio/GitHub: ${profile.portfolio}

Thank you,
${profile.name}`

    const resumeTips = `Resume improvements for this job:

1. Keep your target role close to "${job.title}".
2. Highlight these skills clearly: ${profile.skills}.
3. Add strong project points from: ${profile.projects}.
4. Use keywords from the job description.
5. Add action words like Built, Developed, Integrated, Improved.
6. Keep resume clean and one page if applying as fresher.
7. Add portfolio/GitHub link near contact details.`

    const checklist = `Apply checklist:

1. Review the job page.
2. Update resume for this job.
3. Copy/edit the cover letter.
4. Copy/edit the recruiter message.
5. Generate email draft.
6. Enter recipient email.
7. Send only after reviewing.
8. Mark job as Applied.
9. Follow up after 3 to 5 days.`

    return {
      coverLetter,
      recruiterMessage,
      resumeTips,
      checklist,
    }
  }

  const buildEmailDraft = (job, pack) => {
    return {
      subject: `Application for ${job.title} - ${profile.name}`,
      body: `Dear Hiring Manager,

I hope you are doing well.

I am writing to apply for the ${job.title} position at ${job.company}. I am interested in this opportunity because it matches my career goal of growing as a ${profile.role}.

Here are a few highlights from my profile:

- Skills: ${profile.skills}
- Projects: ${profile.projects}
- Experience: ${profile.experience}
- Portfolio/GitHub: ${profile.portfolio}

Cover letter:

${pack.coverLetter}

Thank you for your time and consideration. I would be grateful for the opportunity to discuss how my skills and projects can contribute to ${job.company}.

Best regards,
${profile.name}
${profile.email}
${profile.phone}
${profile.portfolio}`,
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

    const pack = buildApplicationPack(cleanJob)
    const draft = buildEmailDraft(cleanJob, pack)

    setSelectedJob(cleanJob)
    setApplicationPack(pack)
    setEmailDraft(draft)
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

  const sendEmail = async () => {
    if (!selectedJob || !emailDraft) {
      setEmailStatus("Please select a job first.")
      return
    }

    if (!recipientEmail.trim()) {
      setEmailStatus("Please enter recipient email.")
      return
    }

    if (!emailDraft.subject || !emailDraft.body) {
      setEmailStatus("Please check subject and body before sending.")
      return
    }

    const confirmSend = window.confirm(
      `Send email to ${recipientEmail}?\n\nCheck the subject and body before sending.`
    )

    if (!confirmSend) return

    setSendingEmail(true)
    setEmailStatus("Sending email...")

    try {
      console.log("API_URL:", API_URL)
      console.log("Sending email to:", recipientEmail)

      const res = await fetch(`${API_URL}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          subject: emailDraft.subject,
          body: emailDraft.body,
        }),
      })

      let data = {}

      try {
        data = await res.json()
      } catch (jsonError) {
        console.error("Could not read JSON response:", jsonError)
        throw new Error("Backend did not return JSON response")
      }

      console.log("Email response:", data)

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Email failed. Check Render logs.")
      }

      setEmailStatus("Email sent successfully ✅")

      setSelectedJob((prev) => ({ ...prev, status: "Applied" }))

      setSavedApplications((prev) =>
        prev.map((job) =>
          job.title === selectedJob.title &&
          job.company === selectedJob.company &&
          job.location === selectedJob.location
            ? {
                ...job,
                status: "Applied",
                note: `Email sent to ${recipientEmail}`,
              }
            : job
        )
      )
    } catch (error) {
      console.error("Frontend email error:", error)
      setEmailStatus(`Email failed ❌ ${error.message}`)
    } finally {
      setSendingEmail(false)
    }
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

    const escapeCSV = (value) => {
      const text = String(value ?? "")
      return `"${text.replace(/"/g, '""')}"`
    }

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

    const confirmClear = window.confirm(
      "Are you sure you want to clear all saved applications?"
    )

    if (!confirmClear) return

    setSavedApplications([])
    localStorage.removeItem("jobpilot_saved_applications")
  }

  const resumeScore = Math.round(
    [
      profile.name,
      profile.role,
      profile.email,
      profile.phone,
      profile.portfolio,
      profile.skills,
      profile.experience,
      profile.projects,
    ].filter((x) => x && x.trim().length > 3).length * 12.5
  )

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
            <button onClick={() => scrollToSection("jobs")} className="hover:text-white">
              Jobs
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

      <section id="home" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-blue-400 font-semibold mb-4">
              AI Job Applying Agent
            </p>

            <h2 className="text-6xl font-bold leading-tight mb-6">
              Find jobs. Prepare application. Send email.
            </h2>

            <p className="text-gray-400 text-xl leading-relaxed mb-8">
              A simple AI-powered workflow for real job search, application preparation,
              reviewed email sending, and application tracking.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => scrollToSection("jobs")}
                className="bg-blue-600 hover:bg-blue-700 px-7 py-4 rounded-2xl font-semibold"
              >
                Find Real Jobs
              </button>

              <button
                onClick={() => scrollToSection("tracker")}
                className="bg-white/10 hover:bg-white/20 px-7 py-4 rounded-2xl font-semibold"
              >
                View Tracker
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Resume Score</p>
              <h3 className="text-5xl font-bold mt-3">{resumeScore}%</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Jobs Found</p>
              <h3 className="text-5xl font-bold mt-3">{jobs.length}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Saved</p>
              <h3 className="text-5xl font-bold mt-3">
                {savedApplications.length}
              </h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-gray-400">Best Match</p>
              <h3 className="text-5xl font-bold mt-3">
                {rankedJobs[0]?.matchScore ? `${rankedJobs[0].matchScore}%` : "—"}
              </h3>
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
              className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-gray-400 text-sm">Location</label>
            <input
              value={search.location}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, location: e.target.value }))
              }
              className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="text-gray-400 text-sm">Experience</label>
            <select
              value={search.experience}
              onChange={(e) =>
                setSearch((prev) => ({ ...prev, experience: e.target.value }))
              }
              className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
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
            Review the selected job, copy materials, or send email after approval.
          </p>
        </div>

        {!selectedJob ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center text-gray-400">
            Select a job using Apply AI.
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <p className="text-blue-400 font-semibold mb-3">Selected Job</p>
              <h3 className="text-3xl font-bold mb-3">{selectedJob.title}</h3>
              <p className="text-gray-300 text-xl mb-5">{selectedJob.company}</p>

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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">Email Draft</h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Subject: ${emailDraft.subject}\n\n${emailDraft.body}`,
                        "email"
                      )
                    }
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm"
                  >
                    {copied === "email" ? "Copied ✅" : "Copy Email"}
                  </button>
                </div>

                <label className="text-gray-400 text-sm">Recipient Email</label>
                <input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="w-full mt-2 mb-4 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
                />

                <label className="text-gray-400 text-sm">Subject</label>
                <input
                  value={emailDraft.subject}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full mt-2 mb-4 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
                />

                <label className="text-gray-400 text-sm">Body</label>
                <textarea
                  value={emailDraft.body}
                  onChange={(e) =>
                    setEmailDraft((prev) => ({ ...prev, body: e.target.value }))
                  }
                  rows="12"
                  className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-4 outline-none leading-relaxed"
                />

                <div className="grid md:grid-cols-3 gap-4 mt-5">
                  <button
                    onClick={sendEmail}
                    disabled={sendingEmail}
                    className="bg-pink-600 hover:bg-pink-700 py-4 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {sendingEmail ? "Sending..." : "Send Email"}
                  </button>

                  <button
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
                  onChange={(e) => updateApplicationStatus(index, e.target.value)}
                  className="w-full mt-5 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
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
                      setEmailDraft(buildEmailDraft(job, pack))
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
          <p className="text-blue-400 font-semibold mb-3">Profile</p>
          <h2 className="text-5xl font-bold mb-4">Your Resume Details</h2>
          <p className="text-gray-400 text-lg">
            JobPilot uses these details to prepare applications.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["name", "Full Name"],
              ["role", "Target Role"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["portfolio", "Portfolio / GitHub"],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="text-gray-400 text-sm">{label}</label>
                <input
                  value={profile[field]}
                  onChange={(e) => updateProfile(field, e.target.value)}
                  className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
                />
              </div>
            ))}

            <div className="md:col-span-2">
              <label className="text-gray-400 text-sm">Skills</label>
              <textarea
                value={profile.skills}
                onChange={(e) => updateProfile("skills", e.target.value)}
                rows="3"
                className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-gray-400 text-sm">Experience</label>
              <textarea
                value={profile.experience}
                onChange={(e) => updateProfile("experience", e.target.value)}
                rows="4"
                className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-gray-400 text-sm">Projects</label>
              <textarea
                value={profile.projects}
                onChange={(e) => updateProfile("projects", e.target.value)}
                rows="3"
                className="w-full mt-2 bg-black/30 border border-white/10 rounded-xl p-3 outline-none"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App