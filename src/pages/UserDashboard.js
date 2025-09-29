// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { db } from "../firebase";
// import { ref, onValue, get } from "firebase/database";
// import "./UserDashboard.css";

// /* WaveGraph (class names end with 1) */
// const WaveGraph = ({ value, label, color, unit }) => {
//   const [animationOffset, setAnimationOffset] = useState(0);

//   useEffect(() => {
//     const id = setInterval(() => setAnimationOffset((p) => (p + 1) % 100), 50);
//     return () => clearInterval(id);
//   }, []);

//   const n = (raw) => {
//     if (typeof raw === "number") return raw;
//     const m = String(raw ?? "").replace(",", ".").match(/-?\d+(\.\d+)?/);
//     return m ? parseFloat(m[0]) : 0;
//   };
//   const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
//   const map = (v, a, b, A = 10, B = 30) => {
//     const r = (clamp(v, a, b) - a) / (b - a || 1);
//     return A + r * (B - A);
//   };
//   const amp = (() => {
//     const L = (label || "").toLowerCase();
//     const x = n(value);
//     if (L === "blood pressure") return map(x, 90, 140);
//     if (L === "heart rate") return map(x, 50, 140);
//     if (L === "spo2 level") return map(100 - clamp(x, 85, 100), 0, 15, 10, 28);
//     if (L === "humidity") return map(x, 0, 100);
//     if (L === "temperature") return map(x, 30, 45);
//     if (L === "fall alert") return String(value) === "1" || x >= 1 ? 30 : 12;
//     return map(x, 0, 100);
//   })();

//   const points = () => {
//     const p = [];
//     for (let x = 0; x <= 300; x += 2) {
//       const y = 40 + amp * Math.sin(0.1 * (x + animationOffset * 3));
//       p.push(`${x},${y}`);
//     }
//     return p.join(" ");
//   };

//   return (
//     <div className="wave-graph-container1">
//       <div className="wave-graph-header1">
//         <h4>{label}</h4>
//         <span className="wave-value1" style={{ color }}>
//           {value} {unit}
//         </span>
//       </div>
//       <div className="wave-graph1">
//         <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
//           <defs>
//             <linearGradient id={`grad1-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
//               <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
//               <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
//             </linearGradient>
//             <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
//               <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
//             </pattern>
//           </defs>
//           <rect width="300" height="80" fill="url(#grid1)" />
//           <polyline points={points()} fill="none" stroke={color} strokeWidth="2" />
//           <polygon points={`0,80 ${points()} 300,80`} fill={`url(#grad1-${label})`} />
//           <circle
//             cx={250 + Math.sin(animationOffset * 0.3) * 10}
//             cy={40 + amp * Math.sin(0.1 * (250 + animationOffset * 3))}
//             r="4"
//             fill={color}
//           />
//         </svg>
//       </div>
//     </div>
//   );
// };

// export default function UserDashboard() {
//   const navigate = useNavigate();
//   const username = localStorage.getItem("app.username");

//   const [selectedUser, setSelectedUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [coal, setCoal] = useState(null);
//   const [expanded, setExpanded] = useState(false);

//   // who admin selected
//   useEffect(() => {
//     const selRef = ref(db, "COAL/selectedUser");
//     return onValue(selRef, (s) => setSelectedUser(s.val() ?? null));
//   }, []);

//   // live metrics at COAL root
//   useEffect(() => {
//     const cRef = ref(db, "COAL");
//     return onValue(cRef, (s) => setCoal(s.exists() ? s.val() : null));
//   }, []);

//   // load my profile only if I'm selected
//   useEffect(() => {
//     if (!username) return;
//     if (selectedUser === username) {
//       get(ref(db, `COAL/users/${username}/profile`)).then((s) =>
//         setProfile(s.exists() ? s.val() : null)
//       );
//     } else {
//       setProfile(null);
//       setExpanded(false);
//     }
//   }, [username, selectedUser]);

//   const isMine = selectedUser === username;

//   const signOut = () => {
//     localStorage.removeItem("app.username");
//     navigate("/");
//   };

//   return (
//     <div className="page-bg1">
//       <div className="dash1">
//         <header className="dash-header1">
//           <h2>Hello{username ? `, ${username}` : ""}</h2>
//           <button className="ghost1" onClick={signOut}>Sign out</button>
//         </header>

//         {!username && (
//           <section className="card11">
//             <p>Please sign in again.</p>
//           </section>
//         )}

//         {isMine ? (
//           <>
//             <section>
//               <h3>Your Assignment</h3>
//               <article className="user-card1" onClick={() => setExpanded((v) => !v)}>
//                 <div className="user-card__head1">
//                   <div className="avatar11">
//                     {(profile?.fullName || username || "U").slice(0, 1).toUpperCase()}
//                   </div>
//                   <div>
//                     <div className="user-name1">{profile?.fullName || "Unnamed"}</div>
//                     <div className="user-sub1">@{username}</div>
//                   </div>
//                 </div>
//                 <div className="user-meta1">
//                   <span>Role: {profile?.role || "user"}</span>
//                   <span>
//                     Created:{" "}
//                     {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
//                   </span>
//                 </div>
//                 <button className="ghost1 wide1">{expanded ? "Hide Details" : "View Details"}</button>
//               </article>
//             </section>

//             {expanded && (
//               <section className="user-details-section1">
//                 <div className="user-details-container1">
//                   <div className="user-details-header1">
//                     <div className="user-info1">
//                       <div className="user-avatar-large1">
//                         {(profile?.fullName || username || "U").slice(0, 1).toUpperCase()}
//                       </div>
//                       <div className="user-details-basic1">
//                         <h2>{profile?.fullName || "Unnamed"}</h2>
//                         <p>@{username}</p>
//                         <p>{profile?.email || "No email"}</p>
//                         <span className="user-role1">Role: {profile?.role || "user"}</span>
//                         <span className="user-created1">
//                           Created: {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
//                         </span>
//                         <div className="selected-banner1">
//                           Showing live metrics from <code>COAL</code> routed to you
//                         </div>
//                       </div>
//                     </div>
//                     <button className="close-details-btn1" onClick={() => setExpanded(false)}>✕</button>
//                   </div>

//                   <div className="alerts-monitoring1">
//                     <h3>Real-time Health &amp; Safety Monitoring</h3>
//                     <div className="wave-graphs-grid1">
//                       <WaveGraph value={coal?.BP ?? "-"}         label="Blood Pressure" color="#e74c3c" unit="mmHg" />
//                       <WaveGraph value={coal?.HR ?? "-"}         label="Heart Rate"     color="#e91e63" unit="bpm" />
//                       <WaveGraph value={coal?.SPO2 ?? "-"}       label="SpO2 Level"     color="#2196f3" unit="%" />
//                       <WaveGraph value={coal?.humd ?? "-"}       label="Humidity"       color="#00bcd4" unit="%" />
//                       <WaveGraph value={coal?.temp ?? "-"}       label="Temperature"    color="#ff9800" unit="°C" />
//                       <WaveGraph value={coal?.Fall_alert ?? "-"} label="Fall Alert"     color="#4caf50" unit="status" />
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             )}
//           </>
//         ) : (
//           <section className="card11">
//             <h3>Waiting for assignment…</h3>
//             <p className="muted1">
//               Once the admin selects <strong>@{username}</strong>, your card and details appear here.
//             </p>
//           </section>
//         )}
//       </div>
//     </div>
//   );
// }




import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue, get } from "firebase/database";
import "./UserDashboard.css";

/* ---------------- WaveGraph (class names end with 1) ---------------- */
const WaveGraph = ({ value, label, color, unit }) => {
  const [animationOffset, setAnimationOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAnimationOffset((p) => (p + 1) % 100), 50);
    return () => clearInterval(id);
  }, []);

  const n = (raw) => {
    if (typeof raw === "number") return raw;
    const m = String(raw ?? "").replace(",", ".").match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const map = (v, a, b, A = 10, B = 30) => {
    const r = (clamp(v, a, b) - a) / (b - a || 1);
    return A + r * (B - A);
  };
  const amp = (() => {
    const L = (label || "").toLowerCase();
    const x = n(value);
    if (L === "blood pressure") return map(x, 90, 140);
    if (L === "heart rate") return map(x, 50, 140);
    if (L === "spo2 level") return map(100 - clamp(x, 85, 100), 0, 15, 10, 28);
    if (L === "humidity") return map(x, 0, 100);
    if (L === "temperature") return map(x, 30, 45);
    if (L === "fall alert") return String(value) === "1" || x >= 1 ? 30 : 12;
    return map(x, 0, 100);
  })();

  const points = () => {
    const p = [];
    for (let x = 0; x <= 300; x += 2) {
      const y = 40 + amp * Math.sin(0.1 * (x + animationOffset * 3));
      p.push(`${x},${y}`);
    }
    return p.join(" ");
  };

  return (
    <div className="wave-graph-container1">
      <div className="wave-graph-header1">
        <h4>{label}</h4>
        <span className="wave-value1" style={{ color }}>
          {value} {unit}
        </span>
      </div>
      <div className="wave-graph1">
        <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`grad1-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.1 }} />
            </linearGradient>
            <pattern id="grid1" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="300" height="80" fill="url(#grid1)" />
          <polyline points={points()} fill="none" stroke={color} strokeWidth="2" />
          <polygon points={`0,80 ${points()} 300,80`} fill={`url(#grad1-${label})`} />
          <circle
            cx={250 + Math.sin(animationOffset * 0.3) * 10}
            cy={40 + amp * Math.sin(0.1 * (250 + animationOffset * 3))}
            r="4"
            fill={color}
          />
        </svg>
      </div>
    </div>
  );
};

/* ---------------- User Dashboard with Alert banners + voice ---------------- */
export default function UserDashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("app.username");

  const [selectedUser, setSelectedUser] = useState(null);      // COAL/selectedUser
  const [profile, setProfile] = useState(null);                 // COAL/users/<me>/profile
  const [coal, setCoal] = useState(null);                       // COAL root metrics
  const [alertsNode, setAlertsNode] = useState(null);           // COAL/Alerts (messages & flags)
  const [expanded, setExpanded] = useState(false);

  // local UI state for dismissing banners
  const [dismissed, setDismissed] = useState({});               // {key: true}
  const prevFlagsRef = useRef({});                              // previous flags for edge-trigger

  // which keys we care about from COAL/Alerts (+ Fall_alert fallback at COAL root)
  const ALERT_DEFS = useMemo(() => ([
    { key: "Emergency_Alert",    label: "Emergency Alert",  severity: "danger"  },
    { key: "Health_Help_Request",label: "Health Help Request", severity: "warning" },
    { key: "I_am_Safe_Message",  label: "I am Safe", severity: "info"   },
    { key: "Message_to_Family",  label: "Message to Family", severity: "info"   },
    { key: "Fall_alert",         label: "Fall Alert",       severity: "warning" },
    // derived vitals alerts
    { key: "HR_HIGH",            label: "High Heart Rate",  severity: "warning", derived: true },
    { key: "HR_LOW",             label: "Low Heart Rate",   severity: "warning", derived: true },
    { key: "TEMP_HIGH",          label: "High Temperature", severity: "danger",  derived: true },
    { key: "TEMP_LOW",           label: "Low Temperature",  severity: "warning", derived: true },
  ]), []);

  const isTrue = (v) => v === 1 || v === "1" || v === true || v === "true";

  const speak = (text) => {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1; u.pitch = 1; u.volume = 1;
      // cancel any queued utterances so we don't overlap
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* ignore */ }
  };

  // who admin selected
  useEffect(() => {
    const selRef = ref(db, "COAL/selectedUser");
    return onValue(selRef, (s) => setSelectedUser(s.val() ?? null));
  }, []);

  // live metrics at COAL root (BP, HR, SPO2, humd, temp, Fall_alert)
  useEffect(() => {
    const cRef = ref(db, "COAL");
    return onValue(cRef, (s) => setCoal(s.exists() ? s.val() : null));
  }, []);

  // live messages/flags at COAL/Alerts
  useEffect(() => {
    const aRef = ref(db, "COAL/Alerts");
    return onValue(aRef, (s) => setAlertsNode(s.exists() ? s.val() : {}));
  }, []);

  // load my profile only if I'm selected
  useEffect(() => {
    if (!username) return;
    if (selectedUser === username) {
      get(ref(db, `COAL/users/${username}/profile`)).then((s) =>
        setProfile(s.exists() ? s.val() : null)
      );
    } else {
      setProfile(null);
      setExpanded(false);
      setDismissed({});
    }
  }, [username, selectedUser]);

  const isMine = selectedUser === username;

  // compute active alerts + speak on rising edge
  const parseNum = (raw) => {
    if (typeof raw === 'number') return raw;
    const m = String(raw ?? '').match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };

  const activeAlerts = useMemo(() => {
    const list = [];
    ALERT_DEFS.forEach((def) => {
      if (def.derived) return; // skip derived in direct loop
      let val = alertsNode?.[def.key];
      if (def.key === 'Fall_alert' && (val === undefined || val === null)) {
        val = coal?.Fall_alert;
      }
      const isActive = isTrue(val) || (typeof val === 'string' && val && val !== '0');
      let text = def.label;
      if (typeof val === 'string' && val !== '1' && val.trim() !== '') text = val.trim();
      if (isActive) list.push({ key: def.key, label: def.label, text, severity: def.severity });
    });
    // derived vitals only for routed user (isMine)
    if (coal && isMine) {
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
  }, [ALERT_DEFS, alertsNode, coal, isMine]);

  // speak only when a flag transitions from off -> on
  useEffect(() => {
    const prev = prevFlagsRef.current || {};
    const now = {};
    activeAlerts.forEach((a) => {
      now[a.key] = true;
      if (!prev[a.key] && isMine) {
        // announce once when it turns on
        speak(a.text || a.label);
      }
    });
    prevFlagsRef.current = now;
  }, [activeAlerts, isMine]);

  const dismiss = (key) => setDismissed((d) => ({ ...d, [key]: true }));

  const signOut = () => {
    localStorage.removeItem("app.username");
    navigate("/");
  };

  return (
    <div className="page-bg1">
      <div className="dash1">
        <header className="dash-header1">
          <div className="ud-header-text">
            <h1 className="ud-app-title">Safety and Productivity Monitoring System for Coal Mines</h1>
            <h2 className="ud-welcome">Hello{username ? `, ${username}` : ""}</h2>
          </div>
          <button className="ghost1" onClick={signOut}>Sign out</button>
        </header>

        {!username && (
          <section className="card11">
            <p>Please sign in again.</p>
          </section>
        )}

        {isMine ? (
          <>
            {/* ---- ALERT BANNERS (always visible when routed to this user) ---- */}
            {activeAlerts.filter(a => !dismissed[a.key]).length > 0 && (
              <div className="alerts-stack1">
                {activeAlerts.filter(a => !dismissed[a.key]).map((a) => (
                  <div key={a.key} className={`alert-banner1 ${a.severity}`}>
                    <div className="alert-content1">
                      <span className="alert-dot1" />
                      <strong className="alert-title1">{a.label}</strong>
                      <span className="alert-text1">{a.text}</span>
                    </div>
                    <button className="alert-close1" onClick={() => dismiss(a.key)} aria-label="Dismiss">×</button>
                  </div>
                ))}
              </div>
            )}

            <section>
              <h3>Your Assignment</h3>
              <article className="user-card1" onClick={() => setExpanded((v) => !v)}>
                <div className="user-card__head1">
                  <div className="avatar11">
                    {(profile?.fullName || username || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name1">{profile?.fullName || "Unnamed"}</div>
                    <div className="user-sub1">@{username}</div>
                  </div>
                </div>
                <div className="user-meta1">
                  <span>Role: {profile?.role || "user"}</span>
                  <span>
                    Created:{" "}
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
                <button className="ghost1 wide1">{expanded ? "Hide Details" : "View Details"}</button>
              </article>
            </section>

            {expanded && (
              <section className="user-details-section1">
                <div className="user-details-container1">
                  <div className="user-details-header1">
                    <div className="user-info1">
                      <div className="user-avatar-large1">
                        {(profile?.fullName || username || "U").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="user-details-basic1">
                        <h2>{profile?.fullName || "Unnamed"}</h2>
                        <p>@{username}</p>
                        <p>{profile?.email || "No email"}</p>
                        <span className="user-role1">Role: {profile?.role || "user"}</span>
                        <span className="user-created1">
                          Created: {profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : "-"}
                        </span>
                        <div className="selected-banner1">
                          Showing live metrics from <code>COAL</code> routed to you
                        </div>
                      </div>
                    </div>
                    <button className="close-details-btn1" onClick={() => setExpanded(false)}>✕</button>
                  </div>

                  <div className="alerts-monitoring1">
                    <h3>Real-time Health &amp; Safety Monitoring</h3>
                    <div className="wave-graphs-grid1">
                      <WaveGraph value={coal?.BP ?? "-"}         label="Blood Pressure" color="#e74c3c" unit="mmHg" />
                      <WaveGraph value={coal?.HR ?? "-"}         label="Heart Rate"     color="#e91e63" unit="bpm" />
                      <WaveGraph value={coal?.SPO2 ?? "-"}       label="SpO2 Level"     color="#2196f3" unit="%" />
                      <WaveGraph value={coal?.humd ?? "-"}       label="Humidity"       color="#00bcd4" unit="%" />
                      <WaveGraph value={coal?.temp ?? "-"}       label="Temperature"    color="#ff9800" unit="°C" />
                      <WaveGraph value={coal?.Fall_alert ?? alertsNode?.Fall_alert ?? "-"} label="Fall Alert" color="#4caf50" unit="status" />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="card11">
            <h3>Waiting for assignment…</h3>
            <p className="muted1">
              Once the admin selects <strong>@{username}</strong>, your card and details appear here.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
