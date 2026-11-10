"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  CheckCircle2,
  LogOut,
  MapPin,
  BookOpen,
  Mail,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data = await apiRequest("/api/auth/student/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setDashboard(data);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load your dashboard.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const student = dashboard?.student;
  const room = dashboard?.room;
  const roomSeats = room?.rows.flat() || [];
  const studentSeat = roomSeats.find((seat) => seat.isCurrentStudent);
  const seatCode = studentSeat
    ? `R${studentSeat.row}C${studentSeat.column}`
    : "Not assigned";

  return (
    <div className="dash-container">
      <Navbar />
      <div className="cs-dot-bg" />

      <div className="dash-wrapper" style={{ maxWidth: "1200px" }}>
        {loading ? (
          <div className="dash-panel" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontWeight: 600, color: "#64748b" }}>Loading your examination seating portal...</div>
          </div>
        ) : error ? (
          <div className="dash-panel" style={{ textAlign: "center", maxWidth: "450px", margin: "40px auto", padding: "32px" }}>
            <h2 className="dash-panel-title" style={{ justifyContent: "center" }}>Unable to load dashboard</h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "12px 0 20px" }}>{error}</p>
            <button
              onClick={handleLogout}
              className="login-submit-btn"
              style={{ maxWidth: "200px", margin: "0 auto" }}
            >
              Sign out & Return
            </button>
          </div>
        ) : (
          <>
            {/* WELCOME BANNER WITH BEAUTIFUL SIGN OUT BUTTON */}
            <div className="dash-welcome-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#2563eb", marginBottom: "4px" }}>
                  Student Portal Session
                </div>
                <h1 className="student-name-title" style={{ fontSize: "1.85rem", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                  {student.fullName}
                </h1>
                <div style={{ marginTop: "6px" }}>
                  <span className="student-roll-sub">
                    Roll No: {student.rollNo}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#fef2f2";
                  e.currentTarget.style.borderColor = "#fecaca";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.color = "#334155";
                }}
              >
                <LogOut size={16} style={{ color: "#ef4444" }} />
                <span>Sign Out</span>
              </button>
            </div>

            {/* DASHBOARD CONTENT GRID (Left Column sized naturally, Right Column handles seating map) */}
            <div className="dash-grid" style={{ gridTemplateColumns: "360px 1fr", gap: "28px", alignItems: "start" }}>
              
              {/* LEFT PANEL: Student & Seating Details (Compact & Clean) */}
              <div className="dash-panel" style={{ height: "fit-content" }}>
                <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "16px", fontSize: "1.05rem" }}>
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span>Examination Docket</span>
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  
                  {/* Course */}
                  <div className="dash-info-card" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                      <BookOpen size={13} className="text-blue-600" />
                      <span>Enrolled Course</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", paddingLeft: "19px" }}>
                      {student.courseName}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="dash-info-card" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                      <Mail size={13} className="text-indigo-600" />
                      <span>College Email</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", paddingLeft: "19px", wordBreak: "break-all" }}>
                      {student.email}
                    </div>
                  </div>

                  {/* Building & Room Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div className="dash-info-card" style={{ padding: "12px" }}>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "4px" }}>
                        Building
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                        <Building2 size={14} className="text-blue-600 shrink-0" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.building}</span>
                      </div>
                    </div>
                    <div className="dash-info-card" style={{ padding: "12px" }}>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "4px" }}>
                        Room
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                        <MapPin size={14} className="text-emerald-600 shrink-0" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Seat Badge */}
                  <div className="dash-seat-highlight" style={{ padding: "16px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#bfdbfe", marginBottom: "2px" }}>
                        Allocated Seat Code
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "1.5rem", fontWeight: "900", letterSpacing: "-0.5px" }}>
                        {seatCode}
                      </span>
                      {studentSeat && (
                        <span style={{ display: "block", fontSize: "11px", color: "#dbeafe", marginTop: "2px" }}>
                          Row {studentSeat.row} • Column {studentSeat.column}
                        </span>
                      )}
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "10px", borderRadius: "12px", backdropFilter: "blur(4px)" }}>
                      <CheckCircle2 size={24} color="#ffffff" />
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT PANEL: RedBus Style Hall Seating Map */}
              <div className="dash-panel">
                <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "16px", fontSize: "1.05rem" }}>
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Room Seating Map</span>
                </h2>

                <div className="hall-header-banner">
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase", opacity: 0.9 }}>
                      Exam Hall Layout Matrix
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "800", marginTop: "2px" }}>
                      {room.building} • {room.roomNumber}
                    </div>
                  </div>
                  <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "6px 12px", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", fontWeight: "bold" }}>
                    Seat: {seatCode}
                  </div>
                </div>

                {/* RedBus Seating Grid Container */}
                <div className="bus-seat-container" style={{ maxWidth: "100%", overflowX: "auto" }}>
                  <div className="bus-steering-top">
                    🚪 Front Invigilator Desk / Blackboard
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                    {room.rows.map((row, rowIndex) => (
                      <div
                        key={`row-${rowIndex + 1}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${row.length}, minmax(38px, 1fr))`,
                          gap: "6px",
                          minWidth: "max-content",
                        }}
                      >
                        {row.map((seat) => (
                          <div
                            key={`${seat.row}-${seat.column}`}
                            className={`bus-seat ${
                              seat.isCurrentStudent
                                ? "my-seat"
                                : seat.isEmpty
                                ? ""
                                : "occupied"
                            }`}
                            style={
                              seat.isCurrentStudent
                                ? {
                                    background: "#2563eb",
                                    borderColor: "#1d4ed8",
                                    color: "#ffffff",
                                    boxShadow: "0 0 12px rgba(37, 99, 235, 0.5)",
                                    transform: "scale(1.08)",
                                    zIndex: 2,
                                  }
                                : undefined
                            }
                            title={
                              seat.isCurrentStudent
                                ? "Your assigned seat"
                                : `${seat.isEmpty ? "Empty" : "Occupied"} — Row ${seat.row}, Column ${seat.column}`
                            }
                          >
                            {seat.row},{seat.column}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="seat-legend" style={{ marginTop: "20px" }}>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#2563eb" }}></div>
                    <span>Your Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#e2e8f0" }}></div>
                    <span>Occupied</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#ffffff", border: "1px solid #cbd5e1" }}></div>
                    <span>Available</span>
                  </div>
                </div>

                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  📊 <strong style={{ color: "#0f172a" }}>{roomSeats.length}</strong> total seats configured • <strong style={{ color: "#0f172a" }}>{room.allocatedStudents}</strong> students allocated in this hall
                </div>

              </div>

            </div>
          </>
        )}

        <div className="cs-footer" style={{ marginTop: "40px" }}>
          © 2026 SeatWise. KASHASRI by ALPHA. Streamlined examination seating engine.
        </div>
      </div>
    </div>
  );
}