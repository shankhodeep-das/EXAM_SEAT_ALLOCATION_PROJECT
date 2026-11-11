import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { StaffDashboard, StudentDashboard } from "../services/api";

const COLORS = {
  background: "#0B1423",
  panel: "#121F33",
  panelLight: "#192941",
  border: "#263852",
  text: "#F4F7FB",
  muted: "#9EACC0",
  mint: "#4DE1C1",
  red: "#FF8585",
};

export default function ProfileScreen() {
  const { user, dashboard, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.muted}>Sign in to view your account information.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const details = dashboard
    ? "student" in dashboard
      ? getStudentDetails(dashboard)
      : getOfficialDetails(dashboard)
    : [];
  const name = dashboard && "student" in dashboard
    ? dashboard.student.fullName
    : dashboard && "user" in dashboard
      ? dashboard.user.fullName || dashboard.user.email
      : user.fullName || user.email;
  const role = dashboard && "user" in dashboard ? dashboard.user.role : user.role;
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  const handleSignOut = async () => {
    setSigningOut(true);
    setError("");
    try {
      await signOut();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ACCOUNT & PREFERENCES</Text>
        <Text style={styles.title}>Your profile</Text>

        <View style={styles.identityCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <View style={styles.roleBadge}><Text style={styles.roleText}>{role}</Text></View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          {details.length === 0 ? (
            <Text style={styles.muted}>Account details are still loading.</Text>
          ) : details.map((detail, index) => (
            <View
              key={detail.label}
              style={[styles.detailRow, index < details.length - 1 && styles.detailBorder]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue}>{detail.value || "Not provided"}</Text>
            </View>
          ))}
        </View>

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
        >
          {signingOut
            ? <ActivityIndicator color={COLORS.red} />
            : <Text style={styles.signOutText}>Sign out</Text>}
        </Pressable>

        <Text style={styles.footer}>SEATWISE  •  EXAM SEATING, MADE CLEAR</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStudentDetails(data: StudentDashboard) {
  return [
    { label: "Roll number", value: data.student.rollNo },
    { label: "Course", value: data.student.courseName },
    { label: "Section", value: data.student.section },
    { label: "Semester", value: String(data.student.semester) },
    { label: "Exam room", value: `${data.room.building} · ${data.room.roomNumber}` },
  ];
}

function getOfficialDetails(data: StaffDashboard) {
  return [
    { label: "Employee ID", value: data.user.employeeId || "Not assigned" },
    { label: "Role", value: data.user.role },
    { label: "Account type", value: data.user.staffType || "Official" },
    { label: "Department", value: data.user.department || "Not provided" },
    { label: "Designation", value: data.user.designation || "Not provided" },
    { label: "Assigned rooms", value: String(data.user.roleGroup === "ADMIN" ? data.adminRooms.length : data.assignedRooms.length) },
  ];
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 32 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  kicker: { color: COLORS.mint, fontSize: 9, letterSpacing: 1.5, fontWeight: "900" },
  title: { color: COLORS.text, fontSize: 28, fontWeight: "900", marginTop: 6 },
  identityCard: { alignItems: "center", padding: 24, marginTop: 20, borderRadius: 22, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 76, height: 76, alignItems: "center", justifyContent: "center", borderRadius: 38, backgroundColor: "#193B48", borderWidth: 1, borderColor: "#2A6A70" },
  avatarText: { color: COLORS.mint, fontSize: 32, fontWeight: "900" },
  name: { color: COLORS.text, fontSize: 19, fontWeight: "800", marginTop: 15, textAlign: "center" },
  email: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  roleBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#183A3B", borderRadius: 99 },
  roleText: { color: COLORS.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  detailsCard: { padding: 17, marginTop: 14, borderRadius: 18, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { color: COLORS.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.4, marginBottom: 5 },
  detailRow: { paddingVertical: 12 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { color: COLORS.muted, fontSize: 10, marginBottom: 5 },
  detailValue: { color: COLORS.text, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  muted: { color: COLORS.muted, fontSize: 13, textAlign: "center", marginTop: 8 },
  error: { color: COLORS.red, fontSize: 12, marginTop: 14, textAlign: "center" },
  signOutButton: { minHeight: 49, justifyContent: "center", alignItems: "center", marginTop: 18, borderRadius: 13, borderWidth: 1, borderColor: "#693B48", backgroundColor: "#351F2B" },
  signOutText: { color: COLORS.red, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  footer: { color: "#64748B", textAlign: "center", fontSize: 8, fontWeight: "800", letterSpacing: 1.1, marginTop: 24 },
});
