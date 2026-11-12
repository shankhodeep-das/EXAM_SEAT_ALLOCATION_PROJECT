"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Plus, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";

const createRoom = (number) => ({
  roomNumber: `ROOM-${String(number).padStart(3, "0")}`,
  totalRows: "",
  totalColumns: "",
  specialSeatCount: "0",
});

function nextRoomNumber(building) {
  const highestNumber = (building?.rooms || []).reduce((highest, room) => {
    const match = room.roomNumber.match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return highestNumber + 1;
}

function createRoomList(count, start, currentRooms = []) {
  return Array.from({ length: count }, (_, index) => (
    currentRooms[index] || createRoom(start + index)
  ));
}

export default function AddBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [buildingsError, setBuildingsError] = useState("");
  const [mode, setMode] = useState("new");
  const [buildingId, setBuildingId] = useState("");
  const [buildingCode, setBuildingCode] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomCount, setRoomCount] = useState("1");
  const [rooms, setRooms] = useState([createRoom(1)]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedBuilding = useMemo(
    () => buildings.find((building) => String(building.id) === buildingId),
    [buildings, buildingId]
  );

  useEffect(() => {
    let active = true;

    async function loadBuildings() {
      const token = localStorage.getItem("token");
      if (!token) {
        if (active) {
          setBuildingsError("Your session has expired. Please sign in again.");
          setBuildingsLoading(false);
        }
        return;
      }

      try {
        const data = await apiRequest("/api/buildings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (active) {
          setBuildings(data.buildings || []);
          setBuildingsError("");
          setBuildingId((current) => current || String(data.buildings?.[0]?.id || ""));
        }
      } catch (requestError) {
        if (active) {
          setBuildingsError(requestError.message || "Unable to load existing buildings.");
        }
      } finally {
        if (active) setBuildingsLoading(false);
      }
    }

    loadBuildings();
    return () => {
      active = false;
    };
  }, []);

  const updateRoomCount = (value) => {
    setRoomCount(value);
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1 || count > 100) return;

    const start = mode === "existing"
      ? nextRoomNumber(selectedBuilding)
      : 1;
    setRooms((current) => createRoomList(count, start, current));
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");

    if (nextMode === "existing" && buildings.length > 0) {
      const nextBuildingId = String(buildings[0].id);
      setBuildingId(nextBuildingId);
      setRooms(createRoomList(Number(roomCount) || 1, nextRoomNumber(buildings[0])));
    } else if (nextMode === "new") {
      setRooms(createRoomList(Number(roomCount) || 1, 1));
    }
  };

  const handleBuildingChange = (value) => {
    setBuildingId(value);
    setError("");
    setSuccess("");
    const building = buildings.find((item) => String(item.id) === value);
    setRooms(createRoomList(Number(roomCount) || 1, nextRoomNumber(building)));
  };

  const updateRoom = (index, field, value) => {
    setRooms((current) => current.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [field]: value } : room
    )));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const count = Number(roomCount);
    if (!Number.isInteger(count) || count < 1 || count > 100 || rooms.length !== count) {
      setError("Enter a room count between 1 and 100.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        rooms: rooms.map((room) => ({
          roomNumber: room.roomNumber,
          totalRows: Number(room.totalRows),
          totalColumns: Number(room.totalColumns),
          specialSeatCount: Number(room.specialSeatCount),
        })),
        ...(mode === "existing"
          ? { buildingId: Number(buildingId) }
          : { buildingCode, buildingName }),
      };

      const result = await apiRequest("/api/buildings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const updatedBuilding = {
        ...result.building,
        rooms: [
          ...(buildings.find((item) => item.id === result.building.id)?.rooms || []),
          ...result.rooms,
        ],
      };
      setBuildings((current) => [
        ...current.filter((item) => item.id !== result.building.id),
        updatedBuilding,
      ].sort((a, b) => a.buildingCode.localeCompare(b.buildingCode)));
      setMode("existing");
      setBuildingId(String(result.building.id));
      setBuildingCode("");
      setBuildingName("");
      setRoomCount("1");
      setRooms(createRoomList(1, nextRoomNumber(updatedBuilding)));
      setSuccess(result.message || "Building and rooms added successfully.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add building rooms.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dash-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "22px" }}>
        <div style={{ width: "46px", height: "46px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "14px", color: "#1d4ed8", background: "#eff6ff" }}>
          <Building2 size={22} />
        </div>
        <div>
          <h2 className="dash-panel-title" style={{ margin: "2px 0 6px" }}>Add buildings and rooms</h2>
          <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
            Create a building or add rooms to an existing one. Configure each room&apos;s seat grid and special-seat count.
          </p>
        </div>
      </div>

      {buildingsError && (
        <div role="alert" style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "11px 13px", borderRadius: "10px", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", fontSize: "13px" }}>
          <AlertCircle size={17} />
          {buildingsError}
        </div>
      )}
      {success && (
        <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px", padding: "12px 14px", borderRadius: "10px", color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "13px", fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}
      {error && (
        <div role="alert" style={{ display: "flex", gap: "8px", marginBottom: "16px", padding: "11px 13px", borderRadius: "10px", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", fontSize: "13px" }}>
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "18px" }}>
          <label style={labelStyle}>
            What would you like to add?
            <select value={mode} onChange={(event) => handleModeChange(event.target.value)} style={inputStyle}>
              <option value="new">Create a new building</option>
              <option value="existing" disabled={buildings.length === 0}>Add rooms to an existing building</option>
            </select>
          </label>

          {mode === "new" ? (
            <>
              <label style={labelStyle}>
                Building name
                <input
                  required
                  maxLength={80}
                  value={buildingName}
                  onChange={(event) => setBuildingName(event.target.value)}
                  placeholder="University Building 4"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Building code
                <input
                  required
                  maxLength={24}
                  pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,23}"
                  value={buildingCode}
                  onChange={(event) => setBuildingCode(event.target.value.toUpperCase())}
                  placeholder="UB4"
                  style={inputStyle}
                />
              </label>
            </>
          ) : (
            <label style={labelStyle}>
              Select building
              <select
                required
                value={buildingId}
                onChange={(event) => handleBuildingChange(event.target.value)}
                disabled={buildingsLoading || buildings.length === 0}
                style={inputStyle}
              >
                <option value="" disabled>
                  {buildingsLoading ? "Loading buildings..." : "Select a building"}
                </option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingName} ({building.buildingCode})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label style={labelStyle}>
            Number of rooms to add
            <input
              type="number"
              required
              min={1}
              max={100}
              step={1}
              value={roomCount}
              onChange={(event) => updateRoomCount(event.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", margin: "22px 0 12px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>Room details</h3>
          <span style={{ color: "#64748b", fontSize: "12px" }}>
            {mode === "existing" && selectedBuilding
              ? `Adding to ${selectedBuilding.buildingCode}`
              : "Configure each room"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
          {rooms.map((room, index) => (
            <div key={`room-${index}`} style={{ padding: "16px", border: "1px solid #e2e8f0", borderRadius: "14px", background: "#f8fafc" }}>
              <div style={{ marginBottom: "12px", color: "#1e293b", fontSize: "13px", fontWeight: 800 }}>
                Room {index + 1}
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <label style={labelStyle}>
                  Room number
                  <input
                    required
                    maxLength={40}
                    value={room.roomNumber}
                    onChange={(event) => updateRoom(index, "roomNumber", event.target.value)}
                    placeholder="ROOM-001"
                    style={inputStyle}
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={labelStyle}>
                    Rows
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={room.totalRows}
                      onChange={(event) => updateRoom(index, "totalRows", event.target.value)}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    Columns
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={room.totalColumns}
                      onChange={(event) => updateRoom(index, "totalColumns", event.target.value)}
                      style={inputStyle}
                    />
                  </label>
                </div>
                <label style={labelStyle}>
                  Special seats
                  <input
                    type="number"
                    required
                    min={0}
                    max={1000}
                    value={room.specialSeatCount}
                    onChange={(event) => updateRoom(index, "specialSeatCount", event.target.value)}
                    style={inputStyle}
                  />
                </label>
                {Number(room.totalRows) > 0 && Number(room.totalColumns) > 0 && (
                  <div style={{ color: "#64748b", fontSize: "11px" }}>
                    Capacity: {Number(room.totalRows) * Number(room.totalColumns)} seats
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={submitting || (mode === "existing" && (buildingsLoading || buildings.length === 0))}
          className="login-submit-btn"
          style={{ width: "auto", minWidth: "190px", marginTop: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? <Save size={16} /> : <Plus size={17} />}
          {submitting ? "Saving rooms..." : "Add Building & Rooms"}
        </button>
      </form>
    </section>
  );
}

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  color: "#0f172a",
  background: "#fff",
  fontSize: "13px",
  fontFamily: "inherit",
};
