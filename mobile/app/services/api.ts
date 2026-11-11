export type RoleGroup = "STUDENT" | "STAFF" | "ADMIN";

export type SessionUser = {
  id: number;
  email: string;
  fullName: string | null;
  role: string;
  roleGroup: RoleGroup;
  employeeId?: string | null;
  staffType?: string | null;
  rollNo?: string;
};

export type Seat = {
  row: number;
  column: number;
  isEmpty: boolean;
  courseName: string | null;
  rollNo: string | null;
  isSpecial: boolean;
  isCurrentStudent?: boolean;
};

export type Invigilator = {
  fullName: string;
  employeeId: string | null;
};

export type ExamRoom = {
  building: string;
  roomNumber: string;
  invigilators: Invigilator[];
  allocatedStudents: number;
  rows: Seat[][];
  emptySeatPositions?: { row: number; column: number }[];
};

export type StudentProfile = {
  fullName: string;
  rollNo: string;
  email: string;
  courseName: string;
  section: string;
  semester: number;
};

export type OfficialProfile = {
  fullName: string | null;
  employeeId: string | null;
  department: string | null;
  designation: string | null;
  staffType: string | null;
  email: string;
  role: string;
  roleGroup: "STAFF" | "ADMIN";
};

export type StudentDashboard = {
  student: StudentProfile;
  room: ExamRoom;
};

export type StaffDashboard = {
  user: OfficialProfile;
  staffMembers: {
    fullName: string;
    employeeId: string;
    role: string;
    designation: string;
    department: string;
    staffType: string;
  }[];
  assignedRooms: ExamRoom[];
  adminRooms: ExamRoom[];
};

export type DashboardData = StudentDashboard | StaffDashboard;

type LoginResponse = {
  token: string;
  user: SessionUser;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("API URL is not configured. Set EXPO_PUBLIC_API_URL in mobile/.env.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data as T;
}

export function loginStudent(rollNo: string, email: string, password: string) {
  return apiRequest<LoginResponse>("/api/students/login", {
    method: "POST",
    body: JSON.stringify({ rollNo, email, password }),
  });
}

export function loginOfficial(email: string, password: string) {
  return apiRequest<LoginResponse>("/api/staff/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getDashboard(token: string, roleGroup: RoleGroup) {
  const endpoint = roleGroup === "STUDENT"
    ? "/api/auth/student/dashboard"
    : "/api/auth/staff/dashboard";
  return apiRequest<DashboardData>(endpoint, {}, token);
}

export async function getStudents() {
  return apiRequest<{ students: { id: number; name: string; course: string }[] }>("/api/students");
}
