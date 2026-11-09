"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Calendar, Clock, User, LogOut, CheckCircle2 } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [student, setStudent] = useState({
    name: "Loading Student...",
    rollNo: "BWU/BCA/25/...",
    email: "",
    examName: "Data Structures & Algorithms",
    building: "Block B (Tech Annex)",
    room: "Room B-204",
    seatCode: "B2-37"
  });

  useEffect(() => {
    // Retrieve logged-in user data from localStorage set during login
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setStudent({
          name: parsedUser.name || "Student Scholar",
          rollNo: parsedUser.rollNo || parsedUser.studentCode || "BWU/BCA/25/071",
          email: parsedUser.email || "student@college.edu",
          examName: "Data Structures Theory",
          building: "Block B (Main Campus)",
          room: "Room B-204",
          seatCode: "B2-37"
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="dash-container">
      <Navbar />
      <div className="cs-dot-bg" />

      <div className="dash-wrapper">
        
        {/* WELCOME CARD WITH NAME & ROLL NUMBER */}
        <div className="dash-welcome-card">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Student Portal Session
            </div>
            <h1 className="student-name-title">{student.name}</h1>
            <div>
              <span className="student-roll-sub">Roll No: {student.rollNo}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-xs"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* DASHBOARD CONTENT GRID */}
        <div className="dash-grid">
          
          {/* LEFT PANEL: Exam Allocation Info */}
          <div className="dash-panel">
            <h2 className="dash-panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Assigned Examination</span>
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider mb-1">Paper Subject</span>
                <span className="text-base font-bold text-slate-900"> {student.examName}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider mb-1">Building</span>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>{student.building}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider mb-1">Room</span>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{student.room}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-700 block font-semibold uppercase tracking-wider mb-0.5">Confirmed Seat Code</span>
                  <span className="text-xl font-mono font-extrabold text-blue-900">{student.seatCode}</span>
                </div>
                <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: RedBus Style Seating Arrangement Preview */}
          <div className="dash-panel">
            <h2 className="dash-panel-title" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Hall Seating Map (Live Position)</span>
            </h2>

            {/* TOP BUILDING & ROOM HEADER FOR SEATING MAP */}
            <div className="hall-header-banner">
              <div>
                <div className="text-[11px] opacity-90 font-medium uppercase tracking-wider">Exam Hall Layout</div>
                <div className="text-sm font-extrabold" style={{ marginTop: "2px" }}>
                  {student.building} • {student.room}
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-mono font-bold shrink-0">
                Seat: {student.seatCode}
              </div>
            </div>

            {/* RedBus Style Bus/Classroom Seat Layout */}
            <div className="bus-seat-container">
              <div className="bus-steering-top">Front Invigilator Desk / Blackboard 🚪</div>

              {/* Row 1 */}
              <div className="seat-row">
                <div className="seat-pair">
                  <div className="bus-seat occupied">A1</div>
                  <div className="bus-seat occupied">A2</div>
                </div>
                <div className="bus-aisle"></div>
                <div className="seat-pair">
                  <div className="bus-seat">A3</div>
                  <div className="bus-seat">A4</div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="seat-row">
                <div className="seat-pair">
                  <div className="bus-seat occupied">B1</div>
                  <div className="bus-seat">B2</div>
                </div>
                <div className="bus-aisle"></div>
                <div className="seat-pair">
                  <div className="bus-seat">B3</div>
                  <div className="bus-seat occupied">B4</div>
                </div>
              </div>

              {/* Row 3 (Highlighted Student Seat) */}
              <div className="seat-row">
                <div className="seat-pair">
                  <div className="bus-seat my-seat" title="Your Assigned Seat">37</div>
                  <div className="bus-seat occupied">C2</div>
                </div>
                <div className="bus-aisle"></div>
                <div className="seat-pair">
                  <div className="bus-seat">C3</div>
                  <div className="bus-seat">C4</div>
                </div>
              </div>

              {/* Row 4 */}
              <div className="seat-row">
                <div className="seat-pair">
                  <div className="bus-seat">D1</div>
                  <div className="bus-seat">D2</div>
                </div>
                <div className="bus-aisle"></div>
                <div className="seat-pair">
                  <div className="bus-seat occupied">D3</div>
                  <div className="bus-seat">D4</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-box" style={{ background: "#2563eb" }}></div>
                <span>Your Seat ({student.seatCode})</span>
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

          </div>

        </div>

        <div className="cs-footer" style={{ marginTop: "40px" }}>
          © 2026 SeatWise. KASHASRI by ALPHA.
        </div>

      </div>
    </div>
  );
}