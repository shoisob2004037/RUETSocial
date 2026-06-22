"use client"

import { useEffect, useState } from "react"
import { getJobs, createJob, applyJob, toggleSaveJob, deleteJob } from "../services/api"

const TYPES = ["All", "Full-time", "Part-time", "Internship", "Contract", "Remote"]
const DEPTS = ["All", "CSE", "EEE", "ME", "CE", "ETE", "IPE", "URP", "ARCH", "GCE", "MTE", "BECM", "CFPE", "MSE", "CHE"]

const Jobs = ({ user }) => {
  const me = user?.user
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState("All")
  const [dept, setDept] = useState("All")
  const [q, setQ] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showApplicants, setShowApplicants] = useState(null)
  const [form, setForm] = useState({
    title: "", company: "", location: "", type: "Full-time",
    department: "", description: "", requirements: "", salary: "", applyLink: "", deadline: "",
  })

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (type !== "All") params.type = type
      if (dept !== "All") params.department = dept
      if (q.trim()) params.q = q.trim()
      const data = await getJobs(params)
      setJobs(data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [type, dept])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.company) return
    await createJob({ ...form, postedBy: me._id, postedByName: `${me.firstname} ${me.lastname}` })
    setShowForm(false)
    setForm({ title: "", company: "", location: "", type: "Full-time", department: "", description: "", requirements: "", salary: "", applyLink: "", deadline: "" })
    load()
  }

  const onApply = async (id) => {
    try {
      await applyJob(id, me._id, `${me.firstname} ${me.lastname}`)
      load()
    } catch (e) { alert(e?.response?.data?.message || "Could not apply") }
  }
  const onSave = async (id) => { await toggleSaveJob(id, me._id); load() }
  const onDelete = async (id) => {
    if (!window.confirm("Delete this job?")) return
    await deleteJob(id, me._id, !!me.isAdmin); load()
  }

  return (
    <div className="container py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h2 className="mb-0 fw-bold" style={{ background: "var(--brand-gradient, linear-gradient(90deg,#6366f1,#a855f7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            💼 Job Board
          </h2>
          <small className="text-muted">Opportunities shared by RUET alumni</small>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Post a Job"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card shadow-sm p-3 mb-3">
          <div className="row g-2">
            <div className="col-md-6"><input className="form-control" placeholder="Job title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="col-md-6"><input className="form-control" placeholder="Company *" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required /></div>
            <div className="col-md-4"><input className="form-control" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="col-md-4">
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.filter(t => t !== "All").map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                <option value="">Any department</option>
                {DEPTS.filter(d => d !== "All").map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="col-md-6"><input className="form-control" placeholder="Salary (optional)" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            <div className="col-md-6"><input className="form-control" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
            <div className="col-12"><input className="form-control" placeholder="Apply link (URL)" value={form.applyLink} onChange={(e) => setForm({ ...form, applyLink: e.target.value })} /></div>
            <div className="col-12"><textarea className="form-control" placeholder="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-12"><textarea className="form-control" placeholder="Requirements" rows={2} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
          </div>
          <button className="btn btn-success mt-3 align-self-start">Publish Job</button>
        </form>
      )}

      <div className="card shadow-sm p-3 mb-3">
        <div className="row g-2">
          <div className="col-md-5"><input className="form-control" placeholder="Search title or company" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} /></div>
          <div className="col-md-3"><select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="col-md-3"><select className="form-select" value={dept} onChange={(e) => setDept(e.target.value)}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div className="col-md-1"><button className="btn btn-outline-primary w-100" onClick={load}>Go</button></div>
        </div>
      </div>

      {loading ? <p>Loading…</p> : jobs.length === 0 ? (
        <div className="text-center text-muted py-5">No jobs match your filters.</div>
      ) : (
        <div className="row g-3">
          {jobs.map((j) => {
            const applied = j.applicants?.find((a) => a.userId === me._id)
            const saved = j.savedBy?.includes(me._id)
            const mine = j.postedBy === me._id || me.isAdmin
            return (
              <div className="col-md-6" key={j._id}>
                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h5 className="mb-1">{j.title}</h5>
                        <div className="text-muted small">{j.company} · {j.location || "—"}</div>
                      </div>
                      <span className="badge bg-primary-subtle text-primary align-self-start">{j.type}</span>
                    </div>
                    <div className="mt-2 d-flex flex-wrap gap-2">
                      {j.department && <span className="badge bg-secondary-subtle text-secondary">{j.department}</span>}
                      {j.salary && <span className="badge bg-success-subtle text-success">💰 {j.salary}</span>}
                      {j.deadline && <span className="badge bg-warning-subtle text-warning">⏳ {new Date(j.deadline).toLocaleDateString()}</span>}
                    </div>
                    {j.description && <p className="mt-2 mb-2 small">{j.description}</p>}
                    {j.requirements && <p className="small text-muted mb-2"><strong>Requirements:</strong> {j.requirements}</p>}
                    <div className="small text-muted">Posted by <strong>{j.postedByName || "Alumni"}</strong> · {new Date(j.createdAt).toLocaleDateString()}</div>

                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <button className={`btn btn-sm ${applied ? "btn-success" : "btn-primary"}`} disabled={!!applied} onClick={() => onApply(j._id)}>
                        {applied ? "✓ Applied" : "Apply"}
                      </button>
                      {j.applyLink && <a className="btn btn-sm btn-outline-primary" href={j.applyLink} target="_blank" rel="noreferrer">External link</a>}
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => onSave(j._id)}>{saved ? "★ Saved" : "☆ Save"}</button>
                      <button className="btn btn-sm btn-outline-info" onClick={() => setShowApplicants(showApplicants === j._id ? null : j._id)}>
                        {j.applicants?.length || 0} applicants
                      </button>
                      {mine && <button className="btn btn-sm btn-outline-danger ms-auto" onClick={() => onDelete(j._id)}>Delete</button>}
                    </div>
                    {showApplicants === j._id && (
                      <ul className="list-group list-group-flush mt-2">
                        {(j.applicants || []).map((a, i) => (
                          <li key={i} className="list-group-item px-0 small">{a.name} · <span className="text-muted">{new Date(a.appliedAt).toLocaleDateString()}</span></li>
                        ))}
                        {(!j.applicants || !j.applicants.length) && <li className="list-group-item px-0 small text-muted">No applicants yet.</li>}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Jobs
