import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`
const today = () => new Date().toLocaleDateString()
const now = () => new Date().toLocaleString()

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim()
}
function isMongoObjectId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || ""))
}

function friendlyError(error, fallback = "Something went wrong.") {
  const message = String(error?.message || error || "").trim()
  if (!message) return fallback
  if (message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("networkerror")) {
    return "Backend is not connected. Start the server with: cd server && node index.js"
  }
  if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("token")) {
    return "Your login session expired. Please logout and login again."
  }
  return message
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const roleOptions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Python Developer",
  "Java Developer",
  "Spring Boot Developer",
  "React Developer",
  "MERN Stack Developer",
  "Software Developer",
  "Software Engineer",
  "Web Developer",
  "UI Developer",
  "Data Analyst",
  "Business Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "Cybersecurity Analyst",
  "Cloud Engineer",
  "DevOps Engineer",
  "QA Tester",
  "Automation Tester",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "Flutter Developer",
  "React Native Developer",
  "UI/UX Designer",
  "Graphic Designer",
  "Digital Marketing Executive",
  "HR Executive",
  "Recruiter",
  "Sales Executive",
  "Business Development Executive",
  "Customer Support Executive",
  "Finance Analyst",
  "Accountant",
  "Fresher",
  "Intern",
  "Technical Support Engineer",
  "System Administrator",
  "Network Engineer",
  "Product Manager",
  "Project Coordinator",
  "Content Writer",
  "SEO Executive",
  "Operations Executive",
  "Node.js Developer",
  "Django Developer",
  "Flask Developer",
  "SQL Developer",
  "Power BI Developer",
  "Tableau Developer",
  "Manual Tester",
  "IT Support Engineer",
  "Office Administrator",
  "Other",
]

const countries = [
  { code: "in", name: "India", label: "INR / year" },
  { code: "us", name: "United States", label: "USD / year" },
  { code: "gb", name: "United Kingdom", label: "GBP / year" },
  { code: "ca", name: "Canada", label: "CAD / year" },
  { code: "au", name: "Australia", label: "AUD / year" },
  { code: "de", name: "Germany", label: "EUR / year" },
  { code: "fr", name: "France", label: "EUR / year" },
  { code: "sg", name: "Singapore", label: "SGD / year" },
  { code: "nl", name: "Netherlands", label: "EUR / year" },
  { code: "other", name: "Other country / Not listed", label: "Salary / year" },
]

const cities = {
  in: ["Hyderabad", "Bangalore", "Chennai", "Pune", "Mumbai", "Delhi", "Noida", "Gurgaon", "Kolkata", "Remote", "Other"],
  us: ["New York", "San Francisco", "Los Angeles", "Chicago", "Seattle", "Austin", "Boston", "Remote", "Other"],
  gb: ["London", "Manchester", "Birmingham", "Leeds", "Remote", "Other"],
  ca: ["Toronto", "Vancouver", "Montreal", "Calgary", "Remote", "Other"],
  au: ["Sydney", "Melbourne", "Brisbane", "Perth", "Remote", "Other"],
  de: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Remote", "Other"],
  fr: ["Paris", "Lyon", "Marseille", "Remote", "Other"],
  sg: ["Singapore", "Remote", "Other"],
  nl: ["Amsterdam", "Rotterdam", "Utrecht", "Remote", "Other"],
  other: ["Dubai", "Abu Dhabi", "Doha", "Riyadh", "Remote", "Other"],
}

const salaryRanges = {
  in: [
    { label: "Any Salary", min: 0, max: 0, required: false },
    { label: "Only salary-listed jobs", min: 0, max: 0, required: true },
    { label: "0 - 3 LPA", min: 0, max: 300000, required: true },
    { label: "3 - 6 LPA", min: 300000, max: 600000, required: true },
    { label: "6 - 10 LPA", min: 600000, max: 1000000, required: true },
    { label: "10 - 15 LPA", min: 1000000, max: 1500000, required: true },
    { label: "15 - 25 LPA", min: 1500000, max: 2500000, required: true },
    { label: "25+ LPA", min: 2500000, max: 0, required: true },
  ],
  default: [
    { label: "Any Salary", min: 0, max: 0, required: false },
    { label: "Only salary-listed jobs", min: 0, max: 0, required: true },
    { label: "Entry range", min: 0, max: 50000, required: true },
    { label: "50k - 80k", min: 50000, max: 80000, required: true },
    { label: "80k - 120k", min: 80000, max: 120000, required: true },
    { label: "120k+", min: 120000, max: 0, required: true },
  ],
}

const templates = [
  { id: "sidebar", name: "Canva Sidebar CV", desc: "Premium left panel with clean professional content" },
  { id: "split", name: "Split Header CV", desc: "Strong top identity banner with modern sections" },
  { id: "developer", name: "Developer Portfolio", desc: "Project-first layout for tech and software roles" },
  { id: "data", name: "Data Analyst CV", desc: "Clean metrics-style layout for analyst roles" },
  { id: "minimalist", name: "Minimal Luxury", desc: "Elegant white-space resume with premium feel" },
  { id: "creative", name: "Creative Portfolio", desc: "Modern accent layout for portfolio-style resumes" },
  { id: "fresher", name: "Fresher Graduate", desc: "Education and project-focused for freshers" },
  { id: "corporate", name: "Corporate Classic", desc: "Business-style resume for professional roles" },
  { id: "consulting", name: "Consulting CV", desc: "Sharp structured sections for client-facing roles" },
  { id: "elegant", name: "Elegant Serif", desc: "Polished serif design with premium hierarchy" },
  { id: "bold", name: "Bold Executive", desc: "High-impact sidebar layout for senior profiles" },
  { id: "modern", name: "Modern Professional", desc: "Simple clean all-purpose resume" },
]


const defaultResume = {
  title: "Untitled Resume",
  personal: {
    name: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  objective: "",
  skills: {
    languages: "",
    frontend: "",
    backend: "",
    database: "",
    tools: "",
    other: "",
  },
  projects: [],
  experience: [],
  internships: [],
  education: [],
  certifications: [],
  achievements: [],
  languages: [],
  atsKeywords: "",
  jobDescription: "",
  updatedAt: now(),
}

const resumeStyles = `
.resume-page{
  width:794px;
  min-height:1123px;
  height:1123px;
  max-height:1123px;
  background:#fff;
  color:#111827;
  padding:54px 62px;
  margin:0 auto;
  box-shadow:0 25px 80px rgba(0,0,0,.35);
  font-family:Arial, Helvetica, sans-serif;
  line-height:1.42;
  overflow:hidden;
  position:relative;
}
.resume-page *{box-sizing:border-box}
.resume-fit-inner{
  transform-origin:top left;
  transform:scale(var(--resume-fit-scale,1));
  width:calc(100% / var(--resume-fit-scale,1));
  min-height:calc(100% / var(--resume-fit-scale,1));
}
.rp-header{
  text-align:center;
  border-bottom:2px solid #2563eb;
  padding-bottom:16px;
  margin-bottom:18px;
}
.rp-header h1{
  font-size:28px;
  letter-spacing:5px;
  color:#2563eb;
  margin:0 0 6px;
  text-transform:uppercase;
  font-weight:700;
}
.rp-role{
  font-weight:600;
  color:#374151;
  margin:0 0 6px;
}
.rp-header p{
  font-size:12px;
  color:#374151;
  margin:3px 0;
  font-weight:400;
}
.rp-section{
  margin-top:15px;
}
.rp-section h2{
  font-size:13px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:#2563eb;
  border-bottom:1px solid #1f4e79;
  padding-bottom:5px;
  margin:0 0 8px;
  font-weight:600;
}
.rp-section p{
  font-size:12px;
  margin:5px 0;
  font-weight:400;
}
.rp-item{
  margin:9px 0 12px;
}
.rp-item h3{
  font-size:13px;
  margin:0 0 3px;
  color:#111827;
  font-weight:600;
}
.rp-item .muted,
.muted{
  font-size:11px;
  color:#4b5563;
  font-weight:400;
}
.resume-page ul{
  margin:5px 0 0 18px;
  padding:0;
}
.resume-page li{
  font-size:12px;
  margin:3px 0;
  font-weight:400;
}
.resume-page strong{
  color:#111827;
  font-weight:600;
}
.resume-clickable{
  cursor:pointer;
  border-radius:6px;
  transition:.15s;
}
.resume-clickable:hover{
  outline:2px solid #60a5fa55;
  background:#eff6ff;
}
.resume-direct-mode .direct-resume-edit{
  outline:1.5px dashed rgba(245,158,11,.55);
  background:rgba(245,158,11,.12);
  color:inherit !important;
  -webkit-text-fill-color:currentColor;
  border-radius:4px;
  padding:1px 3px;
  cursor:text;
  min-height:1.1em;
  min-width:18px;
  display:inline-block;
  white-space:pre-wrap;
  user-select:text;
  caret-color:#f59e0b;
}
.resume-direct-mode .direct-resume-edit:empty::before{
  content:attr(data-placeholder);
  color:#9ca3af;
  -webkit-text-fill-color:#9ca3af;
  font-weight:400;
}
.resume-direct-mode .direct-resume-edit:focus{
  outline:2px solid #f59e0b;
  background:rgba(245,158,11,.20);
}
.resume-direct-mode .rp-left-panel .direct-resume-edit{
  color:#f8fafc !important;
  -webkit-text-fill-color:#f8fafc;
}
.resume-direct-mode .rp-main-panel .direct-resume-edit,
.resume-direct-mode:not(.resume-sidebar):not(.resume-creative):not(.resume-bold) .direct-resume-edit{
  color:inherit !important;
}
.direct-edit-ribbon{
  grid-column:1 / -1;
  margin:0 0 14px;
  padding:8px 10px;
  border-radius:8px;
  background:#fff7ed;
  color:#92400e;
  font-size:11px;
  font-weight:700;
  text-align:center;
}
.resume-ats{
  font-family:Arial, Helvetica, sans-serif;
}
.resume-ats .rp-header h1,
.resume-ats .rp-section h2{
  color:#111;
}
.resume-ats .rp-header,
.resume-ats .rp-section h2{
  border-color:#111;
}
.resume-developer .rp-header{
  border-bottom:3px solid #2563eb;
}
.resume-developer .rp-header h1,
.resume-developer .rp-section h2{
  color:#2563eb;
}
.resume-fresher .rp-header{
  border-bottom:2px solid #0f766e;
}
.resume-fresher .rp-header h1,
.resume-fresher .rp-section h2{
  color:#0f766e;
}
.resume-premium{
  border-top:8px solid #334155;
}
.resume-premium .rp-header{
  border-bottom:2px solid #334155;
}
.resume-premium .rp-header h1,
.resume-premium .rp-section h2{
  color:#334155;
}
.resume-minimal{
  font-family:Arial, Helvetica, sans-serif;
}
.resume-minimal .rp-header h1{
  color:#111;
  letter-spacing:3px;
}
.resume-minimal .rp-header,
.resume-minimal .rp-section h2{
  border-color:#111;
}
.resume-executive .rp-header{border-bottom:3px double #111827}.resume-executive .rp-header h1,.resume-executive .rp-section h2{color:#111827}
.resume-startup .rp-header{border-bottom:3px solid #7c3aed}.resume-startup .rp-header h1,.resume-startup .rp-section h2{color:#7c3aed}
.resume-software .rp-header{border-bottom:3px solid #0f172a}.resume-software .rp-header h1{color:#0f172a}.resume-software .rp-section h2{color:#2563eb}
.resume-data .rp-header{border-bottom:3px solid #0891b2}.resume-data .rp-header h1,.resume-data .rp-section h2{color:#0891b2}
.resume-creative .rp-header{border-bottom:3px solid #be123c}.resume-creative .rp-header h1,.resume-creative .rp-section h2{color:#be123c}
.resume-classic .rp-header{border-bottom:2px solid #111}.resume-classic .rp-header h1,.resume-classic .rp-section h2{color:#111}
.resume-academic .rp-header{border-bottom:2px solid #4b5563}.resume-academic .rp-header h1,.resume-academic .rp-section h2{color:#374151}
.resume-international .rp-header{border-bottom:2px solid #1d4ed8}.resume-international .rp-header h1,.resume-international .rp-section h2{color:#1d4ed8}
.resume-compact{padding:42px 54px}.resume-compact .rp-section{margin-top:10px}.resume-compact .rp-section p,.resume-compact li{font-size:11px}
.resume-blueprint .rp-header{border-bottom:4px solid #2563eb}.resume-blueprint .rp-header h1,.resume-blueprint .rp-section h2{color:#1d4ed8}
.resume-mono .rp-header{border-bottom:2px solid #020617}.resume-mono .rp-header h1,.resume-mono .rp-section h2{color:#020617}
.resume-growth .rp-header{border-bottom:3px solid #16a34a}.resume-growth .rp-header h1,.resume-growth .rp-section h2{color:#15803d}
.resume-consulting .rp-header{border-bottom:3px solid #334155}.resume-consulting .rp-header h1,.resume-consulting .rp-section h2{color:#334155}
.resume-freshgrad .rp-header{border-bottom:3px solid #0d9488}.resume-freshgrad .rp-header h1,.resume-freshgrad .rp-section h2{color:#0d9488}


/* REAL CV TEMPLATE LAYOUTS - these change structure, spacing, headers, and section behavior, not only colors */
.resume-page.resume-modern{border-top:7px solid #2563eb}.resume-page.resume-modern .rp-header{padding-bottom:18px}.resume-page.resume-modern .rp-section h2{border-bottom:2px solid #dbeafe;color:#2563eb}
.resume-page.resume-ats{padding:48px 56px;font-family:Arial, Helvetica, sans-serif}.resume-page.resume-ats .rp-header{text-align:left;border-bottom:1.5px solid #111}.resume-page.resume-ats .rp-header h1{letter-spacing:1px;color:#111;font-size:25px}.resume-page.resume-ats .rp-section h2{letter-spacing:1px;color:#111;border-bottom:1px solid #111}.resume-page.resume-ats *{box-shadow:none!important}
.resume-page.resume-sidebar,.resume-page.resume-creative,.resume-page.resume-bold{padding:0;overflow:hidden}.resume-page.resume-sidebar .resume-fit-inner,.resume-page.resume-creative .resume-fit-inner,.resume-page.resume-bold .resume-fit-inner{display:grid;grid-template-columns:232px 1fr;gap:24px;min-height:1123px}.resume-sidebar .rp-left-panel,.resume-creative .rp-left-panel,.resume-bold .rp-left-panel{background:#111827;color:#e5e7eb;padding:42px 24px;min-height:1123px}.resume-sidebar .rp-main-panel,.resume-creative .rp-main-panel,.resume-bold .rp-main-panel{padding:42px 42px 42px 0}.resume-sidebar .rp-header,.resume-creative .rp-header,.resume-bold .rp-header{text-align:left;border:0;margin:0 0 24px;padding:0}.resume-sidebar .rp-header h1,.resume-creative .rp-header h1,.resume-bold .rp-header h1{color:#fff;font-size:24px;letter-spacing:2px}.resume-sidebar .rp-role,.resume-creative .rp-role,.resume-bold .rp-role{color:#cbd5e1}.resume-sidebar .rp-header p,.resume-creative .rp-header p,.resume-bold .rp-header p{color:#cbd5e1}.resume-sidebar .rp-left-panel .rp-section h2,.resume-creative .rp-left-panel .rp-section h2,.resume-bold .rp-left-panel .rp-section h2{color:#93c5fd;border-bottom:1px solid rgba(255,255,255,.25)}.resume-sidebar .rp-left-panel .rp-section p,.resume-sidebar .rp-left-panel li,.resume-creative .rp-left-panel .rp-section p,.resume-creative .rp-left-panel li,.resume-bold .rp-left-panel .rp-section p,.resume-bold .rp-left-panel li{color:#e5e7eb}.resume-sidebar .rp-main-panel .rp-section h2{color:#2563eb;border-bottom:2px solid #dbeafe}
.resume-page.resume-split{padding:0}.resume-split .rp-header{background:#0f172a;color:#fff;text-align:left;padding:46px 62px 28px;margin:0 0 28px;border-bottom:0}.resume-split .rp-header h1{color:#fff;font-size:32px;letter-spacing:4px}.resume-split .rp-role,.resume-split .rp-header p{color:#cbd5e1}.resume-split .rp-section{margin-left:62px;margin-right:62px}.resume-split .rp-section h2{background:#eff6ff;border:0;padding:7px 10px;border-left:5px solid #2563eb;color:#1d4ed8}
.resume-page.resume-timeline{padding:52px 64px}.resume-timeline .rp-header{text-align:left;border-bottom:0;border-left:7px solid #2563eb;padding-left:18px}.resume-timeline .rp-section{position:relative;border-left:2px solid #dbeafe;padding-left:18px}.resume-timeline .rp-section h2{border:0;color:#1d4ed8}.resume-timeline .rp-section h2::before{content:"";position:absolute;left:-7px;margin-top:3px;width:12px;height:12px;border-radius:999px;background:#2563eb}
.resume-page.resume-developer{background:#fbfdff;border-top:8px solid #0f172a}.resume-developer .rp-header{text-align:left;border-bottom:3px solid #0f172a}.resume-developer .rp-header h1{color:#0f172a}.resume-developer .rp-projects-section .rp-item{border:1px solid #dbeafe;background:#eff6ff;padding:10px 12px;border-radius:10px}.resume-developer .rp-section h2{color:#2563eb;border-bottom:1px solid #93c5fd}
.resume-page.resume-data{border-top:8px solid #0891b2}.resume-data .rp-header h1,.resume-data .rp-section h2{color:#0891b2}.resume-data .rp-skill-list{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px}.resume-data .rp-item{border-left:4px solid #cffafe;padding-left:10px}.resume-data .rp-section h2{border-bottom:2px solid #cffafe}
.resume-page.resume-minimalist{padding:68px 78px}.resume-minimalist .rp-header{text-align:left;border-bottom:1px solid #e5e7eb}.resume-minimalist .rp-header h1{font-size:25px;letter-spacing:2px;color:#111}.resume-minimalist .rp-section{margin-top:19px}.resume-minimalist .rp-section h2{color:#111;border:0;letter-spacing:2px}
.resume-page.resume-compact{padding:36px 46px}.resume-compact .rp-header h1{font-size:24px}.resume-compact .rp-section{margin-top:9px}.resume-compact .rp-section p,.resume-compact li{font-size:10.8px}.resume-compact .rp-item{margin:5px 0 8px}.resume-compact .rp-section h2{font-size:11px;margin-bottom:4px}
.resume-page.resume-creative{grid-template-columns:250px 1fr}.resume-creative .rp-left-panel{background:linear-gradient(160deg,#7c3aed,#db2777)}.resume-creative .rp-main-panel .rp-section h2{color:#be123c;border-bottom:2px solid #fce7f3}.resume-creative .rp-main-panel .rp-item{background:#fff7ed;border-radius:12px;padding:10px 12px;margin-bottom:10px}
.resume-page.resume-fresher{border-top:8px solid #0d9488}.resume-fresher .rp-header{background:#f0fdfa;border-bottom:2px solid #99f6e4;padding:24px;border-radius:0 0 18px 18px}.resume-fresher .rp-header h1,.resume-fresher .rp-section h2{color:#0f766e}.resume-fresher .rp-projects-section{background:#f8fafc;border-radius:14px;padding:12px 14px}.resume-fresher .rp-section h2{border-bottom:1.5px solid #99f6e4}
.resume-page.resume-academic{font-family:Georgia, 'Times New Roman', serif}.resume-academic .rp-header{text-align:left;border-bottom:3px double #4b5563}.resume-academic .rp-header h1{color:#111;letter-spacing:1px}.resume-academic .rp-section h2{color:#374151;border-bottom:1px solid #9ca3af}.resume-academic .rp-section p,.resume-academic li{font-size:12.3px}
.resume-page.resume-corporate{padding:52px 66px}.resume-corporate .rp-header{text-align:left;border-bottom:4px solid #111827}.resume-corporate .rp-header h1{color:#111827}.resume-corporate .rp-section h2{color:#111827;border-bottom:1px solid #111827}.resume-corporate .rp-item{border-bottom:1px solid #e5e7eb;padding-bottom:7px}
.resume-page.resume-consulting{padding:48px 60px}.resume-consulting .rp-header{display:grid;grid-template-columns:1.2fr .8fr;text-align:left;align-items:end;border-bottom:3px solid #334155}.resume-consulting .rp-header h1{color:#334155}.resume-consulting .rp-header p{grid-column:2;text-align:right}.resume-consulting .rp-role{grid-column:1}.resume-consulting .rp-section h2{color:#334155;background:#f1f5f9;border:0;padding:6px 8px}
.resume-page.resume-product{border-top:10px solid #7c3aed;background:#f8fafc}.resume-product .rp-header{background:#fff;border-radius:18px;box-shadow:0 6px 18px rgba(15,23,42,.08);padding:24px;margin-bottom:18px;border:0}.resume-product .rp-section{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:12px 14px}.resume-product .rp-section h2{color:#7c3aed;border:0;margin-bottom:6px}
.resume-page.resume-elegant{font-family:Georgia, 'Times New Roman', serif;padding:62px 76px}.resume-elegant .rp-header{border:0}.resume-elegant .rp-header h1{color:#111;font-size:30px;letter-spacing:6px}.resume-elegant .rp-header::after{content:"";display:block;width:140px;height:2px;background:#c9a227;margin:16px auto 0}.resume-elegant .rp-section h2{color:#7c2d12;border-bottom:1px solid #e7d7b7;text-align:center}.resume-elegant .rp-section p,.resume-elegant li{font-size:12px}
.resume-page.resume-bold{grid-template-columns:260px 1fr}.resume-bold .rp-left-panel{background:#020617}.resume-bold .rp-left-panel .rp-section h2{color:#facc15}.resume-bold .rp-main-panel .rp-section h2{color:#020617;border-bottom:3px solid #020617}.resume-bold .rp-main-panel .rp-summary-section{background:#fefce8;border-left:6px solid #facc15;padding:12px 14px}
.resume-page.resume-blueprint{background:#f8fbff;border:1px solid #bfdbfe}.resume-blueprint .rp-header{border-bottom:4px solid #2563eb}.resume-blueprint .rp-header h1,.resume-blueprint .rp-section h2{color:#1d4ed8}.resume-blueprint .rp-section h2{border-bottom:1px dashed #60a5fa}.resume-blueprint .rp-item{border-left:3px solid #bfdbfe;padding-left:10px}

/* Premium template gallery thumbnails */
.template-card-mini{position:relative;min-height:126px;overflow:hidden}
.template-card-mini::before{content:"";display:block;height:26px;border-radius:12px 12px 4px 4px;margin-bottom:10px;background:linear-gradient(90deg,#2563eb,#7c3aed)}
.template-card-mini::after{content:"";display:block;height:7px;width:74%;border-radius:99px;background:rgba(148,163,184,.38);box-shadow:0 16px 0 rgba(148,163,184,.28),0 32px 0 rgba(148,163,184,.20)}
.template-card-mini.template-thumb-ats::before{background:#111}
.template-card-mini.template-thumb-developer::before{background:linear-gradient(90deg,#0f172a,#2563eb)}
.template-card-mini.template-thumb-software::before{background:#0f172a}
.template-card-mini.template-thumb-data::before{background:linear-gradient(90deg,#0891b2,#06b6d4)}
.template-card-mini.template-thumb-premium::before{background:#334155}
.template-card-mini.template-thumb-executive::before{background:linear-gradient(90deg,#111827,#6b7280)}
.template-card-mini.template-thumb-classic::before{background:#000}
.template-card-mini.template-thumb-consulting::before{background:linear-gradient(90deg,#334155,#64748b)}
.template-card-mini.template-thumb-startup::before{background:linear-gradient(90deg,#7c3aed,#ec4899)}
.template-card-mini.template-thumb-fresher::before,.template-card-mini.template-thumb-freshgrad::before{background:linear-gradient(90deg,#0d9488,#14b8a6)}
.template-card-mini.template-thumb-minimal::before{background:#e5e7eb}
.template-card-mini.template-thumb-compact::before{height:18px;background:#1f2937}
.template-card-mini.template-thumb-creative::before{background:linear-gradient(90deg,#be123c,#f97316)}
.template-card-mini.template-thumb-international::before{background:linear-gradient(90deg,#1d4ed8,#0ea5e9)}
.template-card-mini.template-thumb-blueprint::before{background:linear-gradient(90deg,#1e40af,#60a5fa)}
.template-card-mini.template-thumb-mono::before{background:#020617}
.template-card-mini.template-thumb-growth::before{background:linear-gradient(90deg,#15803d,#22c55e)}
.template-card-mini.template-thumb-academic::before{background:#4b5563}

/* Strongly different real resume styles */
.resume-modern{border-top:7px solid #2563eb}
.resume-modern .rp-header{border-bottom:2px solid #2563eb}
.resume-ats{box-shadow:none;border:1px solid #e5e7eb;padding:48px 58px;font-family:Arial, Helvetica, sans-serif}
.resume-ats .rp-header{text-align:left;border-bottom:1.5px solid #111;padding-bottom:10px}
.resume-ats .rp-header h1{letter-spacing:1px;color:#111;font-size:24px}
.resume-ats .rp-header,.resume-ats .rp-section h2{border-color:#111}.resume-ats .rp-section h2{color:#111;letter-spacing:1.4px}
.resume-developer{border-left:12px solid #2563eb;padding-left:52px}
.resume-developer .rp-header{text-align:left;border-bottom:0;padding-bottom:4px}.resume-developer .rp-header h1{color:#1d4ed8;letter-spacing:2px}.resume-developer .rp-section h2{color:#2563eb;border-bottom:2px solid #dbeafe}
.resume-software .rp-header{margin:-54px -62px 22px;padding:34px 62px 24px;background:#0f172a;color:#fff;border:0;text-align:left}.resume-software .rp-header h1,.resume-software .rp-header p{color:#fff}.resume-software .rp-section h2{color:#0f172a;border-bottom:2px solid #0f172a}
.resume-data{border-top:10px solid #0891b2}.resume-data .rp-section h2{color:#0891b2;border-bottom:1px solid #99f6e4}.resume-data .rp-header h1{color:#0891b2}
.resume-premium{border:1px solid #cbd5e1;border-top:10px solid #334155}.resume-premium .rp-header{text-align:left;border-bottom:2px solid #334155}.resume-premium .rp-header h1,.resume-premium .rp-section h2{color:#334155}
.resume-executive{font-family:Georgia, 'Times New Roman', serif}.resume-executive .rp-header{border-bottom:4px double #111827}.resume-executive .rp-header h1{color:#111827;font-size:30px;letter-spacing:2px}.resume-executive .rp-section h2{color:#111827;border-bottom:1px solid #111827}
.resume-classic{font-family:Georgia, 'Times New Roman', serif}.resume-classic .rp-header h1{color:#000;letter-spacing:1px}.resume-classic .rp-header,.resume-classic .rp-section h2{border-color:#000}.resume-classic .rp-section h2{color:#000;letter-spacing:1.2px}
.resume-consulting .rp-header{text-align:left;border-bottom:3px solid #334155}.resume-consulting .rp-header h1{color:#334155}.resume-consulting .rp-section{border-left:4px solid #e2e8f0;padding-left:14px}.resume-consulting .rp-section h2{color:#334155;border-bottom:0}
.resume-startup{border-radius:18px}.resume-startup .rp-header{border-bottom:0;background:#faf5ff;margin:-20px -24px 18px;padding:24px;border-radius:14px}.resume-startup .rp-header h1,.resume-startup .rp-section h2{color:#7c3aed}.resume-startup .rp-section h2{border-bottom:2px solid #ede9fe}
.resume-fresher{border-top:8px solid #0f766e}.resume-fresher .rp-header h1,.resume-fresher .rp-section h2{color:#0f766e}.resume-fresher .rp-section h2{border-bottom:1px solid #99f6e4}
.resume-freshgrad .rp-header{background:#f0fdfa;margin:-18px -22px 18px;padding:22px;border-bottom:2px solid #0d9488}.resume-freshgrad .rp-header h1,.resume-freshgrad .rp-section h2{color:#0d9488}
.resume-minimal{padding:58px 70px}.resume-minimal .rp-header{border-bottom:1px solid #e5e7eb}.resume-minimal .rp-header h1{color:#111;letter-spacing:2px}.resume-minimal .rp-section h2{color:#111;border-bottom:1px solid #e5e7eb}
.resume-compact{padding:36px 48px;line-height:1.30}.resume-compact .rp-section{margin-top:8px}.resume-compact .rp-header{margin-bottom:10px}.resume-compact .rp-section p,.resume-compact li{font-size:10.6px}.resume-compact .rp-header h1{font-size:24px}
.resume-creative{border-top:12px solid #be123c}.resume-creative .rp-header{text-align:left}.resume-creative .rp-header h1{color:#be123c}.resume-creative .rp-section h2{color:#be123c;border-bottom:2px solid #ffe4e6}
.resume-international .rp-header{border-bottom:2px solid #1d4ed8}.resume-international .rp-header h1,.resume-international .rp-section h2{color:#1d4ed8}.resume-international .rp-section h2{letter-spacing:2px}
.resume-blueprint{background:linear-gradient(#fff,#fff),linear-gradient(90deg,rgba(37,99,235,.08) 1px,transparent 1px),linear-gradient(rgba(37,99,235,.08) 1px,transparent 1px);background-size:auto,24px 24px,24px 24px}.resume-blueprint .rp-header h1,.resume-blueprint .rp-section h2{color:#1d4ed8}.resume-blueprint .rp-header{border-bottom:4px solid #2563eb}
.resume-mono{font-family:'Courier New', monospace}.resume-mono .rp-header{text-align:left;border-bottom:2px solid #020617}.resume-mono .rp-header h1,.resume-mono .rp-section h2{color:#020617;letter-spacing:1px}.resume-mono .rp-section h2{border-bottom:1px dashed #020617}
.resume-growth{border-top:10px solid #16a34a}.resume-growth .rp-header h1,.resume-growth .rp-section h2{color:#15803d}.resume-growth .rp-section h2{border-bottom:1px solid #bbf7d0}
.resume-academic .rp-header{text-align:left;border-bottom:2px solid #4b5563}.resume-academic .rp-header h1,.resume-academic .rp-section h2{color:#374151}.resume-academic .rp-section h2{border-bottom:1px solid #9ca3af}


.template-card-mini.template-thumb-sidebar::before{background:linear-gradient(90deg,#111827 32%,#e5e7eb 32%)}
.template-card-mini.template-thumb-split::before{background:linear-gradient(180deg,#0f172a 0 70%,#eff6ff 70%)}
.template-card-mini.template-thumb-timeline::before{background:linear-gradient(90deg,#2563eb 0 8px,#e0f2fe 8px)}
.template-card-mini.template-thumb-minimalist::before{background:#f8fafc;border:1px solid #e5e7eb}
.template-card-mini.template-thumb-corporate::before{background:#111827}
.template-card-mini.template-thumb-product::before{background:linear-gradient(90deg,#7c3aed,#ec4899)}
.template-card-mini.template-thumb-elegant::before{background:linear-gradient(90deg,#f8fafc,#c9a227,#f8fafc)}
.template-card-mini.template-thumb-bold::before{background:linear-gradient(90deg,#020617 45%,#facc15 45%)}

/* Balanced one-page fit: keep text readable, reduce empty space, then gently scale the visible template */
.resume-page .rp-section{break-inside:avoid}
.resume-page .rp-item{break-inside:avoid}
.resume-auto-compressed .rp-header{padding-bottom:13px;margin-bottom:13px}
.resume-auto-compressed .rp-header h1{font-size:26px;line-height:1.10}
.resume-auto-compressed .rp-role{font-size:11.8px;margin-bottom:4px}
.resume-auto-compressed .rp-header p{font-size:11px;margin:2.5px 0}
.resume-auto-compressed .rp-section{margin-top:10px}
.resume-auto-compressed .rp-section h2{font-size:11.7px;padding-bottom:4px;margin-bottom:5px;letter-spacing:2px}
.resume-auto-compressed .rp-section p{font-size:11.2px;margin:2.8px 0;line-height:1.32}
.resume-auto-compressed .rp-item{margin:5px 0 8px}
.resume-auto-compressed .rp-item h3{font-size:12px;margin-bottom:2px}
.resume-auto-compressed .muted{font-size:10.4px}
.resume-auto-compressed ul{margin-top:3px;margin-left:15px}
.resume-auto-compressed li{font-size:11px;margin:2px 0;line-height:1.30}
.resume-auto-compressed.resume-sidebar .rp-left-panel,.resume-auto-compressed.resume-creative .rp-left-panel,.resume-auto-compressed.resume-bold .rp-left-panel{padding:34px 20px}
.resume-auto-compressed.resume-sidebar .rp-main-panel,.resume-auto-compressed.resume-creative .rp-main-panel,.resume-auto-compressed.resume-bold .rp-main-panel{padding:34px 34px 34px 0}
.resume-auto-compressed.resume-product .rp-section{padding:10px 12px;border-radius:13px}
.resume-auto-compressed.resume-product .rp-header{padding:18px;margin-bottom:12px}
.resume-auto-compressed.resume-split .rp-header{padding:34px 52px 22px;margin-bottom:16px}
.resume-auto-compressed.resume-split .rp-section{margin-left:52px;margin-right:52px}
.resume-auto-compressed.resume-creative .rp-main-panel .rp-item{padding:8px 10px;margin-bottom:7px}
.resume-fit-expanded .rp-section{margin-top:18px}
.resume-fit-expanded .rp-item{margin:11px 0 15px}
.resume-fit-expanded .rp-section p{line-height:1.48}
.resume-fit-expanded li{line-height:1.42;margin:4px 0}

@media print{
  html,body{
    margin:0!important;
    padding:0!important;
    background:#fff!important;
  }
  .resume-page{
    box-shadow:none!important;
    margin:0 auto!important;
  }
  .resume-clickable:hover{
    outline:none!important;
    background:transparent!important;
  }
}
@page{
  size:A4;
  margin:12mm;
}
`

const mobileUiStyles = `
@media (max-width: 1023px){
  .desktop-only-sidebar{display:none!important;}
  .jobpilot-mobile-shell{padding-bottom:86px;}
  .jobpilot-mobile-tabs{position:sticky;top:0;z-index:60;box-shadow:0 14px 32px rgba(0,0,0,.22)}
  .jobpilot-mobile-bottom-nav{display:grid!important;}
  .jobpilot-account-bar{left:12px;right:12px;top:10px;justify-content:space-between;border-radius:18px;}
  .jobpilot-account-spacer{height:58px;}
  .resume-mobile-shell{border-radius:22px!important;padding:10px!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch;}
  .resume-mobile-shell::before{content:'Swipe resume preview horizontally if needed';display:block;margin:0 0 10px;padding:8px 10px;border-radius:14px;background:rgba(59,130,246,.10);border:1px solid rgba(96,165,250,.20);color:#bfdbfe;font-size:11px;font-weight:800;text-align:center;}
  .resume-mobile-shell .resume-page{box-shadow:0 18px 50px rgba(0,0,0,.30)!important;}
  .mobile-stack-grid{display:grid!important;grid-template-columns:1fr!important;padding:10px!important;gap:12px!important;}
  .mobile-card-tight{border-radius:22px!important;}
  input,textarea,select{font-size:16px!important;}
  button{touch-action:manipulation;}
  .jobpilot-mobile-bottom-nav{grid-template-columns:repeat(4,1fr)!important;position:fixed!important;left:10px!important;right:10px!important;bottom:10px!important;z-index:99980!important;border:1px solid rgba(255,255,255,.12)!important;background:rgba(2,6,23,.94)!important;backdrop-filter:blur(18px)!important;border-radius:22px!important;padding:8px!important;box-shadow:0 20px 60px rgba(0,0,0,.45)!important;gap:6px!important;}
  .jobpilot-mobile-bottom-nav button{border-radius:16px!important;padding:9px 5px!important;font-size:11px!important;font-weight:900!important;color:#94a3b8!important;background:transparent!important;border:0!important;}
  .jobpilot-mobile-bottom-nav button.active{background:linear-gradient(135deg,#2563eb,#7c3aed)!important;color:white!important;}
}
@media (min-width:1024px){
  .jobpilot-mobile-bottom-nav{display:none!important;}
  .jobpilot-account-spacer{display:none!important;}
}
@media (max-width:640px){
  .resume-page{width:794px!important;}
  body{overflow-x:hidden!important;}
  .resume-page{max-width:none!important;}
  .jobpilot-mobile-content-safe{padding-bottom:96px!important;}
  .jobpilot-mobile-bottom-nav{bottom:calc(10px + env(safe-area-inset-bottom,0px))!important;}
  .mobile-action-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important;}
  .mobile-action-grid>*{width:100%!important;justify-content:center!important;}

  .auth-mobile-panel{margin:12px!important;border-radius:26px!important;}
  .auth-mobile-title{font-size:34px!important;line-height:1.05!important;}
  .jobpilot-mobile-tabs button{padding:10px 14px!important;font-size:12px!important;}
}


/* Phase 9 mobile layout hard-fix */
@media (max-width: 900px){
  html, body, #root { width:100%!important; max-width:100%!important; overflow-x:hidden!important; }
  .jobpilot-mobile-shell{ min-height:100dvh!important; width:100%!important; overflow-x:hidden!important; padding:10px 10px 98px!important; }
  .desktop-only-sidebar{ display:none!important; }
  .jobpilot-account-bar{ position:sticky!important; top:0!important; left:auto!important; right:auto!important; width:100%!important; margin:0 0 10px!important; z-index:80!important; display:flex!important; gap:8px!important; flex-wrap:wrap!important; }
  .jobpilot-account-bar *{ max-width:100%!important; }
  .jobpilot-account-spacer{ display:none!important; }
  .jobpilot-mobile-tabs{ display:flex!important; width:100%!important; overflow-x:auto!important; gap:8px!important; padding:10px!important; border-radius:20px!important; margin-bottom:10px!important; }
  .jobpilot-mobile-tabs button{ flex:0 0 auto!important; min-height:42px!important; white-space:nowrap!important; }
  .mobile-stack-grid{ display:flex!important; flex-direction:column!important; width:100%!important; max-width:100%!important; padding:0!important; gap:12px!important; }
  .mobile-card-tight, .mobile-stack-grid > *{ width:100%!important; max-width:100%!important; min-width:0!important; box-sizing:border-box!important; }
  .mobile-action-grid{ display:grid!important; grid-template-columns:1fr 1fr!important; gap:8px!important; width:100%!important; }
  .mobile-action-grid > *{ width:100%!important; min-width:0!important; }
  input, textarea, select{ width:100%!important; max-width:100%!important; min-width:0!important; box-sizing:border-box!important; font-size:16px!important; }
  button{ min-height:42px!important; touch-action:manipulation!important; }
  .resume-mobile-shell{ width:100%!important; max-width:100%!important; overflow-x:auto!important; -webkit-overflow-scrolling:touch!important; border-radius:20px!important; padding:10px!important; box-sizing:border-box!important; }
  .resume-mobile-shell .resume-page{ transform:none!important; transform-origin:top left!important; min-width:794px!important; width:794px!important; }
  .resume-mobile-shell::before{ content:'Resume preview is A4 size. Swipe left/right to view it.'!important; display:block!important; margin:0 0 10px!important; padding:9px 10px!important; border-radius:14px!important; text-align:center!important; color:#bfdbfe!important; background:rgba(37,99,235,.14)!important; border:1px solid rgba(96,165,250,.25)!important; font-size:11px!important; font-weight:900!important; }
  .jobpilot-mobile-bottom-nav{ display:grid!important; grid-template-columns:repeat(4,1fr)!important; position:fixed!important; left:8px!important; right:8px!important; bottom:calc(8px + env(safe-area-inset-bottom,0px))!important; z-index:99999!important; background:rgba(2,6,23,.96)!important; border:1px solid rgba(255,255,255,.14)!important; border-radius:20px!important; padding:7px!important; gap:5px!important; box-shadow:0 18px 55px rgba(0,0,0,.55)!important; backdrop-filter:blur(18px)!important; }
  .jobpilot-mobile-bottom-nav button{ display:flex!important; flex-direction:column!important; align-items:center!important; justify-content:center!important; gap:2px!important; border:0!important; background:transparent!important; color:#94a3b8!important; border-radius:15px!important; padding:7px 3px!important; font-size:10px!important; font-weight:900!important; min-height:46px!important; }
  .jobpilot-mobile-bottom-nav button.active{ background:linear-gradient(135deg,#2563eb,#7c3aed)!important; color:white!important; }
}


/* Phase 10 phone polish: app-like mobile layout */
@media (max-width: 760px){
  .jobpilot-root-layout{display:block!important;height:auto!important;min-height:100dvh!important;overflow:visible!important;padding:0!important;}
  .jobpilot-mobile-shell{display:block!important;min-height:100dvh!important;height:auto!important;overflow:visible!important;padding:8px 8px 104px!important;}
  .jobpilot-mobile-shell > div:not(.jobpilot-mobile-tabs){height:auto!important;min-height:auto!important;overflow:visible!important;}
  .jobpilot-mobile-shell [class*="h-full"]{height:auto!important;min-height:auto!important;}
  .jobpilot-mobile-shell [class*="overflow-y-auto"]{overflow:visible!important;}
  .jobpilot-mobile-shell [class*="grid"]{max-width:100%!important;}
  .jobpilot-mobile-shell .mobile-stack-grid{display:flex!important;flex-direction:column!important;}
  .jobpilot-mobile-shell h1{font-size:24px!important;line-height:1.15!important;}
  .jobpilot-mobile-shell h2{font-size:22px!important;line-height:1.2!important;}
  .jobpilot-mobile-shell h3{font-size:18px!important;line-height:1.25!important;}
  .jobpilot-mobile-shell p{font-size:14px!important;}
  .jobpilot-mobile-shell .mobile-card-tight,
  .jobpilot-mobile-shell [class*="rounded-3xl"],
  .jobpilot-mobile-shell [class*="rounded-["]{border-radius:20px!important;}
  .jobpilot-mobile-shell .mobile-action-grid,
  .jobpilot-mobile-shell [class*="flex"][class*="gap-2"],
  .jobpilot-mobile-shell [class*="flex"][class*="gap-3"]{flex-wrap:wrap!important;}
  .jobpilot-mobile-shell button{white-space:normal!important;line-height:1.15!important;min-height:44px!important;}
  .jobpilot-mobile-shell textarea{min-height:160px!important;}
  .jobpilot-mobile-tabs{position:sticky!important;top:0!important;z-index:70!important;margin:0 0 8px!important;padding:8px!important;background:rgba(2,6,23,.96)!important;border:1px solid rgba(255,255,255,.10)!important;}
  .jobpilot-account-bar{position:sticky!important;top:0!important;z-index:75!important;margin:0!important;border-radius:0 0 18px 18px!important;}
  .resume-mobile-shell{margin:0!important;}
  .resume-mobile-shell .resume-page{min-width:760px!important;width:760px!important;}
  .jobpilot-mobile-bottom-nav{left:8px!important;right:8px!important;bottom:8px!important;border-radius:22px!important;}
  .jobpilot-mobile-bottom-nav button{font-size:10px!important;min-height:48px!important;}
}

@media (min-width:901px){
  .jobpilot-mobile-bottom-nav{ display:none!important; }
}
`

function isFilledValue(value) {
  if (Array.isArray(value)) return value.some(isFilledValue)
  if (value && typeof value === "object") return Object.values(value).some(isFilledValue)
  return String(value || "").trim().length > 0
}

function cleanResumeArray(list = [], keys = []) {
  return (Array.isArray(list) ? list : [])
    .map((item) => ({ ...item }))
    .filter((item) => keys.some((key) => isFilledValue(item?.[key])))
}

function ensureResumeHasUsefulDefaults(resume) {
  const next = normalizeResume(resume)
  if (!next.summary && next.personal.role) {
    next.summary = `Motivated ${next.personal.role} with practical knowledge, project experience, and a strong interest in building professional, user-focused solutions.`
  }
  if (!next.projects.length && Object.values(next.skills || {}).join(" ").trim()) {
    next.projects = [
      {
        name: "Professional Portfolio Project",
        tech: Object.values(next.skills || {}).filter(Boolean).slice(0, 3).join(", "),
        link: next.personal.github || next.personal.portfolio || "",
        bullets: [
          "Built a practical project to demonstrate technical skills and problem-solving ability.",
          "Applied clean structure, responsive design, and professional development practices.",
          "Improved the project through testing, debugging, and user-focused refinements.",
        ],
      },
    ]
  }
  return next
}

function normalizeResume(input) {
  const r = input || {}

  return {
    ...defaultResume,
    ...r,
    personal: { ...defaultResume.personal, ...(r.personal || {}) },
    skills: { ...defaultResume.skills, ...(r.skills || {}) },
    projects: cleanResumeArray(r.projects, ["name", "tech", "link", "bullets"]),
    experience: cleanResumeArray(r.experience, ["role", "company", "location", "duration", "bullets"]),
    internships: cleanResumeArray(r.internships, ["role", "company", "location", "duration", "bullets"]),
    education: cleanResumeArray(r.education, ["degree", "institution", "location", "duration", "details"]),
    certifications: cleanResumeArray(r.certifications, ["name", "issuer", "year", "link"]),
    achievements: cleanResumeArray(r.achievements, ["title", "description"]),
    languages: cleanResumeArray(r.languages, ["name", "level"]),
    updatedAt: now(),
  }
}

function resumeToPlainText(resume) {
  const p = resume.personal
  const out = []

  if (p.name) out.push(p.name.toUpperCase())
  if (p.role) out.push(p.role)
  out.push([p.phone, p.email, p.location].filter(Boolean).join(" | "))
  out.push([p.linkedin, p.github, p.portfolio].filter(Boolean).join(" | "))
  out.push("")

  if (resume.summary) out.push("PROFESSIONAL SUMMARY", resume.summary, "")
  if (resume.objective) out.push("CAREER OBJECTIVE", resume.objective, "")

  out.push("TECHNICAL SKILLS")
  Object.entries(resume.skills || {}).forEach(([k, v]) => {
    if (v) out.push(`${k.toUpperCase()}: ${v}`)
  })
  out.push("")

  if (resume.education?.length) {
    out.push("EDUCATION")
    resume.education.forEach((e) => {
      out.push(e.degree || "")
      out.push([e.institution, e.location].filter(Boolean).join(", "))
      out.push([e.duration, e.details].filter(Boolean).join(" | "))
      out.push("")
    })
  }

  if (resume.projects?.length) {
    out.push("PROJECTS")
    resume.projects.forEach((p) => {
      out.push(p.name || "")
      if (p.tech) out.push(`Technologies: ${p.tech}`)
      ;(p.bullets || []).forEach((b) => out.push(`- ${b}`))
      if (p.link) out.push(`Link: ${p.link}`)
      out.push("")
    })
  }

  if (resume.experience?.length) {
    out.push("WORK EXPERIENCE")
    resume.experience.forEach((e) => {
      out.push([e.role, e.company].filter(Boolean).join(" — "))
      out.push([e.location, e.duration].filter(Boolean).join(" | "))
      ;(e.bullets || []).forEach((b) => out.push(`- ${b}`))
      out.push("")
    })
  }

  if (resume.internships?.length) {
    out.push("INTERNSHIPS")
    resume.internships.forEach((e) => {
      out.push([e.role, e.company].filter(Boolean).join(" — "))
      out.push([e.location, e.duration].filter(Boolean).join(" | "))
      ;(e.bullets || []).forEach((b) => out.push(`- ${b}`))
      out.push("")
    })
  }

  if (resume.certifications?.length) {
    out.push("CERTIFICATIONS")
    resume.certifications.forEach((c) => out.push(`- ${[c.name, c.issuer, c.year].filter(Boolean).join(" | ")}`))
    out.push("")
  }

  if (resume.achievements?.length) {
    out.push("ACHIEVEMENTS")
    resume.achievements.forEach((a) => out.push(`- ${[a.title, a.description].filter(Boolean).join(" - ")}`))
    out.push("")
  }

  if (resume.languages?.length) {
    out.push("LANGUAGES")
    resume.languages.forEach((l) => out.push(`- ${[l.name, l.level].filter(Boolean).join(" - ")}`))
  }

  return out.filter((x) => x !== undefined && x !== null).join("\n")
}

function parseAIResumeJson(text) {
  const raw = String(text || "")
  const block =
    raw.match(/```json([\s\S]*?)```/i)?.[1] ||
    raw.match(/```([\s\S]*?)```/)?.[1] ||
    raw.match(/\{[\s\S]*\}/)?.[0] ||
    raw

  return JSON.parse(block)
}



function humanizeAIReply(reply = "", context = "") {
  const text = String(reply || "").trim()
  if (!text) return "I can help with that. Please tell me what you want me to write or explain."

  // IMPORTANT: JobPilot AI is now a normal assistant. Do not fake resume edits.
  // Also do not cut useful replies with "..." because users need full answers.
  if (text.includes("[[COPY_RESULT_START]]")) return text

  // Hide accidental JSON/action dumps from old backend versions.
  if (/^\s*\{[\s\S]*"actions"[\s\S]*\}\s*$/.test(text)) {
    return "I can help write clean resume content for you to copy, but direct AI editing is disabled right now."
  }

  return text
}


function prettyPathName(path = "") {
  const map = {
    "personal.name": "name",
    "personal.role": "target role",
    "personal.email": "email",
    "personal.phone": "phone",
    "personal.location": "location",
    "personal.linkedin": "LinkedIn",
    "personal.github": "GitHub",
    "personal.portfolio": "portfolio",
    summary: "professional summary",
    objective: "career objective",
    "skills.languages": "programming languages",
    "skills.frontend": "frontend skills",
    "skills.backend": "backend skills",
    "skills.database": "database skills",
    "skills.tools": "tools",
    "skills.other": "other skills",
    education: "education",
    projects: "projects",
    experience: "work experience",
    internships: "internships",
    certifications: "certifications",
    achievements: "achievements",
    languages: "languages",
    atsKeywords: "ATS keywords",
  }

  return map[path] || String(path || "resume").replace(/\./g, " ")
}

function summarizeAppliedActions(actions = [], originalMessage = "") {
  const cleanActions = Array.isArray(actions) ? actions.filter((a) => a?.path) : []
  const unique = [...new Set(cleanActions.map((a) => prettyPathName(a.path)))]

  if (!unique.length) return []

  const msg = String(originalMessage || "").toLowerCase()
  const changes = unique.slice(0, 8).map((name) => {
    if (msg.includes("python") && name === "target role") return "changed target role to Python Developer"
    if (msg.includes("java") && name === "target role") return "changed target role to Java Developer"
    if (msg.includes("data analyst") && name === "target role") return "changed target role to Data Analyst"
    if (name === "projects") return "improved the projects section"
    if (name === "professional summary") return "rewrote the professional summary"
    if (name === "career objective") return "updated the career objective"
    if (name.includes("skills") || name === "tools" || name === "programming languages") return `updated ${name}`
    return `updated ${name}`
  })

  return [...new Set(changes)]
}

function makeActionChatReply(actions = [], originalMessage = "", fallback = "") {
  const changes = summarizeAppliedActions(actions, originalMessage)

  if (!changes.length) {
    return fallback && !/done\s*[—-]\s*i updated your resume preview/i.test(fallback)
      ? fallback
      : "I checked the resume, but I could not find a clear visible change to apply. Try asking with a specific section, like: ‘improve my project bullets’ or ‘make the role Python Developer’."
  }

  return `Done — I updated your resume preview.\n\nChanged:\n${changes.map((c) => `• ${c}`).join("\n")}`
}

function cloneResume(resume) {
  return JSON.parse(JSON.stringify(normalizeResume(resume)))
}

function setByPath(target, path, value) {
  const parts = String(path || "").split(".").filter(Boolean)
  if (!parts.length) return target

  let cursor = target
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {}
    cursor = cursor[key]
  }

  cursor[parts[parts.length - 1]] = value
  return target
}

function getByPath(target, path) {
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), target)
}

function emptyValueForPath(path) {
  const arrayPaths = ["education", "projects", "experience", "internships", "certifications", "achievements", "languages"]
  if (arrayPaths.includes(path)) return []
  return ""
}

function applyResumeActionsToResume(currentResume, actions = []) {
  const next = cloneResume(currentResume)

  for (const item of Array.isArray(actions) ? actions : []) {
    const action = String(item?.action || "set").toLowerCase()
    const path = item?.path
    if (!path) continue

    if (action === "set" || action === "replace" || action === "improve") {
      setByPath(next, path, item.value)
      continue
    }

    if (action === "append") {
      const existing = getByPath(next, path)
      const value = item.value
      if (Array.isArray(existing)) {
        setByPath(next, path, Array.isArray(value) ? [...existing, ...value] : [...existing, value])
      } else if (typeof existing === "string") {
        const addition = Array.isArray(value) ? value.join(", ") : String(value || "")
        setByPath(next, path, [existing, addition].filter(Boolean).join(existing ? ", " : ""))
      } else {
        setByPath(next, path, Array.isArray(value) ? value : [value])
      }
      continue
    }

    if (action === "remove") {
      setByPath(next, path, emptyValueForPath(path))
    }
  }

  return ensureResumeHasUsefulDefaults(normalizeResume(next))
}

function isResumeActionResponse(data) {
  return data?.type === "resume_action" && Array.isArray(data.actions)
}

function calculateScore(resume) {
  const hasProjects = resume.projects.length > 0
  const hasExperience = resume.experience.length > 0 || resume.internships.length > 0
  const hasUsefulProfile = Boolean(resume.personal.name && (resume.personal.email || resume.personal.phone))

  const checks = [
    ["Contact details", hasUsefulProfile, "Add name plus email or phone.", "personal"],
    ["Target role", Boolean(resume.personal.role), "Add a clear target role.", "personal"],
    ["Summary quality", String(resume.summary || "").length > 60, "Add a strong professional summary.", "summary"],
    ["Skills", Object.values(resume.skills || {}).join(" ").length > 35, "Add role-specific skills.", "skills"],
    ["Projects / proof", hasProjects || hasExperience, "Add one project, internship, or work proof if available.", hasProjects ? "projects" : "experience"],
    ["Bullet points", !hasProjects || resume.projects.some((p) => (p.bullets || []).filter(Boolean).length >= 2), "Add 2-4 bullets for each project.", "projects"],
    ["Education", true, "Education is optional when not available in the document.", "education"],
    ["Experience / internships", true, "Experience is optional for freshers.", "experience"],
    ["Links", Boolean(resume.personal.github || resume.personal.linkedin || resume.personal.portfolio) || true, "Links are optional but recommended.", "personal"],
    ["ATS keywords", String(resume.atsKeywords || "").length > 15, "Add ATS keywords from job description.", "skills"],
  ]

  const passed = checks.filter((x) => x[1]).length

  return {
    score: Math.max(82, Math.round((passed / checks.length) * 100)),
    checks,
    suggestions: checks.filter((x) => !x[1]).map((x) => x[2]),
  }
}


function inferRequestedRole(message = "") {
  const text = String(message || "").toLowerCase().replace(/\s+/g, " ").trim()
  const patterns = [
    /make\s+(?:it|this|my resume|resume)?\s*(?:to|into|as|for)?\s*(?:a|an)?\s*([a-z][a-z0-9+.#\s/-]{2,80}?)(?:\s+role|\s+resume|\s+profile|\s+job)?$/i,
    /change\s+(?:my\s+)?(?:role|target role|resume)\s+(?:to|into|as)\s*(?:a|an)?\s*([a-z][a-z0-9+.#\s/-]{2,80})/i,
    /convert\s+(?:it|this|my resume|resume)?\s*(?:to|into|as|for)\s*(?:a|an)?\s*([a-z][a-z0-9+.#\s/-]{2,80})/i,
    /tailor\s+(?:it|this|my resume|resume)?\s*(?:to|for)\s*(?:a|an)?\s*([a-z][a-z0-9+.#\s/-]{2,80})/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      let role = cleanText(match[1])
        .replace(/^(to|into|as|for)\s+/i, "")
        .replace(/\b(developer role|role|resume|profile|job|position)\b$/i, "")
        .trim()

      if (role && !/^(better|good|professional|ats|fresher|summary|objective|skills?|projects?|experience|internships?)$/i.test(role)) {
        return role
      }
    }
  }

  const roleWords = [
    "python developer",
    "java developer",
    "backend developer",
    "frontend developer",
    "full stack developer",
    "mern stack developer",
    "react developer",
    "node.js developer",
    "software developer",
    "software engineer",
    "data analyst",
    "data scientist",
    "machine learning engineer",
    "ai engineer",
    "devops engineer",
    "cloud engineer",
    "cybersecurity analyst",
    "qa tester",
    "ui ux designer",
    "digital marketing executive",
    "hr executive",
    "sales executive",
  ]

  for (const role of roleWords) {
    if (text.includes(role)) return role
  }

  return ""
}

function titleCaseRole(role = "") {
  return cleanText(role)
    .split(" ")
    .map((word) => {
      if (/^(ui|ux|qa|hr|ai|ml|sql|aws|api|apis)$/i.test(word)) return word.toUpperCase()
      if (/^(node\.js|react\.js|vue\.js)$/i.test(word)) return word.replace(/(^|\.)([a-z])/g, (m) => m.toUpperCase())
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(" ")
    .replace(/\bDeveloper\b/gi, "Developer")
}

function roleProfile(role = "", currentResume = {}) {
  const lower = String(role || "").toLowerCase()
  const roleTitle = titleCaseRole(role || currentResume?.personal?.role || "Software Developer")

  const base = {
    role: roleTitle,
    summary: `Motivated ${roleTitle} with practical knowledge, project experience, and a strong interest in building clean, reliable, and user-focused technology solutions. Skilled in problem solving, debugging, learning quickly, and applying professional development practices to real projects.`,
    objective: `Seeking an entry-level ${roleTitle} role where I can apply my technical skills, strengthen my real-world experience, and contribute to building high-quality software solutions.`,
    skills: {},
    atsKeywords: `${roleTitle}, Problem Solving, Debugging, Git, GitHub, APIs, Software Development, Communication, Teamwork`,
  }

  if (lower.includes("python")) {
    base.summary = "Motivated Python Developer with practical knowledge of Python, backend development, databases, APIs, and problem-solving. Experienced in building real-world projects, writing clean code, debugging issues, and learning modern development practices to create reliable software solutions."
    base.objective = "Seeking an entry-level Python Developer role where I can apply my Python programming skills, backend development knowledge, database understanding, and problem-solving ability to build efficient software solutions and grow as a professional developer."
    base.skills = {
      languages: "Python, JavaScript, HTML, CSS, C, C++",
      backend: "Python, Flask, Django basics, Node.js, Express.js, REST APIs",
      database: "MySQL, MongoDB, SQL",
      tools: "Git, GitHub, VS Code, Postman",
      other: "Problem Solving, Debugging, API Integration, OOP",
    }
    base.atsKeywords = "Python Developer, Python, Flask, Django, REST API, Backend Development, MySQL, MongoDB, SQL, Git, GitHub, Debugging, Problem Solving, OOP"
  } else if (lower.includes("java") || lower.includes("spring")) {
    base.summary = "Motivated Java Developer with practical knowledge of Java, object-oriented programming, backend development, databases, and REST APIs. Skilled in writing clean code, solving problems, debugging applications, and learning enterprise development practices."
    base.objective = "Seeking an entry-level Java Developer role where I can apply my Java, backend development, database, and problem-solving skills to build reliable applications and grow as a professional software developer."
    base.skills = {
      languages: "Java, Python, JavaScript, HTML, CSS, C, C++",
      backend: "Java, Spring Boot basics, REST APIs, Node.js, Express.js",
      database: "MySQL, MongoDB, SQL",
      tools: "Git, GitHub, VS Code, Postman, IntelliJ IDEA",
      other: "OOP, Problem Solving, Debugging, API Integration",
    }
    base.atsKeywords = "Java Developer, Java, Spring Boot, REST API, Backend Development, OOP, MySQL, SQL, MongoDB, Git, GitHub, Debugging, Problem Solving"
  } else if (lower.includes("data analyst") || lower.includes("analyst")) {
    base.summary = "Motivated Data Analyst with practical knowledge of data cleaning, SQL, Excel, Python basics, dashboards, and analytical thinking. Skilled in organizing data, finding insights, solving problems, and presenting information clearly for decision-making."
    base.objective = "Seeking an entry-level Data Analyst role where I can apply my SQL, Excel, Python, data visualization, and analytical skills to support business decisions and grow professionally."
    base.skills = {
      languages: "Python, SQL, JavaScript, HTML, CSS",
      database: "MySQL, SQL, MongoDB",
      tools: "Excel, Power BI basics, Tableau basics, Git, GitHub, VS Code",
      other: "Data Cleaning, Data Analysis, Dashboarding, Problem Solving, Communication",
    }
    base.atsKeywords = "Data Analyst, SQL, Python, Excel, Power BI, Tableau, Data Cleaning, Data Visualization, Dashboard, MySQL, Analysis, Reporting"
  } else if (lower.includes("backend")) {
    base.summary = "Motivated Backend Developer with practical knowledge of server-side development, APIs, databases, authentication, and clean application structure. Skilled in solving problems, debugging backend logic, integrating services, and building reliable systems."
    base.objective = "Seeking an entry-level Backend Developer role where I can apply my backend development, API, database, and problem-solving skills to build reliable and scalable software solutions."
    base.skills = {
      languages: "JavaScript, Python, Java, HTML, CSS, C, C++",
      backend: "Node.js, Express.js, Python, Flask basics, REST APIs, Authentication",
      database: "MySQL, MongoDB, SQL",
      tools: "Git, GitHub, VS Code, Postman",
      other: "Problem Solving, Debugging, API Integration, Backend Architecture basics",
    }
    base.atsKeywords = "Backend Developer, Node.js, Express.js, Python, REST API, API Integration, MySQL, MongoDB, SQL, Authentication, Git, Debugging"
  } else if (lower.includes("frontend") || lower.includes("react") || lower.includes("ui developer")) {
    base.summary = "Motivated Frontend Developer with practical knowledge of React, JavaScript, HTML, CSS, responsive design, and API integration. Skilled in building clean user interfaces, debugging UI issues, and creating user-friendly web applications."
    base.objective = "Seeking an entry-level Frontend Developer role where I can apply my React, JavaScript, responsive design, and problem-solving skills to build clean and user-friendly web applications."
    base.skills = {
      languages: "JavaScript, HTML, CSS, Python, C, C++",
      frontend: "ReactJS, Tailwind CSS, Responsive Design, API Integration",
      backend: "Node.js, Express.js basics",
      database: "MySQL, MongoDB",
      tools: "Git, GitHub, VS Code, Chrome DevTools",
      other: "Problem Solving, Debugging, UI Design basics",
    }
    base.atsKeywords = "Frontend Developer, React, JavaScript, HTML, CSS, Tailwind CSS, Responsive Design, API Integration, UI Development, Git, Debugging"
  } else if (lower.includes("full stack") || lower.includes("mern")) {
    base.summary = "Motivated Full Stack Developer with practical knowledge of frontend development, backend APIs, databases, and full application workflows. Skilled in building responsive interfaces, integrating APIs, managing data, and debugging complete web applications."
    base.objective = "Seeking an entry-level Full Stack Developer role where I can apply my frontend, backend, database, and problem-solving skills to build complete and reliable web applications."
    base.skills = {
      languages: "JavaScript, Python, HTML, CSS, C, C++",
      frontend: "ReactJS, Tailwind CSS, Responsive Design",
      backend: "Node.js, Express.js, REST APIs",
      database: "MongoDB, MySQL, SQL",
      tools: "Git, GitHub, VS Code, Postman",
      other: "Problem Solving, Debugging, API Integration, Full Stack Development",
    }
    base.atsKeywords = "Full Stack Developer, MERN Stack, React, Node.js, Express.js, MongoDB, JavaScript, REST API, MySQL, Git, Debugging"
  }

  return base
}

function buildRoleActions(role, currentResume = {}) {
  const profile = roleProfile(role, currentResume)
  const actions = [
    { action: "set", path: "personal.role", value: profile.role },
    { action: "set", path: "summary", value: profile.summary },
    { action: "set", path: "objective", value: profile.objective },
    { action: "set", path: "atsKeywords", value: profile.atsKeywords },
  ]

  for (const [key, value] of Object.entries(profile.skills || {})) {
    actions.push({ action: "set", path: `skills.${key}`, value })
  }

  return actions
}


function normalizeLoose(text = "") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function findBestProjectIndex(projects = [], message = "") {
  const msg = normalizeLoose(message)
  if (!Array.isArray(projects) || !projects.length) return -1

  let bestIndex = 0
  let bestScore = 0

  projects.forEach((project, index) => {
    const name = normalizeLoose(project?.name || "")
    const tech = normalizeLoose(project?.tech || "")
    const words = name.split(" ").filter((w) => w.length > 2)
    let score = 0

    words.forEach((word) => {
      if (msg.includes(word)) score += 3
    })

    tech.split(" ").filter((w) => w.length > 2).forEach((word) => {
      if (msg.includes(word)) score += 1
    })

    if (msg.includes("movie") && name.includes("movie")) score += 10
    if (msg.includes("search") && name.includes("search")) score += 6
    if (msg.includes("jobpilot") && name.includes("jobpilot")) score += 10
    if (msg.includes("resume") && name.includes("resume")) score += 8

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  })

  return bestScore > 0 ? bestIndex : 0
}

function buildProjectBulletFromCommand(message = "", project = {}) {
  const raw = cleanText(message)
  const lower = raw.toLowerCase()
  const projectName = project?.name || "this project"
  const tech = project?.tech || "relevant technologies"

  const direct = raw
    .replace(/^add\s+/i, "")
    .replace(/\s+(in|into|to|for)\s+(my\s+)?(.+?)\s+proj(?:ect|ct)?\s*$/i, "")
    .replace(/^some\s+sentence\s*/i, "")
    .trim()

  if (direct && direct.length > 18 && !/^(some sentence|sentence|points?|bullet)$/i.test(direct)) {
    return direct.charAt(0).toUpperCase() + direct.slice(1).replace(/[.!?]*$/, ".")
  }

  if (lower.includes("movie") || normalizeLoose(projectName).includes("movie")) {
    return "Developed a responsive movie search experience with real-time API data, smooth navigation, clean UI structure, and user-friendly movie detail pages."
  }

  if (lower.includes("api") || String(tech).toLowerCase().includes("api")) {
    return `Integrated APIs in ${projectName} to fetch dynamic data, improve usability, and create a smoother user experience.`
  }

  if (lower.includes("responsive") || lower.includes("mobile")) {
    return `Improved ${projectName} with responsive layouts to deliver a consistent experience across desktop and mobile devices.`
  }

  return `Enhanced ${projectName} using ${tech} with cleaner functionality, better user experience, and recruiter-friendly project presentation.`
}

function isProjectUpdateIntent(message = "") {
  const text = String(message || "").toLowerCase()
  return (
    /(add|insert|include|write|put|create).*(sentence|point|bullet|line|detail|description).*(project|projct|proj)/i.test(text) ||
    /(improve|update|rewrite|enhance).*(project|projct|proj)/i.test(text) ||
    /project.*(add|insert|include|write|put|improve|update|rewrite|enhance)/i.test(text)
  )
}

function summarizeResumeDiff(before = {}, after = {}, message = "") {
  const changes = []
  const b = normalizeResume(before)
  const a = normalizeResume(after)

  if (b.personal?.role !== a.personal?.role) changes.push(`changed target role to ${a.personal.role || "new role"}`)
  if (b.summary !== a.summary) changes.push("updated professional summary")
  if (b.objective !== a.objective) changes.push("updated career objective")
  if (JSON.stringify(b.skills) !== JSON.stringify(a.skills)) changes.push("updated skills")
  if (JSON.stringify(b.projects) !== JSON.stringify(a.projects)) changes.push("updated projects")
  if (JSON.stringify(b.education) !== JSON.stringify(a.education)) changes.push("updated education")
  if (JSON.stringify(b.experience) !== JSON.stringify(a.experience)) changes.push("updated work experience")
  if (JSON.stringify(b.internships) !== JSON.stringify(a.internships)) changes.push("updated internships")
  if (JSON.stringify(b.certifications) !== JSON.stringify(a.certifications)) changes.push("updated certifications")
  if (JSON.stringify(b.achievements) !== JSON.stringify(a.achievements)) changes.push("updated achievements")
  if (JSON.stringify(b.languages) !== JSON.stringify(a.languages)) changes.push("updated languages")
  if (b.atsKeywords !== a.atsKeywords) changes.push("updated ATS keywords")

  return changes.length ? changes : ["updated the resume preview"]
}

function buildImprovedSummary(resume = {}, message = "") {
  const role = resume?.personal?.role || "software developer"
  const skills = Object.values(resume?.skills || {})
    .join(", ")
    .split(",")
    .map((s) => cleanText(s))
    .filter(Boolean)
  const topSkills = uniqueList(skills).slice(0, 10).join(", ")
  const projectNames = Array.isArray(resume?.projects)
    ? resume.projects.map((p) => p?.name).filter(Boolean).slice(0, 2).join(" and ")
    : ""

  const base = `Detail-oriented ${role} with hands-on project experience and practical knowledge of ${topSkills || "modern development tools"}. Skilled at building clean, responsive, and reliable solutions, debugging issues, integrating APIs, and presenting work professionally for real job opportunities.`

  if (projectNames) {
    return `${base} Built projects like ${projectNames}, showing the ability to turn technical learning into practical, user-focused applications.`
  }

  return base
}

function buildImprovedObjective(resume = {}) {
  const role = resume?.personal?.role || "software developer"
  return `Seeking an entry-level ${role} role where I can apply my technical skills, project experience, and problem-solving ability to build reliable software solutions, learn from experienced teams, and grow into a strong professional developer.`
}

function applyLocalIntent(message, resume) {
  const text = String(message || "").toLowerCase()
  let next = normalizeResume(resume)
  let handled = false
  let reply = ""
  let actions = []

  const addAction = (action) => {
    actions.push(action)
    return action
  }

  const requestedRole = inferRequestedRole(message)
  const roleChangeIntent = requestedRole && /(make|change|convert|tailor|update|set).*(role|resume|profile|it|this|to|into|for|as)|\b(developer|analyst|engineer|designer|tester|executive)\b/i.test(message)

  if (roleChangeIntent) {
    const roleActions = buildRoleActions(requestedRole, next)
    actions = [...actions, ...roleActions]
    next = applyResumeActionsToResume(next, roleActions)
    handled = true
    reply = `Done — I updated the resume for ${titleCaseRole(requestedRole)} roles.\n\nChanged:\n• target role\n• professional summary\n• career objective\n• skills\n• ATS keywords`
  }

  if (text.includes("remove internship") || text.includes("delete internship")) {
    next.internships = []
    handled = true
    addAction({ action: "replace", path: "internships", value: [] })
    reply = "Done — I removed internships from your resume preview."
  }

  if (text.includes("remove experience") || text.includes("delete experience")) {
    next.experience = []
    handled = true
    addAction({ action: "replace", path: "experience", value: [] })
    reply = "Done — I removed work experience from your resume preview."
  }

  if (text.includes("make ats") || text.includes("ats friendly") || text.includes("ats-friendly")) {
    const ats = uniqueList([
      next.personal.role,
      ...Object.values(next.skills || {}).join(",").split(","),
      "ATS Friendly Resume",
      "Problem Solving",
      "Communication",
      "Teamwork",
      "Project Development",
      "Debugging",
    ]).join(", ")

    next.atsKeywords = ats
    next.summary = buildImprovedSummary(next, message)

    handled = true
    addAction({ action: "set", path: "atsKeywords", value: ats })
    addAction({ action: "set", path: "summary", value: next.summary })
    reply = "Done — I made the resume more ATS-friendly and improved the summary using your existing skills."
  }

  if (text.includes("fresher resume") || text.includes("make fresher")) {
    next.experience = []
    next.personal.role = next.personal.role || "Software Developer"
    next.objective = `Seeking an entry-level ${next.personal.role || "software developer"} opportunity where I can apply my technical knowledge, build real-world solutions, learn from experienced professionals, and contribute to high-quality work.`
    next.summary = `Motivated fresher with practical knowledge of ${Object.values(next.skills).filter(Boolean).join(", ")}. Experienced in building academic and personal projects, learning modern development workflows, and solving real-world problems with clean and user-friendly solutions.`
    handled = true
    addAction({ action: "replace", path: "experience", value: [] })
    addAction({ action: "set", path: "summary", value: next.summary })
    addAction({ action: "set", path: "objective", value: next.objective })
    reply = "Done — I converted it into a stronger fresher resume without adding fake experience."
  }

  const addSkillsMatch = text.match(/add\s+(.+?)\s+to\s+(my\s+)?skills/i) || text.match(/add skills?\s*[:\-]?\s*(.+)/i)

  if (addSkillsMatch) {
    const skills = splitList(addSkillsMatch[1] || addSkillsMatch[3])
    const existing = splitList(next.skills.other)
    next.skills.other = uniqueList([...existing, ...skills]).join(", ")
    handled = true
    addAction({ action: "set", path: "skills.other", value: next.skills.other })
    reply = `Done — I added ${skills.join(", ")} to your skills and updated the preview.`
  }

  if (/\b(improve|upgrade|rewrite|better|make).*\bsummary\b|\bsummary\b.*\b(improve|upgrade|rewrite|better)\b/i.test(message)) {
    next.summary = buildImprovedSummary(next, message)
    handled = true
    addAction({ action: "set", path: "summary", value: next.summary })
    reply = `Done — I rewrote your professional summary.\n\nNew summary:\n${next.summary}`
  }

  if (text.includes("career objective") && /(better|improve|rewrite|change|update|make)/i.test(text)) {
    next.objective = buildImprovedObjective(next)
    handled = true
    addAction({ action: "set", path: "objective", value: next.objective })
    reply = `Done — I rewrote your career objective.\n\nNew objective:\n${next.objective}`
  }

  if (text.includes("amazon") && (text.includes("experience") || text.includes("work"))) {
    const exists = next.experience.some((e) => String(e.company || "").toLowerCase().includes("amazon"))

    if (!exists) {
      const item = {
        role: "Amazon Associate",
        company: "Amazon",
        location: "",
        duration: "",
        bullets: [
          "Supported daily operational workflows with accuracy, speed, and attention to detail.",
          "Worked in a fast-paced team environment while maintaining productivity and quality standards.",
          "Developed strong discipline, communication, time management, and problem-solving skills.",
        ],
      }
      next.experience = [...next.experience, item]
      addAction({ action: "append", path: "experience", value: item })
    }

    handled = true
    reply = "I added an Amazon experience section with safe professional wording. Open Edit Profile and update role, location, and duration with your real details."
  }

  if (isProjectUpdateIntent(message)) {
    const projects = Array.isArray(next.projects) && next.projects.length
      ? next.projects
      : [
          {
            name: "Professional Project",
            tech: Object.values(next.skills || {}).filter(Boolean).join(", "),
            link: "",
            bullets: [],
          },
        ]

    const index = findBestProjectIndex(projects, message)
    const project = projects[index] || projects[0]
    const bullet = buildProjectBulletFromCommand(message, project)
    const existingBullets = Array.isArray(project.bullets) ? project.bullets.filter(Boolean) : []
    const alreadyExists = existingBullets.some((b) => normalizeLoose(b) === normalizeLoose(bullet))

    const updatedProject = {
      ...project,
      bullets: alreadyExists ? existingBullets : [...existingBullets, bullet],
    }

    next.projects = projects.map((item, i) => (i === index ? updatedProject : item))
    handled = true
    addAction({ action: "replace", path: "projects", value: next.projects })
    reply = `Done — I added a stronger bullet to ${updatedProject.name || "your project"}.\n\nAdded bullet:\n${bullet}`
  }

  return { handled, resume: ensureResumeHasUsefulDefaults(normalizeResume(next)), reply, actions }
}

function Button({ children, onClick, disabled, variant = "soft", className = "" }) {
  const styles = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-950/30 border border-blue-300/10",
    premium: "bg-gradient-to-r from-amber-300 via-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-950/30 hover:brightness-105 border border-amber-200/40",
    green: "bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-300/10",
    red: "bg-red-500/20 text-red-100 hover:bg-red-500/30 border border-red-300/10",
    soft: "bg-white/[0.055] text-slate-100 hover:bg-white/[0.095] border border-white/10 shadow-inner shadow-white/5",
    dark: "bg-slate-900 text-slate-100 hover:bg-slate-800 border border-white/10",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

function Panel({ children, className = "", ...props }) {
  return (
    <div {...props} className={`rounded-3xl border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, textarea = false, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
        />
      ) : (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400"
        />
      )}
    </label>
  )
}

function Autocomplete({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState(null)
  const ref = useRef(null)

  const filtered = options
    .filter((x) => x.toLowerCase().includes(String(value || "").toLowerCase()))
    .slice(0, 12)

  const updateRect = () => {
    const box = ref.current?.getBoundingClientRect()
    if (box) {
      setRect({
        top: box.bottom + 8,
        left: box.left,
        width: box.width,
      })
    }
  }

  useEffect(() => {
    if (!open) return

    updateRect()

    const close = (e) => {
      if (!ref.current?.contains(e.target) && !e.target.closest?.("[data-autocomplete-menu='true']")) {
        setOpen(false)
      }
    }

    window.addEventListener("mousedown", close)
    window.addEventListener("scroll", updateRect, true)
    window.addEventListener("resize", updateRect)

    return () => {
      window.removeEventListener("mousedown", close)
      window.removeEventListener("scroll", updateRect, true)
      window.removeEventListener("resize", updateRect)
    }
  }, [open, value])

  const menu =
    open && rect
      ? createPortal(
          <div
            data-autocomplete-menu="true"
            style={{
              position: "fixed",
              top: rect.top,
              left: rect.left,
              width: rect.width,
              zIndex: 999999,
            }}
            className="max-h-72 overflow-y-auto rounded-2xl border border-blue-400/40 bg-slate-950 p-2 shadow-2xl shadow-black/80"
          >
            {filtered.length ? (
              filtered.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onChange(item)
                    setOpen(false)
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-blue-600 hover:text-white"
                >
                  {item}
                </button>
              ))
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="block w-full rounded-xl bg-violet-600 px-3 py-2 text-left text-sm font-semibold text-white"
              >
                Use custom: {value}
              </button>
            )}
          </div>,
          document.body
        )
      : null

  return (
    <div ref={ref} className="relative">
      <Field
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={(v) => {
          onChange(v)
          setOpen(true)
        }}
      />
      {menu}
    </div>
  )
}

function SelectBox({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
      >
        {options.map((option) => (
          <option key={typeof option === "string" ? option : option.code} value={typeof option === "string" ? option : option.code}>
            {typeof option === "string" ? option : option.name}
          </option>
        ))}
      </select>
    </label>
  )
}


function AuthScreen({ onAuth, onForgotPassword, onResetPassword, loading, error, notice }) {
  const [mode, setMode] = useState("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")

  const submit = async (e) => {
    e.preventDefault()

    if (mode === "forgot") {
      await onForgotPassword({ email })
      setMode("reset")
      return
    }

    if (mode === "reset") {
      await onResetPassword({ email, code, password })
      setCode("")
      setPassword("")
      setMode("login")
      return
    }

    onAuth({ mode, name, email, password })
  }

  const title = mode === "signup" ? "Create account" : mode === "forgot" ? "Forgot password" : mode === "reset" ? "Reset password" : "Login"
  const subtitle =
    mode === "signup"
      ? "Create your JobPilot account to save jobs, resumes, and tracker data."
      : mode === "forgot"
        ? "Enter your email and we will create a reset code."
        : mode === "reset"
          ? "Enter the reset code and your new password."
          : "Continue your JobPilot workspace."

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#050816] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb66,transparent_34%),radial-gradient(circle_at_bottom_right,#7c3aed66,transparent_34%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 shadow-2xl shadow-black/40 backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="p-8 md:p-12">
          <div className="mb-8 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-200">
            JobPilot AI Cloud Beta
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">
            Find jobs.<br />Build resumes.<br />Track applications.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Login to protect your resumes, saved job applications, templates, uploaded documents, and tracker data before launching worldwide.
          </p>

          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            {[
              "Real job search workspace",
              "Cloud resume saving",
              "Application tracker",
              "Worldwide deployment ready",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 font-bold">
                ✓ {item}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="border-t border-white/10 bg-white/[0.04] p-6 md:p-10 lg:border-l lg:border-t-0">
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

          <div className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="Your name" />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="you@example.com" />
            </label>

            {mode === "reset" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">Reset code</span>
                <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="6-digit code" />
              </label>
            )}

            {mode !== "forgot" && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">{mode === "reset" ? "New password" : "Password"}</span>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-400" placeholder="Minimum 6 characters" />
              </label>
            )}
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-100">{error}</div>}
          {notice && <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-100">{notice}</div>}

          <button disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 font-black text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:opacity-60">
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset code"
                    : "Reset password"}
          </button>

          {mode === "login" && (
            <button type="button" onClick={() => setMode("forgot")} className="mt-3 w-full rounded-2xl px-5 py-2 text-sm font-black text-blue-200 hover:text-white">
              Forgot password?
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setCode("")
              setPassword("")
              setMode(mode === "login" ? "signup" : "login")
            }}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200 hover:bg-white/[0.08]"
          >
            {mode === "login" ? "Need an account? Sign up" : "Back to login"}
          </button>
        </form>
      </div>
    </div>
  )
}

function AccountBar({ user, onLogout, cloudLoading, cloudStatus, backendStatus }) {
  return (
    <div className="jobpilot-account-bar fixed right-4 top-4 z-[99990] flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/85 px-3 py-2 text-xs text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <span className={`h-2.5 w-2.5 rounded-full ${backendStatus?.state === "online" ? "bg-emerald-400" : backendStatus?.state === "offline" ? "bg-red-400" : "bg-yellow-300"}`} title={backendStatus?.message || "System status"} />
      <span className="hidden max-w-[260px] truncate sm:inline">
        {cloudLoading ? "Syncing..." : backendStatus?.state === "offline" ? "Backend offline" : cloudStatus || user?.email || "Logged in"}
      </span>
      <button onClick={onLogout} className="rounded-xl bg-white/[0.06] px-3 py-2 font-black hover:bg-white/[0.12]">
        Logout
      </button>
    </div>
  )
}


function MobileBottomNav({ section, setSection }) {
  const items = [
    ["studio", "Studio", "📄"],
    ["jobs", "Jobs", "💼"],
    ["workspace", "Apply", "✉️"],
    ["tracker", "Track", "✅"],
  ]

  return (
    <nav className="jobpilot-mobile-bottom-nav">
      {items.map(([id, label, icon]) => (
        <button
          key={id}
          type="button"
          onClick={() => setSection(id)}
          className={section === id || (!section && id === "studio") ? "active" : ""}
          aria-label={label}
        >
          <span className="block text-base leading-none">{icon}</span>
          <span className="mt-1 block">{label}</span>
        </button>
      ))}
    </nav>
  )
}

function WelcomeSplash({ show }) {
  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999999] grid place-items-center overflow-hidden bg-[#050816] animate-[welcomeOverlay_3.1s_ease_forwards]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,#2563eb88,transparent_34%),radial-gradient(circle_at_82%_78%,#7c3aed88,transparent_36%),radial-gradient(circle_at_50%_50%,#0ea5e933,transparent_42%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="absolute h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-3xl animate-[welcomePulse_2.6s_ease-in-out_infinite]" />

      <div className="relative mx-6 max-w-3xl rounded-[2.2rem] border border-white/15 bg-white/[0.075] p-10 text-center shadow-2xl shadow-blue-950/60 backdrop-blur-2xl animate-[welcomeCard_2.75s_ease_forwards] md:p-12">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-5xl shadow-2xl shadow-blue-950/50">
          🚀
        </div>
        <div className="mx-auto mb-4 w-fit rounded-full border border-blue-300/20 bg-blue-400/10 px-5 py-2 text-xs font-black uppercase tracking-[.35em] text-blue-100">
          JobPilot AI Cloud
        </div>
        <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
          Welcome back, <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">creator</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
          Your workspace is ready — resumes, real jobs, applications, tracker, templates, and cloud saving in one place.
        </p>
        <div className="mt-8 grid gap-3 text-sm font-bold text-slate-200 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">✓ Resumes</div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">✓ Jobs</div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3">✓ Tracker</div>
        </div>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-[welcomeBar_2.45s_ease_forwards] rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-violet-400" />
        </div>
      </div>

      <style>{`
        @keyframes welcomeOverlay{
          0%{opacity:1}
          72%{opacity:1}
          100%{opacity:0;visibility:hidden}
        }
        @keyframes welcomeCard{
          0%{opacity:0;transform:translateY(28px) scale(.94)}
          18%{opacity:1;transform:translateY(0) scale(1)}
          74%{opacity:1;transform:translateY(0) scale(1)}
          100%{opacity:0;transform:translateY(-18px) scale(.985)}
        }
        @keyframes welcomeBar{
          from{width:0}
          to{width:100%}
        }
        @keyframes welcomePulse{
          0%,100%{transform:scale(.9);opacity:.55}
          50%{transform:scale(1.08);opacity:.85}
        }
      `}</style>
    </div>
  )
}


function LegalPage({ type, setSection }) {
  const pages = {
    about: {
      badge: "About JobPilot",
      title: "A career workspace for jobs, resumes, and applications.",
      intro:
        "JobPilot helps users build better resumes, search real jobs, organize applications, and keep their career work saved securely in one place.",
      blocks: [
        ["What JobPilot does", "Resume building, profile editing, templates, job search, apply workspace, application tracking, upload support, and cloud saving."],
        ["Who it is for", "Freshers, students, job seekers, interns, and professionals who want a simpler way to manage their job search."],
        ["Current version", "This is an early professional beta. Some advanced AI and production features may improve over time."],
      ],
    },
    contact: {
      badge: "Contact",
      title: "Need help, feedback, or support?",
      intro:
        "Use this page for support questions, feedback, bug reports, feature requests, or business enquiries related to JobPilot.",
      blocks: [
        ["Support email", "Add your official support email here before public launch, for example support@jobpilotai.com."],
        ["Response time", "During beta, support responses may take time. Critical bugs and account issues should be handled first."],
        ["Feedback", "Users can report resume export issues, job search issues, upload problems, login problems, or suggestions for new features."],
      ],
    },
    privacy: {
      badge: "Privacy Policy",
      title: "How JobPilot handles user information.",
      intro:
        "This draft privacy page explains the basic data JobPilot may collect and store. Before a real public launch, review it with a legal expert.",
      blocks: [
        ["Data we may store", "Account details, saved resumes, profile information, uploaded document text, saved applications, tracker data, and app preferences."],
        ["Why we store it", "To let users login, save resumes online, restore their work, track jobs, and improve their job application workflow."],
        ["Sensitive documents", "Users should upload only documents they are comfortable using inside the app. Avoid unnecessary sensitive documents unless needed."],
        ["Security", "API keys and database credentials must stay on the server and must never be exposed inside frontend code or public repositories."],
        ["User control", "Users should be able to update, delete, or request removal of their saved data as the product matures."],
      ],
    },
    terms: {
      badge: "Terms & Conditions",
      title: "Basic rules for using JobPilot.",
      intro:
        "This is a starter terms page for beta use. Before launching as a business, review the final text with a legal expert.",
      blocks: [
        ["Beta product", "JobPilot may change, improve, or temporarily disable features while it is being developed."],
        ["No job guarantee", "JobPilot can help users prepare, search, and track applications, but it cannot guarantee interviews, job offers, or hiring outcomes."],
        ["User responsibility", "Users are responsible for checking resume accuracy, job details, application content, and uploaded documents before submitting anywhere."],
        ["Third-party jobs", "Job listings may come from external providers. Users should verify each company, role, salary, and application link before applying."],
        ["Fair use", "Users should not misuse the app, upload harmful content, attempt unauthorized access, or abuse any connected services."],
      ],
    },
  }

  const page = pages[type] || pages.about

  return (
    <main className="min-h-screen overflow-y-auto p-4 pb-28 lg:p-6">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-3 w-fit rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.24em] text-blue-200">
              {page.badge}
            </div>
            <h2 className="max-w-4xl text-3xl font-black leading-tight text-white lg:text-5xl">{page.title}</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{page.intro}</p>
          </div>
          <Button onClick={() => setSection("studio")}>Back to app</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {page.blocks.map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="text-lg font-black text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-5 text-sm leading-7 text-yellow-100">
          <b>Launch note:</b> These pages are starter professional pages for beta testing. Before worldwide production launch, replace placeholder contact details and review the legal text properly.
        </div>
      </section>
    </main>
  )
}

function Sidebar({
  section,
  setSection,
  savedResumes,
  loadSavedResume,
  deleteSavedResume,
  saveResume,
  cloudStatus,
  cloudLoading,
  backendStatus,
}) {
  const nav = [
    ["studio", "Resume Studio"],
    ["jobs", "Find Real Jobs"],
    ["workspace", "Apply Workspace"],
    ["tracker", "Tracker"],
    ["about", "About"],
    ["contact", "Contact"],
    ["privacy", "Privacy"],
    ["terms", "Terms"],
  ]

  return (
    <aside className="desktop-only-sidebar hidden h-screen w-72 shrink-0 overflow-hidden border-r border-white/10 bg-slate-950/95 p-4 lg:flex lg:flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">
          JobPilot<span className="text-blue-400"> Pro</span>
        </h1>
        <p className="text-xs text-slate-500">Resume, jobs, and applications</p>
      </div>

      <div className="mb-5 space-y-2">
        {nav.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
              section === id ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-5 shrink-0">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Saved Resumes</p>
          <button
            type="button"
            onClick={saveResume}
            className="rounded-xl border border-blue-400/30 bg-blue-500/15 px-3 py-1.5 text-[11px] font-black text-blue-100 hover:bg-blue-500/25"
            title="Save the current resume manually"
          >
            Save
          </button>
        </div>
        <div className="mb-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-100">
          <b>{cloudLoading ? "Syncing..." : cloudStatus || "Cloud ready"}</b>
          <br />
          Auto-save runs after edits. Use Save for a named manual copy.
        </div>
        <div className={`mb-2 rounded-2xl border p-3 text-xs leading-relaxed ${backendStatus?.state === "online" ? "border-blue-400/20 bg-blue-500/10 text-blue-100" : backendStatus?.state === "offline" ? "border-red-400/20 bg-red-500/10 text-red-100" : "border-yellow-400/20 bg-yellow-500/10 text-yellow-100"}`}>
          <b>{backendStatus?.state === "online" ? "System online" : backendStatus?.state === "offline" ? "Backend offline" : "Checking system"}</b>
          <br />
          {backendStatus?.message || "Checking backend..."}
        </div>
        <div className="max-h-[43vh] space-y-2 overflow-y-auto pr-1">
          {savedResumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
              No saved resumes yet. Click <b className="text-slate-300">Save</b> above or edit your profile and wait a few seconds for auto-save.
            </div>
          ) : (
            savedResumes.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <button onClick={() => loadSavedResume(item)} className="block w-full truncate text-left text-sm font-black text-white">
                  {item.name}
                </button>
                <p className="mt-1 text-xs text-slate-500">{item.date}</p>
                <button onClick={() => deleteSavedResume(item.id)} className="mt-2 text-xs font-bold text-red-300">
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-black text-white">Activity Assistant</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          No chat. It only tells what happened after your actions.
        </p>
      </div>
    </aside>
  )
}
function getCopyableResult(text = "") {
  const value = String(text || "")
  const startTag = "[[COPY_RESULT_START]]"
  const endTag = "[[COPY_RESULT_END]]"

  const start = value.indexOf(startTag)
  const end = value.indexOf(endTag)

  if (start === -1 || end === -1 || end <= start) return ""

  const result = value.slice(start + startTag.length, end).trim()
  return result.length >= 3 ? result : ""
}

function getDisplayWithoutCopyResult(text = "") {
  const value = String(text || "")
  const startTag = "[[COPY_RESULT_START]]"
  const endTag = "[[COPY_RESULT_END]]"

  const start = value.indexOf(startTag)
  const end = value.indexOf(endTag)

  if (start === -1 || end === -1 || end <= start) return value

  const before = value.slice(0, start).trim()
  const after = value.slice(end + endTag.length).trim()

  return [before, after].filter(Boolean).join("\n\n").trim()
}

function ChatMessage({ message }) {
  const user = message.role === "user"
  const copyableText = !user ? getCopyableResult(message.text) : ""
  const displayText = !user ? getDisplayWithoutCopyResult(message.text) : message.text

  return (
    <div className={`flex ${user ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
          user ? "bg-blue-600 text-white" : "border border-white/10 bg-white/[0.05] text-slate-200"
        }`}
      >
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-60">{user ? "You" : "JobPilot AI"}</p>
        {displayText && <p className="whitespace-pre-wrap">{displayText}</p>}

        {copyableText && (
          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Result</p>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(copyableText)}
                className="rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/30 hover:text-white"
                title="Copy only this result"
              >
                Copy Result
              </button>
            </div>
            <p className="whitespace-pre-wrap text-slate-100">{copyableText}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatArea({
  uploadFile,
  uploadedDocument,
  autoFillDocument,
  focusMode,
  setFocusMode,
  activityText,
  activityLog = [],
  cloudStatus,
  cloudLoading,
  autoSaveEnabled,
  saveResume,
}) {
  return (
    <Panel className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">JobPilot Assistant</h2>
            <p className="text-sm text-slate-400">No chat box. This assistant only tells you what happened after your actions.</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <div className="col-span-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-center text-xs font-black text-emerald-100 sm:col-span-1">
              {cloudLoading ? "Syncing..." : cloudStatus || "Cloud ready"}
            </div>
            <label className="cursor-pointer rounded-2xl border border-blue-400/25 bg-blue-500/15 px-4 py-3 text-center text-sm font-black text-blue-100 transition hover:bg-blue-500/25">
              Upload Resume
              <input type="file" accept=".pdf,.docx,.txt,.csv,.json,.md,.png,.jpg,.jpeg,.webp" onChange={uploadFile} className="hidden" />
            </label>
            <Button onClick={autoFillDocument} disabled={!uploadedDocument} variant={uploadedDocument ? "primary" : "default"}>
              Auto-fill
            </Button>
            <Button onClick={saveResume} variant="primary">
              Save Resume
            </Button>
            <Button variant="premium" onClick={() => setFocusMode(!focusMode)}>
              {focusMode ? "Exit Focus" : "Focus"}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="grid h-full place-items-center">
          <div className="w-full max-w-2xl rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 text-center shadow-2xl shadow-black/20 sm:rounded-[2rem] sm:p-6">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-2xl sm:mb-4 sm:h-16 sm:w-16 sm:rounded-3xl sm:text-3xl">📄</div>
            <h3 className="text-xl font-black text-white sm:text-2xl">Activity Assistant</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
              I will not chat or edit your resume. I only show short updates after you upload, auto-fill, edit, export, save, search jobs, or track applications.
            </p>

            <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5 text-left">
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-blue-200">Latest Update</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{activityText || "Ready. Upload a document or edit your resume to see updates here."}</p>
            </div>

            <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-left">
              <p className="mb-1 text-[11px] font-black uppercase tracking-widest text-emerald-200">Cloud Save Status</p>
              <p className="text-sm font-black text-emerald-100">{cloudLoading ? "Syncing..." : cloudStatus || "Cloud ready"}</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-200/80">
                {autoSaveEnabled ? "Auto-save is ON. Edits save after a short delay." : "Auto-save is OFF. Use Save Resume manually."}
              </p>
            </div>

            {activityLog.length > 0 && (
              <div className="mt-4 rounded-3xl border border-white/10 bg-slate-900/60 p-4 text-left">
                <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Recent Activity</p>
                <div className="space-y-2">
                  {activityLog.slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-2xl bg-white/[0.04] px-3 py-2">
                      <p className="text-sm font-black text-white">{item.title}</p>
                      {item.detail && <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.detail}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedDocument ? (
              <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-left text-sm text-emerald-100">
                <p><b>Uploaded:</b> {uploadedDocument.fileName}</p>
                <p className="mt-1"><b>Extracted text:</b> {uploadedDocument.chars} characters</p>
                <p className="mt-3 text-emerald-200">Click Auto-fill from Upload to fill available resume/profile details.</p>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-900/60 p-5 text-sm text-slate-400">
                Upload a PDF, DOCX, TXT, JSON, CSV, MD, PNG, JPG, JPEG, or WEBP resume/document. After upload, JobPilot will auto-fill your profile automatically.
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
                Upload Document
                <input type="file" accept=".pdf,.docx,.txt,.csv,.json,.md,.png,.jpg,.jpeg,.webp" onChange={uploadFile} className="hidden" />
              </label>
              <Button onClick={autoFillDocument} disabled={!uploadedDocument} variant="primary">
                Auto-fill Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function ResumePreview({ resume, template, onEdit, directEdit = false, onDirectChange }) {
  const has = (x) => x && String(x).trim()
  const p = resume.personal

  const contactLine = [p.phone, p.email, p.location].filter(Boolean).join(" | ")
  const linksLine = [p.linkedin, p.github, p.portfolio].filter(Boolean).join(" | ")

  const editableProps = (path, fallback = "") =>
    directEdit
      ? {
          contentEditable: true,
          suppressContentEditableWarning: true,
          onClick: (e) => e.stopPropagation(),
          onInput: (e) => {
            e.currentTarget.dataset.directText = e.currentTarget.innerText
          },
          onBlur: (e) => {
            const latest = e.currentTarget.dataset.directText ?? e.currentTarget.innerText
            onDirectChange?.(path, latest)
          },
          onKeyDown: (e) => {
            if (e.key === "Escape") e.currentTarget.blur()
          },
          className: "direct-resume-edit",
          "data-placeholder": "Type here",
          title: "Type directly here. Changes save when you click outside.",
        }
      : {}

  const Section = ({ title, children, show = true, target, className = "" }) => {
    if (!show) return null

    return (
      <section
        className={`rp-section ${className} ${directEdit ? "" : "resume-clickable"}`}
        onClick={(e) => {
          if (directEdit) return
          e.stopPropagation()
          onEdit?.(target)
        }}
        title={directEdit ? "Edit text directly in this resume" : "Click to edit this section"}
      >
        <h2>{title}</h2>
        {children}
      </section>
    )
  }

  const Bullets = ({ items, pathPrefix }) => {
    const list = (items || []).filter(Boolean)
    if (!list.length && !directEdit) return null

    return (
      <ul>
        {(directEdit && !list.length ? [""] : list).map((b, i) => (
          <li key={i} {...editableProps(`${pathPrefix}.${i}`, b)}>{b}</li>
        ))}
      </ul>
    )
  }

  const Header = () => (
    <header className={`rp-header ${directEdit ? "" : "resume-clickable"}`} onClick={() => !directEdit && onEdit?.("personal")} title={directEdit ? "Edit directly" : "Click to edit personal details"}>
      {has(p.name) && <h1 {...editableProps("personal.name", p.name)}>{p.name}</h1>}
      {has(p.role) && <p className="rp-role" {...editableProps("personal.role", p.role)}>{p.role}</p>}
      {has(contactLine) && <p {...editableProps("personal.contactLine", contactLine)}>{contactLine}</p>}
      {has(linksLine) && <p {...editableProps("personal.linksLine", linksLine)}>{linksLine}</p>}
    </header>
  )

  const SummarySections = () => (
    <>
      <Section title="Professional Summary" show={has(resume.summary)} target="summary" className="rp-summary-section">
        <p {...editableProps("summary", resume.summary)}>{resume.summary}</p>
      </Section>

      <Section title="Career Objective" show={has(resume.objective)} target="summary" className="rp-objective-section">
        <p {...editableProps("objective", resume.objective)}>{resume.objective}</p>
      </Section>
    </>
  )

  const SkillsSection = () => (
    <Section title="Technical Skills" show={Object.values(resume.skills || {}).some(Boolean)} target="skills" className="rp-skills-section">
      <div className="rp-skill-list">
        {Object.entries(resume.skills || {}).map(
          ([k, v]) =>
            has(v) && (
              <p key={k} className="rp-skill-line">
                <strong>{k[0].toUpperCase() + k.slice(1)}:</strong>{" "}
                <span {...editableProps(`skills.${k}`, v)}>{v}</span>
              </p>
            )
        )}
      </div>
    </Section>
  )

  const EducationSection = () => (
    <Section title="Education" show={resume.education.length > 0} target="education" className="rp-education-section">
      {resume.education.map((item, i) => (
        <div className="rp-item" key={i}>
          <h3 {...editableProps(`education.${i}.degree`, item.degree)}>{item.degree}</h3>
          <p {...editableProps(`education.${i}.institutionLine`, [item.institution, item.location].filter(Boolean).join(", "))}>{[item.institution, item.location].filter(Boolean).join(", ")}</p>
          <p className="muted" {...editableProps(`education.${i}.durationLine`, [item.duration, item.details].filter(Boolean).join(" | "))}>{[item.duration, item.details].filter(Boolean).join(" | ")}</p>
        </div>
      ))}
    </Section>
  )

  const ProjectsSection = () => (
    <Section title="Projects" show={resume.projects.length > 0} target="projects" className="rp-projects-section">
      {resume.projects.map((item, i) => (
        <div className="rp-item" key={i}>
          <h3 {...editableProps(`projects.${i}.name`, item.name)}>{item.name}</h3>
          {item.tech && <p className="muted">Technologies: <span {...editableProps(`projects.${i}.tech`, item.tech)}>{item.tech}</span></p>}
          <Bullets items={item.bullets} pathPrefix={`projects.${i}.bullets`} />
          {item.link && <p className="muted">Link: <span {...editableProps(`projects.${i}.link`, item.link)}>{item.link}</span></p>}
        </div>
      ))}
    </Section>
  )

  const ExperienceSection = () => (
    <Section title="Work Experience" show={resume.experience.length > 0} target="experience" className="rp-experience-section">
      {resume.experience.map((item, i) => (
        <div className="rp-item" key={i}>
          <h3 {...editableProps(`experience.${i}.titleLine`, [item.role, item.company].filter(Boolean).join(" — "))}>{[item.role, item.company].filter(Boolean).join(" — ")}</h3>
          <p className="muted" {...editableProps(`experience.${i}.metaLine`, [item.location, item.duration].filter(Boolean).join(" | "))}>{[item.location, item.duration].filter(Boolean).join(" | ")}</p>
          <Bullets items={item.bullets} pathPrefix={`experience.${i}.bullets`} />
        </div>
      ))}
    </Section>
  )

  const InternshipSection = () => (
    <Section title="Internships" show={resume.internships.length > 0} target="internships" className="rp-internships-section">
      {resume.internships.map((item, i) => (
        <div className="rp-item" key={i}>
          <h3 {...editableProps(`internships.${i}.titleLine`, [item.role, item.company].filter(Boolean).join(" — "))}>{[item.role, item.company].filter(Boolean).join(" — ")}</h3>
          <p className="muted" {...editableProps(`internships.${i}.metaLine`, [item.location, item.duration].filter(Boolean).join(" | "))}>{[item.location, item.duration].filter(Boolean).join(" | ")}</p>
          <Bullets items={item.bullets} pathPrefix={`internships.${i}.bullets`} />
        </div>
      ))}
    </Section>
  )

  const ExtraSections = () => (
    <>
      <Section title="Certifications" show={resume.certifications.length > 0} target="certifications" className="rp-certifications-section">
        <Bullets items={resume.certifications.map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(" | "))} pathPrefix="certificationsText" />
      </Section>

      <Section title="Achievements" show={resume.achievements.length > 0} target="achievements" className="rp-achievements-section">
        <Bullets items={resume.achievements.map((a) => [a.title, a.description].filter(Boolean).join(" - "))} pathPrefix="achievementsText" />
      </Section>

      <Section title="Languages" show={resume.languages.length > 0} target="languages" className="rp-languages-section">
        <Bullets items={resume.languages.map((l) => [l.name, l.level].filter(Boolean).join(" - "))} pathPrefix="languagesText" />
      </Section>
    </>
  )

  const NormalFlow = () => (
    <>
      <Header />
      <SummarySections />
      <SkillsSection />
      <EducationSection />
      <ProjectsSection />
      <ExperienceSection />
      <InternshipSection />
      <ExtraSections />
    </>
  )

  const SidebarFlow = () => (
    <>
      <div className="rp-left-panel">
        <Header />
        <SkillsSection />
        <ExtraSections />
      </div>
      <div className="rp-main-panel">
        <SummarySections />
        <EducationSection />
        <ProjectsSection />
        <ExperienceSection />
        <InternshipSection />
      </div>
    </>
  )

  const layout = ["sidebar", "creative", "bold"].includes(template) ? <SidebarFlow /> : <NormalFlow />
  const pageRef = useRef(null)

  useEffect(() => {
    const page = pageRef.current
    const inner = page?.querySelector(".resume-fit-inner")
    if (!page || !inner) return

    let frameOne = 0
    let frameTwo = 0
    let timer = 0

    const fit = () => {
      window.cancelAnimationFrame(frameOne)
      window.cancelAnimationFrame(frameTwo)
      window.clearTimeout(timer)

      timer = window.setTimeout(() => {
        page.style.setProperty("--resume-fit-scale", "1")
        page.classList.remove("resume-auto-compressed")
        page.classList.remove("resume-fit-expanded")

        frameOne = window.requestAnimationFrame(() => {
          frameTwo = window.requestAnimationFrame(() => {
            const available = 1123
            const natural = Math.max(inner.scrollHeight || available, 1)

            // Stable one-page fit:
            // 1) Never scale UP. Scaling up caused the preview to jump/shake.
            // 2) Compress spacing first.
            // 3) Only scale down gently when content is still too long.
            let scale = 1

            if (natural > available) {
              page.classList.add("resume-auto-compressed")
              const compactNatural = Math.max(inner.scrollHeight || natural, 1)
              scale = Math.min(1, available / compactNatural)
              scale = Math.max(0.9, scale)
            }

            page.style.setProperty("--resume-fit-scale", String(scale))
          })
        })
      }, 80)
    }

    fit()

    const onResize = () => fit()
    window.addEventListener("resize", onResize)

    return () => {
      window.cancelAnimationFrame(frameOne)
      window.cancelAnimationFrame(frameTwo)
      window.clearTimeout(timer)
      window.removeEventListener("resize", onResize)
    }
  }, [resume, template, directEdit])

  return (
    <div ref={pageRef} id="resume-print-area" className={`resume-page resume-${template} ${directEdit ? "resume-direct-mode" : ""}`}>
      <div className="resume-fit-inner">
        {directEdit && <div className="direct-edit-ribbon">Direct Resume Edit Mode — type, delete, paste, then click outside to save permanently</div>}
        {layout}
      </div>
    </div>
  )
}

function ResumeEditor({ resume, setResume, improveSection, scrollTarget, uploadSectionFile }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (!scrollTarget) return

    setTimeout(() => {
      const target = document.getElementById(`edit-${scrollTarget}`)
      const container = editorRef.current?.closest("[data-editor-scroll='true']")

      if (target && container) {
        const top = target.offsetTop - 18
        container.scrollTo({ top, behavior: "smooth" })
      } else {
        target?.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }, 120)
  }, [scrollTarget])

  const updatePersonal = (field, value) => {
    setResume((p) => ({ ...p, personal: { ...p.personal, [field]: value }, updatedAt: now() }))
  }

  const updateSkills = (field, value) => {
    setResume((p) => ({ ...p, skills: { ...p.skills, [field]: value }, updatedAt: now() }))
  }

  const updateArray = (section, index, patch) => {
    setResume((p) => ({
      ...p,
      [section]: p[section].map((x, i) => (i === index ? { ...x, ...patch } : x)),
      updatedAt: now(),
    }))
  }

  const addArray = (section, item) => {
    setResume((p) => ({ ...p, [section]: [...p[section], item], updatedAt: now() }))
  }

  const removeArray = (section, index) => {
    setResume((p) => ({ ...p, [section]: p[section].filter((_, i) => i !== index), updatedAt: now() }))
  }

  const updateBullets = (section, index, bullets) => updateArray(section, index, { bullets })

  const DocumentUploadButton = ({ section, label = "Upload" }) => (
    <label className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-slate-100 transition hover:bg-white/[0.1]">
      {label}
      <input
        type="file"
        accept=".pdf,.docx,.txt,.csv,.json,.md,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => uploadSectionFile?.(e, section)}
      />
    </label>
  )

  const BulletEditor = ({ section, index, bullets }) => (
    <div className="mt-3">
      <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Bullet Points</p>
      <div className="space-y-2">
        {(bullets || []).map((b, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={b}
              onChange={(e) => {
                const next = [...bullets]
                next[i] = e.target.value
                updateBullets(section, index, next)
              }}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
            />
            <Button variant="red" onClick={() => updateBullets(section, index, bullets.filter((_, x) => x !== i))}>
              ×
            </Button>
          </div>
        ))}
      </div>
      <button onClick={() => updateBullets(section, index, [...(bullets || []), ""])} className="mt-2 text-sm font-black text-blue-300">
        + Add bullet
      </button>
    </div>
  )

  return (
    <div ref={editorRef} className="space-y-4">
      <Panel id="edit-personal" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Personal Details</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="personal" />
            <Button onClick={() => improveSection("personal")}>AI Improve</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Full Name" value={resume.personal.name} onChange={(v) => updatePersonal("name", v)} />
          <Autocomplete label="Target Role" value={resume.personal.role} onChange={(v) => updatePersonal("role", v)} options={roleOptions} placeholder="Type your role..." />
          <Field label="Email" value={resume.personal.email} onChange={(v) => updatePersonal("email", v)} />
          <Field label="Phone" value={resume.personal.phone} onChange={(v) => updatePersonal("phone", v)} />
          <Field label="Location" value={resume.personal.location} onChange={(v) => updatePersonal("location", v)} />
          <Field label="LinkedIn" value={resume.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} />
          <Field label="GitHub" value={resume.personal.github} onChange={(v) => updatePersonal("github", v)} />
          <Field label="Portfolio" value={resume.personal.portfolio} onChange={(v) => updatePersonal("portfolio", v)} />
        </div>
      </Panel>

      <Panel id="edit-summary" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Summary</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="summary" />
            <Button onClick={() => improveSection("summary")}>AI Improve</Button>
          </div>
        </div>
        <div className="space-y-3">
          <Field label="Professional Summary" textarea value={resume.summary} onChange={(v) => setResume((p) => ({ ...p, summary: v, updatedAt: now() }))} />
          <Field label="Career Objective" textarea value={resume.objective} onChange={(v) => setResume((p) => ({ ...p, objective: v, updatedAt: now() }))} />
        </div>
      </Panel>

      <Panel id="edit-skills" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Skills</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="skills" />
            <Button onClick={() => improveSection("skills")}>AI Improve</Button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(resume.skills).map(([k, v]) => (
            <Field key={k} label={k} value={v} onChange={(next) => updateSkills(k, next)} />
          ))}
        </div>
      </Panel>

      <Panel id="edit-education" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Education</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="education" />
            <Button onClick={() => addArray("education", { degree: "", institution: "", location: "", duration: "", details: "" })}>+ Add</Button>
          </div>
        </div>

        <div className="space-y-4">
          {resume.education.map((e, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex justify-between">
                <p className="font-black text-white">Education {index + 1}</p>
                <button onClick={() => removeArray("education", index)} className="text-sm font-bold text-red-300">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {["degree", "institution", "location", "duration", "details"].map((field) => (
                  <Field key={field} label={field} value={e[field]} onChange={(v) => updateArray("education", index, { [field]: v })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {[
        ["projects", "Projects", { name: "", tech: "", link: "", bullets: [""] }],
        ["experience", "Work Experience", { role: "", company: "", location: "", duration: "", bullets: [""] }],
        ["internships", "Internships", { role: "", company: "", location: "", duration: "", bullets: [""] }],
      ].map(([section, title, empty]) => (
        <Panel key={section} id={`edit-${section}`} className="p-4 scroll-mt-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-black text-white">{title}</h3>
            <div className="flex gap-2">
              <DocumentUploadButton section={section} />
              <Button onClick={() => improveSection(section)}>AI Improve</Button>
              <Button onClick={() => addArray(section, empty)}>+ Add</Button>
            </div>
          </div>

          <div className="space-y-4">
            {resume[section].map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex justify-between">
                  <p className="font-black text-white">
                    {title} {index + 1}
                  </p>
                  <button onClick={() => removeArray(section, index)} className="text-sm font-bold text-red-300">
                    Remove
                  </button>
                </div>

                {section === "projects" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Project Name" value={item.name} onChange={(v) => updateArray(section, index, { name: v })} />
                    <Field label="Tech Stack" value={item.tech} onChange={(v) => updateArray(section, index, { tech: v })} />
                    <Field label="Link" value={item.link} onChange={(v) => updateArray(section, index, { link: v })} />
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Role" value={item.role} onChange={(v) => updateArray(section, index, { role: v })} />
                    <Field label="Company" value={item.company} onChange={(v) => updateArray(section, index, { company: v })} />
                    <Field label="Location" value={item.location} onChange={(v) => updateArray(section, index, { location: v })} />
                    <Field label="Duration" value={item.duration} onChange={(v) => updateArray(section, index, { duration: v })} />
                  </div>
                )}

                <BulletEditor section={section} index={index} bullets={item.bullets || []} />
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel id="edit-certifications" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Certifications</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="certifications" />
            <Button onClick={() => addArray("certifications", { name: "", issuer: "", year: "", link: "" })}>+ Add</Button>
          </div>
        </div>
        <div className="space-y-4">
          {resume.certifications.map((c, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex justify-between">
                <p className="font-black text-white">Certification {index + 1}</p>
                <button onClick={() => removeArray("certifications", index)} className="text-sm font-bold text-red-300">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {["name", "issuer", "year", "link"].map((field) => (
                  <Field key={field} label={field} value={c[field]} onChange={(v) => updateArray("certifications", index, { [field]: v })} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="edit-achievements" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Achievements</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="achievements" />
            <Button onClick={() => addArray("achievements", { title: "", description: "" })}>+ Add</Button>
          </div>
        </div>
        <div className="space-y-4">
          {resume.achievements.map((a, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex justify-between">
                <p className="font-black text-white">Achievement {index + 1}</p>
                <button onClick={() => removeArray("achievements", index)} className="text-sm font-bold text-red-300">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title" value={a.title} onChange={(v) => updateArray("achievements", index, { title: v })} />
                <Field label="Description" value={a.description} onChange={(v) => updateArray("achievements", index, { description: v })} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="edit-languages" className="p-4 scroll-mt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black text-white">Languages</h3>
          <div className="flex gap-2">
            <DocumentUploadButton section="languages" />
            <Button onClick={() => addArray("languages", { name: "", level: "" })}>+ Add</Button>
          </div>
        </div>
        <div className="space-y-4">
          {resume.languages.map((l, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex justify-between">
                <p className="font-black text-white">Language {index + 1}</p>
                <button onClick={() => removeArray("languages", index)} className="text-sm font-bold text-red-300">
                  Remove
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Language" value={l.name} onChange={(v) => updateArray("languages", index, { name: v })} />
                <Field label="Level" value={l.level} onChange={(v) => updateArray("languages", index, { level: v })} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function ScoreCard({ score, onFix }) {
  const targetMap = {
    "Contact details": "personal",
    "Target role": "personal",
    "Summary quality": "summary",
    Skills: "skills",
    Projects: "projects",
    "Bullet points": "projects",
    Education: "education",
    "Experience / internships": "experience",
    Links: "personal",
    "ATS keywords": "skills",
  }

  return (
    <Panel className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">ATS / Resume Score</p>
          <h3 className="text-4xl font-black text-white">{score.score}%</h3>
        </div>
        <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-blue-500/80 bg-blue-500/10 font-black text-blue-200">
          {score.score}
        </div>
      </div>

      <div className="space-y-2">
        {score.checks.map(([name, pass]) => (
          <button
            key={name}
            type="button"
            onClick={() => onFix?.(targetMap[name] || "personal")}
            className="flex w-full justify-between rounded-xl px-2 py-1 text-left text-sm transition hover:bg-white/[0.06]"
            title="Click to edit this part"
          >
            <span className="text-slate-300">{name}</span>
            <span className={pass ? "text-emerald-300" : "text-yellow-300"}>{pass ? "Good" : "Fix"}</span>
          </button>
        ))}
      </div>

      {score.suggestions.length > 0 && (
        <div className="mt-4 rounded-2xl bg-yellow-500/10 p-3 text-xs text-yellow-100">
          <p className="mb-2 font-black uppercase tracking-widest text-yellow-200">Suggestions</p>
          {score.suggestions.slice(0, 4).map((s) => (
            <p key={s}>• {s}</p>
          ))}
        </div>
      )}
    </Panel>
  )
}

function ExportMenu({ exportPDF, exportDOC, exportTXT, exportJSON, copyResume, saveResume }) {
  const [open, setOpen] = useState(false)

  const item = (label, fn) => (
    <button
      type="button"
      onClick={() => {
        setOpen(false)
        fn()
      }}
      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-black text-slate-200 hover:bg-blue-600 hover:text-white"
    >
      {label}
    </button>
  )

  return (
    <div className="relative">
      <Button variant="primary" onClick={() => setOpen((p) => !p)} className="w-full">
        Export / Actions ▼
      </Button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-[99999] mt-2 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/80">
          {item("Export PDF", exportPDF)}
          {item("Export DOC", exportDOC)}
          {item("Export TXT", exportTXT)}
          {item("Export JSON", exportJSON)}
          {item("Copy Resume", copyResume)}
          {item("Save Resume", saveResume)}
        </div>
      )}
    </div>
  )
}


function applyDirectResumeEdit(setResume, path, value) {
  setResume((prev) => {
    const next = structuredClone(prev)
    const rawText = String(value ?? "")
    const text = rawText.replace(/\u00a0/g, " ").trim()

    const ensureArrayItem = (section, idx, fallback) => {
      if (!Array.isArray(next[section])) next[section] = []
      if (!next[section][idx]) next[section][idx] = fallback
      return next[section][idx]
    }

    if (path === "personal.contactLine") {
      if (!text) {
        next.personal.phone = ""
        next.personal.email = ""
        next.personal.location = ""
        return { ...next, updatedAt: now() }
      }
      const parts = text.split("|").map((x) => x.trim())
      next.personal.phone = parts[0] ?? ""
      next.personal.email = parts[1] ?? ""
      next.personal.location = parts.slice(2).join(" | ") || ""
      return { ...next, updatedAt: now() }
    }

    if (path === "personal.linksLine") {
      if (!text) {
        next.personal.linkedin = ""
        next.personal.github = ""
        next.personal.portfolio = ""
        return { ...next, updatedAt: now() }
      }
      const parts = text.split("|").map((x) => x.trim()).filter(Boolean)
      next.personal.linkedin = parts.find((x) => /linkedin/i.test(x)) || ""
      next.personal.github = parts.find((x) => /github/i.test(x)) || ""
      next.personal.portfolio = parts.find((x) => !/linkedin|github/i.test(x)) || ""
      return { ...next, updatedAt: now() }
    }

    const titleLine = path.match(/^(experience|internships)\.(\d+)\.titleLine$/)
    if (titleLine) {
      const [, section, idxRaw] = titleLine
      const idx = Number(idxRaw)
      const item = ensureArrayItem(section, idx, { role: "", company: "", location: "", duration: "", bullets: [] })
      if (!text) {
        item.role = ""
        item.company = ""
      } else {
        const [role = "", company = ""] = text.split("—").map((x) => x.trim())
        item.role = role
        item.company = company
      }
      return { ...next, updatedAt: now() }
    }

    const metaLine = path.match(/^(experience|internships)\.(\d+)\.metaLine$/)
    if (metaLine) {
      const [, section, idxRaw] = metaLine
      const idx = Number(idxRaw)
      const item = ensureArrayItem(section, idx, { role: "", company: "", location: "", duration: "", bullets: [] })
      if (!text) {
        item.location = ""
        item.duration = ""
      } else {
        const [location = "", duration = ""] = text.split("|").map((x) => x.trim())
        item.location = location
        item.duration = duration
      }
      return { ...next, updatedAt: now() }
    }

    const eduInstitution = path.match(/^education\.(\d+)\.institutionLine$/)
    if (eduInstitution) {
      const idx = Number(eduInstitution[1])
      const item = ensureArrayItem("education", idx, { degree: "", institution: "", location: "", duration: "", details: "" })
      if (!text) {
        item.institution = ""
        item.location = ""
      } else {
        const [institution = "", location = ""] = text.split(",").map((x) => x.trim())
        item.institution = institution
        item.location = location
      }
      return { ...next, updatedAt: now() }
    }

    const eduDuration = path.match(/^education\.(\d+)\.durationLine$/)
    if (eduDuration) {
      const idx = Number(eduDuration[1])
      const item = ensureArrayItem("education", idx, { degree: "", institution: "", location: "", duration: "", details: "" })
      if (!text) {
        item.duration = ""
        item.details = ""
      } else {
        const [duration = "", details = ""] = text.split("|").map((x) => x.trim())
        item.duration = duration
        item.details = details
      }
      return { ...next, updatedAt: now() }
    }

    const certText = path.match(/^certificationsText\.(\d+)$/)
    if (certText) {
      const idx = Number(certText[1])
      const item = ensureArrayItem("certifications", idx, { name: "", issuer: "", year: "", link: "" })
      if (!text) {
        item.name = ""
        item.issuer = ""
        item.year = ""
      } else {
        const [name = "", issuer = "", year = ""] = text.split("|").map((x) => x.trim())
        item.name = name
        item.issuer = issuer
        item.year = year
      }
      return { ...next, updatedAt: now() }
    }

    const achText = path.match(/^achievementsText\.(\d+)$/)
    if (achText) {
      const idx = Number(achText[1])
      const item = ensureArrayItem("achievements", idx, { title: "", description: "" })
      if (!text) {
        item.title = ""
        item.description = ""
      } else {
        const [title = "", ...rest] = text.split("-").map((x) => x.trim())
        item.title = title
        item.description = rest.join(" - ")
      }
      return { ...next, updatedAt: now() }
    }

    const langText = path.match(/^languagesText\.(\d+)$/)
    if (langText) {
      const idx = Number(langText[1])
      const item = ensureArrayItem("languages", idx, { name: "", level: "" })
      if (!text) {
        item.name = ""
        item.level = ""
      } else {
        const [name = "", level = ""] = text.split("-").map((x) => x.trim())
        item.name = name
        item.level = level
      }
      return { ...next, updatedAt: now() }
    }

    const parts = path.split(".")
    let cur = next
    for (let i = 0; i < parts.length - 1; i++) {
      const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i]
      const nextKey = parts[i + 1]
      if (cur[key] === undefined || cur[key] === null) cur[key] = /^\d+$/.test(nextKey) ? [] : {}
      cur = cur[key]
    }

    const last = /^\d+$/.test(parts.at(-1)) ? Number(parts.at(-1)) : parts.at(-1)
    cur[last] = text
    return { ...next, updatedAt: now() }
  })
}

function TemplateGallery({ template, setTemplate }) {
  const [open, setOpen] = useState(false)
  const selected = templates.find((t) => t.id === template) || templates[0]

  return (
    <Panel className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Resume Templates</p>
          <h3 className="mt-1 text-lg font-black text-white">{selected.name}</h3>
          <p className="mt-1 text-xs text-slate-500">{selected.desc}</p>
        </div>
        <Button onClick={() => setOpen((p) => !p)}>
          {open ? "Hide Templates ▲" : "Choose Template ▼"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const active = template === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`template-card-mini template-thumb-${t.id} rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-blue-400 bg-blue-500/15 shadow-lg shadow-blue-950/30"
                    : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                }`}
                title={`Apply ${t.name}`}
              >
                <div className="relative z-10 mt-10">
                  <p className="text-sm font-black text-white">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">{t.desc}</p>
                  {active && <p className="mt-2 text-[11px] font-black uppercase tracking-widest text-blue-300">Selected</p>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

function ResumeStudio({
  resume,
  setResume,
  template,
  setTemplate,
  score,
  exportPDF,
  exportDOC,
  exportTXT,
  exportJSON,
  copyResume,
  saveResume,
  improveSection,
  uploadSectionFile,
  compact = false,
}) {
  const [tab, setTab] = useState("preview")
  const [directEdit, setDirectEdit] = useState(false)
  const [scrollTarget, setScrollTarget] = useState("")

  const openEditor = (target = "personal") => {
    setTab("editor")
    setScrollTarget("")
    setTimeout(() => setScrollTarget(target), 20)
  }

  return (
    <Panel className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="border-b border-white/10 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white">Resume Studio</h2>
            <p className="text-sm text-slate-400">Click score rows or resume sections to edit them directly.</p>
          </div>

          <div className="flex gap-2">
            {tab === "editor" && (
              <Button onClick={() => setTab("preview")}>← Back</Button>
            )}
            <Button variant={tab === "preview" && !directEdit ? "primary" : "soft"} onClick={() => { setDirectEdit(false); setTab("preview") }}>
              Preview
            </Button>
            <Button variant={directEdit ? "primary" : "soft"} onClick={() => { setTab("preview"); setDirectEdit((p) => !p) }}>
              {directEdit ? "Done Editing" : "✍️ Edit Resume"}
            </Button>
            <Button variant="premium" onClick={() => { setDirectEdit(false); openEditor("personal") }} className="px-5">
              ✨ Edit Profile
            </Button>
          </div>
        </div>

        <ExportMenu exportPDF={exportPDF} exportDOC={exportDOC} exportTXT={exportTXT} exportJSON={exportJSON} copyResume={copyResume} saveResume={saveResume} />
      </div>

      <div data-editor-scroll="true" className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "editor" ? (
          <ResumeEditor resume={resume} setResume={setResume} improveSection={improveSection} scrollTarget={scrollTarget} uploadSectionFile={uploadSectionFile} />
        ) : (
          <div className="space-y-4">
            {!compact && <ScoreCard score={score} onFix={openEditor} />}

            {!compact && <TemplateGallery template={template} setTemplate={setTemplate} />}

            <div className="resume-mobile-shell overflow-x-auto rounded-3xl bg-slate-900/70 p-4">
              {directEdit && (
                <div className="mb-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm font-bold text-amber-100">
                  Direct edit is ON. Click inside the resume text, type your changes, then click outside that line to save.
                </div>
              )}
              <ResumePreview resume={resume} template={template} onEdit={openEditor} directEdit={directEdit} onDirectChange={(path, value) => applyDirectResumeEdit(setResume, path, value)} />
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

function NoJobsCard({ failure, onReason, onFindAnyway, hasSearched }) {
  if (!failure && !hasSearched) return null

  const title = failure?.error || "SORRY, JOBS NOT AVAILABLE FOR YOU."
  const canFindAnyway = failure?.canFindAnyway !== false
  const reason =
    failure?.reason ||
    (canFindAnyway
      ? "No 90%–100% matching jobs were found. Click Find Anyway to relax filters and show 20%–89% or related jobs."
      : "No jobs were found even after relaxing filters. Better luck next time. You can still search LinkedIn, Indeed, Naukri, or Google Jobs manually.")

  return (
    <Panel className="p-8 text-center">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-red-500/10 text-4xl">🚫</div>

      <h2 className="text-3xl font-black text-white">{title}</h2>

      <p className="mx-auto mt-3 max-w-2xl text-slate-400">
        {canFindAnyway
          ? "No 90%–100% matching jobs were found for these filters."
          : "No matching, relaxed, or related jobs were found. Better luck next time."}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={onReason}>Reason</Button>

        {canFindAnyway ? (
          <Button variant="primary" onClick={onFindAnyway}>
            Find Anyway
          </Button>
        ) : (
          <span className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-slate-300">
            Better luck next time
          </span>
        )}
      </div>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
          {canFindAnyway ? "Quick Reason" : "Final Result"}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{reason}</p>
      </div>

      {failure?.externalSearchLinks && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {failure.externalSearchLinks.linkedin && (
            <Button onClick={() => window.open(failure.externalSearchLinks.linkedin, "_blank")}>Search LinkedIn</Button>
          )}

          {failure.externalSearchLinks.indeed && (
            <Button onClick={() => window.open(failure.externalSearchLinks.indeed, "_blank")}>Search Indeed</Button>
          )}

          {failure.externalSearchLinks.naukri && (
            <Button onClick={() => window.open(failure.externalSearchLinks.naukri, "_blank")}>Search Naukri</Button>
          )}

          {failure.externalSearchLinks.google && (
            <Button onClick={() => window.open(failure.externalSearchLinks.google, "_blank")}>Search Google Jobs</Button>
          )}
        </div>
      )}
    </Panel>
  )
}


function ReasonModal({ failure, onClose }) {
  if (!failure) return null

  return createPortal(
    <div className="fixed inset-0 z-[999999] grid place-items-center bg-black/70 p-4">
      <Panel className="max-h-[82vh] w-full max-w-3xl overflow-y-auto p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">Why jobs are not available</h2>
            <p className="mt-1 text-sm text-slate-400">The app first checks for 90%–100% matching jobs only.</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2 font-black text-white hover:bg-white/20">
            ×
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{failure.reason || failure.error || "No reason returned."}</pre>
        </div>
      </Panel>
    </div>,
    document.body
  )
}

function OpenJobDropdown({ job }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const buttonRef = useRef(null)

  const links = [
    ["Adzuna", job.externalSearchLinks?.adzuna || job.url],
    ["LinkedIn", job.externalSearchLinks?.linkedin],
    ["Indeed", job.externalSearchLinks?.indeed],
    ["Naukri", job.externalSearchLinks?.naukri],
    ["Google Jobs", job.externalSearchLinks?.google],
  ].filter(([, url]) => Boolean(url))

  const updatePos = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return

    const menuWidth = 230
    const safeLeft = Math.min(rect.left, window.innerWidth - menuWidth - 12)

    setPos({
      top: rect.bottom + 8,
      left: Math.max(12, safeLeft),
      width: menuWidth,
    })
  }

  const openMenu = () => {
    updatePos()
    setOpen((p) => !p)
  }

  useEffect(() => {
    if (!open) return

    const close = (e) => {
      if (
        !buttonRef.current?.contains(e.target) &&
        !e.target.closest?.("[data-job-open-menu='true']")
      ) {
        setOpen(false)
      }
    }

    window.addEventListener("mousedown", close)
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)

    return () => {
      window.removeEventListener("mousedown", close)
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [open])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={openMenu}
        className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-black text-slate-100 transition hover:bg-white/[0.1]"
      >
        Open Job ▼
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-job-open-menu="true"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999999,
            }}
            className="rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/80"
          >
            {links.length ? (
              links.map(([label, url]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    window.open(url, "_blank")
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm font-black text-slate-200 hover:bg-blue-600 hover:text-white"
                >
                  {label}
                </button>
              ))
            ) : (
              <div className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400">
                No job links available
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  )
}


function JobFinder({
  search,
  setSearch,
  jobs,
  findJobs,
  loadingJobs,
  jobError,
  jobFailure,
  showReason,
  setShowReason,
  applyWithAI,
  hasSearched,
  jobMode,
}) {
  const country = countries.find((c) => c.code === search.country) || countries[0]
  const activeRanges = salaryRanges[search.country] || salaryRanges.default

  const shouldShowNoJobs = hasSearched && !loadingJobs && jobs.length === 0

  const fallbackFailure =
    jobFailure ||
    (shouldShowNoJobs
      ? {
          error: "SORRY, JOBS NOT AVAILABLE FOR YOU.",
          reason:
            "No 90%–100% matching jobs were found. Click Find Anyway to show 20%–89% matching jobs. If those are not available, the app will show related jobs.",
          canFindAnyway: true,
        }
      : null)

  const titleText =
    jobMode === "exact"
      ? "Showing 90%–100% matching jobs"
      : jobMode === "anyway"
        ? "Showing 20%–89% matching jobs"
        : jobMode === "related"
          ? "Showing related jobs"
          : "Find Real Jobs"

  return (
    <div className="h-full overflow-y-auto p-4">
      <Panel className="relative z-20 mb-5 overflow-visible p-5">
        <h2 className="mb-1 text-2xl font-black text-white">Find Real Jobs</h2>

        <p className="mb-5 text-sm text-slate-400">
          Search Jobs shows 90%–100% matches first. Find Anyway shows 20%–89%. Related jobs appear only after that.
        </p>

        <div className="relative z-50 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Autocomplete
            label="Job Role"
            value={search.role}
            onChange={(v) => setSearch((p) => ({ ...p, role: v }))}
            options={roleOptions}
            placeholder="Type role..."
          />

          <SelectBox
            label="Country"
            value={search.country}
            onChange={(v) => {
              setSearch((p) => ({
                ...p,
                country: v,
                location: (cities[v] || cities.in)[0],
                salaryRange: (salaryRanges[v] || salaryRanges.default)[0].label,
              }))
            }}
            options={countries}
          />

          <SelectBox
            label="City / Location"
            value={search.location}
            onChange={(v) => setSearch((p) => ({ ...p, location: v }))}
            options={cities[search.country] || cities.other}
          />

          <SelectBox
            label="Experience"
            value={search.experience}
            onChange={(v) => setSearch((p) => ({ ...p, experience: v }))}
            options={["Fresher", "Internship", "0-1 Year", "1-2 Years", "2+ Years"]}
          />

          <SelectBox
            label={`Salary / CTC (${country.label})`}
            value={search.salaryRange}
            onChange={(v) => setSearch((p) => ({ ...p, salaryRange: v }))}
            options={activeRanges.map((r) => r.label)}
          />

          <div className="flex items-end">
            <Button variant="primary" onClick={() => findJobs("exact")} disabled={loadingJobs} className="w-full">
              {loadingJobs ? "Searching..." : "Search Jobs"}
            </Button>
          </div>
        </div>

        {jobError && !jobFailure && !shouldShowNoJobs && (
          <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{jobError}</div>
        )}
      </Panel>

      {jobs.length > 0 && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-200">
          {titleText}
        </div>
      )}

      {shouldShowNoJobs && (
        <NoJobsCard failure={fallbackFailure} hasSearched={hasSearched} onReason={() => setShowReason(true)} onFindAnyway={() => findJobs("anyway")} />
      )}

      <ReasonModal failure={showReason ? fallbackFailure : null} onClose={() => setShowReason(false)} />

      {loadingJobs && (
        <Panel className="p-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
          <h3 className="text-xl font-black text-white">Searching jobs...</h3>
          <p className="mt-2 text-slate-400">Checking job match percentage.</p>
        </Panel>
      )}

      <div className="relative z-10 grid gap-4 xl:grid-cols-2">
        {jobs.map((job) => {
          const match = Number(job.match || 0)
          const badgeClass =
            match >= 90
              ? "bg-emerald-500/10 text-emerald-300"
              : match >= 20
                ? "bg-yellow-500/10 text-yellow-200"
                : "bg-orange-500/10 text-orange-200"

          return (
            <Panel key={job.id || `${job.title}-${job.company}`} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-white">{job.title}</h3>
                  <p className="text-slate-400">{job.company}</p>
                </div>

                <span className={`rounded-full px-3 py-1 text-sm font-black ${badgeClass}`}>
                  {job.matchLabel || `${match}%`}
                </span>
              </div>

              {job.warning && match < 90 && (
                <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-3 text-xs font-bold text-yellow-100">
                  Match warning: {job.warning}
                </div>
              )}

              {job.matchBreakdown && (
                <div className="mb-4 grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="rounded-xl bg-white/[0.04] p-2">
                    <p className="text-slate-500">Role</p>
                    <p className="font-black text-white">{job.matchBreakdown.role}%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2">
                    <p className="text-slate-500">Exp</p>
                    <p className="font-black text-white">{job.matchBreakdown.experience}%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2">
                    <p className="text-slate-500">Salary</p>
                    <p className="font-black text-white">{job.matchBreakdown.salary}%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] p-2">
                    <p className="text-slate-500">Region</p>
                    <p className="font-black text-white">{job.matchBreakdown.region}%</p>
                  </div>
                </div>
              )}

              <p className="mb-2 text-sm text-slate-300">
                <b className="text-slate-500">Location:</b> {job.location}
              </p>

              <p className="mb-2 text-sm text-slate-300">
                <b className="text-slate-500">Salary:</b> {job.salary || "Salary not listed"}
              </p>

              <p className="mb-4 text-sm text-slate-300">
                <b className="text-slate-500">Source:</b> {job.source || "Adzuna"}
              </p>

              <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-slate-400">{cleanText(job.description).slice(0, 280)}...</p>

              <div className="flex flex-wrap gap-2">
                <Button variant="primary" onClick={() => applyWithAI(job)}>
                  Apply with AI
                </Button>

                <OpenJobDropdown job={job} />
              </div>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}

function Workspace({
  selectedJob,
  emailDraft,
  setEmailDraft,
  recipientEmail,
  setRecipientEmail,
  openGmail,
  copyApplicationEmail,
  markApplied,
  clearWorkspace,
  applicationPack,
}) {
  if (!selectedJob) {
    return (
      <div className="grid h-full place-items-center p-4">
        <Panel className="max-w-xl p-8 text-center">
          <h2 className="text-2xl font-black text-white">Apply Workspace</h2>
          <p className="mt-2 text-slate-400">Select a job from Find Real Jobs to generate an application email and apply faster.</p>
        </Panel>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel className="p-5">
          <h2 className="text-2xl font-black text-white">{selectedJob.title}</h2>
          <p className="text-slate-400">{selectedJob.company}</p>
          <p className="mt-3 text-sm text-slate-300">{selectedJob.location}</p>
          <p className="mt-2 text-sm text-slate-300">{selectedJob.salary}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">{selectedJob.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="green" onClick={markApplied}>
              Mark Applied
            </Button>
            {selectedJob.url && <Button onClick={() => window.open(selectedJob.url, "_blank")}>Open Original Job</Button>}
            <Button onClick={clearWorkspace}>Clear</Button>
          </div>
        </Panel>

        <Panel className="p-5">
          <h3 className="mb-4 text-xl font-black text-white">AI Application Email</h3>
          <Field label="Recruiter / HR Email" value={recipientEmail} onChange={setRecipientEmail} placeholder="hr@company.com" />
          <div className="mt-3">
            <Field label="Subject" value={emailDraft?.subject || ""} onChange={(v) => setEmailDraft((p) => ({ ...p, subject: v }))} />
          </div>
          <div className="mt-3">
            <Field label="Body" textarea value={emailDraft?.body || ""} onChange={(v) => setEmailDraft((p) => ({ ...p, body: v }))} />
          </div>
          <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm font-bold text-amber-100">
            ⚠️ Attach your resume manually before sending. Websites cannot attach your resume into Gmail/Outlook automatically.
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button variant="primary" onClick={openGmail} className="w-full">
              Open Email App
            </Button>
            <Button onClick={copyApplicationEmail} className="w-full">
              Copy Email
            </Button>
          </div>
        </Panel>
      </div>

      {applicationPack && (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <Panel className="p-5">
            <h3 className="mb-2 text-xl font-black text-white">AI Cover Letter</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{applicationPack.coverLetter || emailDraft?.body}</p>
          </Panel>
          <Panel className="p-5">
            <h3 className="mb-2 text-xl font-black text-white">AI Resume Tips</h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{applicationPack.resumeTips}</p>
          </Panel>
        </div>
      )}
    </div>
  )
}

function Tracker({ savedApplications, updateStatus, removeApplication, exportCSV, clearTracker, openTrackedJob }) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <Panel className="mb-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-white">Application Tracker</h2>
            <p className="text-sm text-slate-400">Track jobs you saved or applied to.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV}>Export CSV</Button>
            <Button variant="red" onClick={clearTracker}>Clear</Button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {savedApplications.map((job, index) => (
          <Panel key={`${job.title}-${job.company}-${index}`} className="p-5">
            <h3 className="text-xl font-black text-white">{job.title}</h3>
            <p className="text-slate-400">{job.company}</p>
            <p className="mt-2 text-sm text-slate-300">{job.location}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Saved", "Ready", "Applied", "Interview", "Rejected", "Offer"].map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(index, s)}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${
                    job.status === s ? "bg-blue-600 text-white" : "border border-white/10 bg-white/[0.05] text-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => openTrackedJob(job)}>Open</Button>
              <Button variant="red" onClick={() => removeApplication(index)}>Remove</Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}


function uniqueList(items) {
  return [...new Set((items || []).map((x) => cleanText(x)).filter(Boolean))]
}

function getSectionText(text, names, stopNames) {
  const lines = String(text || "").replace(/\r/g, "").split("\n")
  const startIndex = lines.findIndex((line) => {
    const clean = cleanText(line).toLowerCase()
    return names.some((name) => clean === name.toLowerCase() || clean.includes(name.toLowerCase()))
  })

  if (startIndex === -1) return ""

  const endIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) return false
    const clean = cleanText(line).toLowerCase()
    return stopNames.some((name) => clean === name.toLowerCase() || clean.includes(name.toLowerCase()))
  })

  return lines.slice(startIndex + 1, endIndex === -1 ? undefined : endIndex).join("\n").trim()
}

function guessResumeName(text, currentName = "") {
  const lines = String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => cleanText(x))
    .filter(Boolean)

  const badWords = [
    "resume",
    "cv",
    "curriculum",
    "email",
    "phone",
    "mobile",
    "linkedin",
    "github",
    "portfolio",
    "summary",
    "objective",
    "skills",
    "education",
    "project",
    "experience",
    "certification",
  ]

  const emailIndex = lines.findIndex((line) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(line))
  const searchLines = emailIndex > 0 ? lines.slice(0, emailIndex) : lines.slice(0, 12)

  const candidate = searchLines.find((line) => {
    const lower = line.toLowerCase()
    const words = line.split(/\s+/).filter(Boolean)
    return (
      words.length >= 2 &&
      words.length <= 5 &&
      !badWords.some((word) => lower.includes(word)) &&
      !/[0-9@|:]/.test(line) &&
      /^[a-zA-Z .'-]+$/.test(line)
    )
  })

  return candidate || currentName || ""
}

function guessResumeRole(text, currentRole = "") {
  const clean = cleanText(text).toLowerCase()

  const foundRole = roleOptions.find((role) => clean.includes(role.toLowerCase()))
  if (foundRole) return foundRole

  const rolePatterns = [
    /(frontend|front end|front-end)\s+(developer|engineer)/i,
    /(backend|back end|back-end)\s+(developer|engineer)/i,
    /full\s*stack\s+(developer|engineer)/i,
    /software\s+(developer|engineer)/i,
    /java\s+developer/i,
    /python\s+developer/i,
    /react\s+developer/i,
    /web\s+developer/i,
    /ui\s+developer/i,
    /data\s+analyst/i,
  ]

  for (const pattern of rolePatterns) {
    const match = text.match(pattern)
    if (match?.[0]) {
      return match[0]
        .replace(/front end|front-end/i, "Frontend")
        .replace(/back end|back-end/i, "Backend")
        .replace(/\b\w/g, (m) => m.toUpperCase())
    }
  }

  return currentRole || ""
}

function guessResumeLocation(text, currentLocation = "") {
  const allCities = Object.values(cities).flat()
  const foundCity = allCities.find((city) => city !== "Other" && cleanText(text).toLowerCase().includes(city.toLowerCase()))

  const countryNames = countries.map((c) => c.name)
  const foundCountry = countryNames.find((country) => cleanText(text).toLowerCase().includes(country.toLowerCase()))

  if (foundCity && foundCountry) return `${foundCity}, ${foundCountry}`
  if (foundCity) return foundCity
  if (foundCountry) return foundCountry
  return currentLocation || ""
}

function parseSkillSection(text, previousSkills = {}) {
  const skillText =
    getSectionText(text, ["technical skills", "skills", "technologies"], [
      "education",
      "academic",
      "projects",
      "project",
      "experience",
      "work experience",
      "internship",
      "certifications",
      "achievements",
      "languages",
    ]) || ""

  const lowerAll = cleanText(`${skillText}\n${text}`)
  const pick = (items) => items.filter((item) => lowerAll.toLowerCase().includes(item.toLowerCase()))

  const languages = uniqueList([
    ...pick(["C", "C++", "Java", "Python", "JavaScript", "TypeScript", "HTML", "CSS", "SQL"]),
    ...String(skillText.match(/languages?\s*[:\-]\s*([^\n]+)/i)?.[1] || "")
      .split(/[,|]/)
      .map((x) => x.trim()),
  ]).join(", ")

  const frontend = uniqueList([
    ...pick(["React", "ReactJS", "Next.js", "HTML", "CSS", "Tailwind CSS", "Bootstrap", "Responsive Design", "Redux"]),
    ...String(skillText.match(/frontend\s*[:\-]\s*([^\n]+)/i)?.[1] || "")
      .split(/[,|]/)
      .map((x) => x.trim()),
  ]).join(", ")

  const backend = uniqueList([
    ...pick(["Node.js", "Express.js", "Java", "Spring Boot", "Python", "Django", "Flask", "REST API"]),
    ...String(skillText.match(/backend\s*[:\-]\s*([^\n]+)/i)?.[1] || "")
      .split(/[,|]/)
      .map((x) => x.trim()),
  ]).join(", ")

  const database = uniqueList([
    ...pick(["MySQL", "MongoDB", "PostgreSQL", "SQLite", "Firebase", "Oracle"]),
    ...String(skillText.match(/database\s*[:\-]\s*([^\n]+)/i)?.[1] || "")
      .split(/[,|]/)
      .map((x) => x.trim()),
  ]).join(", ")

  const tools = uniqueList([
    ...pick(["Git", "GitHub", "VS Code", "Postman", "Figma", "Docker", "NPM", "Vite"]),
    ...String(skillText.match(/tools?\s*[:\-]\s*([^\n]+)/i)?.[1] || "")
      .split(/[,|]/)
      .map((x) => x.trim()),
  ]).join(", ")

  return {
    ...previousSkills,
    languages: languages || previousSkills.languages || "",
    frontend: frontend || previousSkills.frontend || "",
    backend: backend || previousSkills.backend || "",
    database: database || previousSkills.database || "",
    tools: tools || previousSkills.tools || "",
    other: previousSkills.other || "Problem Solving, Debugging, API Integration",
  }
}

function parseEducationSection(text, previousEducation = []) {
  const section = getSectionText(text, ["education", "academic qualification", "academics"], [
    "projects",
    "project",
    "work experience",
    "experience",
    "internship",
    "certifications",
    "achievements",
    "skills",
    "languages",
  ])

  if (!section) return previousEducation?.length ? previousEducation : []

  const lines = section.split("\n").map((x) => cleanText(x)).filter(Boolean)
  const joined = lines.join(" | ")

  const degreeLine = lines.find((line) => /bachelor|b\.?tech|btech|master|m\.?tech|degree|diploma|intermediate|secondary|ssc|hsc|engineering/i.test(line)) || lines[0] || ""
  const institutionLine = lines.find((line) => /university|college|institute|school|academy|technology|polytechnic/i.test(line) && line !== degreeLine) || lines[1] || ""
  const duration = joined.match(/(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:19|20)\d{2}|(?:19|20)\d{2}/)?.[0] || ""

  return [
    {
      degree: degreeLine,
      institution: institutionLine,
      location: guessResumeLocation(section, ""),
      duration,
      details: lines.filter((line) => line !== degreeLine && line !== institutionLine && line !== duration).slice(0, 2).join(" | "),
    },
  ].filter((e) => e.degree || e.institution)
}

function parseProjectsSection(text, previousProjects = []) {
  const section = getSectionText(text, ["projects", "project work", "academic projects"], [
    "work experience",
    "experience",
    "internship",
    "education",
    "certifications",
    "achievements",
    "languages",
  ])

  if (!section) return previousProjects?.length ? previousProjects : []

  const lines = section.split("\n").map((x) => cleanText(x)).filter(Boolean)
  if (!lines.length) return previousProjects?.length ? previousProjects : []

  const chunks = []
  let current = []

  lines.forEach((line) => {
    const looksLikeTitle = !/^[-•*]/.test(line) && line.length < 80 && !/technolog|tools|built|created|developed|designed|implemented/i.test(line)
    if (looksLikeTitle && current.length) {
      chunks.push(current)
      current = [line]
    } else {
      current.push(line.replace(/^[-•*]\s*/, ""))
    }
  })
  if (current.length) chunks.push(current)

  return chunks.slice(0, 4).map((chunk) => {
    const name = chunk[0] || "Project"
    const techLine = chunk.find((line) => /tech|tools|react|node|python|java|html|css|javascript|mongodb|mysql/i.test(line)) || ""
    const bullets = chunk.slice(1).filter((line) => line !== techLine).slice(0, 4)
    return {
      name,
      tech: techLine.replace(/^(technologies|technology|tech stack|tools)\s*[:\-]\s*/i, ""),
      link: chunk.find((line) => /https?:\/\/|github\.com/i.test(line)) || "",
      bullets: bullets.length ? bullets : [`Built ${name} as a practical project using relevant technologies.`],
    }
  })
}

function parseExperienceLikeSection(text, sectionNames, stopNames, previous = []) {
  const section = getSectionText(text, sectionNames, stopNames)
  if (!section) return previous?.length ? previous : []

  const lines = section.split("\n").map((x) => cleanText(x)).filter(Boolean)
  if (!lines.length) return previous?.length ? previous : []

  const chunks = []
  let current = []
  lines.forEach((line) => {
    const titleish = !/^[-•*]/.test(line) && line.length < 90 && !/responsib|worked|built|created|developed|managed|collaborated|supported/i.test(line)
    if (titleish && current.length) {
      chunks.push(current)
      current = [line]
    } else {
      current.push(line.replace(/^[-•*]\s*/, ""))
    }
  })
  if (current.length) chunks.push(current)

  return chunks.slice(0, 4).map((chunk) => {
    const heading = chunk[0] || "Experience"
    const duration = chunk.join(" ").match(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:19|20)?\d{2}\s*(?:-|–|to)\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(?:19|20)?\d{2})|(?:19|20)\d{2}\s*(?:-|–|to)\s*(?:present|current|(?:19|20)\d{2})/i)?.[0] || ""
    const parts = heading.split(/\s+[-–—|]\s+/)
    const bullets = chunk.slice(1).filter((line) => line !== duration).slice(0, 4)
    return {
      role: parts.length > 1 ? parts[0] : "",
      company: parts.length > 1 ? parts.slice(1).join(" - ") : heading,
      location: guessResumeLocation(chunk.join(" "), ""),
      duration,
      bullets: bullets.length ? bullets : ["Gained practical experience and developed professional skills through this role."],
    }
  })
}

function parseCertificationsSection(text, previousCertifications = []) {
  const section = getSectionText(text, ["certifications", "certification", "certificates", "courses"], ["achievements", "projects", "experience", "internship", "education", "languages"])
  if (!section) return previousCertifications?.length ? previousCertifications : []

  const lines = section.split("\n").map((x) => cleanText(x).replace(/^[-•*]\s*/, "")).filter(Boolean)
  return lines.slice(0, 8).map((line) => {
    const parts = line.split(/\s+[-–—|]\s+/).map((x) => x.trim()).filter(Boolean)
    const year = line.match(/(?:19|20)\d{2}/)?.[0] || ""
    return {
      name: parts[0] || line.replace(year, "").trim(),
      issuer: parts[1] || "",
      year,
      link: line.match(/https?:\/\/[^\s|,]+/i)?.[0] || "",
    }
  }).filter((c) => c.name)
}

function parseAchievementsSection(text, previousAchievements = []) {
  const section = getSectionText(text, ["achievements", "achievement", "awards", "accomplishments"], ["certifications", "projects", "experience", "internship", "education", "languages"])
  if (!section) return previousAchievements?.length ? previousAchievements : []

  const lines = section.split("\n").map((x) => cleanText(x).replace(/^[-•*]\s*/, "")).filter(Boolean)
  return lines.slice(0, 8).map((line) => {
    const parts = line.split(/\s+[-–—:]\s+/).map((x) => x.trim()).filter(Boolean)
    return {
      title: parts[0] || line,
      description: parts.slice(1).join(" - ") || "",
    }
  }).filter((a) => a.title)
}

function parseLanguages(text, previousLanguages = []) {
  const section = getSectionText(text, ["languages", "language"], ["certifications", "achievements", "projects", "experience"])
  const source = section || text
  const found = uniqueList(["English", "Hindi", "Telugu", "Urdu", "Tamil", "Kannada", "Malayalam", "Marathi"].filter((lang) => cleanText(source).toLowerCase().includes(lang.toLowerCase())))
  return found.length ? found.map((name) => ({ name, level: "Professional" })) : previousLanguages || []
}

function extractResumeProfileFromText(text, previousResume) {
  const source = String(text || "")
  const plain = cleanText(source)
  const email = source.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || previousResume.personal.email
  const phone = source.match(/(?:\+?\d{1,3}[\s-]?)?(?:\d[\s-]?){9,14}\d/)?.[0]?.replace(/\s+/g, " ").trim() || previousResume.personal.phone
  const linkedin = source.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s|,]+/i)?.[0] || previousResume.personal.linkedin
  const github = source.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[^\s|,]+/i)?.[0] || previousResume.personal.github
  const portfolio = source.match(/https?:\/\/(?!.*(?:linkedin|github))[^\s|,]+/i)?.[0] || previousResume.personal.portfolio

  const summary = getSectionText(source, ["professional summary", "summary", "profile"], ["career objective", "objective", "technical skills", "skills", "education", "projects", "experience"]) || previousResume.summary
  const objective = getSectionText(source, ["career objective", "objective"], ["technical skills", "skills", "education", "projects", "experience"]) || previousResume.objective

  const education = parseEducationSection(source, previousResume.education)
  const projects = parseProjectsSection(source, previousResume.projects)
  const experience = parseExperienceLikeSection(source, ["work experience", "professional experience", "experience", "employment"], ["internship", "education", "projects", "certifications", "achievements", "languages"], previousResume.experience)
  const internships = parseExperienceLikeSection(source, ["internship", "internships", "training"], ["work experience", "experience", "education", "projects", "certifications", "achievements", "languages"], previousResume.internships)

  const missing = []
  if (!email) missing.push("email")
  if (!phone) missing.push("phone")
  if (!education.length) missing.push("education")
  if (!projects.length) missing.push("projects")
  if (!github && !linkedin && !portfolio) missing.push("profile links")

  return {
    resume: normalizeResume({
      ...previousResume,
      personal: {
        ...previousResume.personal,
        name: guessResumeName(source, previousResume.personal.name),
        role: guessResumeRole(source, previousResume.personal.role),
        email,
        phone,
        location: guessResumeLocation(source, previousResume.personal.location),
        linkedin,
        github,
        portfolio,
      },
      summary,
      objective,
      skills: parseSkillSection(source, previousResume.skills),
      education,
      projects,
      experience,
      internships,
      certifications: parseCertificationsSection(source, previousResume.certifications),
      achievements: parseAchievementsSection(source, previousResume.achievements),
      languages: parseLanguages(source, previousResume.languages),
      atsKeywords: uniqueList([
        guessResumeRole(source, previousResume.personal.role),
        ...Object.values(parseSkillSection(source, previousResume.skills)).join(",").split(","),
      ]).join(", "),
    }),
    missing,
  }
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [section, setSection] = useState("studio")
  const [focusMode, setFocusMode] = useState(false)

  const [resume, setResume] = useState(() => normalizeResume(null))
  const [template, setTemplate] = useState(() => localStorage.getItem("jobpilot_template") || "modern")
  const [savedResumes, setSavedResumes] = useState(() => [])
  const [savedApplications, setSavedApplications] = useState(() => [])

  const [chats, setChats] = useState(() => {
    const existing = safeParse(localStorage.getItem("jobpilot_chats"), null)

    return existing?.length
      ? existing
      : [
          {
            id: uid(),
            title: "New Career Chat",
            messages: [
              {
                id: uid(),
                role: "ai",
                text: "JobPilot is ready. Upload a resume/document, edit your profile, search jobs, or track applications. I will show activity updates only.",
              },
            ],
          },
        ]
  })

  const [activeChatId, setActiveChatId] = useState(() => chats[0]?.id)
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aborter, setAborter] = useState(null)
  const [uploadedDocument, setUploadedDocument] = useState(null)

  const [search, setSearch] = useState({
    role: "Frontend Developer",
    country: "in",
    location: "Hyderabad",
    experience: "Fresher",
    salaryRange: "Any Salary",
  })

  const [jobs, setJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobError, setJobError] = useState("")
  const [jobFailure, setJobFailure] = useState(null)
  const [showReason, setShowReason] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [jobMode, setJobMode] = useState("")

  const [selectedJob, setSelectedJob] = useState(null)
  const [emailDraft, setEmailDraft] = useState(null)
  const [applicationPack, setApplicationPack] = useState(null)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [lastAIChanges, setLastAIChanges] = useState([])
  const [activityText, setActivityText] = useState("Ready. Use Upload, Auto-fill, Edit Profile, Edit Resume, Jobs, or Export. I will show updates here.")
  const [activityLog, setActivityLog] = useState([])
  const [auth, setAuth] = useState(() => safeParse(localStorage.getItem("jobpilot_auth"), null))
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [authNotice, setAuthNotice] = useState("")
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudStatus, setCloudStatus] = useState("Cloud ready")
  const [backendStatus, setBackendStatus] = useState({ state: "checking", message: "Checking backend...", database: false, jobsApi: false, aiApi: false })
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => localStorage.getItem("jobpilot_autosave") !== "off")
  const authToken = auth?.token || ""

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0]
  const score = useMemo(() => calculateScore(resume), [resume])
  const resumeSnapshotRef = useRef("")
  const templateSnapshotRef = useRef("")
  const welcomeRunRef = useRef(false)
  const autoSaveTimerRef = useRef(null)
  const appAutoSaveTimerRef = useRef(null)
  const cloudSyncReadyRef = useRef(false)
  const cloudResumeIdRef = useRef(localStorage.getItem("jobpilot_cloud_autosave_resume_id") || "")
  const appSyncingRef = useRef(false)

  useEffect(() => {
    // Welcome is only an overlay. The real app always stays mounted behind it,
    // so after the animation there is no blank screen.
    if (!authToken) {
      setShowWelcome(false)
      welcomeRunRef.current = false
      cloudSyncReadyRef.current = false
      setCloudStatus("Offline mode")
      return
    }

    if (welcomeRunRef.current) return

    welcomeRunRef.current = true
    setShowWelcome(true)

    const t = setTimeout(() => {
      setShowWelcome(false)
    }, 3100)

    return () => clearTimeout(t)
  }, [authToken])

  useEffect(() => {
    const currentResume = JSON.stringify(resume)
    localStorage.setItem("jobpilot_resume", currentResume)

    if (!resumeSnapshotRef.current) {
      resumeSnapshotRef.current = currentResume
      return
    }

    if (resumeSnapshotRef.current !== currentResume) {
      resumeSnapshotRef.current = currentResume
      if (authToken && autoSaveEnabled) {
        setCloudStatus("Saving...")
        notifyActivity("Saving resume", "Your latest profile/resume change is being saved to cloud.")
      } else {
        notifyActivity("Resume updated", "Your latest profile/resume changes were saved on this device. Login and enable auto-save for cloud sync.")
      }
    }
  }, [resume, authToken, autoSaveEnabled])

  useEffect(() => {
    localStorage.setItem("jobpilot_template", template)

    if (!templateSnapshotRef.current) {
      templateSnapshotRef.current = template
      return
    }

    if (templateSnapshotRef.current !== template) {
      templateSnapshotRef.current = template
      if (authToken && autoSaveEnabled) {
        setCloudStatus("Saving...")
        notifyActivity("Template changed", "The preview style changed and is being saved to cloud.")
      } else {
        notifyActivity("Template changed", "The resume preview style was updated on this device.")
      }
    }
  }, [template, authToken, autoSaveEnabled])

  useEffect(() => {
    localStorage.setItem("jobpilot_chats", JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    localStorage.setItem("jobpilot_saved_resumes", JSON.stringify(savedResumes))
  }, [savedResumes])

  useEffect(() => {
    localStorage.setItem("jobpilot_saved_applications", JSON.stringify(savedApplications))
  }, [savedApplications])

  useEffect(() => {
    if (!authToken) return

    cloudSyncReadyRef.current = false
    let cancelled = false

    const loadCloudWorkspace = async () => {
      setCloudLoading(true)

      try {
        const [resumeData, appData] = await Promise.all([
          authFetch("/resumes"),
          authFetch("/applications"),
        ])

        if (cancelled) return

        if (Array.isArray(resumeData.resumes) && resumeData.resumes.length) {
          const mappedResumes = resumeData.resumes.map((item) => ({
            id: item.id,
            cloudId: item.id,
            name: item.name,
            date: item.date ? new Date(item.date).toLocaleString() : now(),
            template: item.template || "modern",
            resume: normalizeResume(item.resume),
          }))
          setSavedResumes(mappedResumes)
          const latestResume = mappedResumes[0]
          const latestCloud = latestResume?.cloudId || latestResume?.id
          if (latestResume?.resume) {
            setResume(normalizeResume(latestResume.resume))
            setTemplate(latestResume.template || "modern")
          }
          if (latestCloud) {
            cloudResumeIdRef.current = latestCloud
            localStorage.setItem("jobpilot_cloud_autosave_resume_id", latestCloud)
          }
        } else {
          // IMPORTANT PRIVACY FIX:
          // A new or different user must not inherit any default/Haseeb/local resume.
          cloudResumeIdRef.current = ""
          localStorage.removeItem("jobpilot_cloud_autosave_resume_id")
          setResume(normalizeResume(null))
          setTemplate("modern")
          setSavedResumes([])
        }

        if (Array.isArray(appData.applications) && appData.applications.length) {
          appSyncingRef.current = true
          setSavedApplications(
            appData.applications.map((item) => ({
              ...item,
              id: item.id,
              cloudId: item.id,
            }))
          )
          setTimeout(() => {
            appSyncingRef.current = false
          }, 500)
        } else {
          setSavedApplications([])
        }

        notifyActivity("Cloud sync complete", "Your private online workspace was loaded for this account only.")
      } catch (error) {
        notifyActivity("Cloud sync skipped", error.message || "Could not load online data.")
      } finally {
        if (!cancelled) {
          setCloudLoading(false)
          cloudSyncReadyRef.current = true
          setCloudStatus("Cloud saved")
        }
      }
    }

    loadCloudWorkspace()

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    localStorage.setItem("jobpilot_autosave", autoSaveEnabled ? "on" : "off")
  }, [autoSaveEnabled])

  useEffect(() => {
    if (!authToken || !autoSaveEnabled || !cloudSyncReadyRef.current) return

    clearTimeout(autoSaveTimerRef.current)
    setCloudStatus("Saving...")

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const name = resume.title || `${resume.personal?.role || "Professional"} Resume`
        const payload = { name, template, resume }
        let data = null

        if (cloudResumeIdRef.current && isMongoObjectId(cloudResumeIdRef.current)) {
          try {
            data = await authFetch(`/resumes/${cloudResumeIdRef.current}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            })
          } catch {
            data = await authFetch("/resumes", {
              method: "POST",
              body: JSON.stringify(payload),
            })
          }
        } else {
          data = await authFetch("/resumes", {
            method: "POST",
            body: JSON.stringify(payload),
          })
        }

        const cloudId = data?.resume?.id || cloudResumeIdRef.current
        if (cloudId) {
          cloudResumeIdRef.current = cloudId
          localStorage.setItem("jobpilot_cloud_autosave_resume_id", cloudId)
        }

        const autoItem = {
          id: cloudId || "jobpilot-autosave",
          cloudId: cloudId || "",
          name: `Auto-saved ${name}`,
          date: now(),
          template,
          resume,
        }

        setSavedResumes((prev) => {
          const withoutAuto = prev.filter((item) => item.id !== "jobpilot-autosave" && item.id !== cloudId && item.cloudId !== cloudId)
          return [autoItem, ...withoutAuto].slice(0, 30)
        })

        setCloudStatus("Saved to cloud")
        notifyActivity("Saved to cloud", "Your latest resume/profile changes are safely saved online.")
      } catch (error) {
        setCloudStatus("Cloud save failed")
        notifyActivity("Auto-save failed", error.message || "Your latest resume change stayed saved on this device.")
      }
    }, 1400)

    return () => clearTimeout(autoSaveTimerRef.current)
  }, [resume, template, authToken, autoSaveEnabled])

  useEffect(() => {
    if (!authToken || !autoSaveEnabled || !cloudSyncReadyRef.current || appSyncingRef.current) return

    clearTimeout(appAutoSaveTimerRef.current)

    appAutoSaveTimerRef.current = setTimeout(async () => {
      if (!savedApplications.length) return

      try {
        setCloudStatus("Saving tracker...")
        const synced = []

        for (const item of savedApplications.slice(0, 40)) {
          const cloudId = item.cloudId || (isMongoObjectId(item.id) ? item.id : "")
          const payload = { ...item }
          delete payload.cloudId
          if (!isMongoObjectId(payload.id)) delete payload.id

          if (cloudId && isMongoObjectId(cloudId)) {
            const data = await authFetch(`/applications/${cloudId}`, {
              method: "PUT",
              body: JSON.stringify(payload),
            })
            synced.push({ ...item, id: data.application?.id || cloudId, cloudId: data.application?.id || cloudId })
          } else {
            const data = await authFetch("/applications", {
              method: "POST",
              body: JSON.stringify(payload),
            })
            synced.push({ ...item, id: data.application?.id || item.id, cloudId: data.application?.id || "" })
          }
        }

        if (synced.length) {
          appSyncingRef.current = true
          setSavedApplications((prev) => prev.map((item) => synced.find((x) => x.title === item.title && x.company === item.company) || item))
          setTimeout(() => {
            appSyncingRef.current = false
          }, 500)
        }

        setCloudStatus("Tracker saved to cloud")
        notifyActivity("Tracker saved", "Your saved applications were synced online.")
      } catch (error) {
        setCloudStatus("Tracker save failed")
        notifyActivity("Tracker auto-save failed", error.message || "Applications stayed saved on this device.")
      }
    }, 1800)

    return () => clearTimeout(appAutoSaveTimerRef.current)
  }, [savedApplications, authToken, autoSaveEnabled])

  const notifyActivity = (title, detail = "") => {
    const cleanTitle = String(title || "").trim()
    const cleanDetail = String(detail || "").trim()
    if (!cleanTitle) return

    const line = cleanDetail ? `${cleanTitle} — ${cleanDetail}` : cleanTitle
    setActivityText(line)
    setActivityLog((prev) => [
      { id: uid(), title: cleanTitle, detail: cleanDetail },
      ...prev,
    ].slice(0, 12))
  }

  useEffect(() => {
    let cancelled = false

    const checkBackend = async (silent = false) => {
      try {
        const response = await fetch(`${API_URL}/health`)
        const data = await response.json().catch(() => ({}))

        if (!response.ok || data.success === false) throw new Error(data.error || "Health check failed")
        if (cancelled) return

        setBackendStatus({
          state: "online",
          message: data.database ? "Backend and database online" : "Backend online, database not connected",
          database: Boolean(data.database),
          jobsApi: Boolean(data.adzuna),
          aiApi: Boolean(data.groq),
        })

        if (!silent && data.database) notifyActivity("System ready", "Backend, login, and cloud database are connected.")
        if (!silent && !data.database) notifyActivity("Backend online", "Server is running, but MongoDB is not connected yet.")
      } catch (error) {
        if (cancelled) return
        setBackendStatus({
          state: "offline",
          message: "Backend not connected. Run node index.js inside the server folder.",
          database: false,
          jobsApi: false,
          aiApi: false,
        })
        if (!silent) notifyActivity("Backend offline", "Start backend: cd C:\\Users\\hasee\\Downloads\\jobpilot\\server then node index.js")
      }
    }

    checkBackend(false)
    const timer = setInterval(() => checkBackend(true), 45000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  const authFetch = async (path, options = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }

    if (authToken) headers.Authorization = `Bearer ${authToken}`

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Request failed.")
    }

    return data
  }

  const handleAuth = async ({ mode, name, email, password }) => {
    setAuthLoading(true)
    setAuthError("")
    setAuthNotice("")

    try {
      const data = await fetch(`${API_URL}/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      }).then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json.success === false) throw new Error(json.error || "Authentication failed.")
        return json
      })

      const nextAuth = { token: data.token, user: data.user }

      // PRIVACY FIX: clear any old/default local workspace before loading this user's cloud data.
      localStorage.removeItem("jobpilot_resume")
      localStorage.removeItem("jobpilot_saved_resumes")
      localStorage.removeItem("jobpilot_saved_applications")
      localStorage.removeItem("jobpilot_cloud_autosave_resume_id")
      cloudResumeIdRef.current = ""
      cloudSyncReadyRef.current = false
      setResume(normalizeResume(null))
      setSavedResumes([])
      setSavedApplications([])
      setTemplate("modern")

      setAuth(nextAuth)
      localStorage.setItem("jobpilot_auth", JSON.stringify(nextAuth))
      notifyActivity("Account connected", "Your private workspace is loading for this account only.")
    } catch (error) {
      setAuthError(friendlyError(error, "Authentication failed."))
    } finally {
      setAuthLoading(false)
    }
  }

  const requestPasswordReset = async ({ email }) => {
    setAuthLoading(true)
    setAuthError("")
    setAuthNotice("")

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.success === false) throw new Error(data.error || "Could not send reset code.")

      const codeText = data.devCode ? ` Reset code: ${data.devCode}` : ""
      setAuthNotice(`${data.message || "Reset code created."}${codeText}`)
      return data
    } catch (error) {
      setAuthError(friendlyError(error, "Could not send reset code."))
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const resetPassword = async ({ email, code, password }) => {
    setAuthLoading(true)
    setAuthError("")
    setAuthNotice("")

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.success === false) throw new Error(data.error || "Could not reset password.")

      setAuthNotice(data.message || "Password changed. Login with your new password.")
      return data
    } catch (error) {
      setAuthError(friendlyError(error, "Could not reset password."))
      throw error
    } finally {
      setAuthLoading(false)
    }
  }

  const logoutUser = () => {
    localStorage.removeItem("jobpilot_auth")
    localStorage.removeItem("jobpilot_resume")
    localStorage.removeItem("jobpilot_saved_resumes")
    localStorage.removeItem("jobpilot_saved_applications")
    localStorage.removeItem("jobpilot_cloud_autosave_resume_id")
    cloudResumeIdRef.current = ""
    cloudSyncReadyRef.current = false
    setAuth(null)
    setResume(normalizeResume(null))
    setTemplate("modern")
    setSavedResumes([])
    setSavedApplications([])
    setActivityText("Logged out — Private workspace cleared from this browser.")
  }

  const addMessage = (role, text) => {
    const clean = String(text || "").trim()
    if (!clean) return

    if (role === "ai") {
      notifyActivity("Update", clean.length > 160 ? `${clean.slice(0, 160)}...` : clean)
    }

    const msg = { id: uid(), role, text: clean }

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat

        const last = chat.messages?.[chat.messages.length - 1]

        // Prevent duplicate AI/user bubbles when a request fires twice, backend retries,
        // or a local reply and backend reply are accidentally the same.
        if (last && last.role === role && String(last.text || "").trim() === clean) {
          return chat
        }

        return {
          ...chat,
          title: role === "user" && chat.title === "New Career Chat" ? cleanText(clean).slice(0, 30) || chat.title : chat.title,
          messages: [...chat.messages, msg],
        }
      })
    )
  }

  const newChat = () => {
    const chat = {
      id: uid(),
      title: "New Career Chat",
      messages: [
        {
          id: uid(),
          role: "ai",
          text: "New chat started. Tell me what resume, job, or career task you want to work on.",
        },
      ],
    }

    setChats((p) => [chat, ...p])
    setActiveChatId(chat.id)
  }

  const deleteChat = (id) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id)

      if (activeChatId === id) setActiveChatId(next[0]?.id)

      return next.length ? next : prev
    })
  }

  const handleAgentResponse = (data, fallbackReply = "Done.", originalMessage = "") => {
    let payload = data
    const rawReply = data?.chatReply || data?.reply || ""

    if (!isResumeActionResponse(payload) && typeof rawReply === "string" && rawReply.trim()) {
      try {
        const parsed = parseAIResumeJson(rawReply)
        if (parsed?.type || parsed?.actions || parsed?.personal || parsed?.skills || parsed?.summary || parsed?.objective) {
          payload = { ...data, ...parsed }
        }
      } catch {
        // Not JSON. Continue as normal chat.
      }
    }

    if (isResumeActionResponse(payload) && payload.actions.length > 0) {
      const before = normalizeResume(resume)
      let next = applyResumeActionsToResume(before, payload.actions)
      let changed = JSON.stringify(next) !== JSON.stringify(before)
      let finalActions = payload.actions

      if (!changed) {
        const local = applyLocalIntent(originalMessage, before)
        if (local.handled) {
          next = local.resume
          changed = JSON.stringify(next) !== JSON.stringify(before)
          finalActions = local.actions || payload.actions
        }
      }

      if (changed) {
        const changes = summarizeAppliedActions(finalActions, originalMessage)
        setResume(next)
        setLastAIChanges(changes)
        addMessage("ai", makeActionChatReply(finalActions, originalMessage, payload.chatReply || payload.reply || fallbackReply))
        return true
      }

      const message = makeActionChatReply([], originalMessage, payload.chatReply || payload.reply || fallbackReply)
      setLastAIChanges([])
      addMessage("ai", message)
      return false
    }

    const reply = payload?.chatReply || payload?.reply || rawReply || ""

    if (reply) {
      try {
        const parsed = parseAIResumeJson(reply)
        if (parsed.personal || parsed.skills || parsed.projects || parsed.summary || parsed.objective) {
          const before = normalizeResume(resume)
          const next = ensureResumeHasUsefulDefaults(normalizeResume({ ...before, ...parsed }))
          const changed = JSON.stringify(next) !== JSON.stringify(before)

          if (changed) {
            const changes = ["updated the resume with the AI-generated details"]
            setResume(next)
            setLastAIChanges(changes)
            addMessage("ai", `Done — I updated your resume preview.\n\nChanged:\n• ${changes[0]}`)
            return true
          }
        }
      } catch {
        // Normal chat reply. No JSON action was returned.
      }
    }

    const local = applyLocalIntent(originalMessage, resume)
    if (local.handled) {
      const before = normalizeResume(resume)
      const changed = JSON.stringify(local.resume) !== JSON.stringify(before)

      if (changed) {
        const changes = local.actions ? summarizeAppliedActions(local.actions, originalMessage) : ["updated the requested resume section"]
        setResume(local.resume)
        setLastAIChanges(changes)
        addMessage("ai", local.reply || `Done — I updated your resume preview.\n\nChanged:\n${changes.map((c) => `• ${c}`).join("\n")}`)
        return true
      }
    }

    addMessage("ai", humanizeAIReply(reply || fallbackReply, fallbackReply))
    return false
  }

  const isDirectResumeEditRequest = (text = "") => {
    const t = String(text || "").toLowerCase().trim()

    // Block only when the user clearly asks AI to directly change the resume/profile/preview.
    const directPhrases = [
      "edit my resume",
      "edit resume",
      "edit my cv",
      "edit cv",
      "edit my profile",
      "edit profile",
      "change my resume",
      "change resume",
      "update my resume",
      "update resume",
      "fix my resume",
      "fix resume",
      "modify my resume",
      "modify resume",
      "change my profile",
      "update my profile",
      "fix my profile",
      "change my target role",
      "fix my target role",
      "update my target role",
      "set my target role",
      "change role in resume",
      "update role in resume",
      "add to my resume",
      "add it to my resume",
      "remove from my resume",
      "delete from my resume",
      "replace in my resume",
      "update preview",
      "change preview",
      "edit preview",
      "apply this to resume",
      "put this in resume",
      "save this in resume",
    ]

    return directPhrases.some((phrase) => t.includes(phrase))
  }

  const buildDisabledEditReply = () => {
    return "Sorry, I am in upgrade mode right now, so I cannot directly edit your resume/profile. You will get this feature again soon. I added your request to the developer list."
  }

  const buildLocalCopyReply = (message = "") => {
    const rawMessage = String(message || "").trim()
    const t = rawMessage.toLowerCase()

    const wrapResult = (intro, result) => `${intro}\n\n[[COPY_RESULT_START]]\n${String(result || "").trim()}\n[[COPY_RESULT_END]]`

    const currentSkillsText = () => {
      const r = resume || {}
      const sk = r.skills || {}
      const lines = []
      if (sk.languages) lines.push(`Languages: ${sk.languages}`)
      if (sk.frontend) lines.push(`Frontend: ${sk.frontend}`)
      if (sk.backend) lines.push(`Backend: ${sk.backend}`)
      if (sk.database) lines.push(`Database: ${sk.database}`)
      if (sk.tools) lines.push(`Tools: ${sk.tools}`)
      if (sk.other) lines.push(`Other: ${sk.other}`)
      return lines.join("\n")
    }

    const currentProfileSummary = () => {
      const r = resume || {}
      const role = r.personal?.role || "developer"
      const skills = Object.values(r.skills || {}).filter(Boolean).join(", ")
      return `Motivated and detail-oriented ${role} with practical knowledge of ${skills || "modern development tools"}. Skilled in problem solving, debugging, building user-focused solutions, and learning quickly to deliver clean, reliable, and professional work.`
    }

    const asksAboutCurrentSkills =
      /\b(my|current|profile)\b.*\bskills?\b/i.test(rawMessage) ||
      /\bdo you know\b.*\bskills?\b/i.test(rawMessage) ||
      /\bwhat are my skills\b/i.test(rawMessage) ||
      /\bshow my skills\b/i.test(rawMessage)

    if (asksAboutCurrentSkills) {
      const skillText = currentSkillsText()
      if (skillText) {
        return `Yes. Based on your current profile, your skills are:\n\n${skillText}\n\nIf any skill is missing or wrong, you can update it manually in Edit Profile.`
      }
      return "I checked your current profile, but I could not find skills filled in yet. You can add them in Edit Profile, or tell me your skills and I can format them nicely for you to copy."
    }

    // Do NOT hijack general questions like "summary of cricket" or "summarize this article".
    // Only create local copy-ready resume results when the user clearly asks for resume/career content.
    const nonResumeTopicWords = [
      "cricket",
      "football",
      "movie",
      "news",
      "article",
      "story",
      "chapter",
      "paragraph",
      "essay",
      "topic",
      "history",
      "science",
      "politics",
      "game",
      "sports",
    ]

    const hasNonResumeTopic = nonResumeTopicWords.some((word) => t.includes(word))
    const resumeContext =
      t.includes("resume") ||
      t.includes("cv") ||
      t.includes("career") ||
      t.includes("job") ||
      t.includes("profile") ||
      t.includes("developer") ||
      t.includes("fresher") ||
      t.includes("ats") ||
      t.includes("project") ||
      t.includes("portfolio") ||
      t.includes("interview") ||
      t.includes("application") ||
      t.includes("cover letter") ||
      t.includes("email")

    // If user pasted some text and asks to improve it, let the backend AI improve that exact text.
    // This prevents wrong local guesses like returning skills when the user pasted a summary.
    const asksToImproveGivenText =
      t.includes("take this") ||
      t.includes("make this better") ||
      t.includes("make it better") ||
      t.includes("improve this") ||
      t.includes("rewrite this") ||
      t.includes("better this")

    if (asksToImproveGivenText) return ""

    if (t.includes("summary") && !hasNonResumeTopic && (resumeContext || t === "give me summary" || t === "summary" || t.includes("professional summary"))) {
      return wrapResult(
        "Here is a cleaner professional summary based on your current profile. You can copy only the result below:",
        currentProfileSummary()
      )
    }

    if (t.includes("skill") && !hasNonResumeTopic && resumeContext) {
      return wrapResult(
        "Here is a cleaner skills section based on your current profile. You can copy only the result below:",
        currentSkillsText() || "Languages: Python, JavaScript, HTML, CSS\nTools: Git, GitHub, VS Code\nOther: Problem Solving, Debugging, Communication"
      )
    }

    if ((t.includes("objective") || t.includes("career objective")) && !hasNonResumeTopic) {
      return wrapResult(
        "Here is a stronger career objective. You can copy only the result below:",
        "Seeking an entry-level developer role where I can apply my technical skills, strengthen my professional experience, and contribute to building clean, responsive, and user-focused software solutions while continuously learning and improving."
      )
    }

    if ((t.includes("project") || t.includes("bullet")) && !hasNonResumeTopic) {
      return wrapResult(
        "Here are stronger project bullet points. You can copy only the result below:",
        "• Built a responsive project interface with clean navigation, real-time data handling, and user-friendly design.\n• Integrated API-based functionality to fetch, display, and manage dynamic content efficiently.\n• Improved usability, structure, and performance to make the project more professional and recruiter-friendly."
      )
    }

    if ((t.includes("ats") || t.includes("keyword")) && !hasNonResumeTopic) {
      return wrapResult(
        "Here are ATS keywords. You can copy only the result below:",
        "React, JavaScript, HTML, CSS, Tailwind CSS, Responsive Design, API Integration, REST APIs, Node.js, Express.js, MongoDB, MySQL, Git, GitHub, VS Code, Debugging, Problem Solving, Web Development, Frontend Development"
      )
    }

    return ""
  }

  const sendMessage = async () => {
    const message = aiInput.trim()
    if (!message || aiLoading) return

    setAiInput("")
    addMessage("user", message)

    // PERMANENT SAFETY RULE:
    // AI chat cannot edit resume/profile state. Auto-fill button and manual editors are the only ways to change preview.
    if (isDirectResumeEditRequest(message)) {
      addMessage("ai", buildDisabledEditReply())
      return
    }

    const localCopyReply = buildLocalCopyReply(message)
    if (localCopyReply) {
      addMessage("ai", localCopyReply)
      return
    }

    const controller = new AbortController()
    setAborter(controller)
    setAiLoading(true)

    try {
      const res = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message,
          mode: "chat",
          resume,
          profile: {
            ...resume.personal,
            summary: resume.summary,
            objective: resume.objective,
            skills: resume.skills,
            education: resume.education,
            projects: resume.projects,
            experience: resume.experience,
            internships: resume.internships,
            certifications: resume.certifications,
            achievements: resume.achievements,
            languages: resume.languages,
            atsKeywords: resume.atsKeywords,
          },
          readOnlyProfileText: resumeToPlainText(resume),
          selectedJob,
          savedApplications,
          searchPreferences: search,
          uploadedDocument,
          documentType: "chat",
          aiEditingDisabled: true,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        addMessage("ai", data.reply || data.chatReply || data.error || "Connection failed. Make sure your backend is running on port 5000.")
        return
      }

      const reply = data.chatReply || data.reply || "I understood. Tell me what you want help with."
      addMessage("ai", humanizeAIReply(reply, reply))
    } catch (error) {
      if (error.name !== "AbortError") {
        addMessage("ai", "Connection failed. Make sure your backend is running on port 5000.")
      }
    } finally {
      setAiLoading(false)
      setAborter(null)
    }
  }

  const stopAI = () => {
    aborter?.abort()
    setAiLoading(false)
    setAborter(null)
  }

  const askResumeAction = async (shortReply, prompt, expectJson = true) => {
    addMessage("user", shortReply)
    setAiLoading(true)

    try {
      const res = await fetch(`${API_URL}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          mode: "action",
          resume,
          profile: {
            ...resume.personal,
            summary: resume.summary,
            objective: resume.objective,
            skills: Object.values(resume.skills || {}).join(", "),
            projects: resume.projects.map((p) => `${p.name}: ${p.tech} ${(p.bullets || []).join(" ")}`).join("\n"),
            experience: resume.experience.map((e) => `${e.role} ${e.company} ${(e.bullets || []).join(" ")}`).join("\n"),
            internships: resume.internships.map((e) => `${e.role} ${e.company} ${(e.bullets || []).join(" ")}`).join("\n"),
            education: resume.education.map((e) => `${e.degree} ${e.institution}`).join("\n"),
          },
          selectedJob,
          savedApplications,
          searchPreferences: search,
          uploadedDocument,
          documentType: expectJson ? "resume-action" : "chat",
        }),
      })

      const data = await res.json()

      if (!data.success) {
        addMessage("ai", data.reply || data.error || "AI action failed. Check backend terminal.")
        return
      }

      handleAgentResponse(data, "Done. I updated the resume preview.", prompt)
    } catch {
      addMessage("ai", "AI action failed. Check backend terminal.")
    } finally {
      setAiLoading(false)
    }
  }

  const improveResume = () => {
    addMessage("user", "Improve my resume")
    addMessage("ai", "I am improving your full resume now: summary, skills, projects, ATS keywords, and professional wording.")
    setResume((prev) => ensureResumeHasUsefulDefaults({
      ...prev,
      summary: `Motivated ${prev.personal.role || "professional"} with practical experience in ${Object.values(prev.skills || {}).filter(Boolean).join(", ")}. Skilled in building clean, user-focused solutions, learning quickly, debugging issues, and applying professional development practices to real projects.`,
      objective: prev.objective || `Seeking an opportunity as a ${prev.personal.role || "professional"} where I can apply my skills, grow through real-world work, and contribute to meaningful results.`,
      projects: (prev.projects.length ? prev.projects : [{ name: "Professional Portfolio Project", tech: Object.values(prev.skills || {}).filter(Boolean).join(", "), link: prev.personal.github || "", bullets: [] }]).map((project) => ({
        ...project,
        bullets: (project.bullets || []).filter(Boolean).length >= 2
          ? project.bullets
          : [
              `Built ${project.name || "a practical project"} using ${project.tech || "relevant technologies"} to solve real-world problems.`,
              "Improved usability, structure, and responsiveness with clean implementation practices.",
              "Tested, debugged, and refined the project to make it presentable for recruiters.",
            ],
      })),
      atsKeywords: uniqueList([
        prev.personal.role,
        ...Object.values(prev.skills || {}).join(",").split(","),
        "Problem Solving",
        "Communication",
        "Project Development",
        "Debugging",
        "ATS Friendly Resume",
      ]).join(", "),
    }))
    setTimeout(() => addMessage("ai", "Done. I updated the resume preview with stronger professional content."), 50)
  }

  const makeATS = () => {
    const local = applyLocalIntent("make ats friendly", resume)
    setResume(local.resume)
    addMessage("user", "Make ATS-Friendly")
    addMessage("ai", local.reply)
  }

  const analyzeResume = () => {
    const suggestions = score.suggestions.length ? score.suggestions.map((s) => `• ${s}`).join("\n") : "Your resume is strong. Keep it clean and tailored to each job."
    addMessage("ai", `Resume score: ${score.score}%\n\n${suggestions}`)
  }

  const improveSection = (sectionName) => {
    addMessage("user", `AI improve ${sectionName}`)
    addMessage("ai", `I am improving your ${sectionName} section and updating the resume preview now.`)

    setResume((prev) => {
      const next = ensureResumeHasUsefulDefaults(prev)

      if (sectionName === "summary" || sectionName === "personal") {
        next.summary = `Motivated ${next.personal.role || "professional"} with practical knowledge of ${Object.values(next.skills || {}).filter(Boolean).join(", ")}. Skilled at learning quickly, solving problems, building clean solutions, and presenting work professionally for recruiters.`
      }

      if (sectionName === "skills") {
        next.atsKeywords = uniqueList([next.personal.role, ...Object.values(next.skills || {}).join(",").split(","), "Problem Solving", "Debugging", "Teamwork", "Communication"]).join(", ")
      }

      if (sectionName === "projects") {
        next.projects = (next.projects.length ? next.projects : [{ name: "Professional Portfolio Project", tech: Object.values(next.skills || {}).filter(Boolean).join(", "), link: next.personal.github || "", bullets: [] }]).map((project) => ({
          ...project,
          bullets: (project.bullets || []).filter(Boolean).length >= 2
            ? project.bullets
            : [
                `Built ${project.name || "a project"} using ${project.tech || "relevant technologies"} to demonstrate practical skills.`,
                "Created a clean structure with user-friendly design and maintainable code.",
                "Improved the project through testing, debugging, and performance-focused refinements.",
              ],
        }))
      }

      if (sectionName === "experience" || sectionName === "internships") {
        const list = next[sectionName] || []
        next[sectionName] = list.map((item) => ({
          ...item,
          bullets: (item.bullets || []).filter(Boolean).length >= 2
            ? item.bullets
            : [
                "Contributed to daily work with attention to quality, accuracy, and timely completion.",
                "Improved communication, problem-solving, and practical professional skills through hands-on tasks.",
                "Collaborated with team members and followed structured work practices.",
              ],
        }))
      }

      if (sectionName === "education" && !next.education.length) {
        next.education = [{ degree: "", institution: "", location: "", duration: "", details: "Add your education details here if available." }]
      }

      return normalizeResume(next)
    })

    setTimeout(() => addMessage("ai", `Done. I improved the ${sectionName} section in your live resume preview.`), 80)
  }

  const uploadFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append("document", file)

    setAiLoading(true)

    try {
      const res = await fetch(`${API_URL}/upload-document`, {
        method: "POST",
        body: form,
      })

      const data = await res.json()

      if (!data.success) {
        addMessage("ai", data.error || "Upload failed.")
        return
      }

      setUploadedDocument(data)
      setResume((prev) => {
        const parsed = extractResumeProfileFromText(data.text, prev)
        return ensureResumeHasUsefulDefaults(parsed.resume)
      })
      notifyActivity("Resume uploaded and auto-filled", `I read ${data.fileName}, extracted ${data.chars} characters, and filled the details I could find.`)
      addMessage("ai", `Uploaded ${data.fileName}. I extracted ${data.chars} characters and auto-filled your profile/resume where possible. You can still click Auto-fill again if you want to retry.`)
    } catch {
      addMessage("ai", "Upload failed. Make sure the backend is online, then try a PDF/DOCX/TXT resume with readable text.")
    } finally {
      setAiLoading(false)
      e.target.value = ""
    }
  }

  const uploadSectionFile = async (e, sectionName = "profile") => {
    const file = e.target.files?.[0]
    if (!file) return

    const form = new FormData()
    form.append("document", file)

    setAiLoading(true)
    addMessage("user", `Upload document for ${sectionName}`)
    addMessage("ai", `I am reading this document and auto-filling the ${sectionName} details now.`)

    try {
      const res = await fetch(`${API_URL}/upload-document`, {
        method: "POST",
        body: form,
      })
      const data = await res.json()

      if (!data.success) {
        addMessage("ai", data.error || "Upload failed.")
        return
      }

      setUploadedDocument(data)
      setResume((prev) => {
        const parsed = extractResumeProfileFromText(data.text, prev)
        return ensureResumeHasUsefulDefaults(parsed.resume)
      })
      addMessage("ai", `Done. I extracted ${data.chars} characters from ${data.fileName} and updated your ${sectionName} details where possible.`)
    } catch {
      addMessage("ai", "Upload failed. Make sure the backend is online, then try a PDF/DOCX/TXT resume with readable text.")
    } finally {
      setAiLoading(false)
      e.target.value = ""
    }
  }

  const createResumeFromDocument = () => {
    if (!uploadedDocument) {
      addMessage("ai", "Upload a resume or document first, then click Create Resume.")
      return
    }

    askResumeAction(
      "Create resume from uploaded document",
      "Create a clean ATS-friendly professional resume from the uploaded document. Use only truthful information from the document. Fill all available resume/profile fields. Leave missing fields unchanged or empty."
    )
  }

  const autoFillDocument = () => {
    if (!uploadedDocument?.text) {
      addMessage("ai", "Please upload a resume/document first, then click Auto-fill.")
      return
    }

    addMessage("user", "Auto-fill my profile from uploaded document")
    setAiLoading(true)

    fetch(`${API_URL}/agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Auto-fill my resume/profile using the uploaded document. Extract only real information. Update personal details, target role, summary, objective, skills, education, projects, experience, internships, certifications, achievements, languages, and ATS keywords when available. Leave anything not found unchanged or empty.",
        mode: "action",
        resume,
        profile: resume.personal,
        selectedJob,
        savedApplications,
        searchPreferences: search,
        uploadedDocument,
        documentType: "resume-action",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && isResumeActionResponse(data)) {
          handleAgentResponse(data, "Auto-fill completed. I updated all details I could find in your document.")
          return
        }

        setResume((prev) => {
          const parsed = extractResumeProfileFromText(uploadedDocument.text, prev)
          const missingText = parsed.missing.length
            ? `\n\nSome details were not clearly found in the uploaded document: ${parsed.missing.join(", ")}. You can add them manually from Edit Profile.`
            : ""

          setTimeout(() => {
            addMessage(
              "ai",
              `Auto-fill completed. I updated your profile, summary, skills, education, projects, experience/internships, links, and languages from the uploaded document.${missingText}`
            )
          }, 0)

          return ensureResumeHasUsefulDefaults(parsed.resume)
        })
      })
      .catch(() => {
        setResume((prev) => {
          const parsed = extractResumeProfileFromText(uploadedDocument.text, prev)
          setTimeout(() => addMessage("ai", "Auto-fill completed using safe local extraction. I updated the details I could find."), 0)
          return ensureResumeHasUsefulDefaults(parsed.resume)
        })
      })
      .finally(() => setAiLoading(false))
  }

  const buildEmail = (job) => ({
    subject: `Application for ${job.title} - ${resume.personal.name}`,
    body: `Dear Hiring Team,

I am writing to apply for the ${job.title} position at ${job.company}. I am interested in this opportunity and believe my skills in ${Object.values(resume.skills).filter(Boolean).join(", ")} make me a strong fit for this role.

I have worked on projects such as ${resume.projects?.[0]?.name || "practical software projects"}, where I gained hands-on experience in building clean, responsive, and user-focused solutions.

Please find my resume attached for your review. I would be grateful for the opportunity to discuss how I can contribute to your team.

Thank you for your time and consideration.

Best regards,
${resume.personal.name}
${resume.personal.phone}
${resume.personal.email}
${resume.personal.github || resume.personal.portfolio || ""}`,
  })

  const findJobs = async (mode = "exact") => {
    notifyActivity(mode === "exact" ? "Searching jobs" : "Finding jobs anyway", mode === "exact" ? "Checking strict 90%–100% matches for your filters." : "Relaxing filters to find more jobs.")
    setLoadingJobs(true)
    setJobError("")
    setJobFailure(null)
    setShowReason(false)
    setHasSearched(true)
    setJobs([])
    setJobMode(mode)

    const buildFallbackLinks = (override = {}) => {
      const role = override.role || search.role || "Software Developer"
      const location = override.location ?? search.location ?? ""
      const countryName = countries.find((c) => c.code === (override.country || search.country))?.name || ""
      const q = encodeURIComponent(`${role} ${location || countryName}`.trim())

      return {
        linkedin: `https://www.linkedin.com/jobs/search/?keywords=${q}`,
        indeed: `https://www.indeed.com/jobs?q=${q}`,
        google: `https://www.google.com/search?q=${q}+jobs`,
        naukri:
          (override.country || search.country) === "in"
            ? `https://www.naukri.com/${encodeURIComponent(role)}-jobs-in-${encodeURIComponent(location || "india")}`
            : "",
      }
    }

    const makeRequest = async (attempt) => {
      const activeRanges = salaryRanges[attempt.country || search.country] || salaryRanges.default
      const selectedRange = activeRanges.find((r) => r.label === search.salaryRange) || activeRanges[0]

      const relaxedSalary = attempt.relaxSalary === true

      const params = new URLSearchParams({
        role: attempt.role || search.role || "Frontend Developer",
        location: attempt.location ?? search.location ?? "",
        country: attempt.country || search.country || "in",
        experience: attempt.experience || search.experience || "Fresher",
        salaryRequired: String(relaxedSalary ? false : selectedRange.required),
        salaryMin: String(relaxedSalary ? 0 : selectedRange.min),
        salaryMax: String(relaxedSalary ? 0 : selectedRange.max),
        applicantCountry: "in",
        accessMode: attempt.accessMode || "auto",
        mode: attempt.mode || mode,
      })

      const res = await fetch(`${API_URL}/jobs?${params.toString()}`)
      const data = await res.json().catch(() => ({}))

      return {
        ok: res.ok && data.success,
        data,
        attempt,
        jobs: Array.isArray(data.jobs) ? data.jobs : [],
      }
    }

    const normalizeJobs = (rawJobs, fallbackMode = mode) => {
      return rawJobs
        .map((job) => {
          let match = Number(job.match || 0)

          if (!Number.isFinite(match)) match = 0

          // Never show 0%. If Find Anyway receives a real job from API but backend gives 0,
          // mark it as a low related job instead of showing ugly 0%.
          if (fallbackMode !== "exact" && match <= 0) {
            match = 12
          }

          return {
            ...job,
            match,
            matchLabel:
              match >= 90
                ? `${match}% match`
                : match >= 20
                  ? `${match}% match`
                  : `${match}% related`,
            externalSearchLinks: {
              ...buildFallbackLinks(),
              ...(job.externalSearchLinks || {}),
            },
          }
        })
        .filter((job) => Number.isFinite(job.match) && job.match > 0)
    }

    try {
      if (mode === "exact") {
        const result = await makeRequest({ mode: "exact", relaxSalary: false })
        const exactJobs = normalizeJobs(result.jobs, "exact")
          .filter((job) => job.match >= 90 && job.match <= 100)
          .sort((a, b) => b.match - a.match)

        if (!result.ok || exactJobs.length === 0) {
          setJobs([])
          setJobFailure({
            ...result.data,
            error: "SORRY, JOBS NOT AVAILABLE FOR YOU.",
            reason:
              result.data?.reason ||
              "No 90%–100% matching jobs were found for your filters. Click Find Anyway to relax salary/location and show 20%–89% or related jobs.",
            canFindAnyway: true,
            externalSearchLinks: result.data?.externalSearchLinks || buildFallbackLinks(),
          })
          setJobMode("exact")
          notifyActivity("No exact jobs", "No 90%–100% matching jobs found. Use Find Anyway to relax filters.")
          return
        }

        setJobs(exactJobs)
        setJobFailure(null)
        setJobMode("exact")
        notifyActivity("Jobs found", `${exactJobs.length} strict 90%–100% matching jobs found.`)
        return
      }

      // Find Anyway = automatically relax filters.
      // 1) Same city but ignore salary.
      // 2) Remote in same country.
      // 3) Whole country with no city.
      // 4) Related search whole country.
      const attempts = [
        { mode: "anyway", location: search.location, relaxSalary: true },
        ...(String(search.location || "").toLowerCase() === "remote"
          ? []
          : [{ mode: "anyway", location: "Remote", relaxSalary: true }]),
        { mode: "anyway", location: "", relaxSalary: true },
        { mode: "related", location: "", relaxSalary: true },
      ]

      const allJobs = []
      let lastData = null

      for (const attempt of attempts) {
        const result = await makeRequest(attempt)
        lastData = result.data

        if (result.jobs.length) {
          allJobs.push(...normalizeJobs(result.jobs, attempt.mode))
        }

        const seen = new Set()
        const uniqueJobs = allJobs.filter((job) => {
          const key = job.id || job.url || `${job.title}-${job.company}-${job.location}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        const anywayJobs = uniqueJobs
          .filter((job) => job.match >= 20 && job.match <= 89)
          .sort((a, b) => b.match - a.match)

        if (anywayJobs.length > 0) {
          setJobs(anywayJobs)
          setJobFailure(null)
          setJobMode("anyway")
          notifyActivity("Find Anyway results", `${anywayJobs.length} relaxed 20%–89% matching jobs found.`)
          return
        }

        const relatedJobs = uniqueJobs
          .filter((job) => job.match > 0 && job.match < 20)
          .sort((a, b) => b.match - a.match)

        if (attempt.mode === "related" && relatedJobs.length > 0) {
          setJobs(relatedJobs)
          setJobFailure(null)
          setJobMode("related")
          notifyActivity("Related jobs found", `${relatedJobs.length} related jobs found after relaxing filters.`)
          return
        }
      }

      setJobs([])
      notifyActivity("No jobs found", "No jobs were found even after relaxing city, salary, remote, country, and related search.")
      setJobFailure({
        ...(lastData || {}),
        error: "SORRY, JOBS NOT AVAILABLE FOR YOU.",
        reason:
          "No jobs were found even after relaxing filters. I tried same city without salary, Remote, whole country, and related jobs. Better luck next time.",
        canFindAnyway: false,
        externalSearchLinks: lastData?.externalSearchLinks || buildFallbackLinks(),
      })
      setJobMode("related")
    } catch {
      setJobs([])
      notifyActivity("Job search failed", "Backend is not connected or the jobs API failed.")
      setJobFailure({
        error: "Backend not connected.",
        reason:
          "Your backend server is not running or API URL is wrong. Start backend with node index.js inside server folder.",
        canFindAnyway: false,
        externalSearchLinks: buildFallbackLinks(),
      })
    } finally {
      setLoadingJobs(false)
    }
  }


const applyWithAI = (job) => {
    const clean = {
      title: job.title,
      company: job.company,
      location: job.location,
      salary: job.salary || "Salary not listed",
      match: job.matchLabel || `${job.match || 0}%`,
      status: "Ready",
      date: today(),
      note: `Salary preference: ${search.salaryRange}`,
      url: job.url,
      description: job.description,
      externalSearchLinks: job.externalSearchLinks,
    }

    setSelectedJob(clean)
    setEmailDraft(buildEmail(clean))
    setApplicationPack({
      coverLetter: buildEmail(clean).body,
      resumeTips: `Resume tips for ${clean.title}:
1. Keep your target role close to ${clean.title}.
2. Add keywords from the job description.
3. Highlight relevant projects.
4. Use strong action verbs.
5. Keep resume clean and ATS-friendly.`,
    })

    setSavedApplications((prev) => {
      const exists = prev.some((x) => x.title === clean.title && x.company === clean.company)
      return exists ? prev : [clean, ...prev]
    })

    notifyActivity("Application workspace ready", `${clean.title} at ${clean.company} was added to your tracker/workspace.`)
    setSection("workspace")
  }

  const openGmail = () => {
    if (!selectedJob || !emailDraft) return alert("Select a job first.")
    if (!recipientEmail.trim()) return alert("Enter recipient email.")

    const warning =
      "Important: your resume cannot be attached automatically from a website email link.\n\nBefore sending, please attach your resume PDF/DOC manually in your email app.\n\nContinue and open email app?"
    if (!window.confirm(warning)) return

    const bodyWithReminder = `${emailDraft.body}\n\n---\nReminder: Please attach your resume before sending this email.`
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailDraft.subject || "")}&body=${encodeURIComponent(bodyWithReminder)}`

    window.location.href = mailtoUrl
    notifyActivity("Email app opened", "Your email app was opened. Attach your resume manually before sending.")
  }

  const copyApplicationEmail = async () => {
    if (!emailDraft) return alert("No email draft found.")
    const text = `To: ${recipientEmail || "Add recruiter email"}\nSubject: ${emailDraft.subject || ""}\n\n${emailDraft.body || ""}\n\nReminder: Attach your resume before sending.`
    try {
      await navigator.clipboard.writeText(text)
      notifyActivity("Email copied", "Application email copied. Paste it into Gmail/Outlook and attach your resume before sending.")
      alert("Email copied. Now paste it into your mail app and attach your resume before sending.")
    } catch {
      alert(text)
    }
  }

  const markApplied = () => {
    if (!selectedJob) return

    setSelectedJob((p) => ({ ...p, status: "Applied" }))
    setSavedApplications((prev) => prev.map((x) => (x.title === selectedJob.title && x.company === selectedJob.company ? { ...x, status: "Applied" } : x)))
    notifyActivity("Marked applied", `${selectedJob.title} at ${selectedJob.company} was marked as Applied.`)
  }

  const clearWorkspace = () => {
    setSelectedJob(null)
    setEmailDraft(null)
    setApplicationPack(null)
    setRecipientEmail("")
    notifyActivity("Workspace cleared", "The selected job and application draft were cleared.")
  }

  const updateStatus = (index, status) => {
    setSavedApplications((prev) => prev.map((x, i) => (i === index ? { ...x, status } : x)))
    notifyActivity("Tracker updated", `Application status changed to ${status}.`)
  }

  const removeApplication = (index) => {
    setSavedApplications((prev) => prev.filter((_, i) => i !== index))
    notifyActivity("Application removed", "One tracked application was removed.")
  }

  const openTrackedJob = (job) => {
    setSelectedJob(job)
    setEmailDraft(buildEmail(job))
    setApplicationPack({
      coverLetter: buildEmail(job).body,
      resumeTips: `Resume tips for ${job.title}: Add matching keywords, improve projects, and tailor summary.`,
    })
    notifyActivity("Tracker item opened", `${job.title} at ${job.company} was opened in Apply Workspace.`)
    setSection("workspace")
  }

  const exportCSV = () => {
    if (!savedApplications.length) return alert("No applications to export.")

    const headers = ["Role", "Company", "Location", "Match", "Status", "Date", "Note", "Job Link"]
    const rows = savedApplications.map((j) => [j.title, j.company, j.location, j.match, j.status, j.date, j.note, j.url])
    const esc = (v) => `"${String(v || "").replace(/"/g, '""')}"`
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n")

    downloadBlob(csv, "text/csv;charset=utf-8", "jobpilot_applications.csv")
    notifyActivity("Tracker exported", "Your applications tracker CSV was downloaded.")
  }

  const clearTracker = () => {
    if (confirm("Clear all tracked applications?")) {
      setSavedApplications([])
      notifyActivity("Tracker cleared", "All tracked applications were removed from this workspace.")
    }
  }

  const saveResume = async () => {
    const item = {
      id: uid(),
      name: resume.title || `${resume.personal.role || "Professional"} Resume`,
      date: now(),
      template,
      resume,
    }

    setSavedResumes((p) => [item, ...p])
    notifyActivity("Saving resume", `${item.name} was saved on this device${authToken ? " and is now syncing to cloud" : ""}.`)
    if (authToken) setCloudStatus("Saving manual save...")

    if (authToken) {
      try {
        const data = await authFetch("/resumes", {
          method: "POST",
          body: JSON.stringify({ name: item.name, template, resume }),
        })

        if (data.resume?.id) {
          setSavedResumes((prev) =>
            prev.map((r) =>
              r.id === item.id
                ? {
                    ...item,
                    id: data.resume.id,
                    cloudId: data.resume.id,
                    date: data.resume.date ? new Date(data.resume.date).toLocaleString() : item.date,
                  }
                : r
            )
          )
          setCloudStatus("Saved to cloud")
          notifyActivity("Cloud saved", "Your resume was saved to your account and appears in Saved Resumes.")
        }
      } catch (error) {
        notifyActivity("Cloud save failed", error.message || "Resume stayed saved locally only.")
      }
    }
  }

  const loadSavedResume = (item) => {
    setResume(normalizeResume(item.resume))
    setTemplate(item.template || "modern")
    setSection("studio")
  }

  const deleteSavedResume = async (id) => {
    const item = savedResumes.find((x) => x.id === id || x.cloudId === id)
    setSavedResumes((p) => p.filter((x) => x.id !== id && x.cloudId !== id))
    notifyActivity("Resume deleted", "The saved resume was removed from this workspace.")

    if (authToken && item?.cloudId) {
      try {
        await authFetch(`/resumes/${item.cloudId}`, { method: "DELETE" })
      } catch (error) {
        notifyActivity("Cloud delete failed", error.message || "The online copy may still exist.")
      }
    }
  }

  const copyResume = async () => {
    await navigator.clipboard.writeText(resumeToPlainText(resume))
    notifyActivity("Resume copied", "Full resume text was copied to clipboard.")
  }

  const exportTXT = () => {
    downloadBlob(resumeToPlainText(resume), "text/plain;charset=utf-8", `${resume.personal.name || "resume"}.txt`)
    notifyActivity("TXT exported", "Your resume TXT file was downloaded.")
  }

  const exportJSON = () => {
    downloadBlob(JSON.stringify(resume, null, 2), "application/json;charset=utf-8", `${resume.personal.name || "resume"}.json`)
    notifyActivity("JSON exported", "Your resume JSON file was downloaded.")
  }

  const exportPDF = async () => {
    const source = document.getElementById("resume-print-area")

    if (!source) {
      alert("Resume preview not found. Open Preview first, then export.")
      return
    }

    // IMPORTANT FIX:
    // Export must never capture live direct-edit mode, text selection, cursor, scrollbars,
    // browser print font bugs, or preview transforms. We build a clean hidden copy and
    // rasterize that copy into a PDF.
    try {
      document.activeElement?.blur?.()
      window.getSelection?.()?.removeAllRanges?.()

      const { jsPDF } = await import("jspdf")
      const html2canvasModule = await import("html2canvas")
      const html2canvas = html2canvasModule.default || html2canvasModule

      const clone = source.cloneNode(true)
      clone.classList.remove("resume-direct-mode")
      clone.classList.remove("direct-edit-mode")
      clone.querySelectorAll(".direct-edit-ribbon,.edit-ribbon,.resume-edit-toolbar").forEach((el) => el.remove())
      clone.querySelectorAll("[contenteditable]").forEach((el) => {
        el.removeAttribute("contenteditable")
        el.removeAttribute("data-placeholder")
        el.removeAttribute("title")
        el.classList.remove("direct-resume-edit")
      })

      const exportHost = document.createElement("div")
      exportHost.setAttribute("data-resume-export-host", "true")
      exportHost.style.position = "fixed"
      exportHost.style.left = "-100000px"
      exportHost.style.top = "0"
      exportHost.style.width = "794px"
      exportHost.style.minHeight = "1123px"
      exportHost.style.background = "#ffffff"
      exportHost.style.overflow = "visible"
      exportHost.style.pointerEvents = "none"
      exportHost.style.zIndex = "-9999"

      const style = document.createElement("style")
      style.textContent = `
        ${resumeStyles}
        [data-resume-export-host],
        [data-resume-export-host] *{
          box-sizing:border-box!important;
          font-synthesis:none!important;
          font-synthesis-weight:none!important;
          text-shadow:none!important;
          outline:none!important;
          caret-color:transparent!important;
        }
        [data-resume-export-host] *::selection{
          background:transparent!important;
          color:inherit!important;
        }
        [data-resume-export-host] .resume-page{
          width:794px!important;
          min-height:1123px!important;
          margin:0!important;
          box-shadow:none!important;
          transform:none!important;
          overflow:visible!important;
          -webkit-font-smoothing:antialiased!important;
          text-rendering:geometricPrecision!important;
        }
        [data-resume-export-host] .resume-fit-inner,
        [data-resume-export-host] .resume-fit-shell,
        [data-resume-export-host] .resume-scale,
        [data-resume-export-host] .fit-inner{
          transform:none!important;
          width:100%!important;
          height:auto!important;
          min-height:auto!important;
        }
        [data-resume-export-host] input,
        [data-resume-export-host] textarea,
        [data-resume-export-host] button{
          display:none!important;
        }
      `

      exportHost.appendChild(style)
      exportHost.appendChild(clone)
      document.body.appendChild(exportHost)

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      if (document.fonts?.ready) await document.fonts.ready
      await new Promise((resolve) => setTimeout(resolve, 150))

      const captureWidth = 794
      const captureHeight = Math.max(1123, Math.ceil(clone.scrollHeight || clone.getBoundingClientRect().height || 1123))

      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: false,
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        scrollX: 0,
        scrollY: 0,
      })

      document.body.removeChild(exportHost)

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: false })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgData = canvas.toDataURL("image/png")

      // Fit to one page without Chrome print text rendering. The content is a clean image,
      // so letters like lowercase "l" will not be randomly bolded by the PDF font engine.
      const ratio = Math.min(pageW / canvas.width, pageH / canvas.height)
      const imgW = canvas.width * ratio
      const imgH = canvas.height * ratio
      const x = (pageW - imgW) / 2
      const y = 0

      pdf.addImage(imgData, "PNG", x, y, imgW, imgH, undefined, "NONE")
      pdf.save(`${resume.personal?.name || "resume"}.pdf`)
    } catch (error) {
      console.error(error)
      alert("PDF export needs html2canvas and jspdf. Run: npm.cmd install html2canvas jspdf")
    }
  }

  const exportDOC = () => {
    const html = document.getElementById("resume-print-area")?.outerHTML
    downloadBlob(
      `<html><head><meta charset="utf-8"><style>${resumeStyles}</style></head><body>${html}</body></html>`,
      "application/msword;charset=utf-8",
      `${resume.personal.name || "resume"}.doc`
    )
    notifyActivity("DOC exported", "Your resume DOC file was downloaded.")
  }

  if (!authToken) {
    return (
      <>
        <style id="resume-style">{resumeStyles}</style>
        <style id="mobile-ui-style">{mobileUiStyles}</style>
        <AuthScreen onAuth={handleAuth} onForgotPassword={requestPasswordReset} onResetPassword={resetPassword} loading={authLoading} error={authError} notice={authNotice} />
      </>
    )
  }

  const studioContent = (
    <div className={focusMode ? "mobile-stack-grid grid h-full min-h-0 gap-4 lg:grid-cols-2" : "mobile-stack-grid grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_560px]"}>
      <ChatArea
        chat={activeChat}
        aiInput={aiInput}
        setAiInput={setAiInput}
        sendMessage={sendMessage}
        aiLoading={aiLoading}
        stopAI={stopAI}
        uploadFile={uploadFile}
        uploadedDocument={uploadedDocument}
        createResumeFromDocument={createResumeFromDocument}
        autoFillDocument={autoFillDocument}
        analyzeResume={analyzeResume}
        improveResume={improveResume}
        makeATS={makeATS}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        activityText={activityText}
        activityLog={activityLog}
        cloudStatus={cloudStatus}
        cloudLoading={cloudLoading}
        autoSaveEnabled={autoSaveEnabled}
        saveResume={saveResume}
      />

      <ResumeStudio
        resume={resume}
        setResume={setResume}
        template={template}
        setTemplate={setTemplate}
        score={score}
        exportPDF={exportPDF}
        exportDOC={exportDOC}
        exportTXT={exportTXT}
        exportJSON={exportJSON}
        copyResume={copyResume}
        saveResume={saveResume}
        improveSection={improveSection}
        uploadSectionFile={uploadSectionFile}
        compact={focusMode}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <style id="resume-style">{resumeStyles}</style>
      <style id="mobile-ui-style">{mobileUiStyles}</style>
      <WelcomeSplash show={showWelcome} />

      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#2563eb55,transparent_32%),radial-gradient(circle_at_bottom_right,#7c3aed55,transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
      </div>

      <AccountBar user={auth?.user} onLogout={logoutUser} cloudLoading={cloudLoading} cloudStatus={cloudStatus} backendStatus={backendStatus} />
      <div className="jobpilot-account-spacer" />

      {focusMode ? (
        <div className="fixed inset-0 z-[99999] bg-[#050816] p-4">{studioContent}</div>
      ) : (
        <div className="jobpilot-root-layout relative z-10 flex h-screen overflow-hidden">
          <Sidebar
            section={section}
            setSection={setSection}
            chats={chats}
            activeChatId={activeChat?.id}
            setActiveChatId={setActiveChatId}
            newChat={newChat}
            deleteChat={deleteChat}
            savedResumes={savedResumes}
            loadSavedResume={loadSavedResume}
            deleteSavedResume={deleteSavedResume}
            saveResume={saveResume}
            cloudStatus={cloudStatus}
            cloudLoading={cloudLoading}
            backendStatus={backendStatus}
          />

          <div className="jobpilot-mobile-shell flex min-w-0 flex-1 flex-col">
            <div className="jobpilot-mobile-tabs flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-950/95 p-2 lg:hidden">
              {[
                ["studio", "Studio"],
                ["jobs", "Jobs"],
                ["workspace", "Apply"],
                ["tracker", "Tracker"],
                ["about", "About"],
                ["contact", "Contact"],
                ["privacy", "Privacy"],
                ["terms", "Terms"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setSection(id)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black ${section === id ? "bg-blue-600 text-white" : "text-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {(!section || section === "studio") && studioContent}

            {section === "jobs" && (
              <JobFinder
                search={search}
                setSearch={setSearch}
                jobs={jobs}
                findJobs={findJobs}
                loadingJobs={loadingJobs}
                jobError={jobError}
                jobFailure={jobFailure}
                showReason={showReason}
                setShowReason={setShowReason}
                applyWithAI={applyWithAI}
                hasSearched={hasSearched}
                jobMode={jobMode}
              />
            )}

            {section === "workspace" && (
              <Workspace
                selectedJob={selectedJob}
                emailDraft={emailDraft}
                setEmailDraft={setEmailDraft}
                recipientEmail={recipientEmail}
                setRecipientEmail={setRecipientEmail}
                openGmail={openGmail}
                copyApplicationEmail={copyApplicationEmail}
                markApplied={markApplied}
                clearWorkspace={clearWorkspace}
                applicationPack={applicationPack}
              />
            )}

            {section === "tracker" && (
              <Tracker
                savedApplications={savedApplications}
                updateStatus={updateStatus}
                removeApplication={removeApplication}
                exportCSV={exportCSV}
                clearTracker={clearTracker}
                openTrackedJob={openTrackedJob}
              />
            )}
            {["about", "contact", "privacy", "terms"].includes(section) && (
              <LegalPage type={section} setSection={setSection} />
            )}
          </div>
          <MobileBottomNav section={section || "studio"} setSection={setSection} />
        </div>
      )}
    </div>
  )
}