"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  // Toggle state: 'student' or 'faculty'
    const router = useRouter();
    const [role, setRole] = useState("student");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
  // Form Field States
    const [studentCode, setStudentCode] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

  
    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            let result;
            console.log(role, studentCode, email, password);
            if (role === "student") {
            result = await apiRequest("/api/students/login", {
                method: "POST",
                body: JSON.stringify({
                rollNo: studentCode,
                email,
                password,
                }),
            });
            } else {
            result = await apiRequest("/api/staff/login", {
                method: "POST",
                body: JSON.stringify({
                email,
                password,
                }),
            });
            }

            // Temporary development approach for authentication
            sessionStorage.setItem("authToken", result.token);
            sessionStorage.setItem("user", JSON.stringify(result.user));

            // Clear password from the form
            setPassword("");

            // Redirect according to account type
            if (result.user.roleGroup === "STUDENT") {
            router.push("/student/dashboard");
            }else if (result.user.roleGroup === "STAFF") {
            router.push("/staff/dashboard");
            }

        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };


  return (
    <div className="cs-container">
      <Navbar />

      {/* Matching Background Pattern */}
      <div className="cs-dot-bg" />

      <div className="cs-wrapper" style={{ minHeight: "calc(100vh - 120px)" }}>
        
        {/* Status Badge */}
        <div className="cs-pill-wrap">
          <div className="cs-pill">
            <span className="cs-badge-dot"></span>
            SeatWise Portal Authentication
          </div>
        </div>

        {/* Main Header */}
        <div className="cs-center" style={{ marginBottom: "24px" }}>
          <h1 className="cs-title">
            Log in to <span className="cs-title-blue">SeatWise</span>
          </h1>
          <p className="cs-subtitle" style={{ marginTop: "8px" }}>
            Select your account type to access your exam allocation portal
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          
          {/* Options Switcher: Students vs Faculty */}
          <div className="login-toggle-group">
            <button
              type="button"
              className={`login-toggle-btn ${role === "student" ? "active" : ""}`}
              onClick={() => setRole("student")}
            >
              Students
            </button>
            <button
              type="button"
              className={`login-toggle-btn ${role === "faculty/officials" ? "active" : ""}`}
              onClick={() => setRole("faculty/officials")}
            >
              Faculty / Officials
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            
            {/* Student Specific Field */}
            {role === "student" && (
              <div className="form-group">
                <label htmlFor="studentCode">Student Code / Roll Number</label>
                <input
                  type="text"
                  id="studentCode"
                  required
                  placeholder="e.g. BWU/BCA/25/071"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                />
              </div>
            )}

            {/* Common Field: Email */}
            <div className="form-group">
              <label htmlFor="email">
                {role === "student" ? "College Email" : "Faculty/Officials Email"}
              </label>
              <input
                type="email"
                id="email"
                required
                placeholder={role === "student" ? "XYZ@college.edu" : "ABC@college.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Common Field: Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
            >
                {loading
                    ? "Logging in..."
                    : `Log In as ${role === "student" ? "Student" : "Faculty / Officials"}`}
            </button>
            {error && (
                <p style={{ color: "red", marginTop: "12px" }}>
                    {error}
                </p>
            )}
          </form>

        </div>

        <div className="cs-footer">
          © 2026 SeatWise. KASHASRI by Alpha.
        </div>

      </div>
    </div>
  );
}