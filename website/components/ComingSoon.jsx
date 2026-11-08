"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import "@/app/globals.css";

export default function ComingSoon({
  title = "This module is under development",
  subtitle = "We are fine-tuning our automated room matrix, seat assignments, and student access features. Check back soon for updates.",
  noticeText = "Hall allocations and features are currently being synced. Check back shortly for full access.",
  fileUrl = null,
  fileLabel = "Download Attached File"
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState("matrix");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="cs-container">
      <Navbar />
      <div style={{ padding: "12px 5% 0" }}>
        <button
          onClick={() => router.back()}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 15px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            color: "#334155",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#eff6ff";
            e.currentTarget.style.borderColor = "#bfdbfe";
            e.currentTarget.style.color = "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.color = "#334155";
          }}
        >
          ← Back
        </button>
      </div>


      <div className="cs-dot-bg" />

      <div className="cs-wrapper">
        
        {/* Status Pill */}
        <div className="cs-pill-wrap">
          <div className="cs-pill">
            <span className="cs-badge-dot"></span>
            Under Active Development • New Versions are on the way
          </div>
        </div>

        {/* Content & Floating Cards */}
        <div className="cs-grid">
          
          {/* LEFT Sticky Note Card */}
          <div className="cs-card cs-sticky-note">
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>Semester Notice</div>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{noticeText}</p>
            <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(0,0,0,0.1)", fontSize: "11px", color: "#64748b" }}>
              Status: In Progress
            </div>
          </div>

          {/* CENTER Hero Block */}
          <div className="cs-center">
            <h1 className="cs-title">
              {title} <br />
              <span className="cs-title-blue">Coming Soon</span>
            </h1>

            <p className="cs-subtitle">{subtitle}</p>

            {/* Subscribe Form */}
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="cs-form">
                <input
                  type="email"
                  required
                  placeholder="Enter email for notification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cs-input"
                />
                <button type="submit" className="btn btn-outline" style={{ background: '#2563eb', color: '#fff', border: 'none' }}>
                  Get Notified
                </button>
              </form>
            ) : (
              <div style={{ marginTop: "24px", color: "#166534", backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "10px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
                ✓ You'll be notified when this feature goes live!
              </div>
            )}

            {/* Attached File Action (Rendered when fileUrl is passed) */}
            {fileUrl && (
              <div style={{ marginTop: "16px" }}>
                <a href={fileUrl} download className="cs-file-btn">
                  📁 {fileLabel}
                </a>
              </div>
            )}
          </div>

          {/* RIGHT Layout Card */}
          <div className="cs-card">
            <div style={{ fontWeight: 600, marginBottom: "8px", color: "#334155" }}>System Status</div>
            <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", marginBottom: "8px" }}>
              <span style={{ color: "#64748b" }}>Module: </span>
              <strong>Active Dev</strong>
            </div>
            <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "8px" }}>
              <span style={{ color: "#64748b" }}>Target: </span>
              <strong style={{ color: "#2563eb" }}>Upcoming Release</strong>
            </div>
          </div>

        </div>

        {/* Feature Preview Tabs */}
        <div className="cs-tab-box">
          <div className="cs-tabs">
            <button
              onClick={() => setActiveTab("matrix")}
              className={`cs-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
            >
              Automated Seating
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`cs-tab-btn ${activeTab === "tickets" ? "active" : ""}`}
            >
              Student Hall Tickets
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`cs-tab-btn ${activeTab === "admin" ? "active" : ""}`}
            >
              Exam Admin Panel
            </button>
          </div>

          <div style={{ textAlign: "center", padding: "8px 0" }}>
            {activeTab === "matrix" && (
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>Conflict-Free Room Allocation</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Spaces out students by course and section to prevent adjacent room overlaps.
                </p>
              </div>
            )}
            {activeTab === "tickets" && (
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>Digital Hall Passes</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Students can look up seat numbers and exam schedules on mobile devices.
                </p>
              </div>
            )}
            {activeTab === "admin" && (
              <div>
                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a" }}>Dataset Processing</h4>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Upload class lists to generate print-ready seating matrices.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="cs-footer">
          © 2026 SeatWise. Streamlined examination management.
        </div>

      </div>
    </div>
  );
}