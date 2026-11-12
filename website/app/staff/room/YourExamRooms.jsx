"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, MapPin, Search } from "lucide-react";
import { downloadPdf } from "@/lib/api";

function getSeatDetails(seat, allocationMode) {
  if (seat.isEmpty) {
    return `Empty seat — Row ${seat.row}, Column ${seat.column}`;
  }

  const groupLabel = allocationMode === "section"
    ? "Course / section"
    : "Course";

  return [
    `Occupied seat — Row ${seat.row}, Column ${seat.column}`,
    seat.courseName && `${groupLabel}: ${seat.courseName}`,
    seat.rollNo && `Roll No: ${seat.rollNo}`,
    seat.isSpecial && "Special seat",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function YourExamRooms({
  rooms,
  adminView = false,
  allocationMode = "course",
  canDownloadInvigilationPdf = false,
}) {
  const [roomSearch, setRoomSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const pageSize = 4;

  const handleDownloadPdf = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setDownloadError("Your session has expired. Please sign in again.");
      return;
    }

    setDownloadError("");
    setDownloadingPdf(true);
    try {
      await downloadPdf("/api/auth/staff/invigilation-report.pdf", {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      setDownloadError(error.message || "Unable to download the invigilation PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const visibleRooms = useMemo(() => {
    const normalizedSearch = roomSearch.trim().toLowerCase();
    return [...rooms]
      .filter((room) => roomFilter !== "empty" || (room.emptySeatPositions || []).length > 0)
      .filter((room) => {
        if (!normalizedSearch) return true;
        return `${room.roomNumber} ${room.building}`.toLowerCase().includes(normalizedSearch);
      })
      .sort((a, b) => {
        const buildingOrder = a.building.localeCompare(b.building);
        if (buildingOrder !== 0) return buildingOrder;
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
  }, [rooms, roomFilter, roomSearch]);
  const pageCount = Math.ceil(visibleRooms.length / pageSize);
  const pageRooms = adminView
    ? visibleRooms.slice(page * pageSize, (page + 1) * pageSize)
    : visibleRooms;

  return (
    <section className="dash-panel" style={{ padding: "20px" }}>
      <h2
        className="dash-panel-title"
        style={{
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "12px",
          marginBottom: "14px",
          fontSize: "1rem",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <MapPin className="w-4 h-4 text-blue-600" />
        <span>{adminView ? "Exam Rooms" : "Your Exam Room"}</span>
        <span style={{ marginLeft: "auto", padding: "5px 9px", borderRadius: "8px", color: "#1d4ed8", background: "#eff6ff", fontSize: "10px", fontWeight: 750 }}>
          {allocationMode === "section" ? "Section arrangement" : "Course arrangement"}
        </span>
        {canDownloadInvigilationPdf && (
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            aria-label="Download invigilation assignments as PDF"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "7px 10px",
              border: "1px solid #bfdbfe",
              borderRadius: "9px",
              color: "#1d4ed8",
              background: "#fff",
              fontSize: "11px",
              fontWeight: 750,
              cursor: downloadingPdf ? "wait" : "pointer",
              opacity: downloadingPdf ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            {downloadingPdf ? "Preparing PDF..." : "Download PDF"}
          </button>
        )}
      </h2>
      {downloadError && (
        <p role="alert" style={{ margin: "0 0 14px", color: "#b91c1c", fontSize: "12px" }}>
          {downloadError}
        </p>
      )}

      {adminView && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <label style={{ display: "flex", flex: "1 1 240px", position: "relative" }}>
            <Search
              size={16}
              aria-hidden="true"
              style={{ position: "absolute", left: "12px", top: "11px", color: "#64748b" }}
            />
            <input
              type="search"
              value={roomSearch}
              onChange={(event) => {
                setRoomSearch(event.target.value);
                setPage(0);
              }}
              placeholder="Search room number or building"
              aria-label="Search rooms"
              style={{
                width: "100%",
                minHeight: "40px",
                padding: "8px 12px 8px 36px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "13px",
              }}
            />
          </label>
          <select
            value={roomFilter}
            onChange={(event) => {
              setRoomFilter(event.target.value);
              setPage(0);
            }}
            aria-label="Filter rooms"
            style={{
              minHeight: "40px",
              padding: "8px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "10px",
              background: "#ffffff",
              color: "#334155",
              fontSize: "13px",
            }}
          >
            <option value="all">All rooms</option>
            <option value="empty">Rooms with empty seats</option>
          </select>
        </div>
      )}

      {pageRooms.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
          {adminView
            ? "No rooms match your search or filter."
            : "No room assignment was found for you in the current seat allocation."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {pageRooms.map((room) => (
            <article
              key={`${room.building}-${room.roomNumber}`}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "16px",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "#0f172a", fontSize: "15px", fontWeight: 800 }}>
                    {room.roomNumber}
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>
                    {room.building}
                  </p>
                </div>
                <div style={{ color: "#475569", fontSize: "12px", fontWeight: 700 }}>
                  {room.allocatedStudents} students allocated
                </div>
              </div>

              {adminView && (
                <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "12px" }}>
                  {(room.emptySeatPositions || []).length} empty {(room.emptySeatPositions || []).length === 1 ? "seat" : "seats"}
                  {(room.emptySeatPositions || []).length > 0
                    ? `: ${(room.emptySeatPositions || []).map((seat) => `R${seat.row}C${seat.column}`).join(", ")}`
                    : ""}
                </p>
              )}

              <div
                style={{
                  padding: "10px 12px",
                  marginBottom: "16px",
                  borderRadius: "10px",
                  background: "#eff6ff",
                  color: "#1e3a8a",
                  fontSize: "12px",
                }}
              >
                <strong>Invigilators:</strong>{" "}
                {room.invigilators.length > 0
                  ? room.invigilators
                      .map((faculty) =>
                        faculty.employeeId
                          ? `${faculty.fullName} (${faculty.employeeId})`
                          : faculty.fullName
                      )
                      .join(" • ")
                  : "Not listed in the allocation report"}
              </div>

              <div
                aria-label={`Seat arrangement for ${room.roomNumber}`}
                style={{
                  maxHeight: "420px",
                  overflow: "auto",
                  padding: "10px 4px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  {room.rows.map((row, rowIndex) => (
                    <div
                      key={`row-${rowIndex + 1}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${row.length}, 56px)`,
                        gap: "8px",
                        minWidth: "max-content",
                      }}
                    >
                      {row.map((seat) => (
                        <div
                          key={`${seat.row}-${seat.column}`}
                          title={getSeatDetails(seat, allocationMode)}
                          aria-label={getSeatDetails(seat, allocationMode)}
                          style={{
                            width: "56px",
                            height: "46px",
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: `1.5px solid ${seat.isEmpty ? "#86efac" : "#fdba74"}`,
                            borderRadius: "6px 6px 10px 10px",
                            background: seat.isEmpty ? "#dcfce7" : "#ffedd5",
                            color: seat.isEmpty ? "#166534" : "#9a3412",
                            fontSize: "11px",
                            fontFamily: "monospace",
                            fontWeight: 700,
                            cursor: "help",
                          }}
                        >
                          {seat.row},{seat.column}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginTop: "12px",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                <span><span style={{ color: "#c2410c" }}>■</span> Occupied</span>
                <span><span style={{ color: "#15803d" }}>■</span> Empty</span>
                <span>
                  Hover a seat for {allocationMode === "section" ? "course, section, and" : "course and"} roll number
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {adminView && pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "14px",
            marginTop: "20px",
          }}
        >
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
            disabled={page === 0}
            aria-label="Previous rooms page"
            style={paginationButtonStyle(page === 0)}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span aria-live="polite" style={{ color: "#475569", fontSize: "13px" }}>
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((currentPage) => Math.min(pageCount - 1, currentPage + 1))}
            disabled={page >= pageCount - 1}
            aria-label="Next rooms page"
            style={paginationButtonStyle(page >= pageCount - 1)}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}

function paginationButtonStyle(disabled) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: disabled ? "#f1f5f9" : "#ffffff",
    color: disabled ? "#94a3b8" : "#334155",
    fontSize: "12px",
    fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
