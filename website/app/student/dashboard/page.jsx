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
  DoorOpen,
  KeyRound,
  X,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function StudentDashboard() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    setUser(null);
    router.replace("/");
  };

  const closePasswordDialog = () => {
    if (passwordSubmitting) return;
    setPasswordDialogOpen(false);
    setPasswordUpdated(false);
    setPasswordError("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("The new password and confirmation do not match.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setPasswordError("Your session has expired. Please sign in again.");
      return;
    }

    setPasswordSubmitting(true);
    try {
      await apiRequest("/api/auth/student/password", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordUpdated(true);
    } catch (requestError) {
      setPasswordError(requestError.message || "Unable to update your password.");
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const student = dashboard?.student;
  const room = dashboard?.room;
  const roomSeats = room?.rows.flat() || [];
  const studentSeat = roomSeats.find((seat) => seat.isCurrentStudent);
  const seatCode = studentSeat
    ? `R${studentSeat.row}C${studentSeat.column}`
    : "Not assigned";
  const allocationLabel = dashboard?.allocationMode === "section"
    ? "Course / section"
    : "Course";

  const getSeatDetails = (seat) => {
    if (seat.isEmpty) {
      return `Available seat\nRow ${seat.row}, Column ${seat.column}`;
    }

    return [
      seat.isCurrentStudent ? "Your seat" : "Occupied seat",
      `Row ${seat.row}, Column ${seat.column}`,
      seat.allocationGroup && `${allocationLabel}: ${seat.allocationGroup}`,
      seat.rollNo && `Roll No: ${seat.rollNo}`,
      seat.isSpecial && "Special seat",
    ]
      .filter(Boolean)
      .join("\n");
  };

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
            {/* WELCOME BANNER */}
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

            {/* DASHBOARD GRID */}
            <div className="dash-grid" style={{ gridTemplateColumns: "340px 1fr", gap: "24px", alignItems: "start" }}>
              
              {/* LEFT PANEL: Compact Docket */}
              <div className="dash-panel" style={{ height: "fit-content", padding: "20px" }}>
                <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "14px", fontSize: "1rem" }}>
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Examination Docket</span>
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  
                  {/* Course */}
                  <div className="dash-info-card" style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "2px" }}>
                      <BookOpen size={12} className="text-blue-600" />
                      <span>Enrolled Course</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", paddingLeft: "18px" }}>
                      {student.courseName}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="dash-info-card" style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "2px" }}>
                      <Mail size={12} className="text-indigo-600" />
                      <span>College Email</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", paddingLeft: "18px", wordBreak: "break-all" }}>
                      {student.email}
                    </div>
                  </div>

                  {/* Building & Room Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div className="dash-info-card" style={{ padding: "10px" }}>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "2px" }}>
                        Building
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                        <Building2 size={13} className="text-blue-600 shrink-0" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.building}</span>
                      </div>
                    </div>
                    <div className="dash-info-card" style={{ padding: "10px" }}>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "2px" }}>
                        Room
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "700", color: "#0f172a" }}>
                        <MapPin size={13} className="text-emerald-600 shrink-0" />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmed Seat Badge */}
                  <div className="dash-seat-highlight" style={{ padding: "14px", borderRadius: "12px" }}>
                    <div>
                      <span style={{ display: "block", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", color: "#bfdbfe", marginBottom: "2px" }}>
                        Allocated Seat Code
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: "900", letterSpacing: "-0.5px" }}>
                        {seatCode}
                      </span>
                      {studentSeat && (
                        <span style={{ display: "block", fontSize: "11px", color: "#dbeafe", marginTop: "1px" }}>
                          Row {studentSeat.row} • Column {studentSeat.column}
                        </span>
                      )}
                    </div>
                    <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "8px", borderRadius: "10px", backdropFilter: "blur(4px)" }}>
                      <CheckCircle2 size={22} color="#ffffff" />
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT PANEL: Authentic Classroom Architecture Map */}
              <div className="dash-panel">
                <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", marginBottom: "16px", fontSize: "1.05rem" }}>
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>Room Seating Map</span>
                  <span style={{ marginLeft: "auto", padding: "5px 9px", borderRadius: "8px", color: "#1d4ed8", background: "#eff6ff", fontSize: "10px", fontWeight: 750 }}>
                    {allocationLabel} arrangement
                  </span>
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

                {/* Classroom Blueprint Container */}
                <div style={{
                  background: "#f8fafc",
                  border: "2px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "20px",
                  position: "relative",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                }}>
                  
                  {/* Classroom Top Header: Entrance Gate & Teacher Desk/Blackboard */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    borderBottom: "2px dashed #cbd5e1",
                    paddingBottom: "12px",
                    gap: "12px"
                  }}>
                    {/* Entrance Gate Indicator */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#e2e8f0",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#475569",
                      border: "1px solid #cbd5e1"
                    }}>
                      <DoorOpen size={14} className="text-blue-600" />
                      <span>ENTRANCE GATE</span>
                    </div>

                    {/* Invigilator Desk & Blackboard */}
                    <div style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      padding: "6px 16px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#1e293b",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      letterSpacing: "0.5px"
                    }}>
                      <span>INVIGILATOR DESK & BLACKBOARD</span>
                      {room.invigilators?.length > 0 ? (
                        <span style={{ fontWeight: "600", letterSpacing: 0 }}>
                          {room.invigilators.map((faculty) => (
                            faculty.employeeId
                              ? `${faculty.fullName} (${faculty.employeeId})`
                              : faculty.fullName
                          )).join(" • ")}
                        </span>
                      ) : (
                        <span style={{ fontWeight: "600", letterSpacing: 0 }}>
                          No invigilators listed for this room
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scrollable Classroom Chair-Table Layout */}
                  <div 
                    style={{
                      maxHeight: "420px",
                      overflowY: "auto", 
                      overflowX: "auto", 
                      padding: "10px 4px",
                      scrollbarWidth: "thin"
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                      {room.rows.map((row, rowIndex) => (
                        <div
                          key={`row-${rowIndex + 1}`}
                          style={{
                            display: "grid",
                            gridTemplateColumns: `repeat(${row.length}, minmax(54px, 1fr))`,
                            gap: "8px",
                            minWidth: "max-content",
                          }}
                        >
                          {row.map((seat) => (
                            <button
                              type="button"
                              key={`${seat.row}-${seat.column}`}
                              className={`bus-seat ${
                                seat.isCurrentStudent
                                  ? "my-seat"
                                  : seat.isEmpty
                                  ? "available"
                                  : "occupied"
                              }`}
                              style={{
                                width: "56px",
                                height: "46px",
                                borderRadius: "6px 6px 10px 10px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                fontWeight: "bold",
                                borderWidth: "1.5px",
                                borderStyle: "solid",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                                position: "relative",
                                padding: 0,
                                cursor: "help",
                                textAlign: "center",
                                ...(seat.isCurrentStudent
                                  ? {
                                      background: "#2563eb",
                                      borderColor: "#1d4ed8",
                                      color: "#ffffff",
                                      boxShadow: "0 0 14px rgba(37, 99, 235, 0.6)",
                                      transform: "scale(1.06)",
                                      zIndex: 2,
                                    }
                                  : seat.isEmpty
                                  ? {
                                      background: "#dcfce7",
                                      borderColor: "#86efac",
                                      color: "#166534",
                                    }
                                  : {
                                      background: "#ffedd5",
                                      borderColor: "#fdba74",
                                      color: "#9a3412",
                                    })
                              }}
                              title={getSeatDetails(seat)}
                              aria-label={getSeatDetails(seat)}
                            >
                              {/* Attached desktop arm-tablet pad visual line for classroom chair-table */}
                              <div style={{
                                position: "absolute",
                                top: "-3px",
                                right: "4px",
                                width: "12px",
                                height: "3px",
                                backgroundColor: seat.isCurrentStudent
                                  ? "#93c5fd"
                                  : seat.isEmpty
                                  ? "#86efac"
                                  : "#fb923c",
                                borderRadius: "2px"
                              }} />
                              <span>{seat.row},{seat.column}</span>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Legend */}
                <div className="seat-legend" style={{ marginTop: "20px" }}>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#2563eb" }}></div>
                    <span>Your Seat</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#ffedd5", border: "1px solid #fdba74" }}></div>
                    <span>Occupied</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-box" style={{ background: "#dcfce7", border: "1px solid #86efac" }}></div>
                    <span>Empty</span>
                  </div>
                </div>

                <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: "#64748b", background: "#f8fafc", padding: "10px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  📊 <strong style={{ color: "#0f172a" }}>{roomSeats.length}</strong> total seats configured • <strong style={{ color: "#0f172a" }}>{room.allocatedStudents}</strong> students allocated in this hall
                </div>

              </div>

            </div>

            <section className="dash-panel" style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", display: "grid", placeItems: "center", color: "#1d4ed8", background: "#eff6ff", border: "1px solid #dbeafe" }}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Account security</h2>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>Keep your student account protected with a strong password.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPasswordUpdated(false);
                  setPasswordError("");
                  setPasswordDialogOpen(true);
                }}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", padding: "12px 18px", border: "1px solid #1d4ed8", borderRadius: "12px", color: "#fff", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", fontWeight: 750, fontSize: "13px", cursor: "pointer", boxShadow: "0 6px 16px rgba(37, 99, 235, 0.22)", transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = "translateY(-1px)";
                  event.currentTarget.style.boxShadow = "0 9px 20px rgba(37, 99, 235, 0.3)";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = "translateY(0)";
                  event.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.22)";
                }}
              >
                <KeyRound size={16} />
                Update Password
              </button>
            </section>
          </>
        )}

        {passwordDialogOpen && (
          <div
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closePasswordDialog();
            }}
            style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: "20px", background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(5px)" }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="password-dialog-title"
              className="dash-panel"
              style={{ width: "min(100%, 440px)", padding: "28px", position: "relative", boxShadow: "0 24px 70px rgba(15, 23, 42, 0.24)" }}
            >
              <button
                type="button"
                onClick={closePasswordDialog}
                disabled={passwordSubmitting}
                aria-label="Close password update dialog"
                style={{ position: "absolute", top: "16px", right: "16px", width: "34px", height: "34px", display: "grid", placeItems: "center", border: "1px solid #e2e8f0", borderRadius: "10px", color: "#64748b", background: "#fff", cursor: passwordSubmitting ? "not-allowed" : "pointer" }}
              >
                <X size={17} />
              </button>

              {passwordUpdated ? (
                <div style={{ textAlign: "center", padding: "14px 4px 4px" }} role="status" aria-live="polite">
                  <div style={{ width: "58px", height: "58px", margin: "0 auto 16px", borderRadius: "50%", display: "grid", placeItems: "center", color: "#15803d", background: "#dcfce7" }}>
                    <ShieldCheck size={30} />
                  </div>
                  <h2 id="password-dialog-title" style={{ fontSize: "21px", fontWeight: 850, color: "#0f172a", marginBottom: "8px" }}>Password updated</h2>
                  <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "22px" }}>Your new password has been saved securely.</p>
                  <button type="button" onClick={closePasswordDialog} className="login-submit-btn" style={{ marginTop: 0 }}>Done</button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "22px", paddingRight: "28px" }}>
                    <div style={{ width: "42px", height: "42px", marginBottom: "14px", borderRadius: "13px", display: "grid", placeItems: "center", color: "#1d4ed8", background: "#eff6ff" }}>
                      <KeyRound size={20} />
                    </div>
                    <h2 id="password-dialog-title" style={{ fontSize: "21px", fontWeight: 850, color: "#0f172a", marginBottom: "7px" }}>Update your password</h2>
                    <p style={{ color: "#64748b", fontSize: "13px" }}>Enter your current password, then choose a new one.</p>
                  </div>

                  <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {[
                      ["currentPassword", "Current password", "Enter your current password"],
                      ["newPassword", "New password", "At least 8 characters"],
                      ["confirmPassword", "Confirm new password", "Re-enter your new password"],
                    ].map(([field, label, placeholder]) => (
                      <label key={field} style={{ display: "flex", flexDirection: "column", gap: "6px", color: "#334155", fontSize: "12px", fontWeight: 700 }}>
                        {label}
                        <input
                          type="password"
                          required
                          minLength={field === "currentPassword" ? undefined : 8}
                          maxLength={72}
                          autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                          value={passwordForm[field]}
                          onChange={(event) => setPasswordForm((form) => ({ ...form, [field]: event.target.value }))}
                          placeholder={placeholder}
                          style={{ width: "100%", padding: "12px 13px", borderRadius: "11px", border: "1px solid #cbd5e1", outline: "none", background: "#fff", color: "#0f172a", fontSize: "14px" }}
                        />
                      </label>
                    ))}

                    {passwordError && (
                      <div role="alert" style={{ padding: "10px 12px", borderRadius: "10px", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", fontSize: "13px" }}>
                        {passwordError}
                      </div>
                    )}

                    <button type="submit" disabled={passwordSubmitting} className="login-submit-btn" style={{ marginTop: "4px", opacity: passwordSubmitting ? 0.7 : 1, cursor: passwordSubmitting ? "wait" : "pointer" }}>
                      {passwordSubmitting ? "Updating password..." : "Save New Password"}
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        )}

        <div className="cs-footer" style={{ marginTop: "40px" }}>
          © 2026 SeatWise. KASHASRI by ALPHA. Streamlined examination seating engine.
        </div>
      </div>
    </div>
  );
}