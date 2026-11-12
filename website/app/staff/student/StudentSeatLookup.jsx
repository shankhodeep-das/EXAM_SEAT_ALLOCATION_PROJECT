"use client";

import { useState } from "react";
import {
  AlertCircle,
  Armchair,
  BookOpen,
  Building2,
  DoorOpen,
  GraduationCap,
  Mail,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

const cardStyle = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow: "0 4px 12px rgba(15, 23, 42, 0.035)",
};

export default function StudentSeatLookup() {
  const [rollNo, setRollNo] = useState("");
  const [result, setResult] = useState(null);
  const [searchedRollNo, setSearchedRollNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    const searchRollNo = rollNo.trim();
    if (!searchRollNo) {
      setError("Enter a student roll number to search.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setSearchedRollNo(searchRollNo);

    try {
      const data = await apiRequest(
        `/api/staff/students/${encodeURIComponent(searchRollNo)}/seat`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to find that student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ ...cardStyle, padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "46px", height: "46px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "14px", color: "#1d4ed8", background: "#eff6ff" }}>
            <Search size={22} />
          </div>
          <div>
            <h2 style={{ margin: "2px 0 6px", color: "#0f172a", fontSize: "19px", fontWeight: 850 }}>Student seat lookup</h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
              Search by roll number to view the student&apos;s profile, assigned room, seat position, and room arrangement.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSearch}
          style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: "10px" }}
        >
          <label htmlFor="student-roll-search" style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: "7px", color: "#334155", fontSize: "12px", fontWeight: 750 }}>
            Student roll number
            <input
              id="student-roll-search"
              type="search"
              required
              maxLength={64}
              value={rollNo}
              onChange={(event) => setRollNo(event.target.value)}
              placeholder="Enter the exact roll number"
              autoComplete="off"
              style={{ width: "100%", padding: "12px 14px", border: "1px solid #cbd5e1", borderRadius: "11px", color: "#0f172a", background: "#fff", fontSize: "14px", outline: "none" }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="login-submit-btn"
            style={{ width: "auto", minWidth: "138px", margin: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: loading ? 0.7 : 1 }}
          >
            <Search size={16} />
            {loading ? "Searching..." : "Search student"}
          </button>
        </form>

        {error && (
          <div role="alert" style={{ display: "flex", alignItems: "center", gap: "9px", marginTop: "14px", padding: "11px 13px", border: "1px solid #fecaca", borderRadius: "10px", color: "#b91c1c", background: "#fef2f2", fontSize: "13px" }}>
            <AlertCircle size={17} />
            {error}
          </div>
        )}
      </div>

      {loading && (
        <div style={{ ...cardStyle, padding: "34px", color: "#64748b", textAlign: "center", fontSize: "14px" }}>
          Loading student and allocation details...
        </div>
      )}

      {result && (
        <>
          <section style={cardStyle} aria-labelledby="student-result-title">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Student record</div>
                <h2 id="student-result-title" style={{ margin: "5px 0 0", color: "#0f172a", fontSize: "21px", fontWeight: 850 }}>{result.student.fullName}</h2>
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid #dbeafe", color: "#1d4ed8", background: "#eff6ff", fontFamily: "monospace", fontSize: "13px", fontWeight: 800 }}>
                {result.student.rollNo}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px" }}>
              <DetailCard icon={Mail} label="Email" value={result.student.email || "Not linked"} />
              <DetailCard icon={GraduationCap} label="Course" value={result.student.courseName} />
              <DetailCard icon={BookOpen} label="Course code / level" value={[result.student.courseCode, result.student.courseLevel].filter(Boolean).join(" / ") || "Not specified"} />
              <DetailCard icon={Users} label="Section / semester" value={`${result.student.section} / ${result.student.semester}`} />
              <DetailCard icon={ShieldCheck} label="Special requirements" value={result.student.specialReq ? "Yes" : "No"} />
              <DetailCard icon={Armchair} label="Special seat request" value={result.student.specialSeatReq ? "Yes" : "No"} />
            </div>
          </section>

          {result.room ? (
            <section style={cardStyle} aria-labelledby="student-room-title">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", display: "grid", placeItems: "center", borderRadius: "13px", color: "#1d4ed8", background: "#eff6ff" }}>
                    <Building2 size={21} />
                  </div>
                  <div>
                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>Assigned examination room</div>
                    <h2 id="student-room-title" style={{ margin: "4px 0 0", color: "#0f172a", fontSize: "18px", fontWeight: 850 }}>{result.room.building} · {result.room.roomNumber}</h2>
                  </div>
                </div>
                <div style={{ padding: "11px 15px", borderRadius: "12px", color: "#fff", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 7px 18px rgba(37, 99, 235, 0.2)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 750, letterSpacing: "0.08em", opacity: 0.85, textTransform: "uppercase" }}>Seat position</div>
                  <div style={{ marginTop: "2px", fontFamily: "monospace", fontSize: "17px", fontWeight: 850 }}>{result.room.seatCode}</div>
                  <div style={{ marginTop: "2px", fontSize: "11px", opacity: 0.9 }}>Row {result.room.seat.row} · Column {result.room.seat.column}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "18px" }}>
                <MetricCard label="Room layout" value={`${result.room.totalRows} × ${result.room.totalColumns}`} />
                <MetricCard label="Total capacity" value={`${result.room.totalSeats} seats`} />
                <MetricCard label="Allocated students" value={result.room.allocatedStudents} />
                <MetricCard label="Special seats" value={result.room.specialSeatCount} />
              </div>

              <div style={{ marginBottom: "18px", padding: "14px", border: "1px solid #e2e8f0", borderRadius: "12px", background: "#f8fafc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", color: "#334155", fontSize: "12px", fontWeight: 800 }}>
                  <DoorOpen size={16} />
                  Room invigilators
                </div>
                {result.room.invigilators.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {result.room.invigilators.map((faculty, index) => (
                      <span key={`${faculty.employeeId || faculty.fullName}-${index}`} style={{ padding: "7px 10px", border: "1px solid #dbeafe", borderRadius: "9px", color: "#1e40af", background: "#eff6ff", fontSize: "12px", fontWeight: 700 }}>
                        {faculty.fullName}{faculty.employeeId ? ` · ${faculty.employeeId}` : ""}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px" }}>No invigilators are listed in the current allocation report.</p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a", fontSize: "14px", fontWeight: 850 }}>Seating arrangement</h3>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "11px" }}>The searched student&apos;s seat is highlighted. Other students&apos; personal details are not shown.</p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "#475569" }}>
                  <Legend color="#2563eb" label="Student seat" />
                  <Legend color="#dbeafe" label="Occupied" />
                  <Legend color="#ffffff" label="Empty" />
                  <Legend color="#fef3c7" label="Special" />
                </div>
              </div>

              <div style={{ overflowX: "auto", padding: "16px", border: "1px solid #e2e8f0", borderRadius: "14px", background: "#f8fafc" }}>
                <div role="grid" aria-label="Room seating grid" style={{ minWidth: "max-content", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", minWidth: "180px", marginBottom: "6px", padding: "8px 16px", borderRadius: "9px", color: "#475569", background: "#e2e8f0", fontSize: "10px", fontWeight: 850, letterSpacing: "0.07em" }}>
                    <DoorOpen size={14} />
                    INVIGILATOR DESK / FRONT
                  </div>
                  {result.room.rows.map((row, rowIndex) => (
                    <div
                      key={`room-row-${rowIndex}`}
                      role="row"
                      style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 52px)`, gap: "7px" }}
                    >
                      {row.map((seat) => {
                        const background = seat.isCurrentStudent
                          ? "#2563eb"
                          : seat.isSpecial
                            ? "#fef3c7"
                            : seat.isEmpty
                              ? "#ffffff"
                              : "#dbeafe";
                        const color = seat.isCurrentStudent
                          ? "#ffffff"
                          : seat.isSpecial
                            ? "#92400e"
                            : "#334155";

                        return (
                          <div
                            key={`${seat.row}-${seat.column}`}
                            role="gridcell"
                            aria-label={`Row ${seat.row}, column ${seat.column}${seat.isCurrentStudent ? ", searched student" : seat.isEmpty ? ", empty" : ", occupied"}${seat.isSpecial ? ", special seat" : ""}`}
                            title={`Row ${seat.row}, Column ${seat.column}${seat.isCurrentStudent ? " · Student seat" : seat.isEmpty ? " · Empty" : " · Occupied"}${seat.isSpecial ? " · Special" : ""}`}
                            style={{ width: "52px", height: "44px", display: "grid", placeItems: "center", border: `${seat.isCurrentStudent ? 2 : 1}px solid ${seat.isCurrentStudent ? "#1d4ed8" : seat.isSpecial ? "#f59e0b" : "#cbd5e1"}`, borderRadius: "9px", color, background, fontFamily: "monospace", fontSize: "10px", fontWeight: 800, boxShadow: seat.isCurrentStudent ? "0 0 0 3px rgba(37, 99, 235, 0.16)" : "0 1px 2px rgba(15, 23, 42, 0.04)" }}
                          >
                            {seat.isCurrentStudent ? "YOU" : `${seat.row},${seat.column}`}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: "11px", padding: "15px 17px", border: "1px solid #fde68a", borderRadius: "13px", color: "#92400e", background: "#fffbeb", fontSize: "13px" }}>
              <AlertCircle size={18} />
              {result.message || "A seat has not been assigned in the current allocation report."}
            </div>
          )}
        </>
      )}

      {!loading && !result && !error && !searchedRollNo && (
        <div style={{ padding: "38px 24px", border: "1px dashed #cbd5e1", borderRadius: "16px", background: "rgba(255,255,255,0.75)", color: "#64748b", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", margin: "0 auto 12px", display: "grid", placeItems: "center", borderRadius: "15px", color: "#2563eb", background: "#eff6ff" }}>
            <Search size={21} />
          </div>
          <div style={{ color: "#334155", fontWeight: 800, fontSize: "14px" }}>Search for a student</div>
          <p style={{ margin: "5px 0 0", fontSize: "12px" }}>Enter a roll number to view the student&apos;s exam seat and room details.</p>
        </div>
      )}
    </section>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div style={{ minWidth: 0, padding: "12px", border: "1px solid #e2e8f0", borderRadius: "11px", background: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px", color: "#64748b", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>
        <Icon size={13} />
        {label}
      </div>
      <div style={{ overflowWrap: "anywhere", color: "#0f172a", fontSize: "12px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={{ padding: "12px", border: "1px solid #e2e8f0", borderRadius: "11px", background: "#f8fafc" }}>
      <div style={{ marginBottom: "4px", color: "#64748b", fontSize: "10px", fontWeight: 800, textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: "#0f172a", fontSize: "15px", fontWeight: 850 }}>{value}</div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "12px", height: "12px", border: "1px solid #94a3b8", borderRadius: "3px", background: color }} />
      {label}
    </span>
  );
}
