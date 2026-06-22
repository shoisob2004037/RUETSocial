import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers, getFullMediaUrl } from "../services/api";
import { Search, Users, GraduationCap } from "lucide-react";

const DEPARTMENTS = [
  "All", "CSE", "EEE", "ME", "CE", "ETE", "IPE", "MTE", "URP", "Arch",
  "GCE", "ChE", "BME", "MSE", "Other",
];

const batchFromRoll = (roll) => {
  if (!roll) return "—";
  const m = String(roll).match(/^(\d{2})/);
  return m ? `20${m[1]}` : "—";
};

const Directory = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [batch, setBatch] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const batches = useMemo(() => {
    const set = new Set(users.map((u) => batchFromRoll(u.roll)));
    return ["All", ...Array.from(set).filter((b) => b !== "—").sort().reverse()];
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (dept !== "All" && u.department !== dept) return false;
      if (batch !== "All" && batchFromRoll(u.roll) !== batch) return false;
      if (!q) return true;
      const name = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
      return name.includes(q) || (u.roll || "").includes(q);
    });
  }, [users, search, dept, batch]);

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div
        className="rounded-2xl p-6 mb-6 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg,#7c3aed 0%,#4f46e5 50%,#2563eb 100%)" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Users size={28} />
          <h1 className="text-2xl font-bold m-0">Alumni Directory</h1>
        </div>
        <p className="opacity-90 m-0">
          Find batchmates and alumni across every RUET department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
        <div className="md:col-span-6 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or roll…"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="md:col-span-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white"
        >
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
        </select>
        <select
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
          className="md:col-span-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white"
        >
          {batches.map((b) => <option key={b} value={b}>{b === "All" ? "All Batches" : `Batch ${b}`}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading alumni…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-2xl">
          No alumni match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <Link
              key={u._id}
              to={`/profile/${u._id}`}
              className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-0.5 no-underline text-inherit"
            >
              <div className="flex items-center gap-3">
                <img
                  src={u.profilePicture ? getFullMediaUrl(u.profilePicture) : "/logo.png"}
                  alt={u.firstname}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-100 group-hover:ring-purple-400 transition"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {u.firstname} {u.lastname}
                  </div>
                  <div className="text-xs text-gray-500 truncate">@{u.roll}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">
                  <GraduationCap size={12} /> {u.department || "—"}
                </span>
                <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                  Batch {batchFromRoll(u.roll)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
