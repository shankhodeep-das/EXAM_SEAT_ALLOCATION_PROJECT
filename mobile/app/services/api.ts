export type RoleGroup = "STUDENT" | "STAFF" | "ADMIN";
export type AllocationMode = "course" | "section";

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
  allocationMode: AllocationMode;
  student: StudentProfile;
  room: ExamRoom;
};

export type StaffDashboard = {
  allocationMode: AllocationMode;
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

export type StudentSeatLookup = {
  allocationMode: AllocationMode;
  student: Omit<StudentProfile, "email"> & {
    email: string | null;
    courseCode: string | null;
    courseLevel: string | null;
    specialReq: boolean;
    specialSeatReq: boolean;
  };
  room: {
    building: string;
    roomNumber: string;
    allocatedStudents: number;
    totalRows: number;
    totalColumns: number;
    totalSeats: number;
    specialSeatCount: number;
    seatCode: string;
    seat: { row: number; column: number; isSpecial: boolean };
    invigilators: Invigilator[];
    rows: {
      row: number;
      column: number;
      isEmpty: boolean;
      isSpecial: boolean;
      isCurrentStudent: boolean;
    }[][];
  } | null;
  message?: string;
};

export type Building = {
  id: number;
  buildingCode: string;
  buildingName: string;
  rooms: {
    id: number;
    roomNumber: string;
    totalRows: number;
    totalColumns: number;
    specialSeatCount: number;
  }[];
};

export type AllocationResult = {
  message: string;
  summary?: string[];
  filledCount?: number;
  remainingUnallocated?: number;
  skippedRooms?: number;
};

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

export function updatePassword(
  token: string,
  roleGroup: RoleGroup,
  currentPassword: string,
  newPassword: string
) {
  const endpoint = roleGroup === "STUDENT"
    ? "/api/student/password"
    : "/api/staff/password";
  return apiRequest<{ message: string }>(endpoint, {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  }, token);
}

export function getStudentSeat(token: string, rollNo: string) {
  return apiRequest<StudentSeatLookup>(
    `/api/staff/students/${encodeURIComponent(rollNo)}/seat`,
    {},
    token
  );
}

export function getBuildings(token: string) {
  return apiRequest<{ buildings: Building[] }>("/api/buildings", {}, token);
}

export function addBuildingRooms(
  token: string,
  payload: {
    buildingId?: number;
    buildingCode?: string;
    buildingName?: string;
    rooms: {
      roomNumber: string;
      totalRows: number;
      totalColumns: number;
      specialSeatCount: number;
    }[];
  }
) {
  return apiRequest<{
    message: string;
    building: { id: number; buildingCode: string; buildingName: string };
    rooms: Building["rooms"];
  }>(
    "/api/buildings",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
}

export function getAllocationMode(token: string) {
  return apiRequest<{ mode: AllocationMode }>(
    "/api/admin/room-matrix/display-mode",
    {},
    token
  );
}

export function setAllocationMode(token: string, mode: AllocationMode) {
  return apiRequest<{ mode: AllocationMode; message: string }>(
    "/api/admin/room-matrix/display-mode",
    { method: "PUT", body: JSON.stringify({ mode }) },
    token
  );
}

export function runAllocation(token: string, mode: AllocationMode, limit: number) {
  const isSection = mode === "section";
  return apiRequest<AllocationResult>(
    isSection ? "/api/admin/room-matrix/run-sections" : "/api/admin/room-matrix/run",
    {
      method: "POST",
      body: JSON.stringify(isSection
        ? { maxSectionsPerRoom: limit }
        : { maxCoursesPerRoom: limit }),
    },
    token
  );
}

export function fillEmptySeats(token: string) {
  return apiRequest<AllocationResult>(
    "/api/admin/room-matrix/fill-empty-seats",
    { method: "POST" },
    token
  );
}

export async function getStudents() {
  return apiRequest<{ students: { id: number; name: string; course: string }[] }>("/api/students");
}
