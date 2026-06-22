"use client"

import { useEffect, useState } from "react"
import { getPolls, createPoll, votePoll, deletePoll } from "../services/api"

const CATS = ["All", "General", "Academic", "Career", "Campus", "Fun"]

const Polls = ({ user }) => {
  const me = user?.user
  const [polls, setPolls] = useState([])
  const [cat, setCat] = useState("All")
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ question: "", category: "General", multiSelect: false, expiresAt: "", options: ["", ""] })

  const load = async () => {
    setLoading(true)
    try { setPolls(await getPolls(cat === "All" ? {} : { category: cat })) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [cat])

  const submit = async (e) => {
    e.preventDefault()
    const opts = form.options.map(s => s.trim()).filter(Boolean)
    if (!form.question.trim() || opts.length < 2) return alert("Need a question and at least 2 options.")
    await createPoll({
      createdBy: me._id, createdByName: `${me.firstname} ${me.lastname}`,
      question: form.question, category: form.category, multiSelect: form.multiSelect,
      expiresAt: form.expiresAt || undefined, options: opts,
    })
    setForm({ question: "", category: "General", multiSelect: false, expiresAt: "", options: ["", ""] })
    setShowForm(false); load()
  }

  const onVote = async (id, idx) => { await votePoll(id, me._id, idx); load() }
  const onDelete = async (id) => { if (window.confirm("Delete poll?")) { await deletePoll(id, me._id, !!me.isAdmin); load() } }

  const updOpt = (i, v) => { const o = [...form.options]; o[i] = v; setForm({ ...form, options: o }) }

  return (
    <div className="container py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h2 className="mb-0 fw-bold" style={{ background: "var(--brand-gradient, linear-gradient(90deg,#6366f1,#a855f7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>📊 Community Polls</h2>
          <small className="text-muted">Vote, debate, and discover what RUETians think</small>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ Create Poll"}</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card shadow-sm p-3 mb-3">
          <input className="form-control mb-2" placeholder="Your question…" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} required />
          {form.options.map((o, i) => (
            <div className="input-group mb-2" key={i}>
              <span className="input-group-text">{String.fromCharCode(65 + i)}</span>
              <input className="form-control" placeholder={`Option ${i + 1}`} value={o} onChange={e => updOpt(i, e.target.value)} />
              {form.options.length > 2 && <button type="button" className="btn btn-outline-danger" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>×</button>}
            </div>
          ))}
          {form.options.length < 8 && <button type="button" className="btn btn-link p-0 mb-2" onClick={() => setForm({ ...form, options: [...form.options, ""] })}>+ Add option</button>}
          <div className="row g-2">
            <div className="col-md-4"><select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="col-md-4"><input className="form-control" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <div className="col-md-4 d-flex align-items-center"><div className="form-check"><input className="form-check-input" type="checkbox" id="ms" checked={form.multiSelect} onChange={e => setForm({ ...form, multiSelect: e.target.checked })} /><label className="form-check-label" htmlFor="ms">Allow multiple selections</label></div></div>
          </div>
          <button className="btn btn-success mt-3 align-self-start">Publish Poll</button>
        </form>
      )}

      <div className="d-flex flex-wrap gap-2 mb-3">
        {CATS.map(c => (
          <button key={c} className={`btn btn-sm ${cat === c ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {loading ? <p>Loading…</p> : polls.length === 0 ? (
        <div className="text-center text-muted py-5">No polls yet — be the first to ask!</div>
      ) : polls.map(p => {
        const total = p.options.reduce((s, o) => s + (o.votes?.length || 0), 0)
        const closed = p.expiresAt && new Date(p.expiresAt) < new Date()
        const mine = p.createdBy === me._id || me.isAdmin
        return (
          <div className="card shadow-sm mb-3 border-0" style={{ borderRadius: 14 }} key={p._id}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <span className="badge bg-primary-subtle text-primary mb-2">{p.category}</span>
                  {p.multiSelect && <span className="badge bg-info-subtle text-info ms-1">multi-select</span>}
                  {closed && <span className="badge bg-secondary ms-1">closed</span>}
                  <h5 className="mb-1">{p.question}</h5>
                  <small className="text-muted">by {p.createdByName || "Anon"} · {new Date(p.createdAt).toLocaleDateString()}{p.expiresAt && ` · ends ${new Date(p.expiresAt).toLocaleString()}`}</small>
                </div>
                {mine && <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(p._id)}>Delete</button>}
              </div>
              <div className="mt-3">
                {p.options.map((o, i) => {
                  const count = o.votes?.length || 0
                  const pct = total ? Math.round((count / total) * 100) : 0
                  const voted = o.votes?.includes(me._id)
                  return (
                    <button key={i} disabled={closed} onClick={() => onVote(p._id, i)} className="btn w-100 text-start mb-2 position-relative" style={{ background: voted ? "linear-gradient(90deg,#ede9fe,#dbeafe)" : "#f8f9fa", border: voted ? "1px solid #6366f1" : "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                      <div className="position-absolute top-0 start-0 h-100" style={{ width: `${pct}%`, background: "rgba(99,102,241,0.18)", transition: "width .35s" }} />
                      <div className="d-flex justify-content-between position-relative">
                        <span>{voted && "✓ "}{o.text}</span>
                        <strong>{pct}% · {count}</strong>
                      </div>
                    </button>
                  )
                })}
              </div>
              <div className="small text-muted text-end">{total} vote{total === 1 ? "" : "s"}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Polls
