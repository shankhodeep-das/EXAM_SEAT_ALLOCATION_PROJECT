import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import {
  addBuildingRooms,
  AllocationMode,
  AllocationResult,
  Building,
  fillEmptySeats,
  getAllocationMode,
  getBuildings,
  getStudentSeat,
  runAllocation,
  setAllocationMode,
  StudentSeatLookup,
} from "../services/api";

const COLORS = {
  background: "#0B1423",
  panel: "#121F33",
  panelLight: "#192941",
  border: "#263852",
  text: "#F4F7FB",
  muted: "#9EACC0",
  mint: "#4DE1C1",
  blue: "#6BA8FF",
  green: "#8FE0B2",
  amber: "#FFBE6B",
  red: "#FF8585",
};

type RoomDraft = {
  roomNumber: string;
  totalRows: string;
  totalColumns: string;
  specialSeatCount: string;
};

function createRooms(count: number, start = 1): RoomDraft[] {
  return Array.from({ length: count }, (_, index) => ({
    roomNumber: `ROOM-${String(start + index).padStart(3, "0")}`,
    totalRows: "",
    totalColumns: "",
    specialSeatCount: "0",
  }));
}

function nextRoomNumber(building?: Building) {
  return (building?.rooms || []).reduce((highest, room) => {
    const match = room.roomNumber.match(/(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0) + 1;
}

export default function ManageScreen() {
  const { token, user, dashboard, dashboardError, refreshDashboard } = useAuth();
  const official = dashboard && "user" in dashboard ? dashboard.user : null;
  const role = official?.role || user?.role || "";
  const staffType = official?.staffType || user?.staffType || "";
  const isAdmin = user?.roleGroup === "ADMIN";
  const canManageBuildings = isAdmin || role === "EXAM_OFFICER";
  const canChangeMode = canManageBuildings;
  const canSearchSeats = isAdmin ||
    role === "EXAM_OFFICER" ||
    role === "FACULTY" ||
    staffType === "FACULTY";

  const [mode, setMode] = useState<AllocationMode | null>(null);
  const [modeLoading, setModeLoading] = useState(true);
  const [modeSaving, setModeSaving] = useState(false);
  const [modeMessage, setModeMessage] = useState("");
  const [modeError, setModeError] = useState("");
  const [running, setRunning] = useState<AllocationMode | "fill" | null>(null);
  const [courseLimit, setCourseLimit] = useState("2");
  const [sectionLimit, setSectionLimit] = useState("");
  const [allocationResult, setAllocationResult] = useState<{
    mode: AllocationMode | "fill";
    result: AllocationResult;
  } | null>(null);
  const [allocationError, setAllocationError] = useState("");

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [buildingsError, setBuildingsError] = useState("");
  const [buildingMode, setBuildingMode] = useState<"new" | "existing">("new");
  const [buildingId, setBuildingId] = useState("");
  const [buildingCode, setBuildingCode] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [roomCount, setRoomCount] = useState("1");
  const [rooms, setRooms] = useState<RoomDraft[]>(createRooms(1));
  const [buildingSaving, setBuildingSaving] = useState(false);
  const [buildingMessage, setBuildingMessage] = useState("");
  const [buildingError, setBuildingError] = useState("");

  const [rollNo, setRollNo] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookup, setLookup] = useState<StudentSeatLookup | null>(null);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => String(building.id) === buildingId),
    [buildings, buildingId]
  );

  useEffect(() => {
    if (!token || !canChangeMode) return;
    let active = true;
    getAllocationMode(token)
      .then((result) => {
        if (active) {
          setMode(result.mode);
          setModeError("");
        }
      })
      .catch((error: unknown) => {
        if (active) setModeError(errorMessage(error, "Unable to load the student display mode."));
      })
      .finally(() => {
        if (active) setModeLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, canChangeMode]);

  useEffect(() => {
    if (!token || !canManageBuildings) return;
    let active = true;
    getBuildings(token)
      .then((result) => {
        if (!active) return;
        setBuildings(result.buildings);
        if (result.buildings.length > 0) {
          setBuildingId((current) => current || String(result.buildings[0].id));
        }
        setBuildingsError("");
      })
      .catch((error: unknown) => {
        if (active) setBuildingsError(errorMessage(error, "Unable to load existing buildings."));
      })
      .finally(() => {
        if (active) setBuildingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, canManageBuildings]);

  const changeMode = (nextMode: AllocationMode) => {
    if (!token || nextMode === mode || modeSaving) return;
    Alert.alert(
      "Change student view?",
      `Students will see the ${nextMode}-based seating arrangement the next time their dashboard loads. This does not regenerate either report.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change view",
          onPress: () => {
            setModeSaving(true);
            setModeError("");
            setModeMessage("");
            setAllocationError("");
            setAllocationResult(null);
            setAllocationMode(token, nextMode)
              .then(async (result) => {
                setMode(result.mode);
                setModeMessage(result.message);
                await refreshDashboard();
              })
              .catch((error: unknown) => {
                setModeError(errorMessage(error, "Unable to change the student display mode."));
              })
              .finally(() => setModeSaving(false));
          },
        },
      ]
    );
  };

  const startAllocation = (allocationMode: AllocationMode) => {
    if (!token || running) return;
    const rawLimit = allocationMode === "course" ? courseLimit : sectionLimit;
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 5) {
      setAllocationError(`Enter a whole number from 1 to 5 for the ${allocationMode} limit.`);
      return;
    }

    Alert.alert(
      "Replace allocation report?",
      `This updates only the ${allocationMode === "course" ? "seat-allocation.txt" : "seat-allocation-CT.txt"} report. The other report remains unchanged.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Run allocation",
          style: "destructive",
          onPress: () => {
            setRunning(allocationMode);
            setAllocationError("");
            setAllocationResult(null);
            runAllocation(token, allocationMode, limit)
              .then(async (result) => {
                setAllocationResult({ mode: allocationMode, result });
                await refreshDashboard();
              })
              .catch((error: unknown) => {
                setAllocationError(errorMessage(error, "Unable to run the allocation."));
              })
              .finally(() => setRunning(null));
          },
        },
      ]
    );
  };

  const startFill = () => {
    if (!token || running || !mode) return;
    Alert.alert(
      "Fill compatible empty seats?",
      `This changes only the current ${mode} report. It uses unallocated students and checks adjacent seats for safe placement.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fill seats",
          style: "destructive",
          onPress: () => {
            setRunning("fill");
            setAllocationError("");
            setAllocationResult(null);
            fillEmptySeats(token)
              .then(async (result) => {
                setAllocationResult({ mode: "fill", result });
                if (result.filledCount) await refreshDashboard();
              })
              .catch((error: unknown) => {
                setAllocationError(errorMessage(error, "Unable to fill empty seats."));
              })
              .finally(() => setRunning(null));
          },
        },
      ]
    );
  };

  const updateRoomCount = (value: string) => {
    setRoomCount(value);
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1 || count > 100) return;
    const start = buildingMode === "existing" ? nextRoomNumber(selectedBuilding) : 1;
    setRooms((current) => Array.from({ length: count }, (_, index) => (
      current[index] || {
        ...createRooms(1, start + index)[0],
      }
    )));
  };

  const selectBuildingMode = (nextMode: "new" | "existing") => {
    setBuildingMode(nextMode);
    setBuildingError("");
    setBuildingMessage("");
    const nextBuilding = nextMode === "existing" ? selectedBuilding : undefined;
    setRooms(createRooms(Number(roomCount) || 1, nextRoomNumber(nextBuilding)));
  };

  const selectBuilding = (building: Building) => {
    setBuildingId(String(building.id));
    setRooms(createRooms(Number(roomCount) || 1, nextRoomNumber(building)));
    setBuildingError("");
    setBuildingMessage("");
  };

  const updateRoom = (index: number, field: keyof RoomDraft, value: string) => {
    setRooms((current) => current.map((room, roomIndex) => (
      roomIndex === index ? { ...room, [field]: value } : room
    )));
  };

  const submitBuildings = () => {
    if (!token || buildingSaving) return;
    const count = Number(roomCount);
    if (!Number.isInteger(count) || count < 1 || count > 100 || rooms.length !== count) {
      setBuildingError("Enter a room count between 1 and 100.");
      return;
    }
    if (buildingMode === "existing" && !selectedBuilding) {
      setBuildingError("Select an existing building or choose new building.");
      return;
    }
    if (buildingMode === "new" &&
      (!/^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(buildingCode.trim().toUpperCase()) ||
        buildingName.trim().length < 2 || buildingName.trim().length > 80)) {
      setBuildingError("Enter a valid building code and a building name of 2 to 80 characters.");
      return;
    }

    const roomNumbers = new Set<string>();
    for (const room of rooms) {
      const rows = Number(room.totalRows);
      const columns = Number(room.totalColumns);
      const specialSeats = Number(room.specialSeatCount);
      const capacity = rows * columns;
      if (!room.roomNumber.trim() || room.roomNumber.trim().length > 40 ||
        !Number.isInteger(rows) || rows < 1 ||
        !Number.isInteger(columns) || columns < 1 || capacity > 1000 ||
        !Number.isInteger(specialSeats) || specialSeats < 0 || specialSeats > capacity) {
        setBuildingError(`Check the room number, dimensions, and special-seat count for ${room.roomNumber || "each room"}. Room capacity cannot exceed 1,000.`);
        return;
      }
      const normalized = room.roomNumber.trim().toLowerCase();
      if (roomNumbers.has(normalized)) {
        setBuildingError(`Room number ${room.roomNumber} is repeated in this request.`);
        return;
      }
      roomNumbers.add(normalized);
    }

    setBuildingSaving(true);
    setBuildingError("");
    setBuildingMessage("");
    addBuildingRooms(token, {
      ...(buildingMode === "existing"
        ? { buildingId: Number(buildingId) }
        : { buildingCode: buildingCode.trim(), buildingName: buildingName.trim() }),
      rooms: rooms.map((room) => ({
        roomNumber: room.roomNumber.trim(),
        totalRows: Number(room.totalRows),
        totalColumns: Number(room.totalColumns),
        specialSeatCount: Number(room.specialSeatCount),
      })),
    })
      .then(async (result) => {
        setBuildingMessage(result.message);
        let updated: { buildings: Building[] };
        try {
          updated = await getBuildings(token);
        } catch (error) {
          setBuildingsError(errorMessage(error, "Rooms were added, but the building list could not be refreshed."));
          return;
        }
        setBuildings(updated.buildings);
        setBuildingsError("");
        const createdBuilding = updated.buildings.find((building) => building.id === result.building.id);
        setBuildingMode("existing");
        setBuildingId(String(result.building.id));
        setBuildingCode("");
        setBuildingName("");
        setRoomCount("1");
        setRooms(createRooms(1, nextRoomNumber(createdBuilding)));
      })
      .catch((error: unknown) => {
        setBuildingError(errorMessage(error, "Unable to add building rooms."));
      })
      .finally(() => setBuildingSaving(false));
  };

  const searchStudent = () => {
    const searchRollNo = rollNo.trim();
    if (!token) return;
    if (!searchRollNo) {
      setLookupError("Enter a student roll number.");
      return;
    }
    setLookupLoading(true);
    setLookupError("");
    setLookup(null);
    getStudentSeat(token, searchRollNo)
      .then(setLookup)
      .catch((error: unknown) => {
        setLookupError(errorMessage(error, "Unable to find that student."));
      })
      .finally(() => setLookupLoading(false));
  };

  if (!user || user.roleGroup === "STUDENT") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.title}>Official tools</Text>
          <Text style={styles.muted}>These controls are available to authorized staff accounts.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>AUTHORIZED STAFF WORKSPACE</Text>
          <Text style={styles.title}>Official tools</Text>
          <Text style={styles.subtitle}>Manage the student seating view, rooms, and verified seat lookups.</Text>
          {!!dashboardError && <Feedback tone="error" text={dashboardError} />}

          {canChangeMode && (
            <Card title="Student seat arrangement" subtitle="Choose which saved report students see. This does not change either allocation file.">
              <View style={styles.modeButtons}>
                {(["course", "section"] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: mode === value, disabled: modeLoading || modeSaving }}
                    disabled={modeLoading || modeSaving || running !== null}
                    onPress={() => changeMode(value)}
                    style={[styles.modeButton, mode === value && styles.modeButtonActive]}
                  >
                    <Text style={[styles.modeButtonText, mode === value && styles.modeButtonTextActive]}>
                      {value === "course" ? "Course view" : "Section view"}{mode === value ? " · Current" : ""}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {modeLoading && <InlineLoading label="Loading the current student view…" />}
              {!!modeError && <Feedback tone="error" text={modeError} />}
              {!!modeMessage && <Feedback tone="success" text={modeMessage} />}
            </Card>
          )}

          {isAdmin && (
            <Card title="Room matrix allocation" subtitle="Course and section runs update separate reports. The other report is left unchanged.">
              <Text style={styles.note}>
                Section mode groups different sections of the same exact course. Each report supports a limit of 1–5 groups per room.
              </Text>
              <NumberField
                label="Maximum courses per room"
                value={courseLimit}
                onChangeText={setCourseLimit}
                placeholder="2"
              />
              <ActionButton
                label="Run course allocation"
                busy={running === "course"}
                disabled={running !== null}
                onPress={() => startAllocation("course")}
              />
              <NumberField
                label="Maximum sections per room"
                value={sectionLimit}
                onChangeText={setSectionLimit}
                placeholder="2"
                topSpace
              />
              <ActionButton
                label="Run section allocation"
                busy={running === "section"}
                disabled={running !== null}
                onPress={() => startAllocation("section")}
                secondary
              />
              <View style={styles.divider} />
              <Text style={styles.fieldLabel}>Fill safe empty seats</Text>
              <Text style={styles.helpText}>
                Places unallocated students in compatible empty seats in the active report, respecting course/section adjacency and special-seat requirements.
              </Text>
              <ActionButton
                label="Fill empty seats"
                busy={running === "fill"}
                disabled={running !== null || !mode}
                onPress={startFill}
                secondary
              />
              {!!allocationError && <Feedback tone="error" text={allocationError} />}
              {allocationResult && (
                <View style={styles.resultBox}>
                  <Text style={styles.successText}>{allocationResult.result.message}</Text>
                  {allocationResult.result.summary?.map((line) => (
                    <Text key={line} style={styles.resultText}>{line}</Text>
                  ))}
                  {allocationResult.mode === "fill" && (
                    <>
                      <Text style={styles.resultText}>Students added: {allocationResult.result.filledCount ?? 0}</Text>
                      <Text style={styles.resultText}>Still unallocated: {allocationResult.result.remainingUnallocated ?? "—"}</Text>
                      {!!allocationResult.result.skippedRooms && (
                        <Text style={styles.resultText}>Rooms without a safe placement: {allocationResult.result.skippedRooms}</Text>
                      )}
                    </>
                  )}
                </View>
              )}
            </Card>
          )}

          {canManageBuildings && (
            <Card title="Add buildings and rooms" subtitle="Create a building or add rooms to an existing one. Set the exact seat layout for every room.">
              {buildingsLoading ? (
                <InlineLoading label="Loading buildings…" />
              ) : (
                <>
                  <View style={styles.modeButtons}>
                    <Pressable
                      onPress={() => selectBuildingMode("new")}
                      style={[styles.modeButton, buildingMode === "new" && styles.modeButtonActive]}
                    >
                      <Text style={[styles.modeButtonText, buildingMode === "new" && styles.modeButtonTextActive]}>New building</Text>
                    </Pressable>
                    <Pressable
                      disabled={buildings.length === 0}
                      onPress={() => selectBuildingMode("existing")}
                      style={[styles.modeButton, buildingMode === "existing" && styles.modeButtonActive, buildings.length === 0 && styles.disabled]}
                    >
                      <Text style={[styles.modeButtonText, buildingMode === "existing" && styles.modeButtonTextActive]}>Existing building</Text>
                    </Pressable>
                  </View>
                  {buildingMode === "new" ? (
                    <>
                      <TextField label="Building code" value={buildingCode} onChangeText={setBuildingCode} placeholder="BLDG-3" autoCapitalize="characters" />
                      <TextField label="Building name" value={buildingName} onChangeText={setBuildingName} placeholder="University Building 3" />
                    </>
                  ) : (
                    <>
                      {buildings.length === 0 ? (
                        <Text style={styles.helpText}>No buildings are available yet. Create a new building first.</Text>
                      ) : (
                        <View style={styles.buildingOptions}>
                          {buildings.map((building) => (
                            <Pressable
                              key={building.id}
                              onPress={() => selectBuilding(building)}
                              style={[styles.buildingOption, String(building.id) === buildingId && styles.buildingOptionSelected]}
                            >
                              <Text style={styles.buildingName}>{building.buildingName}</Text>
                              <Text style={styles.buildingMeta}>{building.buildingCode} · {building.rooms.length} rooms</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </>
                  )}
                  <NumberField
                    label="Number of rooms to add"
                    value={roomCount}
                    onChangeText={updateRoomCount}
                    placeholder="1"
                  />
                  {rooms.map((room, index) => (
                    <View key={`room-${index}`} style={styles.roomDraft}>
                      <Text style={styles.roomDraftTitle}>ROOM {index + 1}</Text>
                      <TextField label="Room number" value={room.roomNumber} onChangeText={(value) => updateRoom(index, "roomNumber", value)} />
                      <View style={styles.inputPair}>
                        <View style={styles.inputHalf}>
                          <NumberField label="Rows" value={room.totalRows} onChangeText={(value) => updateRoom(index, "totalRows", value)} placeholder="Rows" />
                        </View>
                        <View style={styles.inputHalf}>
                          <NumberField label="Columns" value={room.totalColumns} onChangeText={(value) => updateRoom(index, "totalColumns", value)} placeholder="Columns" />
                        </View>
                      </View>
                      <NumberField
                        label="Special seats"
                        value={room.specialSeatCount}
                        onChangeText={(value) => updateRoom(index, "specialSeatCount", value)}
                        placeholder="0"
                      />
                    </View>
                  ))}
                  <ActionButton
                    label="Save building and rooms"
                    busy={buildingSaving}
                    disabled={buildingSaving || buildingsLoading || (buildingMode === "existing" && !selectedBuilding)}
                    onPress={submitBuildings}
                  />
                </>
              )}
              {!!buildingsError && <Feedback tone="error" text={buildingsError} />}
              {!!buildingError && <Feedback tone="error" text={buildingError} />}
              {!!buildingMessage && <Feedback tone="success" text={buildingMessage} />}
            </Card>
          )}

          {canSearchSeats && (
            <Card title="Student seat lookup" subtitle="Search by roll number to verify the student's profile, room, seat position, and arrangement.">
              <TextField
                label="Student roll number"
                value={rollNo}
                onChangeText={setRollNo}
                placeholder="Enter exact roll number"
                autoCapitalize="characters"
                maxLength={64}
              />
              <ActionButton label="Search student" busy={lookupLoading} disabled={lookupLoading} onPress={searchStudent} />
              {!!lookupError && <Feedback tone="error" text={lookupError} />}
              {lookup && <LookupResult result={lookup} />}
            </Card>
          )}

          <Text style={styles.footer}>SEATWISE · OFFICIAL CONTROLS</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LookupResult({ result }: { result: StudentSeatLookup }) {
  const { student, room } = result;
  return (
    <View style={styles.lookupBox}>
      <Text style={styles.resultHeading}>{student.fullName}</Text>
      <Text style={styles.resultText}>{student.rollNo}</Text>
      <View style={styles.lookupDetails}>
        <Detail label="Email" value={student.email || "Not linked"} />
        <Detail label="Course" value={student.courseName} />
        <Detail label="Course code / level" value={[student.courseCode, student.courseLevel].filter(Boolean).join(" / ") || "Not specified"} />
        <Detail label="Section / semester" value={`${student.section} / ${student.semester}`} />
        <Detail label="Special requirements" value={student.specialReq ? "Yes" : "No"} />
        <Detail label="Special seat" value={student.specialSeatReq ? "Requested" : "Not requested"} />
        <Detail label="Arrangement" value={result.allocationMode} />
      </View>
      {room ? (
        <>
          <View style={styles.seatLocation}>
            <Text style={styles.resultHeading}>{room.building} · {room.roomNumber}</Text>
            <Text style={styles.seatLocationText}>
              {room.seatCode} · Row {room.seat.row}, Column {room.seat.column}{room.seat.isSpecial ? " · SPECIAL SEAT" : ""}
            </Text>
            <Text style={styles.resultText}>
              {room.allocatedStudents} students · {room.totalRows} × {room.totalColumns} layout · {room.totalSeats} seats · {room.specialSeatCount} special seats
            </Text>
            {room.invigilators.length > 0 && (
              <Text style={styles.resultText}>
                Invigilators: {room.invigilators.map((faculty) => faculty.employeeId
                  ? `${faculty.fullName} (${faculty.employeeId})`
                  : faculty.fullName).join(", ")}
              </Text>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.lookupGrid}>
            {room.rows.map((row, rowIndex) => (
              <View key={`lookup-row-${rowIndex}`} style={styles.lookupSeatRow}>
                {row.map((seat) => (
                  <View
                    key={`${seat.row}-${seat.column}`}
                    accessibilityLabel={`Row ${seat.row}, column ${seat.column}${seat.isCurrentStudent ? ", searched student" : seat.isEmpty ? ", empty" : ", occupied"}`}
                    style={[
                      styles.lookupSeat,
                      seat.isCurrentStudent ? styles.lookupSeatMine : seat.isEmpty ? styles.lookupSeatEmpty : styles.lookupSeatOccupied,
                    ]}
                  >
                    <Text style={styles.lookupSeatText}>{seat.isCurrentStudent ? "YOU" : `${seat.row},${seat.column}`}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <Text style={styles.helpText}>The searched student&apos;s seat is highlighted. Other students&apos; personal details are not shown.</Text>
        </>
      ) : (
        <Feedback tone="error" text={result.message || "No seat allocation is present in the active report."} />
      )}
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "none",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71819A"
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        style={styles.input}
      />
    </View>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
  placeholder,
  topSpace = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  topSpace?: boolean;
}) {
  return (
    <View style={[styles.field, topSpace && styles.fieldTop]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#71819A"
        keyboardType="number-pad"
        style={styles.input}
      />
    </View>
  );
}

function ActionButton({
  label,
  busy,
  disabled,
  onPress,
  secondary = false,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        (disabled || pressed) && styles.buttonDisabled,
      ]}
    >
      {busy
        ? <ActivityIndicator color={secondary ? COLORS.mint : COLORS.background} />
        : <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>}
    </Pressable>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <View style={styles.loadingLine}>
      <ActivityIndicator size="small" color={COLORS.mint} />
      <Text style={styles.helpText}>{label}</Text>
    </View>
  );
}

function Feedback({ tone, text }: { tone: "error" | "success"; text: string }) {
  return (
    <View style={[styles.feedback, tone === "error" ? styles.feedbackError : styles.feedbackSuccess]}>
      <Text style={tone === "error" ? styles.errorText : styles.successText}>{text}</Text>
    </View>
  );
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 36 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 },
  kicker: { color: COLORS.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 5 },
  subtitle: { color: COLORS.muted, fontSize: 12, lineHeight: 19, marginTop: 5, marginBottom: 16 },
  muted: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  card: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, padding: 16, marginBottom: 13 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  cardSubtitle: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 5, marginBottom: 14 },
  note: { color: "#C7D7EF", fontSize: 10, lineHeight: 16, padding: 11, marginBottom: 8, borderRadius: 10, backgroundColor: "#172A42" },
  modeButtons: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  modeButton: { flexGrow: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: COLORS.panelLight, alignItems: "center" },
  modeButtonActive: { borderColor: "#2A6E68", backgroundColor: "#163B3B" },
  modeButtonText: { color: COLORS.muted, fontSize: 10, fontWeight: "800" },
  modeButtonTextActive: { color: COLORS.mint },
  field: { marginTop: 9 },
  fieldTop: { marginTop: 18 },
  fieldLabel: { color: "#D4DEEC", fontSize: 10, fontWeight: "800", marginBottom: 6 },
  input: { minHeight: 43, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, color: COLORS.text, backgroundColor: "#0D1929", fontSize: 12 },
  actionButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 15, paddingVertical: 11, marginTop: 10, borderRadius: 11, backgroundColor: COLORS.mint },
  actionButtonSecondary: { borderWidth: 1, borderColor: "#2A6E68", backgroundColor: "#163B3B" },
  actionText: { color: COLORS.background, fontSize: 11, fontWeight: "900" },
  actionTextSecondary: { color: COLORS.mint },
  buttonDisabled: { opacity: 0.55 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
  helpText: { color: COLORS.muted, fontSize: 10, lineHeight: 16 },
  feedback: { padding: 11, borderRadius: 10, marginTop: 10 },
  feedbackError: { borderWidth: 1, borderColor: "#693B48", backgroundColor: "#351F2B" },
  feedbackSuccess: { borderWidth: 1, borderColor: "#275B4D", backgroundColor: "#17382F" },
  errorText: { color: "#FFC1C1", fontSize: 11, lineHeight: 16 },
  successText: { color: COLORS.green, fontSize: 11, lineHeight: 16, fontWeight: "800" },
  resultBox: { marginTop: 10, padding: 12, borderWidth: 1, borderColor: "#275B4D", borderRadius: 11, backgroundColor: "#17382F" },
  resultText: { color: "#D6F4E3", fontSize: 10, lineHeight: 16, marginTop: 4 },
  resultHeading: { color: COLORS.text, fontSize: 15, fontWeight: "900" },
  buildingOptions: { gap: 7, marginTop: 3 },
  buildingOption: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, backgroundColor: COLORS.panelLight },
  buildingOptionSelected: { borderColor: COLORS.mint, backgroundColor: "#163B3B" },
  disabled: { opacity: 0.55 },
  buildingName: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  buildingMeta: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  roomDraft: { padding: 11, marginTop: 11, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: "#0F1B2D" },
  roomDraftTitle: { color: COLORS.blue, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  inputPair: { flexDirection: "row", gap: 9 },
  inputHalf: { flex: 1 },
  lookupBox: { padding: 12, marginTop: 13, borderRadius: 12, backgroundColor: COLORS.panelLight, borderWidth: 1, borderColor: COLORS.border },
  lookupDetails: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  detailCard: { flexGrow: 1, minWidth: "45%", padding: 9, borderRadius: 9, backgroundColor: "#0D1929" },
  detailLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", textTransform: "uppercase" },
  detailValue: { color: COLORS.text, fontSize: 10, fontWeight: "700", marginTop: 4 },
  seatLocation: { padding: 11, marginTop: 10, borderRadius: 10, backgroundColor: "#152D43" },
  seatLocationText: { color: COLORS.mint, fontSize: 12, fontWeight: "900", marginTop: 6 },
  lookupGrid: { alignItems: "center", gap: 5, padding: 9, marginTop: 10, borderRadius: 10, backgroundColor: "#0D1929" },
  lookupSeatRow: { flexDirection: "row", gap: 4 },
  lookupSeat: { width: 35, height: 31, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1 },
  lookupSeatMine: { borderColor: COLORS.blue, backgroundColor: "#203D65" },
  lookupSeatOccupied: { borderColor: "#78504A", backgroundColor: "#462F30" },
  lookupSeatEmpty: { borderColor: "#39765B", backgroundColor: "#1C4338" },
  lookupSeatText: { color: COLORS.text, fontSize: 7, fontWeight: "900" },
  loadingLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  footer: { color: "#64748B", textAlign: "center", fontSize: 8, fontWeight: "800", letterSpacing: 1, marginTop: 8 },
});
