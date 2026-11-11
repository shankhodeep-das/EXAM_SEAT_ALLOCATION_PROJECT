"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Award,
  Building2,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Settings,
  ShieldAlert,
  Unlock,
  Users,
  UserRound,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import YourExamRooms from "../room/YourExamRooms";

export default function StaffDashboard() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [profileCardOpen, setProfileCardOpen] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const profileControlRef = React.useRef(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const token = localStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const data = await apiRequest("/api/auth/staff/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setDashboard(data);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Unable to load official dashboard.");
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

  useEffect(() => {
    if (!profileCardOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileControlRef.current?.contains(event.target)) {
        setProfileCardOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProfileCardOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileCardOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.replace("/login");
  };

  const profile = dashboard?.user;
  const staffMembers = dashboard?.staffMembers || [];
  const isAdmin = profile?.roleGroup === "ADMIN";
  const rolePower = isAdmin ? 3 : 2;
  const roleLabel = profile?.role || (isAdmin ? "Administrator" : "Staff");
  const RoleBadgeIcon = isAdmin ? ShieldAlert : Award;
  const profileInitial = (profile?.fullName || profile?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, requiredPower: 1, active: true },
    ...(isAdmin || profile?.staffType === "FACULTY"
      ? [{ name: "Exam Room", icon: MapPin, requiredPower: 2 }]
      : []),
    { name: "Hall Allocations", icon: MapPin, requiredPower: 1 },
    { name: "Student Management", icon: Users, requiredPower: 2 },
    { name: "Room Matrix Config", icon: Building2, requiredPower: 3 },
    { name: "System Settings", icon: Settings, requiredPower: 3 },
    { name: "Help & Support", icon: HelpCircle, requiredPower: 1 },
  ];

  return (
    <div className="dash-container" style={{ background: "#F1F5F9" }}>
      <Navbar />
      <div className="cs-dot-bg" />

      <div className="dash-wrapper" style={{ maxWidth: "1400px", padding: "24px 20px" }}>
        {loading ? (
          <div className="dash-panel" style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontWeight: 600, color: "#64748b" }}>Loading official control center...</div>
          </div>
        ) : error || !profile ? (
          <div className="dash-panel" style={{ textAlign: "center", maxWidth: "450px", margin: "40px auto", padding: "32px" }}>
            <h2 className="dash-panel-title" style={{ justifyContent: "center" }}>Access Restricted</h2>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "12px 0 20px" }}>
              {error || "Official account details are unavailable."}
            </p>
            <button
              onClick={handleLogout}
              className="login-submit-btn"
              style={{ maxWidth: "200px", margin: "0 auto" }}
            >
              Sign out & Return
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px", alignItems: "start" }}>
            <aside className="dash-panel" style={{ padding: "20px 16px", background: "#0F172A", color: "#F8FAFC", border: "1px solid #1E293B", borderRadius: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "16px", borderBottom: "1px solid #1E293B", marginBottom: "20px" }}>
                <div style={{ background: "#2563EB", padding: "8px", borderRadius: "10px", color: "#fff" }}>
                  <LayoutDashboard size={18} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#60A5FA", letterSpacing: "0.5px" }}>SeatWise Portal</div>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>Official Control</div>
                </div>
              </div>

              <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {navItems.map((item) => {
                  const isLocked = rolePower < item.requiredPower;
                  const IconComponent = item.icon;
                  const isActive = activeSection === item.name;

                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => {
                        if (!isLocked && ["Dashboard", "Exam Room"].includes(item.name)) {
                          setActiveSection(item.name);
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        background: isActive ? "#2563EB" : isLocked ? "rgba(30, 41, 59, 0.4)" : "transparent",
                        color: isActive ? "#FFFFFF" : isLocked ? "#64748B" : "#94A3B8",
                        fontWeight: isActive ? "700" : "600",
                        fontSize: "13px",
                        cursor: isLocked ? "not-allowed" : "pointer",
                        border: isActive ? "1px solid #3B82F6" : "1px solid transparent",
                        width: "100%",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <IconComponent size={16} />
                        <span>{item.name}</span>
                      </div>
                      {isLocked ? (
                        <Lock size={14} color="#64748B" title={`Requires Level ${item.requiredPower} Access`} />
                      ) : (
                        <Unlock size={14} color="#3B82F6" opacity={isActive ? 1 : 0} />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div style={{ marginTop: "40px", padding: "14px", background: "rgba(30, 41, 59, 0.7)", borderRadius: "14px", border: "1px solid #334155" }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: "700", color: "#94A3B8", marginBottom: "4px" }}>Active Permission</div>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "6px" }}>
                  <RoleBadgeIcon size={14} className="text-blue-400" />
                  <span>{roleLabel}</span>
                </div>
              </div>
            </aside>

            <main style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {activeSection === "Dashboard" ? (
                <header className="dash-welcome-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "#FFFFFF", border: "1px solid #E2E8F0", margin: 0 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "#2563eb" }}>
                        Official Management Console
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: "800",
                          border: "1px solid",
                        }}
                        className={isAdmin ? "bg-purple-100 text-purple-700 border-purple-300" : "bg-amber-100 text-amber-700 border-amber-300"}
                      >
                        <RoleBadgeIcon size={12} />
                        {roleLabel}
                      </span>
                    </div>
                    <h1 className="student-name-title" style={{ fontSize: "1.75rem", fontWeight: "900", color: "#0f172a", margin: 0 }}>
                      {profile.fullName || profile.email}
                    </h1>
                    <div style={{ marginTop: "6px" }}>
                      <span className="student-roll-sub">Employee ID: {profile.employeeId || "Not assigned"}</span>
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
                    }}
                  >
                    <LogOut size={16} style={{ color: "#ef4444" }} />
                    <span>Sign Out</span>
                  </button>
                </header>
              ) : (
                <header
                  className="dash-welcome-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    margin: 0,
                    padding: "14px 20px",
                    position: "relative",
                    zIndex: profileHovered || profileCardOpen ? 30 : 1,
                  }}
                >
                  <h1 style={{ margin: 0, color: "#0f172a", fontSize: "1.2rem", fontWeight: 800 }}>
                    {activeSection}
                  </h1>
                  <div
                    ref={profileControlRef}
                    style={{
                      position: "relative",
                      zIndex: profileHovered || profileCardOpen ? 31 : "auto",
                    }}
                    onMouseEnter={() => setProfileHovered(true)}
                    onMouseLeave={() => setProfileHovered(false)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setProfileHovered(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Open profile menu"
                      aria-haspopup="dialog"
                      aria-expanded={profileCardOpen}
                      onClick={() => setProfileCardOpen((isOpen) => !isOpen)}
                      onFocus={() => setProfileHovered(true)}
                      style={{
                        width: "44px",
                        height: "44px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #bfdbfe",
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#ffffff",
                        fontSize: "17px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {profileInitial || <UserRound size={20} />}
                    </button>

                    {(profileHovered || profileCardOpen) && (
                      <div
                        role={profileCardOpen ? "dialog" : "tooltip"}
                        aria-label={profileCardOpen ? "Official profile details" : "Quick profile details"}
                        style={{
                          position: "absolute",
                          top: "52px",
                          right: 0,
                          zIndex: 20,
                          width: profileCardOpen ? "290px" : "240px",
                          padding: "16px",
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                          background: "#ffffff",
                          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
                          color: "#0f172a",
                        }}
                      >
                        <div style={{ marginBottom: "10px", fontSize: "14px", fontWeight: 800 }}>
                          {profile.fullName || profile.email}
                        </div>
                        <ProfileField label="Role" value={profile.role} />
                        <ProfileField label="Employee ID" value={profile.employeeId} />
                        <ProfileField label="Email" value={profile.email} />
                        {profileCardOpen && (
                          <>
                            <ProfileField label="Department" value={profile.department} />
                            <ProfileField label="Designation" value={profile.designation} />
                            <ProfileField label="Staff Type" value={profile.staffType} />
                            <button
                              type="button"
                              onClick={handleLogout}
                              style={{
                                width: "100%",
                                marginTop: "12px",
                                padding: "10px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                border: "1px solid #fecaca",
                                borderRadius: "10px",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              <LogOut size={16} />
                              Sign Out
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </header>
              )}

              {activeSection === "Exam Room" ? (
                <YourExamRooms
                  rooms={isAdmin ? dashboard?.adminRooms || [] : dashboard?.assignedRooms || []}
                  adminView={isAdmin}
                />
              ) : (
                <>
              <section className="dash-panel" style={{ padding: "20px" }}>
                <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "14px", fontSize: "1rem" }}>
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Official Profile</span>
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <ProfileField label="Name" value={profile.fullName} />
                  <ProfileField label="Employee ID" value={profile.employeeId} />
                  <ProfileField label="Role" value={profile.role} />
                  <ProfileField label="Email" value={profile.email} />
                  <ProfileField label="Department" value={profile.department} />
                  <ProfileField label="Designation" value={profile.designation} />
                  <ProfileField label="Staff Type" value={profile.staffType} />
                </div>
              </section>

              {isAdmin && (
                <section className="dash-panel" style={{ padding: "20px" }}>
                  <h2 className="dash-panel-title" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "14px", fontSize: "1rem" }}>
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Staff Directory</span>
                  </h2>
                  {staffMembers.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                            <th style={{ padding: "10px 12px" }}>Name</th>
                            <th style={{ padding: "10px 12px" }}>Employee ID</th>
                            <th style={{ padding: "10px 12px" }}>Role</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staffMembers.map((staffMember) => (
                            <tr key={staffMember.employeeId} style={{ borderBottom: "1px solid #f1f5f9", color: "#0f172a" }}>
                              <td style={{ padding: "12px" }}>{staffMember.fullName}</td>
                              <td style={{ padding: "12px", fontFamily: "monospace" }}>{staffMember.employeeId}</td>
                              <td style={{ padding: "12px" }}>{staffMember.role}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
                      No active staff records are available.
                    </p>
                  )}
                </section>
              )}
                </>
              )}
            </main>
          </div>
        )}

        <div className="cs-footer" style={{ marginTop: "40px" }}>
          © 2026 SeatWise. KASHASRI by ALPHA. Streamlined examination seating engine.
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="dash-info-card" style={{ padding: "10px 12px" }}>
      <div style={{ color: "#64748b", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", marginBottom: "3px" }}>
        {label}
      </div>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", overflowWrap: "anywhere" }}>
        {value || "Not provided"}
      </div>
    </div>
  );
}
