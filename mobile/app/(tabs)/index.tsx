import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import {
  loginOfficial,
  loginStudent,
  StudentDashboard,
  StaffDashboard,
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
  amber: "#FFBE6B",
  red: "#FF8585",
};

type AccountType = "student" | "official";

export default function HomeScreen() {
  const { token, user, dashboard, initializing, dashboardLoading, dashboardError, signIn, refreshDashboard } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    setSubmitting(true);
    setLoginError("");
    try {
      const result = accountType === "student"
        ? await loginStudent(rollNo.trim(), email.trim(), password)
        : await loginOfficial(email.trim(), password);
      await signIn(result.token, result.user);
      setPassword("");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (initializing) {
    return <LoadingScreen label="Preparing your secure portal" />;
  }

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.loginScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
              <Text style={styles.brandName}>SEATWISE</Text>
              <Text style={styles.brandTag}>EXAM PORTAL</Text>
            </View>

            <View style={styles.hero}>
              <View style={styles.eyebrow}>
                <View style={styles.liveDot} />
                <Text style={styles.eyebrowText}>YOUR EXAM, IN VIEW</Text>
              </View>
              <Text style={styles.heroTitle}>A calmer way{"\n"}to find your seat.</Text>
              <Text style={styles.heroSubtitle}>
                Sign in to see your verified exam room, seat arrangement, and official details.
              </Text>
              <View style={styles.heroOrbLarge} />
              <View style={styles.heroOrbSmall} />
            </View>

            <View style={styles.loginCard}>
              <Text style={styles.cardKicker}>WELCOME BACK</Text>
              <Text style={styles.cardTitle}>Sign in to SeatWise</Text>
              <Text style={styles.cardSubtitle}>Choose your account type to continue.</Text>

              <View style={styles.segment}>
                {(["student", "official"] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      setAccountType(type);
                      setLoginError("");
                    }}
                    style={[styles.segmentOption, accountType === type && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentText, accountType === type && styles.segmentTextActive]}>
                      {type === "student" ? "Student" : "Faculty / Official"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {accountType === "student" && (
                <Field
                  label="ROLL NUMBER"
                  placeholder="BWU / CSE / 25 / 001"
                  value={rollNo}
                  onChangeText={setRollNo}
                  autoCapitalize="characters"
                />
              )}
              <Field
                label="COLLEGE EMAIL"
                placeholder="you@university.edu"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="PASSWORD"
                placeholder="Your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {!!loginError && <Text accessibilityRole="alert" style={styles.errorText}>{loginError}</Text>}

              <Pressable
                disabled={submitting || !email || !password || (accountType === "student" && !rollNo)}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (submitting || !email || !password || (accountType === "student" && !rollNo)) && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {submitting
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.primaryButtonText}>Continue securely <Text style={styles.buttonArrow}>→</Text></Text>}
              </Pressable>
              <Text style={styles.secureNote}>Your account is protected with secure on-device session storage.</Text>
            </View>

            <Text style={styles.footerText}>SEATWISE  •  EXAM SEATING, MADE CLEAR</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  if (dashboardLoading && !dashboard) {
    return <LoadingScreen label="Loading your official exam details" />;
  }

  if (dashboardError && !dashboard) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.errorState}>
          <Text style={styles.cardKicker}>CONNECTION ISSUE</Text>
          <Text style={styles.cardTitle}>Your dashboard could not load</Text>
          <Text style={styles.cardSubtitle}>{dashboardError}</Text>
          <Pressable onPress={refreshDashboard} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.dashboardScroll}
        refreshControl={
          <RefreshControl
            refreshing={dashboardLoading}
            onRefresh={refreshDashboard}
            tintColor={COLORS.mint}
          />
        }
      >
        <View style={styles.topBar}>
          <View style={styles.brandRowCompact}>
            <View style={styles.brandMarkSmall}><Text style={styles.brandMarkTextSmall}>S</Text></View>
            <Text style={styles.brandName}>SEATWISE</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>
              {user.roleGroup === "STUDENT" ? "STUDENT" : user.roleGroup === "ADMIN" ? "ADMIN" : "FACULTY"}
            </Text>
          </View>
        </View>

        <Text style={styles.welcomeLabel}>YOUR PORTAL, AT A GLANCE</Text>
        <Text style={styles.welcomeTitle}>Hello,{"\n"}{dashboardName(dashboard, user.fullName || user.email)}</Text>
        <Text style={styles.welcomeBody}>
          {user.roleGroup === "STUDENT"
            ? "Your exam seat and hall details are ready when you are."
            : "Your official exam assignments and account details."}
        </Text>

        {dashboard && "student" in dashboard ? (
          <StudentOverview data={dashboard} />
        ) : dashboard && "user" in dashboard ? (
          <OfficialOverview data={dashboard} />
        ) : (
          <View style={styles.errorState}>
            <Text style={styles.cardSubtitle}>Dashboard details are not available.</Text>
          </View>
        )}

        <View style={styles.bottomNote}>
          <Text style={styles.bottomNoteTitle}>Need your full seating plan?</Text>
          <Text style={styles.bottomNoteBody}>Open the Exam Room tab below to explore the room arrangement.</Text>
        </View>
        <Text style={styles.footerText}>SEATWISE  •  EXAM SEATING, MADE CLEAR</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StudentOverview({ data }: { data: StudentDashboard }) {
  const currentSeat = data.room.rows.flat().find((seat) => seat.isCurrentStudent);
  return (
    <>
      <View style={styles.seatHero}>
        <View style={styles.seatHeroTop}>
          <Text style={styles.seatHeroLabel}>YOUR ASSIGNED SEAT</Text>
          <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>VERIFIED</Text></View>
        </View>
        <Text style={styles.seatCode}>
          {currentSeat ? `R${currentSeat.row} · C${currentSeat.column}` : "Not assigned"}
        </Text>
        <Text style={styles.seatRoom}>{data.room.roomNumber}  /  {data.room.building}</Text>
        <View style={styles.seatAccent} />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="BUILDING" value={data.room.building.replace("University Building ", "UB ")} tone="blue" />
        <StatCard label="HALL" value={data.room.roomNumber} tone="mint" />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.cardKicker}>STUDENT DETAILS</Text>
        <InfoLine label="Roll number" value={data.student.rollNo} />
        <InfoLine label="Course" value={data.student.courseName} />
        <InfoLine label="Section / semester" value={`${data.student.section} · Semester ${data.student.semester}`} last />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.cardKicker}>ROOM TEAM</Text>
        {data.room.invigilators.length > 0
          ? data.room.invigilators.map((faculty) => (
            <InfoLine
              key={faculty.employeeId || faculty.fullName}
              label={faculty.employeeId || "Invigilator"}
              value={faculty.fullName}
            />
          ))
          : <Text style={styles.cardSubtitle}>No invigilators are listed in the allocation report.</Text>}
      </View>
    </>
  );
}

function OfficialOverview({ data }: { data: StaffDashboard }) {
  return (
    <>
      <View style={styles.officialBanner}>
        <Text style={styles.seatHeroLabel}>OFFICIAL ACCOUNT</Text>
        <Text style={styles.officialName}>{data.user.fullName || data.user.email}</Text>
        <Text style={styles.seatRoom}>{data.user.role}  ·  {data.user.employeeId || "No employee ID"}</Text>
      </View>
      <View style={styles.statsRow}>
        <StatCard label="ASSIGNED ROOMS" value={`${data.user.roleGroup === "ADMIN" ? data.adminRooms.length : data.assignedRooms.length}`} tone="mint" />
        <StatCard label="ACCOUNT TYPE" value={data.user.staffType || "Official"} tone="blue" />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.cardKicker}>PROFILE DETAILS</Text>
        <InfoLine label="Email" value={data.user.email} />
        <InfoLine label="Department" value={data.user.department || "Not provided"} />
        <InfoLine label="Designation" value={data.user.designation || "Not provided"} last />
      </View>
    </>
  );
}

function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#71819A"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.loadingState}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>S</Text></View>
        <ActivityIndicator color={COLORS.mint} style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>{label}</Text>
      </View>
    </SafeAreaView>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "mint" }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === "blue" ? styles.blueText : styles.mintText]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InfoLine({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoLine, !last && styles.infoLineBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function dashboardName(dashboard: StudentDashboard | StaffDashboard | null, fallback: string) {
  if (!dashboard) return fallback;
  return "student" in dashboard
    ? dashboard.student.fullName
    : dashboard.user.fullName || dashboard.user.email;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loginScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 22 },
  dashboardScroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 28 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandRowCompact: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.mint, alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: COLORS.background, fontSize: 24, fontWeight: "900" },
  brandMarkSmall: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.mint, alignItems: "center", justifyContent: "center" },
  brandMarkTextSmall: { color: COLORS.background, fontSize: 19, fontWeight: "900" },
  brandName: { color: COLORS.text, fontSize: 13, fontWeight: "900", letterSpacing: 2 },
  brandTag: { marginLeft: "auto", color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  hero: { paddingTop: 42, paddingBottom: 30, position: "relative", overflow: "hidden" },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 17 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.mint },
  eyebrowText: { color: COLORS.mint, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  heroTitle: { color: COLORS.text, fontSize: 37, lineHeight: 43, fontWeight: "800", letterSpacing: -1.2 },
  heroSubtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 13, maxWidth: 330 },
  heroOrbLarge: { position: "absolute", width: 170, height: 170, borderRadius: 85, right: -120, top: 20, borderWidth: 1, borderColor: "#253A50" },
  heroOrbSmall: { position: "absolute", width: 100, height: 100, borderRadius: 50, right: -90, top: 55, borderWidth: 1, borderColor: "#294B5A" },
  loginCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, padding: 21 },
  cardKicker: { color: COLORS.mint, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginBottom: 8 },
  cardTitle: { color: COLORS.text, fontSize: 21, lineHeight: 27, fontWeight: "800", letterSpacing: -0.5 },
  cardSubtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  segment: { flexDirection: "row", padding: 4, marginTop: 20, marginBottom: 18, borderRadius: 12, backgroundColor: COLORS.background },
  segmentOption: { flex: 1, minHeight: 42, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  segmentActive: { backgroundColor: COLORS.panelLight, borderWidth: 1, borderColor: COLORS.border },
  segmentText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
  segmentTextActive: { color: COLORS.text },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { color: "#BDCADB", fontSize: 9, fontWeight: "800", letterSpacing: 1.3, marginBottom: 7 },
  input: { minHeight: 49, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#0E192A", paddingHorizontal: 14, color: COLORS.text, fontSize: 14 },
  errorText: { color: COLORS.red, fontSize: 12, lineHeight: 18, marginBottom: 12 },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: COLORS.mint, alignItems: "center", justifyContent: "center", marginTop: 3, paddingHorizontal: 14 },
  primaryButtonText: { color: COLORS.background, fontWeight: "900", fontSize: 14 },
  buttonArrow: { fontSize: 18 },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  secureNote: { color: "#71819A", fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 13 },
  footerText: { color: "#64748B", textAlign: "center", fontSize: 9, fontWeight: "800", letterSpacing: 1.2, marginTop: 24 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rolePill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: "#193449", borderWidth: 1, borderColor: "#28556A" },
  rolePillText: { color: COLORS.mint, fontSize: 9, letterSpacing: 1.3, fontWeight: "900" },
  welcomeLabel: { color: COLORS.mint, fontSize: 9, fontWeight: "800", letterSpacing: 1.6, marginTop: 34 },
  welcomeTitle: { color: COLORS.text, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -1, marginTop: 10 },
  welcomeBody: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 9, marginBottom: 21 },
  seatHero: { overflow: "hidden", position: "relative", backgroundColor: "#173B46", borderRadius: 22, borderWidth: 1, borderColor: "#2B6870", padding: 20, minHeight: 166, justifyContent: "space-between" },
  seatHeroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  seatHeroLabel: { color: "#B3D8D6", fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
  verifiedBadge: { backgroundColor: "#254F50", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  verifiedText: { color: COLORS.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  seatCode: { color: "#F4FFFD", fontSize: 33, fontWeight: "900", letterSpacing: 1, marginTop: 13 },
  seatRoom: { color: "#C0D4D9", fontSize: 12, marginTop: 5 },
  seatAccent: { position: "absolute", right: -34, bottom: -96, height: 190, width: 190, borderRadius: 95, borderWidth: 1, borderColor: "#35747A" },
  statsRow: { flexDirection: "row", gap: 11, marginTop: 12 },
  statCard: { flex: 1, minWidth: 0, borderRadius: 16, padding: 15, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border },
  statLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  statValue: { fontSize: 16, fontWeight: "900", marginTop: 9 },
  blueText: { color: COLORS.blue },
  mintText: { color: COLORS.mint },
  infoCard: { marginTop: 12, padding: 17, borderRadius: 17, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.border },
  infoLine: { paddingVertical: 12 },
  infoLineBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.muted, fontSize: 10, marginBottom: 5 },
  infoValue: { color: COLORS.text, fontSize: 13, lineHeight: 19, fontWeight: "700" },
  officialBanner: { backgroundColor: "#1E3150", borderWidth: 1, borderColor: "#30496B", padding: 20, borderRadius: 22, marginTop: 4 },
  officialName: { color: COLORS.text, fontSize: 23, fontWeight: "800", marginTop: 13 },
  bottomNote: { backgroundColor: "#142536", borderWidth: 1, borderColor: "#284151", borderRadius: 15, padding: 15, marginTop: 14 },
  bottomNoteTitle: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  bottomNoteBody: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  errorState: { flex: 1, justifyContent: "center", padding: 24 },
  loadingState: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.muted, fontSize: 12, marginTop: 14 },
});
