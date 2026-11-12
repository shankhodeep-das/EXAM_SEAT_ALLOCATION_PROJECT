import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { ExamRoom } from "../services/api";

const COLORS = {
  background: "#0B1423",
  panel: "#121F33",
  panelLight: "#192941",
  border: "#263852",
  text: "#F4F7FB",
  muted: "#9EACC0",
  mint: "#4DE1C1",
  blue: "#6BA8FF",
  amber: "#FFBE6B",
  coral: "#FFB18A",
  green: "#8FE0B2",
};

const PAGE_SIZE = 4;

export default function ExamRoomScreen() {
  const { user, dashboard, dashboardLoading, dashboardError, refreshDashboard } = useAuth();
  const [search, setSearch] = useState("");
  const [emptyOnly, setEmptyOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [selectedSeat, setSelectedSeat] = useState<{ room: string; row: number; column: number } | null>(null);

  const isStudent = dashboard ? "student" in dashboard : user?.roleGroup === "STUDENT";
  const isAdmin = dashboard && "user" in dashboard && dashboard.user.roleGroup === "ADMIN";
  const isFaculty = dashboard && "user" in dashboard &&
    dashboard.user.roleGroup === "STAFF" &&
    dashboard.user.staffType?.toUpperCase() === "FACULTY";

  const allRooms = useMemo(() => {
    if (!dashboard) return [];
    if ("student" in dashboard) return [dashboard.room];
    return dashboard.user.roleGroup === "ADMIN" ? dashboard.adminRooms : dashboard.assignedRooms;
  }, [dashboard]);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...allRooms]
      .filter((room) => !emptyOnly || getEmptyPositions(room).length > 0)
      .filter((room) => !query || `${room.roomNumber} ${room.building}`.toLowerCase().includes(query))
      .sort((a, b) => {
        const buildingOrder = a.building.localeCompare(b.building);
        return buildingOrder || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      });
  }, [allRooms, emptyOnly, search]);

  const pagedRooms = isAdmin
    ? filteredRooms.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : filteredRooms;
  const pageCount = Math.ceil(filteredRooms.length / PAGE_SIZE);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const updateEmptyOnly = (value: boolean) => {
    setEmptyOnly(value);
    setPage(0);
  };

  const shareInvigilationPdf = async () => {
    if (!allRooms.length) {
      setPdfError("No invigilation assignments are available to export.");
      return;
    }

    setPdfBusy(true);
    setPdfError("");
    try {
      const allocationMode = dashboard && "allocationMode" in dashboard
        ? dashboard.allocationMode
        : "course";
      const official = dashboard && "user" in dashboard ? dashboard.user : null;
      const html = buildInvigilationHtml(
        allRooms,
        allocationMode,
        official?.fullName || user?.fullName || "Faculty member",
        official?.employeeId || user?.employeeId || ""
      );
      const file = await Print.printToFileAsync({ html });
      if (!await Sharing.isAvailableAsync()) {
        throw new Error("PDF sharing is not available on this device.");
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save or share invigilation assignments",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Unable to prepare the invigilation PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.centerState}>
          <Text style={styles.title}>Your exam room</Text>
          <Text style={styles.mutedText}>Sign in to view your seat arrangement.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dashboardLoading && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.centerState}>
          <ActivityIndicator color={COLORS.mint} />
          <Text style={styles.mutedText}>Loading verified room details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={dashboardLoading} onRefresh={refreshDashboard} tintColor={COLORS.mint} />
        }
      >
        <View style={styles.topLine}>
          <View>
            <Text style={styles.kicker}>{isAdmin ? "OFFICIAL CONTROL" : isStudent ? "YOUR SEATING PLAN" : "FACULTY PORTAL"}</Text>
            <Text style={styles.title}>{isAdmin ? "Exam rooms" : "Exam room"}</Text>
          </View>
          <View style={styles.countPill}><Text style={styles.countText}>{allRooms.length} {allRooms.length === 1 ? "ROOM" : "ROOMS"}</Text></View>
        </View>

        {dashboard && "allocationMode" in dashboard && (
          <Text style={styles.modeLabel}>
            STUDENT SEATING VIEW · {dashboard.allocationMode.toUpperCase()} ARRANGEMENT
          </Text>
        )}

        {isFaculty && (
          <Pressable
            accessibilityRole="button"
            disabled={pdfBusy}
            onPress={shareInvigilationPdf}
            style={({ pressed }) => [styles.pdfButton, pressed && styles.buttonPressed, pdfBusy && styles.buttonDisabled]}
          >
            {pdfBusy
              ? <ActivityIndicator color={COLORS.background} />
              : <Text style={styles.pdfButtonText}>Download / share invigilation PDF</Text>}
          </Pressable>
        )}
        {!!pdfError && <Text accessibilityRole="alert" style={styles.errorText}>{pdfError}</Text>}

        {!!dashboardError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{dashboardError}</Text>
            <Pressable onPress={refreshDashboard}><Text style={styles.retryText}>Try again</Text></Pressable>
          </View>
        )}

        {isAdmin && (
          <>
            <TextInput
              value={search}
              onChangeText={updateSearch}
              placeholder="Search room or building"
              placeholderTextColor="#71819A"
              autoCapitalize="none"
              style={styles.searchInput}
              accessibilityLabel="Search rooms by number or building"
            />
            <View style={styles.filterRow}>
              <FilterChip label="All rooms" selected={!emptyOnly} onPress={() => updateEmptyOnly(false)} />
              <FilterChip label="Empty seats" selected={emptyOnly} onPress={() => updateEmptyOnly(true)} />
            </View>
            <Text style={styles.resultsText}>Showing {filteredRooms.length} matching rooms · 4 per page</Text>
          </>
        )}

        {pagedRooms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isAdmin ? "No rooms match those filters" : "No room assignment found"}
            </Text>
            <Text style={styles.mutedText}>
              {isAdmin
                ? "Try another room number or switch back to all rooms."
                : "Your assignment will appear here when included in the current seating report."}
            </Text>
          </View>
        ) : (
          <View style={styles.roomList}>
            {pagedRooms.map((room) => (
              <RoomCard
                key={`${room.building}-${room.roomNumber}`}
                room={room}
                showEmptySummary={Boolean(isAdmin)}
                selectedSeat={selectedSeat?.room === room.roomNumber ? selectedSeat : null}
                onSelectSeat={(row, column) => setSelectedSeat({ room: room.roomNumber, row, column })}
              />
            ))}
          </View>
        )}

        {isAdmin && pageCount > 1 && (
          <View style={styles.pagination}>
            <Pressable
              accessibilityRole="button"
              disabled={page === 0}
              onPress={() => setPage((current) => Math.max(0, current - 1))}
              style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>‹ Previous</Text>
            </Pressable>
            <Text style={styles.pageNumber}>Page {page + 1} of {pageCount}</Text>
            <Pressable
              accessibilityRole="button"
              disabled={page >= pageCount - 1}
              onPress={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              style={[styles.pageButton, page >= pageCount - 1 && styles.pageButtonDisabled]}
            >
              <Text style={styles.pageButtonText}>Next ›</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function RoomCard({
  room,
  showEmptySummary,
  selectedSeat,
  onSelectSeat,
}: {
  room: ExamRoom;
  showEmptySummary: boolean;
  selectedSeat: { room: string; row: number; column: number } | null;
  onSelectSeat: (row: number, column: number) => void;
}) {
  const emptyPositions = getEmptyPositions(room);
  const totalSeats = room.rows.reduce((total, row) => total + row.length, 0);

  return (
    <View style={styles.roomCard}>
      <View style={styles.roomHeading}>
        <View style={styles.roomTitleGroup}>
          <Text style={styles.roomNumber}>{room.roomNumber}</Text>
          <Text style={styles.building}>{room.building}</Text>
        </View>
        <Text style={styles.allocated}>{room.allocatedStudents} allocated</Text>
      </View>

      <View style={styles.roomStats}>
        <MiniStat label="SEATS" value={`${totalSeats}`} />
        <MiniStat label="OCCUPIED" value={`${totalSeats - emptyPositions.length}`} />
        <MiniStat label="EMPTY" value={`${emptyPositions.length}`} />
      </View>

      {showEmptySummary && (
        <View style={styles.emptySeatStrip}>
          <Text style={styles.emptySeatLabel}>EMPTY SEAT POSITIONS</Text>
          <Text style={styles.emptySeatValue}>
            {emptyPositions.length > 0
              ? emptyPositions.map(({ row, column }) => `R${row}C${column}`).join("  ·  ")
              : "No empty seats"}
          </Text>
        </View>
      )}

      <View style={styles.invigilatorBox}>
        <Text style={styles.invigilatorLabel}>INVIGILATORS</Text>
        {room.invigilators.length > 0
          ? room.invigilators.map((faculty) => (
            <Text key={faculty.employeeId || faculty.fullName} style={styles.invigilatorName}>
              {faculty.fullName}{faculty.employeeId ? `  ·  ${faculty.employeeId}` : ""}
            </Text>
          ))
          : <Text style={styles.mutedSmall}>Not listed in the allocation report</Text>}
      </View>

      <Text style={styles.mapLabel}>SEAT MAP <Text style={styles.tapHint}>· tap a seat for details</Text></Text>
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.mapScroller}>
        <View style={styles.grid}>
          <View style={styles.board}><Text style={styles.boardText}>FRONT OF ROOM · BOARD</Text></View>
          {room.rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex + 1}`} style={styles.seatRow}>
              {row.map((seat) => {
                const isSelected = selectedSeat?.row === seat.row && selectedSeat.column === seat.column;
                const tone = seat.isCurrentStudent ? "mine" : seat.isEmpty ? "empty" : "occupied";
                return (
                  <Pressable
                    key={`${seat.row}-${seat.column}`}
                    accessibilityRole="button"
                    accessibilityLabel={seat.isEmpty
                      ? `Empty seat, row ${seat.row}, column ${seat.column}`
                      : `Occupied seat, row ${seat.row}, column ${seat.column}, ${seat.courseName || ""}, ${seat.rollNo || ""}`}
                    onPress={() => onSelectSeat(seat.row, seat.column)}
                    style={[
                      styles.seat,
                      tone === "mine" ? styles.mySeat : tone === "empty" ? styles.emptySeat : styles.occupiedSeat,
                      isSelected && styles.selectedSeat,
                    ]}
                  >
                    <Text style={[
                      styles.seatText,
                      tone === "mine" ? styles.mySeatText : tone === "empty" ? styles.emptySeatText : styles.occupiedSeatText,
                    ]}>
                      {seat.row},{seat.column}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <LegendDot label="Occupied" color={COLORS.coral} />
        <LegendDot label="Empty" color={COLORS.green} />
        {room.rows.flat().some((seat) => seat.isCurrentStudent) && <LegendDot label="Your seat" color={COLORS.blue} />}
      </View>

      {selectedSeat && (
        <SelectedSeatDetails
          seat={room.rows.flat().find((seat) => seat.row === selectedSeat.row && seat.column === selectedSeat.column)!}
        />
      )}
    </View>
  );
}

function SelectedSeatDetails({ seat }: { seat: ExamRoom["rows"][number][number] }) {
  return (
    <View style={styles.selectedDetails}>
      <Text style={styles.selectedTitle}>
        {seat.isCurrentStudent ? "YOUR ASSIGNED SEAT" : seat.isEmpty ? "AVAILABLE SEAT" : "OCCUPIED SEAT"}
        {"  ·  "}R{seat.row}C{seat.column}
      </Text>
      {!seat.isEmpty && (
        <>
          {seat.courseName && <Text style={styles.selectedValue}>{seat.courseName}</Text>}
          {seat.rollNo && <Text style={styles.selectedMeta}>Roll No. {seat.rollNo}</Text>}
          {seat.isSpecial && <Text style={styles.specialBadge}>SPECIAL SEAT</Text>}
        </>
      )}
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, selected && styles.filterChipSelected]}>
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function getEmptyPositions(room: ExamRoom) {
  return room.emptySeatPositions || room.rows.flat()
    .filter((seat) => seat.isEmpty)
    .map(({ row, column }) => ({ row, column }));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function buildInvigilationHtml(
  rooms: ExamRoom[],
  mode: "course" | "section",
  fullName: string,
  employeeId: string
) {
  const roomRows = rooms.map((room) => {
    const groups = [...new Set(room.rows.flat()
      .filter((seat) => !seat.isEmpty && seat.courseName)
      .map((seat) => seat.courseName as string))];
    return `<tr>
      <td>${escapeHtml(room.building)}</td>
      <td>${escapeHtml(room.roomNumber)}</td>
      <td>${escapeHtml(groups.join(", ") || "Not specified")}</td>
      <td>${escapeHtml(room.invigilators.map((item) => item.fullName).join(", ") || "Not listed")}</td>
      <td>${room.allocatedStudents}</td>
    </tr>`;
  }).join("");

  return `<!doctype html>
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: Arial, sans-serif; color: #172033; padding: 28px; }
      h1 { margin-bottom: 4px; font-size: 22px; }
      p { margin-top: 0; color: #526174; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 22px; }
      th, td { padding: 9px 7px; border: 1px solid #d5deea; text-align: left; font-size: 10px; }
      th { background: #edf3fa; }
    </style></head>
    <body>
      <h1>Invigilation assignments</h1>
      <p>SeatWise · ${mode} arrangement · ${rooms.length} assigned room${rooms.length === 1 ? "" : "s"}</p>
      <p>Faculty: ${escapeHtml(fullName)}${employeeId ? ` · ${escapeHtml(employeeId)}` : ""}</p>
      <table>
        <thead><tr><th>Building</th><th>Room</th><th>${mode === "section" ? "Course / section" : "Course"}</th><th>Invigilators</th><th>Students</th></tr></thead>
        <tbody>${roomRows}</tbody>
      </table>
    </body></html>`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 34 },
  centerState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 12 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  modeLabel: { color: COLORS.blue, fontSize: 9, fontWeight: "900", letterSpacing: 0.9, marginBottom: 10 },
  pdfButton: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 13, marginBottom: 12, borderRadius: 11, backgroundColor: COLORS.mint },
  pdfButtonText: { color: COLORS.background, fontSize: 11, fontWeight: "900" },
  buttonPressed: { opacity: 0.75 },
  buttonDisabled: { opacity: 0.6 },
  kicker: { color: COLORS.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "900", marginTop: 5, letterSpacing: -0.5 },
  countPill: { backgroundColor: "#193449", borderWidth: 1, borderColor: "#28556A", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  countText: { color: COLORS.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  mutedText: { color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  mutedSmall: { color: COLORS.muted, fontSize: 10, marginTop: 6 },
  errorCard: { backgroundColor: "#3A2028", padding: 14, borderRadius: 12, marginBottom: 12 },
  errorText: { color: "#FFC1C1", fontSize: 12, lineHeight: 18 },
  retryText: { color: COLORS.mint, fontSize: 12, fontWeight: "800", marginTop: 8 },
  searchInput: { minHeight: 46, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, paddingHorizontal: 14, color: COLORS.text, fontSize: 13 },
  filterRow: { flexDirection: "row", gap: 8, marginTop: 11 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.panel },
  filterChipSelected: { backgroundColor: "#163B3B", borderColor: "#2A6E68" },
  filterChipText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  filterChipTextSelected: { color: COLORS.mint },
  resultsText: { color: COLORS.muted, fontSize: 10, marginTop: 10, marginBottom: 12 },
  roomList: { gap: 14 },
  roomCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 19, padding: 14, overflow: "hidden" },
  roomHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  roomTitleGroup: { flex: 1 },
  roomNumber: { color: COLORS.text, fontSize: 18, fontWeight: "900" },
  building: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  allocated: { color: COLORS.blue, fontSize: 10, fontWeight: "800", marginTop: 5 },
  roomStats: { flexDirection: "row", gap: 8, marginTop: 13 },
  miniStat: { flex: 1, backgroundColor: COLORS.panelLight, borderRadius: 11, padding: 10 },
  miniStatLabel: { color: COLORS.muted, fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  miniStatValue: { color: COLORS.text, fontSize: 15, fontWeight: "900", marginTop: 5 },
  emptySeatStrip: { marginTop: 10, padding: 10, borderRadius: 10, backgroundColor: "#17382F", borderWidth: 1, borderColor: "#275B4D" },
  emptySeatLabel: { color: COLORS.green, fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  emptySeatValue: { color: "#D6F4E3", fontSize: 11, lineHeight: 17, marginTop: 5 },
  invigilatorBox: { marginTop: 10, padding: 11, borderRadius: 11, backgroundColor: "#152D43" },
  invigilatorLabel: { color: COLORS.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  invigilatorName: { color: COLORS.text, fontSize: 11, fontWeight: "700", marginTop: 5 },
  mapLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1, marginTop: 15, marginBottom: 8 },
  tapHint: { color: "#6F8097", fontWeight: "500", letterSpacing: 0 },
  mapScroller: { borderRadius: 12, backgroundColor: "#0D1929" },
  grid: { padding: 10, alignItems: "center", gap: 6 },
  board: { width: "100%", minWidth: 210, alignItems: "center", paddingVertical: 6, marginBottom: 3, borderBottomWidth: 1, borderBottomColor: "#36506B" },
  boardText: { color: "#8499B4", fontSize: 7, fontWeight: "800", letterSpacing: 1.2 },
  seatRow: { flexDirection: "row", gap: 5 },
  seat: { width: 43, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  occupiedSeat: { backgroundColor: "#462F30", borderColor: "#78504A" },
  emptySeat: { backgroundColor: "#1C4338", borderColor: "#39765B" },
  mySeat: { backgroundColor: "#203D65", borderColor: "#5B98EA" },
  selectedSeat: { borderWidth: 2, borderColor: "#FFFFFF" },
  seatText: { fontSize: 9, fontWeight: "800", fontVariant: ["tabular-nums"] },
  occupiedSeatText: { color: "#FFD1B7" },
  emptySeatText: { color: "#BDF3D2" },
  mySeatText: { color: "#D7E9FF" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: COLORS.muted, fontSize: 9 },
  selectedDetails: { marginTop: 10, padding: 12, backgroundColor: COLORS.panelLight, borderRadius: 11, borderLeftWidth: 3, borderLeftColor: COLORS.mint },
  selectedTitle: { color: COLORS.mint, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  selectedValue: { color: COLORS.text, fontSize: 12, lineHeight: 17, fontWeight: "700", marginTop: 7 },
  selectedMeta: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  specialBadge: { color: COLORS.amber, fontSize: 8, fontWeight: "900", marginTop: 6 },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 18 },
  pageButton: { backgroundColor: COLORS.panelLight, borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 10 },
  pageButtonDisabled: { opacity: 0.4 },
  pageButtonText: { color: COLORS.text, fontSize: 10, fontWeight: "800" },
  pageNumber: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  emptyState: { padding: 22, alignItems: "center", backgroundColor: COLORS.panel, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginTop: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 15, fontWeight: "800", marginBottom: 7 },
});
