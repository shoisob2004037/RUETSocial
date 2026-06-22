"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getAllUsers, requestMentorship, getMyMentorships, updateMentorshipStatus } from "../services/api"

const Mentorship = ({ user }) => {
  const me = user?.user
  const [tab, setTab] = useState("find") // find | mine
  const [alumni, setAlumni] = useState([])
  const [items, setItems] = useState([])
  const [q, setQ] = useState("")
  const [dept, setDept] = useState("")
  const [target, setTarget] = useState(null)
  const [topic, setTopic] = useState("")
  const [message, setMessage] = useState("")

  const load = async () => {
    const users = await getAllUsers()
    // Heuristic: treat users with role/department as potential mentors; exclude self
    setAlumni(users.filter(u => u._id !== me._id))
    setItems(await getMyMentorships(me._id))
  }
  useEffect(() => { load() }, [])

  const filtered = alumni.filter(u => {
    const name = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase()
    const okQ = !q || name.includes(q.toLowerCase()) || (u.username || "").toLowerCase().includes(q.toLowerCase())
    const okD = !dept || (u.department || "").toLowerCase() === dept.toLowerCase()
    return okQ && okD
  })

  const submit = async (e) => {
    e.preventDefault()
    if (!target || !topic.trim()) return
    await requestMentorship({
      menteeId: me._id, menteeName: `${me.firstname} ${me.lastname}`,
      mentorId: target._id, mentorName: `${target.firstname} ${target.lastname}`,
      topic, message,
    })
    setTarget(null); setTopic(""); setMessage(""); setTab("mine"); load()
  }

  const respond = async (id, status) => { await updateMentorshipStatus(id, { status, currentUserId: me._id }); load() }

  return (
    <div className="container py-3">
      <div className="mb-3">
        <h2 className="mb-0 fw-bold" style={{ background: "var(--brand-gradient, linear-gradient(90deg,#6366f1,#a855f7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🎓 Mentorship</h2>
        <small className="text-muted">Connect with alumni mentors across departments</small>
      </div>

      <ul className="nav nav-pills mb-3">
        <li className="nav-item"><button className={`nav-link ${tab === "find" ? "active" : ""}`} onClick={() => setTab("find")}>Find a mentor</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>My requests ({items.length})</button></li>
      </ul>

      {tab === "find" && (
        <>
          <div className="card p-3 shadow-sm mb-3">
            <div className="row g-2">
              <div className="col-md-8"><input className="form-control" placeholder="Search alumni by name or username…" value={q} onChange={e => setQ(e.target.value)} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Filter by department (e.g. CSE)" value={dept} onChange={e => setDept(e.target.value)} /></div>
            </div>
          </div>

          <div className="row g-3">
            {filtered.slice(0, 30).map(u => (
              <div className="col-md-4" key={u._id}>
                <div className="card h-100 shadow-sm border-0 text-center p-3" style={{ borderRadius: 14 }}>
                  <img src={u.profilepicture || "/avatar.png"} onError={(e) => (e.target.src = "https://api.dicebear.com/7.x/initials/svg?seed=" + (u.firstname || "U"))} alt="" className="rounded-circle mx-auto mb-2" style={{ width: 72, height: 72, objectFit: "cover" }} />
                  <h6 className="mb-0">{u.firstname} {u.lastname}</h6>
                  <small className="text-muted">@{u.username}</small>
                  <div className="my-2">
                    {u.department && <span className="badge bg-primary-subtle text-primary me-1">{u.department}</span>}
                    {u.role && <span className="badge bg-secondary-subtle text-secondary">{u.role}</span>}
                  </div>
                  <div className="d-flex gap-2 justify-content-center mt-auto">
                    <Link className="btn btn-sm btn-outline-primary" to={`/profile/${u._id}`}>Profile</Link>
                    <button className="btn btn-sm btn-primary" onClick={() => setTarget(u)}>Request</button>
                  </div>
                </div>
              </div>
            ))}
            {!filtered.length && <p className="text-muted">No alumni match.</p>}
          </div>
        </>
      )}

      {tab === "mine" && (
        <div className="row g-3">
          {items.length === 0 && <p className="text-muted">No mentorship requests yet.</p>}
          {items.map(m => {
            const iAmMentor = m.mentorId === me._id
            return (
              <div className="col-md-6" key={m._id}>
                <div className="card shadow-sm border-0 p-3" style={{ borderRadius: 14 }}>
                  <div className="d-flex justify-content-between">
                    <strong>{iAmMentor ? `From ${m.menteeName}` : `To ${m.mentorName}`}</strong>
                    <span className={`badge ${m.status === "accepted" ? "bg-success" : m.status === "declined" ? "bg-danger" : m.status === "completed" ? "bg-secondary" : "bg-warning text-dark"}`}>{m.status}</span>
                  </div>
                  <div className="mt-1"><strong>Topic:</strong> {m.topic}</div>
                  {m.message && <p className="small mt-1 mb-1">{m.message}</p>}
                  {m.responseMessage && <p className="small text-muted mb-1"><em>Reply:</em> {m.responseMessage}</p>}
                  <small className="text-muted">{new Date(m.createdAt).toLocaleString()}</small>
                  {iAmMentor && m.status === "pending" && (
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-sm btn-success" onClick={() => respond(m._id, "accepted")}>Accept</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => respond(m._id, "declined")}>Decline</button>
                    </div>
                  )}
                  {m.status === "accepted" && (
                    <button className="btn btn-sm btn-outline-secondary mt-2" onClick={() => respond(m._id, "completed")}>Mark completed</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {target && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }} onClick={() => setTarget(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <form className="modal-content" onSubmit={submit}>
              <div className="modal-header">
                <h5 className="modal-title">Request mentorship from {target.firstname} {target.lastname}</h5>
                <button type="button" className="btn-close" onClick={() => setTarget(null)}></button>
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Topic (e.g. Career advice, MS abroad)" value={topic} onChange={e => setTopic(e.target.value)} required />
                <textarea className="form-control" rows={4} placeholder="Tell them why you'd like their guidance…" value={message} onChange={e => setMessage(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => setTarget(null)}>Cancel</button>
                <button className="btn btn-primary">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Mentorship
