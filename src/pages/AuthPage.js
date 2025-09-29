import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ref, get } from "firebase/database";
import "./AuthPage.css";

// SHA-256 for comparing user passwords stored in RTDB
async function sha256Hex(message) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function AuthPage() {
  const [roleTab, setRoleTab] = useState("user"); // 'user' | 'admin'
  const [adminMode, setAdminMode] = useState("login"); // 'login' | 'register'

  // Admin fields
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // User fields
  const [username, setUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (adminMode === "register") {
        await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        setMessage("Admin account created. You can now sign in.");
        setAdminMode("login");
      } else {
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        setMessage("Admin signed in.");
        navigate("/admin");
      }
    } catch (err) {
      setMessage(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Password hash stored at: COAL/users/{username}/auth/passwordHash
      const snap = await get(ref(db, `COAL/users/${username}/auth/passwordHash`));
      if (!snap.exists()) {
        setMessage("User not found. Check username.");
        return;
      }
      const storedHash = snap.val();
      const hash = await sha256Hex(userPassword);
      if (storedHash === hash) {
        localStorage.setItem("app.username", username);
        setMessage("User login success.");
        navigate("/user");
      } else {
        setMessage("Invalid password for this username.");
      }
    } catch (err) {
      setMessage(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg">
      <div className="auth-card">
         <h1 className="ud-app-title">Safety and Productivity Monitoring System for Coal Mines</h1>
        <h1>Welcome</h1>
        <p className="muted">Select your role and sign in.</p>

        <div className="tabs">
          <button
            className={roleTab === "user" ? "tab active" : "tab"}
            onClick={() => setRoleTab("user")}
          >
            User Login
          </button>
          <button
            className={roleTab === "admin" ? "tab active" : "tab"}
            onClick={() => setRoleTab("admin")}
          >
            Admin Login 
          </button>
        </div>

        {roleTab === "admin" ? (
          <form className="form" onSubmit={handleAdminAuth}>
            

            <label>
              Email
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>

            <button className="primary" disabled={loading}>
              {adminMode === "register" ? "Create Admin Account" : "Sign In as Admin"}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleUserLogin}>
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                placeholder="assigned by admin"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={4}
              />
            </label>
            <button className="primary" disabled={loading}>
              Sign In as User
            </button>
            <p className="muted small">
              Users are created by the Admin. Ask for your username and password.
            </p>
          </form>
        )}

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}
