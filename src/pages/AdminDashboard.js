



// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { auth, db } from "../firebase";
// import { signOut } from "firebase/auth";
// import { ref, set, onValue, get, update, serverTimestamp } from "firebase/database";
// import "./AdminDashboard.css";

// // --- helper: SHA-256 for user password hashing ---
// async function sha256Hex(message) {
//   const msgUint8 = new TextEncoder().encode(message);
//   const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
// }

// // ---------------- WaveGraph ----------------
// const WaveGraph = ({ value, label, color, unit }) => {
//   const [animationOffset, setAnimationOffset] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => setAnimationOffset((p) => (p + 1) % 100), 50);
//     return () => clearInterval(interval);
//   }, []);

//   const getFirstNumber = (raw) => {
//     if (typeof raw === "number") return raw;
//     const str = String(raw ?? "").replace(",", ".").trim();
//     const m = str.match(/-?\d+(?:\.\d+)?/);
//     return m ? parseFloat(m[0]) : 0;
//   };
//   const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
//   const mapRange = (val, inMin, inMax, outMin = 10, outMax = 30) => {
//     const v = clamp(val, inMin, inMax);
//     const r = (v - inMin) / (inMax - inMin || 1);
//     return outMin + r * (outMax - outMin);
//   };
//   const computeAmplitude = (lbl, raw) => {
//     const num = getFirstNumber(raw);
//     const l = (lbl || "").toLowerCase();
//     switch (l) {
//       case "blood pressure": return mapRange(num, 90, 140);
//       case "heart rate":     return mapRange(num, 50, 140);
//       case "spo2 level":     return mapRange(100 - clamp(num, 85, 100), 0, 15, 10, 28);
//       case "humidity":       return mapRange(num, 0, 100);
//       case "temperature":    return mapRange(num, 30, 45);
//       case "fall alert":     return String(raw) === "1" || num >= 1 ? 30 : 12;
//       default:               return mapRange(num, 0, 100);
//     }
//   };

//   const amplitude = computeAmplitude(label, value);
//   const frequency = 0.1;

//   const generateWavePoints = () => {
//     const pts = [];
//     for (let x = 0; x <= 300; x += 2) {
//       const y = 40 + amplitude * Math.sin(frequency * (x + animationOffset * 3));
//       pts.push(`${x},${y}`);
//     }
//     return pts.join(" ");
//   };

//   return (
//     <div className="wave-graph-container">
//       <div className="wave-graph-header">
//         <h4>{label}</h4>
//         <span className="wave-value" style={{ color }}>
//           {value} {unit}
//         </span>
//       </div>
//       <div className="wave-graph">
//         <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
//           <defs>
//             <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
//               <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
//               <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
//             </linearGradient>
//             <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
//               <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
//             </pattern>
//           </defs>
//           <rect width="300" height="80" fill="url(#grid)" />
//           <polyline
//             points={generateWavePoints()}
//             fill="none"
//             stroke={color}
//             strokeWidth="2"
//             style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
//           />
//           <polygon points={`0,80 ${generateWavePoints()} 300,80`} fill={`url(#gradient-${label})`} />
//           <circle
//             cx={250 + Math.sin(animationOffset * 0.3) * 10}
//             cy={40 + amplitude * Math.sin(0.1 * (250 + animationOffset * 3))}
//             r="4"
//             fill={color}
//             style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// // ---------------- Admin Dashboard ----------------
// export default function AdminDashboard() {
//   const [mode, setMode] = useState("add"); // 'add' | 'manage'
//   const [msg, setMsg] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // add user form
//   const [username, setUsername] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   // manage users
//   const [users, setUsers] = useState([]);
//   const [selected, setSelected] = useState(null); // username
//   const [selectedData, setSelectedData] = useState(null);

//   // COAL root metrics (BP, HR, SPO2, humd, temp, Fall_alert, selectedUser?)
//   const [coal, setCoal] = useState(null);

//   const navigate = useNavigate();

//   // subscribe to users
//   useEffect(() => {
//     const usersRef = ref(db, "COAL/users");
//     const off = onValue(usersRef, (snap) => {
//       const val = snap.val() || {};
//       const arr = Object.keys(val).map((k) => ({
//         key: k,
//         profile: val[k]?.profile || null,
//         auth: val[k]?.auth || null,
//         data: val[k]?.data || null,
//       }));
//       arr.sort((a, b) => (b.profile?.createdAt || 0) - (a.profile?.createdAt || 0));
//       setUsers(arr);
//     });
//     return () => off();
//   }, []);

//   // subscribe to COAL root for metrics
//   useEffect(() => {
//     const coalRef = ref(db, "COAL");
//     const off = onValue(coalRef, (snap) => setCoal(snap.exists() ? snap.val() : null));
//     return () => off();
//   }, []);

//   // open user details and mark selection in COAL root
//   const openUser = async (uname) => {
//     setSelected(uname);
//     const s = await get(ref(db, `COAL/users/${uname}`));
//     setSelectedData(s.exists() ? s.val() : null);

//     await update(ref(db, "COAL"), {
//       selectedUser: uname,
//       routedAt: serverTimestamp(),
//     });
//   };

//   const closeDetails = () => {
//     setSelected(null);
//     setSelectedData(null);
//   };

//   const handleCreateUser = async (e) => {
//     e.preventDefault();
//     setMsg(null);
//     setLoading(true);
//     try {
//       const passwordHash = await sha256Hex(password);
//       const now = Date.now();

//       await set(ref(db, `COAL/users/${username}`), {
//         auth: { passwordHash },
//         profile: {
//           username,
//           fullName,
//           email: email || null,
//           role: "user",
//           createdAt: now,
//         },
//         // Optional per-user defaults (not used for graphs)
//         data: {
//           alerts: {
//             BP: "120/80",
//             HR: "72",
//             SPO2: "98",
//             humd: "65",
//             temp: "36.5",
//             Fall_alert: "0",
//           },
//         },
//       });

//       setMsg(`User "${username}" created.`);
//       setUsername("");
//       setFullName("");
//       setEmail("");
//       setPassword("");
//       setMode("manage");
//     } catch (err) {
//       setMsg(err.message || "Failed to create user.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const doLogout = async () => {
//     await signOut(auth);
//     navigate("/");
//   };

//   const selectedProfile = useMemo(() => selectedData?.profile || null, [selectedData]);

//   return (
//     <div className="page-bg">
//       <div className="dash">
//         <header className="dash-header">
//           <div className="brand">
//             <h1>Safety and Productivity Monitoring System for Coal Mines</h1>
//           </div>
//           <button className="ghost" onClick={doLogout}>Sign out</button>
//         </header>

//         <div className="mode-bar">
//           <button className={mode === "add" ? "mode-btn active" : "mode-btn"} onClick={() => setMode("add")}>
//             Add Users
//           </button>
//           <button className={mode === "manage" ? "mode-btn active" : "mode-btn"} onClick={() => setMode("manage")}>
//             Manage Users
//           </button>
//         </div>

//         {mode === "add" ? (
//           <section className="card">
//             <h3>Add a User</h3>
//             <form className="form" onSubmit={handleCreateUser}>
//               <label>
//                 Username
//                 <input type="text" value={username} onChange={(e) => setUsername(e.target.value.trim())}
//                        placeholder="e.g., miner_101" required />
//               </label>
//               <label>
//                 Full name
//                 <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
//                        placeholder="e.g., Prakash K" required />
//               </label>
//               <label>
//                 Email (optional)
//                 <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//                        placeholder="user@example.com" />
//               </label>
//               <label>
//                 Temporary password
//                 <input type="text" value={password} onChange={(e) => setPassword(e.target.value)}
//                        placeholder="choose a starter password" required minLength={4} />
//               </label>
//               <button className="primary" disabled={loading}>Create User</button>
//             </form>
//             {msg && <div className="message">{msg}</div>}
//             <p className="muted small">
//               Password hashes stored at <code>COAL/users/&lt;username&gt;/auth/passwordHash</code>.
//             </p>
//           </section>
//         ) : (
//           <section>
//             <h3>Users</h3>
//             <div className="grid">
//               {users.length === 0 && <div className="muted">No users yet.</div>}
//               {users.map((u) => (
//                 <article key={u.key} className="user-card" onClick={() => openUser(u.key)}>
//                   <div className="user-card__head">
//                     <div className="avatar">{(u.profile?.fullName || u.key).slice(0, 1).toUpperCase()}</div>
//                     <div>
//                       <div className="user-name">{u.profile?.fullName || "Unnamed"}</div>
//                       <div className="user-sub">@{u.key}</div>
//                     </div>
//                   </div>
//                   <div className="user-meta">
//                     <span>Role: {u.profile?.role || "user"}</span>
//                     <span>
//                       Created:{" "}
//                       {u.profile?.createdAt ? new Date(u.profile.createdAt).toLocaleString() : "-"}
//                     </span>
//                   </div>
//                   <button className="ghost wide">View Details</button>
//                 </article>
//               ))}
//             </div>
//           </section>
//         )}
//       </div>

//       {/* Details section shows COAL root metrics for whichever user is selected */}
//       {selected && (
//         <div className="user-details-section">
//           <div className="user-details-container">
//             <div className="user-details-header">
//               <div className="user-info">
//                 <div className="user-avatar-large">
//                   {(selectedProfile?.fullName || selected).slice(0, 1).toUpperCase()}
//                 </div>
//                 <div className="user-details-basic">
//                   <h2>{selectedProfile?.fullName || "Unnamed"}</h2>
//                   <p>@{selectedProfile?.username || selected}</p>
//                   <p>{selectedProfile?.email || "No email"}</p>
//                   <span className="user-role">Role: {selectedProfile?.role || "user"}</span>
//                   <span className="user-created">
//                     Created: {selectedProfile?.createdAt ? new Date(selectedProfile.createdAt).toLocaleString() : "-"}
//                   </span>
//                   <div className="selected-banner">
//                     Showing metrics from <code>COAL</code> for <strong>@{selected}</strong>
//                   </div>
//                 </div>
//               </div>
//               <button className="close-details-btn" onClick={closeDetails}>✕ Close Details</button>
//             </div>

//             <div className="alerts-monitoring">
//               <h3>Real-time Health & Safety Monitoring</h3>
//               <div className="wave-graphs-grid">
//                 <WaveGraph value={coal?.BP ?? "-"}        label="Blood Pressure" color="#e74c3c" unit="mmHg" />
//                 <WaveGraph value={coal?.HR ?? "-"}        label="Heart Rate"     color="#e91e63" unit="bpm" />
//                 <WaveGraph value={coal?.SPO2 ?? "-"}      label="SpO2 Level"     color="#2196f3" unit="%" />
//                 <WaveGraph value={coal?.humd ?? "-"}      label="Humidity"       color="#00bcd4" unit="%" />
//                 <WaveGraph value={coal?.temp ?? "-"}      label="Temperature"    color="#ff9800" unit="°C" />
//                 <WaveGraph value={coal?.Fall_alert ?? "-"} label="Fall Alert"    color="#4caf50" unit="status" />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




import React, { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, set, onValue, get, update, serverTimestamp } from "firebase/database";
import "./AdminDashboard.css";

// --- helper: SHA-256 for user password hashing ---
async function sha256Hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------- WaveGraph ----------------
const WaveGraph = ({ value, label, color, unit }) => {
  const [animationOffset, setAnimationOffset] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setAnimationOffset((p) => (p + 1) % 100), 50);
    return () => clearInterval(interval);
  }, []);

  const getFirstNumber = (raw) => {
    if (typeof raw === "number") return raw;
    const str = String(raw ?? "").replace(",", ".").trim();
    const m = str.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mapRange = (val, inMin, inMax, outMin = 10, outMax = 30) => {
    const v = clamp(val, inMin, inMax);
    const r = (v - inMin) / (inMax - inMin || 1);
    return outMin + r * (outMax - outMin);
  };
  const computeAmplitude = (lbl, raw) => {
    const num = getFirstNumber(raw);
    const l = (lbl || "").toLowerCase();
    switch (l) {
      case "blood pressure": return mapRange(num, 90, 140);
      case "heart rate":     return mapRange(num, 50, 140);
      case "spo2 level":     return mapRange(100 - clamp(num, 85, 100), 0, 15, 10, 28);
      case "humidity":       return mapRange(num, 0, 100);
      case "temperature":    return mapRange(num, 30, 45);
      case "fall alert":     return String(raw) === "1" || num >= 1 ? 30 : 12;
      default:               return mapRange(num, 0, 100);
    }
  };

  const amplitude = computeAmplitude(label, value);
  const frequency = 0.1;

  const generateWavePoints = () => {
    const pts = [];
    for (let x = 0; x <= 300; x += 2) {
      const y = 40 + amplitude * Math.sin(frequency * (x + animationOffset * 3));
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  };

  return (
    <div className="wave-graph-container">
      <div className="wave-graph-header">
        <h4>{label}</h4>
        <span className="wave-value" style={{ color }}>
          {value} {unit}
        </span>
      </div>
      <div className="wave-graph">
        <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
            </linearGradient>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="300" height="80" fill="url(#grid)" />
          <polyline
            points={generateWavePoints()}
            fill="none"
            stroke={color}
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
          />
          <polygon points={`0,80 ${generateWavePoints()} 300,80`} fill={`url(#gradient-${label})`} />
          <circle
            cx={250 + Math.sin(animationOffset * 0.3) * 10}
            cy={40 + amplitude * Math.sin(0.1 * (250 + animationOffset * 3))}
            r="4"
            fill={color}
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
          />
        </svg>
      </div>
    </div>
  );
};

// ---------------- Admin Dashboard ----------------
export default function AdminDashboard() {
  const [mode, setMode] = useState("add"); // 'add' | 'manage'
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // add user form
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // manage users
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null); // username
  const [selectedData, setSelectedData] = useState(null);

  // COAL root metrics and Alerts node
  const [coal, setCoal] = useState(null);          // BP/HR/SPO2/humd/temp/Fall_alert at COAL root
  const [alertsNode, setAlertsNode] = useState({}); // messages/flags at COAL/Alerts

  // alert UI helpers
  const [dismissed, setDismissed] = useState({});
  const prevFlagsRef = useRef({});

  const ALERT_DEFS = useMemo(() => ([
    { key: "Emergency_Alert",     label: "Emergency Alert",      severity: "danger"  },
    { key: "Health_Help_Request", label: "Health Help Request",  severity: "warning" },
    { key: "I_am_Safe_Message",   label: "I am Safe Message",    severity: "info"    },
    { key: "Message_to_Family",   label: "Message to Family",    severity: "info"    },
    { key: "Fall_alert",          label: "Fall Alert",           severity: "warning" },
    // dynamic vitals derived alerts (computed, not direct DB keys)
    { key: "HR_HIGH",             label: "High Heart Rate",      severity: "warning", derived: true },
    { key: "HR_LOW",              label: "Low Heart Rate",       severity: "warning", derived: true },
    { key: "TEMP_HIGH",           label: "High Temperature",     severity: "danger",  derived: true },
    { key: "TEMP_LOW",            label: "Low Temperature",      severity: "warning", derived: true },
  ]), []);

  const isTrue = (v) => v === 1 || v === "1" || v === true || v === "true";

  const speak = (text) => {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1; u.volume = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const navigate = useNavigate();

  // subscribe to users
  useEffect(() => {
    const usersRef = ref(db, "COAL/users");
    const off = onValue(usersRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val).map((k) => ({
        key: k,
        profile: val[k]?.profile || null,
        auth: val[k]?.auth || null,
        data: val[k]?.data || null,
      }));
      arr.sort((a, b) => (b.profile?.createdAt || 0) - (a.profile?.createdAt || 0));
      setUsers(arr);
    });
    return () => off();
  }, []);

  // subscribe to COAL root for metrics (BP, HR, SPO2, humd, temp, Fall_alert, selectedUser)
  useEffect(() => {
    const coalRef = ref(db, "COAL");
    const off = onValue(coalRef, (snap) => setCoal(snap.exists() ? snap.val() : null));
    return () => off();
  }, []);

  // subscribe to COAL/Alerts for messages/flags
  useEffect(() => {
    const aRef = ref(db, "COAL/Alerts");
    const off = onValue(aRef, (snap) => setAlertsNode(snap.exists() ? snap.val() : {}));
    return () => off();
  }, []);

  // helper to parse numeric vitals
  const parseNum = (raw) => {
    if (typeof raw === 'number') return raw;
    const m = String(raw ?? '').match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };

  // derive active alerts (including dynamic HR/temp thresholds)
  const activeAlerts = useMemo(() => {
    const list = [];
    ALERT_DEFS.forEach((def) => {
      if (def.derived) return; // skip derived for direct evaluation
      let val = alertsNode?.[def.key];
      if (def.key === "Fall_alert" && (val === undefined || val === null)) {
        val = coal?.Fall_alert;
      }
      const on = isTrue(val) || (typeof val === 'string' && val && val !== '0');
      let text = def.label;
      if (typeof val === 'string' && val !== '1' && val.trim() !== '') text = val.trim();
      if (on) list.push({ key: def.key, label: def.label, text, severity: def.severity });
    });

    // dynamic vitals thresholds (only when a user is selected)
    if (coal && selected) {
      const hr = parseNum(coal.HR);
      if (!isNaN(hr)) {
        if (hr > 110) list.push({ key: 'HR_HIGH', label: 'High Heart Rate', text: `Heart rate ${hr} bpm`, severity: 'warning' });
        else if (hr < 50) list.push({ key: 'HR_LOW', label: 'Low Heart Rate', text: `Heart rate ${hr} bpm`, severity: 'warning' });
      }
      const temp = parseNum(coal.temp);
      if (!isNaN(temp)) {
        if (temp >= 38) list.push({ key: 'TEMP_HIGH', label: 'High Temperature', text: `Temperature ${temp}°C`, severity: 'danger' });
        else if (temp <= 35) list.push({ key: 'TEMP_LOW', label: 'Low Temperature', text: `Temperature ${temp}°C`, severity: 'warning' });
      }
    }
    return list;
  }, [ALERT_DEFS, alertsNode, coal, selected]);

  // speak on rising edges while a user is opened
  useEffect(() => {
    if (!selected) return;
    const prev = prevFlagsRef.current || {};
    const now = {};
    activeAlerts.forEach((a) => {
      now[a.key] = true;
      if (!prev[a.key]) {
        const phrase =
          a.text && a.text !== a.label
            ? `${a.label} for ${selected}. ${a.text}`
            : `${a.label} for ${selected}`;
        speak(phrase);
      }
    });
    prevFlagsRef.current = now;
  }, [activeAlerts, selected]);

  // open user and mark selection in COAL root
  const openUser = async (uname) => {
    setSelected(uname);
    const s = await get(ref(db, `COAL/users/${uname}`));
    setSelectedData(s.exists() ? s.val() : null);
    setDismissed({}); // reset dismissals when switching users

    await update(ref(db, "COAL"), {
      selectedUser: uname,
      routedAt: serverTimestamp(),
    });
  };

  const closeDetails = () => {
    setSelected(null);
    setSelectedData(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const passwordHash = await sha256Hex(password);
      const now = Date.now();
      await set(ref(db, `COAL/users/${username}`), {
        auth: { passwordHash },
        profile: { username, fullName, email: email || null, role: "user", createdAt: now },
        data: {
          alerts: { BP: "120/80", HR: "72", SPO2: "98", humd: "65", temp: "36.5", Fall_alert: "0" },
        },
      });
      setMsg(`User "${username}" created.`);
      setUsername(""); setFullName(""); setEmail(""); setPassword("");
      setMode("manage");
    } catch (err) {
      setMsg(err.message || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const selectedProfile = useMemo(() => selectedData?.profile || null, [selectedData]);

  // ---------------- PDF EXPORT ----------------
  const generatePdf = () => {
    if (!selected) return;
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const marginX = 40;
    let y = 50;
    const line = (text, opts={}) => { doc.setFontSize(opts.size||11); doc.text(text, marginX, y); y += (opts.gap||18); };

    // Title
    doc.setFontSize(18);
    doc.text(`User Report: @${selected}`, marginX, y); y += 26;
    doc.setFontSize(11);
    line(`Generated: ${new Date().toLocaleString()}`);

    // Profile
    if (selectedProfile) {
      line('Profile:', { size: 13, gap: 20 });
      line(`Name: ${selectedProfile.fullName || 'Unnamed'}`);
      line(`Role: ${selectedProfile.role || 'user'}`);
      line(`Email: ${selectedProfile.email || '—'}`);
      line(`Created: ${selectedProfile.createdAt ? new Date(selectedProfile.createdAt).toLocaleString() : '—'}`);
      y += 10;
    }

    // Metrics (from COAL root) if available
    const metrics = [
      ['Blood Pressure', coal?.BP ?? '-'],
      ['Heart Rate (bpm)', coal?.HR ?? '-'],
      ['SpO2 (%)', coal?.SPO2 ?? '-'],
      ['Humidity (%)', coal?.humd ?? '-'],
      ['Temperature (°C)', coal?.temp ?? '-'],
      ['Fall Alert', coal?.Fall_alert ?? '-'],
    ];
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Value']],
      body: metrics,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [102,126,234] },
    });
    y = doc.lastAutoTable.finalY + 25;

    // Active alerts table
    if (activeAlerts.length) {
      doc.setFontSize(13); doc.text('Active Alerts', marginX, y); y += 12;
      const alertRows = activeAlerts.map(a => [a.label, a.text, a.severity]);
      autoTable(doc, {
        startY: y,
        head: [['Alert', 'Message', 'Severity']],
        body: alertRows,
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [231,76,60] },
      });
      y = doc.lastAutoTable.finalY + 20;
    }

    // Footer
    doc.setFontSize(9);
    doc.text('Safety and Productivity Monitoring System for Coal Mines', marginX, 820);
    doc.save(`user-report-${selected}-${Date.now()}.pdf`);
  };

  return (
    <div className="page-bg">
      <div className="dash">
        <header className="dash-header">
          <div className="brand">
            <h1>Safety and Productivity Monitoring System for Coal Mines</h1>
          </div>
          <button className="ghost" onClick={doLogout}>Sign out</button>
        </header>

        <div className="mode-bar">
          <button className={mode === "add" ? "mode-btn active" : "mode-btn"} onClick={() => setMode("add")}>
            Add Users
          </button>
          <button className={mode === "manage" ? "mode-btn active" : "mode-btn"} onClick={() => setMode("manage")}>
            Manage Users
          </button>
        </div>

        {mode === "add" ? (
          <section className="card">
            <h3>Add a User</h3>
            <form className="form" onSubmit={handleCreateUser}>
              <label>Username
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value.trim())} placeholder="e.g., miner_101" required />
              </label>
              <label>Full name
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g., Prakash K" required />
              </label>
              <label>Email (optional)
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
              </label>
              <label>Temporary password
                <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="choose a starter password" required minLength={4} />
              </label>
              <button className="primary" disabled={loading}>Create User</button>
            </form>
            {msg && <div className="message">{msg}</div>}
           
          </section>
        ) : (
          <section>
            <h3>Users</h3>
            <div className="grid">
              {users.length === 0 && <div className="muted">No users yet.</div>}
              {users.map((u) => (
                <article key={u.key} className="user-card" onClick={() => openUser(u.key)}>
                  <div className="user-card__head">
                    <div className="avatar">{(u.profile?.fullName || u.key).slice(0, 1).toUpperCase()}</div>
                    <div>
                      <div className="user-name">{u.profile?.fullName || "Unnamed"}</div>
                      <div className="user-sub">@{u.key}</div>
                    </div>
                  </div>
                  <div className="user-meta">
                    <span>Role: {u.profile?.role || "user"}</span>
                    <span>Created: {u.profile?.createdAt ? new Date(u.profile.createdAt).toLocaleString() : "-"}</span>
                  </div>
                  <button className="ghost wide">View Details</button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Details section shows metrics + alert banners for the selected user */}
      {selected && (
        <div className="user-details-section">
          <div className="user-details-container">
            {/* --- Alert banners (dismissible) --- */}
            {activeAlerts.filter(a => !dismissed[a.key]).length > 0 && (
              <div className="alerts-stack">
                {activeAlerts.filter(a => !dismissed[a.key]).map((a) => (
                  <div key={a.key} className={`alert-banner ${a.severity}`}>
                    <div className="alert-content">
                      <span className="alert-dot" />
                      <strong className="alert-title">
                        {a.label} for @{selected}
                      </strong>
                      <span className="alert-text">{a.text}</span>
                    </div>
                    <button
                      className="alert-close"
                      onClick={() => setDismissed((d) => ({ ...d, [a.key]: true }))}
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="user-details-header">
              <div className="user-info">
                <div className="user-avatar-large">
                  {(selectedProfile?.fullName || selected).slice(0, 1).toUpperCase()}
                </div>
                <div className="user-details-basic">
                  <h2>{selectedProfile?.fullName || "Unnamed"}</h2>
                  <p>@{selectedProfile?.username || selected}</p>
                  <p>{selectedProfile?.email || "No email"}</p>
                  <span className="user-role">Role: {selectedProfile?.role || "user"}</span>
                  <span className="user-created">
                    Created: {selectedProfile?.createdAt ? new Date(selectedProfile.createdAt).toLocaleString() : "-"}
                  </span>
                  <div className="selected-banner">
                    Showing metrics from <code>COAL</code> for <strong>@{selected}</strong>
                  </div>
                </div>
              </div>
              <div className="details-actions">
                <button className="ghost export-btn" onClick={generatePdf}>Export PDF</button>
                <button className="close-details-btn" onClick={closeDetails}>✕ Close Details</button>
              </div>
            </div>

            <div className="alerts-monitoring">
              <h3>Real-time Health & Safety Monitoring</h3>
              <div className="wave-graphs-grid">
                <WaveGraph value={coal?.BP ?? "-"}         label="Blood Pressure" color="#e74c3c" unit="mmHg" />
                <WaveGraph value={coal?.HR ?? "-"}         label="Heart Rate"     color="#e91e63" unit="bpm" />
                <WaveGraph value={coal?.SPO2 ?? "-"}       label="SpO2 Level"     color="#2196f3" unit="%" />
                <WaveGraph value={coal?.humd ?? "-"}       label="Humidity"       color="#00bcd4" unit="%" />
                <WaveGraph value={coal?.temp ?? "-"}       label="Temperature"    color="#ff9800" unit="°C" />
                <WaveGraph value={coal?.Fall_alert ?? "-"} label="Fall Alert"     color="#4caf50" unit="status" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
