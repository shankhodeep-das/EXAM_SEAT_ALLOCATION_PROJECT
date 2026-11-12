"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Grid2X2,
  Play,
  UserPlus,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function RoomMatrixConfig({
  canRunAllocations = false,
  onDashboardRefresh,
}) {
  const [maxCoursesPerRoom, setMaxCoursesPerRoom] = useState("2");
  const [maxSectionsPerRoom, setMaxSectionsPerRoom] = useState("");
  const [running, setRunning] = useState(null);
  const [courseError, setCourseError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [courseSuccess, setCourseSuccess] = useState(null);
  const [sectionSuccess, setSectionSuccess] = useState(null);
  const [displayMode, setDisplayMode] = useState(null);
  const [displayLoading, setDisplayLoading] = useState(true);
  const [displaySaving, setDisplaySaving] = useState(false);
  const [displayError, setDisplayError] = useState("");
  const [displayMessage, setDisplayMessage] = useState("");
  const [fillError, setFillError] = useState("");
  const [fillSuccess, setFillSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDisplayMode() {
      const token = localStorage.getItem("token");
      if (!token) {
        if (active) {
          setDisplayError("Your session has expired. Please sign in again.");
          setDisplayLoading(false);
        }
        return;
      }

      try {
        const result = await apiRequest("/api/admin/room-matrix/display-mode", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) setDisplayMode(result.mode);
      } catch (requestError) {
        if (active) {
          setDisplayError(requestError.message || "Unable to load the student display mode.");
        }
      } finally {
        if (active) setDisplayLoading(false);
      }
    }

    loadDisplayMode();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event, allocationType) => {
    event.preventDefault();

    const isSectionAllocation = allocationType === "section";
    const limit = Number(isSectionAllocation ? maxSectionsPerRoom : maxCoursesPerRoom);
    const setError = isSectionAllocation ? setSectionError : setCourseError;
    const setSuccess = isSectionAllocation ? setSectionSuccess : setCourseSuccess;
    const reportFile = isSectionAllocation
      ? "seat-allocation-CT.txt"
      : "seat-allocation.txt";

    setError("");
    setSuccess(null);

    if (!Number.isInteger(limit) || limit < 1 || limit > 5) {
      setError("Enter a whole number from 1 to 5.");
      return;
    }

    const shouldRun = window.confirm(
      `This will replace only ${reportFile}. The other allocation report will not change. Continue?`
    );
    if (!shouldRun) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setRunning(allocationType);
    try {
      const result = await apiRequest(
        isSectionAllocation
          ? "/api/admin/room-matrix/run-sections"
          : "/api/admin/room-matrix/run",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(isSectionAllocation
            ? { maxSectionsPerRoom: limit }
            : { maxCoursesPerRoom: limit }),
        }
      );
      setSuccess(result);
    } catch (requestError) {
      setError(requestError.message || "Unable to run seat allocation.");
    } finally {
      setRunning(null);
    }
  };

  const handleDisplayModeChange = async (mode) => {
    if (displaySaving || mode === displayMode) return;

    const modeLabel = mode === "section" ? "section" : "course";
    if (!window.confirm(`Show students the ${modeLabel}-based arrangement on their next dashboard load?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setDisplayError("Your session has expired. Please sign in again.");
      return;
    }

    setDisplayError("");
    setDisplayMessage("");
    setDisplaySaving(true);
    try {
      const result = await apiRequest("/api/admin/room-matrix/display-mode", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      setDisplayMode(result.mode);
      setDisplayMessage(result.message);
      onDashboardRefresh?.();
    } catch (requestError) {
      setDisplayError(requestError.message || "Unable to change the student display mode.");
    } finally {
      setDisplaySaving(false);
    }
  };

  const handleFillEmptySeats = async () => {
    if (!displayMode || running !== null) return;

    const modeLabel = displayMode === "section" ? "section" : "course";
    if (!window.confirm(
      `Fill compatible empty seats in the current ${modeLabel} report? This changes only that report and cannot be undone.`
    )) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFillError("Your session has expired. Please sign in again.");
      return;
    }

    setFillError("");
    setFillSuccess(null);
    setRunning("fill");
    try {
      const result = await apiRequest("/api/admin/room-matrix/fill-empty-seats", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFillSuccess(result);
      if (result.filledCount > 0) onDashboardRefresh?.();
    } catch (requestError) {
      setFillError(requestError.message || "Unable to fill empty seats.");
    } finally {
      setRunning(null);
    }
  };

  return (
    <section className="dash-panel" style={{ maxWidth: "900px", width: "100%", padding: "26px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "22px" }}>
        <div style={{ width: "48px", height: "48px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "15px", color: "#1d4ed8", background: "#eff6ff" }}>
          <Grid2X2 size={23} />
        </div>
        <div>
          <div style={{ color: "#2563eb", fontSize: "10px", fontWeight: 850, letterSpacing: "0.1em", textTransform: "uppercase" }}>Allocation controls</div>
          <h2 style={{ margin: "5px 0 7px", color: "#0f172a", fontSize: "21px", fontWeight: 850 }}>Room Matrix Config</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.6 }}>
            Choose the arrangement students see. Admins can also generate course- or section-based reports independently.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "22px", padding: "13px 15px", border: "1px solid #bfdbfe", borderRadius: "12px", color: "#1e40af", background: "#eff6ff", fontSize: "12px", lineHeight: 1.55 }}>
        <CircleHelp size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
        <span>
          Section mode places sections from one exact course in each room, then interleaves those sections (for example, BTECH (CSE) Sections C and D). Different full course names are never combined. Set a limit from 1 to 5 sections per room.
        </span>
      </div>

      <div style={{ marginBottom: "22px", padding: "18px", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
        <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "15px", fontWeight: 800 }}>Student seat arrangement</h3>
        <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: "12px", lineHeight: 1.5 }}>
          Choose which saved arrangement students see on their next dashboard load. This does not regenerate or modify either report.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {[
            { mode: "course", label: "Course arrangement" },
            { mode: "section", label: "Section arrangement" },
          ].map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => handleDisplayModeChange(option.mode)}
              disabled={displayLoading || displaySaving || running !== null}
              aria-pressed={displayMode === option.mode}
              className="login-submit-btn"
              style={{
                width: "auto",
                minWidth: "180px",
                margin: 0,
                border: displayMode === option.mode ? "1px solid #1d4ed8" : "1px solid #cbd5e1",
                color: displayMode === option.mode ? "#fff" : "#334155",
                background: displayMode === option.mode ? "#2563eb" : "#fff",
                opacity: displayLoading || displaySaving ? 0.7 : 1,
              }}
            >
              {displaySaving && displayMode !== option.mode ? "Saving..." : option.label}
              {displayMode === option.mode && " (Current)"}
            </button>
          ))}
        </div>
        {displayLoading && <p role="status" style={{ margin: "12px 0 0", color: "#64748b", fontSize: "12px" }}>Loading current student view...</p>}
        {displayError && <p role="alert" style={{ margin: "12px 0 0", color: "#b91c1c", fontSize: "12px" }}>{displayError}</p>}
        {displayMessage && <p role="status" aria-live="polite" style={{ margin: "12px 0 0", color: "#166534", fontSize: "12px" }}>{displayMessage}</p>}
      </div>

      {canRunAllocations && (
        <div style={{ marginBottom: "22px", padding: "18px", border: "1px solid #c7d2fe", borderRadius: "14px", background: "#f8faff" }}>
          <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "15px", fontWeight: 800 }}>Fill compatible empty seats</h3>
          <p style={{ margin: "0 0 14px", color: "#64748b", fontSize: "12px", lineHeight: 1.55 }}>
            Uses only unallocated students from the database. It avoids putting the same course (or section in section mode) directly beside another, respects special-seat requirements, and keeps each section-mode room to one exact course. Only the current {displayMode || "selected"} report changes.
          </p>
          <button
            type="button"
            onClick={handleFillEmptySeats}
            disabled={running !== null || displayLoading || displaySaving || !displayMode}
            className="login-submit-btn"
            style={{ width: "auto", minWidth: "220px", margin: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", opacity: running !== null ? 0.7 : 1, cursor: running !== null ? "wait" : "pointer" }}
          >
            <UserPlus size={16} />
            {running === "fill" ? "Filling seats..." : "Fill empty seats"}
          </button>
          {fillError && <p role="alert" style={{ margin: "14px 0 0", color: "#b91c1c", fontSize: "13px" }}>{fillError}</p>}
          {fillSuccess && (
            <div role="status" aria-live="polite" style={{ marginTop: "14px", padding: "13px", border: "1px solid #bbf7d0", borderRadius: "11px", color: "#166534", background: "#f0fdf4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", fontWeight: 800 }}><CheckCircle2 size={18} />{fillSuccess.message}</div>
              <div style={{ marginTop: "6px", fontSize: "11px" }}>Still unallocated: {fillSuccess.remainingUnallocated}</div>
              {fillSuccess.skippedRooms > 0 && <div style={{ marginTop: "4px", fontSize: "11px" }}>Rooms with no safe eligible placement: {fillSuccess.skippedRooms}</div>}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "22px", padding: "13px 15px", border: "1px solid #fed7aa", borderRadius: "12px", color: "#9a3412", background: "#fff7ed", fontSize: "12px", lineHeight: 1.55 }}>
        <AlertCircle size={17} style={{ flexShrink: 0, marginTop: "1px" }} />
        <span>
          Course runs write only <code style={{ fontWeight: 800 }}>seat-allocation.txt</code>; section runs write only <code style={{ fontWeight: 800 }}>seat-allocation-CT.txt</code>. Running one does not modify the other.
        </span>
      </div>

      {canRunAllocations && <div style={{ display: "grid", gap: "22px" }}>
        <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
          <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "15px", fontWeight: 800 }}>Course allocation</h3>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "12px" }}>
            Uses course names and updates only seat-allocation.txt.
          </p>
          <form onSubmit={(event) => handleSubmit(event, "course")} style={{ display: "flex", alignItems: "end", flexWrap: "wrap", gap: "14px" }}>
            <label htmlFor="max-courses-per-room" style={{ display: "flex", flex: "0 1 270px", flexDirection: "column", gap: "7px", color: "#334155", fontSize: "12px", fontWeight: 750 }}>
              Maximum courses per room
              <input
                id="max-courses-per-room"
                type="number"
                required
                min={1}
                max={5}
                step={1}
                value={maxCoursesPerRoom}
                onChange={(event) => setMaxCoursesPerRoom(event.target.value)}
                disabled={running !== null || displaySaving}
                style={{ width: "100%", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: "11px", color: "#0f172a", background: "#fff", fontSize: "14px" }}
              />
            </label>
            <button type="submit" disabled={running !== null || displaySaving} className="login-submit-btn" style={{ width: "auto", minWidth: "190px", margin: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", opacity: running !== null || displaySaving ? 0.7 : 1, cursor: running !== null || displaySaving ? "wait" : "pointer" }}>
              <Play size={16} />
              {running === "course" ? "Allocation running..." : "Run course allocation"}
            </button>
          </form>
          {courseError && <p role="alert" style={{ margin: "14px 0 0", color: "#b91c1c", fontSize: "13px" }}>{courseError}</p>}
          {courseSuccess && (
            <div role="status" aria-live="polite" style={{ marginTop: "14px", padding: "13px", border: "1px solid #bbf7d0", borderRadius: "11px", color: "#166534", background: "#f0fdf4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", fontWeight: 800 }}><CheckCircle2 size={18} />{courseSuccess.message}</div>
              {courseSuccess.summary?.map((line) => <div key={line} style={{ marginTop: "6px", fontSize: "11px" }}>{line}</div>)}
            </div>
          )}
        </div>

        <div style={{ padding: "18px", border: "1px solid #e2e8f0", borderRadius: "14px" }}>
          <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "15px", fontWeight: 800 }}>Section allocation (CT)</h3>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "12px" }}>
            Uses the students&apos; section values and updates only seat-allocation-CT.txt.
          </p>
          <form onSubmit={(event) => handleSubmit(event, "section")} style={{ display: "flex", alignItems: "end", flexWrap: "wrap", gap: "14px" }}>
            <label htmlFor="max-sections-per-room" style={{ display: "flex", flex: "0 1 270px", flexDirection: "column", gap: "7px", color: "#334155", fontSize: "12px", fontWeight: 750 }}>
              Maximum sections per room
              <input
                id="max-sections-per-room"
                type="number"
                required
                min={1}
                max={5}
                step={1}
                value={maxSectionsPerRoom}
                onChange={(event) => setMaxSectionsPerRoom(event.target.value)}
                disabled={running !== null || displaySaving}
                style={{ width: "100%", padding: "12px 13px", border: "1px solid #cbd5e1", borderRadius: "11px", color: "#0f172a", background: "#fff", fontSize: "14px" }}
              />
            </label>
            <button type="submit" disabled={running !== null || displaySaving} className="login-submit-btn" style={{ width: "auto", minWidth: "190px", margin: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", opacity: running !== null || displaySaving ? 0.7 : 1, cursor: running !== null || displaySaving ? "wait" : "pointer" }}>
              <Play size={16} />
              {running === "section" ? "Allocation running..." : "Run section allocation"}
            </button>
          </form>
          {sectionError && <p role="alert" style={{ margin: "14px 0 0", color: "#b91c1c", fontSize: "13px" }}>{sectionError}</p>}
          {sectionSuccess && (
            <div role="status" aria-live="polite" style={{ marginTop: "14px", padding: "13px", border: "1px solid #bbf7d0", borderRadius: "11px", color: "#166534", background: "#f0fdf4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px", fontWeight: 800 }}><CheckCircle2 size={18} />{sectionSuccess.message}</div>
              {sectionSuccess.summary?.map((line) => <div key={line} style={{ marginTop: "6px", fontSize: "11px" }}>{line}</div>)}
            </div>
          )}
        </div>
      </div>}

      {running !== null && (
        <div role="status" aria-live="polite" style={{ marginTop: "16px", color: "#64748b", fontSize: "12px" }}>
          {running === "fill"
            ? "The empty-seat operation is checking the selected report and roster. Keep this page open until it finishes."
            : `The ${running}-based allocator is processing student and room data. Keep this page open until it finishes.`}
        </div>
      )}
    </section>
  );
}
