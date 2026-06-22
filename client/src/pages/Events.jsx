import { useEffect, useMemo, useRef, useState } from "react";
import {
  getEvents,
  createEvent,
  toggleAttendEvent,
  deleteEvent,
  uploadImage,
} from "../services/api";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Trash2,
  X,
  ImagePlus,
} from "lucide-react";

const DEPARTMENTS = [
  "All", "CSE", "EEE", "ME", "CE", "ETE", "IPE", "MTE", "URP", "Arch",
  "GCE", "ChE", "BME", "MSE", "Other",
];

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return d;
  }
};

const EventCard = ({ ev, currentUserId, onToggle, onDelete }) => {
  const going = ev.attendees?.includes(currentUserId);
  const upcoming = new Date(ev.eventDate) >= new Date();
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
      <div
        className="h-32 sm:h-36 relative"
        style={{
          background: ev.coverImage
            ? `url(${ev.coverImage}) center/cover`
            : "linear-gradient(135deg,#7c3aed,#4f46e5,#2563eb)",
        }}
      >
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur ${
            upcoming
              ? "bg-green-500/90 text-white"
              : "bg-gray-700/70 text-white"
          }`}
        >
          {upcoming ? "Upcoming" : "Past"}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 m-0 leading-tight">
            {ev.title}
          </h3>
          {ev.createdBy === currentUserId && (
            <button
              onClick={() => onDelete(ev._id)}
              className="text-red-500 hover:bg-red-50 p-1 rounded"
              title="Delete event"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        {ev.description && (
          <p className="text-sm text-gray-600 mt-1 mb-3 line-clamp-2">
            {ev.description}
          </p>
        )}
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} /> {formatDate(ev.eventDate)}
          </div>
          {ev.location && (
            <div className="flex items-center gap-2">
              <MapPin size={14} /> {ev.location}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users size={14} /> {ev.attendees?.length || 0} going ·{" "}
            {ev.department}
          </div>
        </div>
        <button
          onClick={() => onToggle(ev._id)}
          className={`mt-4 w-full py-2.5 rounded-xl font-semibold transition ${
            going
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
              : "text-white hover:opacity-90"
          }`}
          style={
            !going
              ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
              : {}
          }
        >
          {going ? "✓ You're going" : "RSVP"}
        </button>
      </div>
    </div>
  );
};

const CreateEventModal = ({ user, onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    department: user?.user?.department || "All",
    eventDate: "",
    coverImage: "",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Max image size is 10MB");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await uploadImage(file, "events");
      // backend returns { url, public_id } or similar; handle both shapes
      const url = res?.url || res?.secure_url || res?.imageUrl || res?.image;
      if (!url) throw new Error("Upload failed");
      setForm((f) => ({ ...f, coverImage: url }));
    } catch (err) {
      console.error(err);
      alert("Failed to upload image");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.eventDate) return;
    setSaving(true);
    try {
      const created = await createEvent({
        ...form,
        createdBy: user.user._id,
        creatorName: `${user.user.firstname} ${user.user.lastname}`,
      });
      onCreated(created);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-8">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="m-0 font-semibold">Create Event</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          {/* Cover photo upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Cover Photo
            </label>
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              className="relative h-40 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition flex items-center justify-center overflow-hidden"
              style={
                previewUrl
                  ? { background: `url(${previewUrl}) center/cover` }
                  : {}
              }
            >
              {!previewUrl && (
                <div className="text-center text-gray-500">
                  <ImagePlus className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Click to upload cover</p>
                  <p className="text-xs">PNG, JPG up to 10MB</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold">
                  Uploading…
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          <input
            required
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              type="datetime-local"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
            />
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="px-3 py-2.5 rounded-xl border border-gray-200"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none"
          />
          <button
            disabled={saving || uploading}
            type="submit"
            className="w-full py-2.5 rounded-xl text-white font-semibold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            {saving ? "Creating…" : "Create Event"}
          </button>
        </form>
      </div>
    </div>
  );
};

const Events = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState("All");
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => events.filter((e) => dept === "All" || e.department === dept),
    [events, dept]
  );

  const onToggle = async (id) => {
    try {
      const updated = await toggleAttendEvent(id, user.user._id);
      setEvents((prev) => prev.map((e) => (e._id === id ? updated : e)));
    } catch (e) {
      console.error(e);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id, user.user._id, user.user.isAdmin);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div
        className="rounded-2xl p-6 mb-6 text-white shadow-lg flex items-center justify-between flex-wrap gap-3"
        style={{
          background:
            "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#2563eb 100%)",
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={28} />
            <h1 className="text-2xl font-bold m-0">Events</h1>
          </div>
          <p className="opacity-90 m-0">
            Alumni meetups, department fests & reunions.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-white text-purple-700 font-semibold px-4 py-2 rounded-xl hover:scale-105 transition inline-flex items-center gap-2"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              dept === d
                ? "text-white shadow"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
            style={
              dept === d
                ? { background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }
                : {}
            }
          >
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading events…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl">
          No events yet — be the first to create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ev) => (
            <EventCard
              key={ev._id}
              ev={ev}
              currentUserId={user.user._id}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateEventModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={(ev) => setEvents((prev) => [ev, ...prev])}
        />
      )}
    </div>
  );
};

export default Events;
