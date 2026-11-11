import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DashboardData,
  getDashboard,
  RoleGroup,
  SessionUser,
} from "../services/api";

const TOKEN_KEY = "seatwise.session.token";
const USER_KEY = "seatwise.session.user";

type AuthContextValue = {
  token: string | null;
  user: SessionUser | null;
  dashboard: DashboardData | null;
  initializing: boolean;
  dashboardLoading: boolean;
  dashboardError: string;
  signIn: (token: string, user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (!active) return;

        if (storedToken && storedUser) {
          const restoredUser = JSON.parse(storedUser) as SessionUser;
          setToken(storedToken);
          setUser(restoredUser);
          try {
            const data = await getDashboard(storedToken, restoredUser.roleGroup);
            if (active) setDashboard(data);
          } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load your dashboard.";
            if (active) setDashboardError(message);
          }
        } else if (storedToken || storedUser) {
          await Promise.all([
            SecureStore.deleteItemAsync(TOKEN_KEY),
            SecureStore.deleteItemAsync(USER_KEY),
          ]);
        }
      } catch (error) {
        console.error("Unable to restore the saved session:", error);
        if (active) setDashboardError("Could not restore your saved session. Please sign in again.");
      } finally {
        if (active) setInitializing(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (!token || !user) return;

    setDashboardLoading(true);
    setDashboardError("");
    try {
      const data = await getDashboard(token, user.roleGroup as RoleGroup);
      setDashboard(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load your dashboard.";
      setDashboardError(message);
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  }, [token, user]);

  const signIn = useCallback(async (nextToken: string, nextUser: SessionUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, nextToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser)),
    ]);
    setDashboard(null);
    setDashboardError("");
    setUser(nextUser);
    setToken(nextToken);
    setDashboardLoading(true);
    try {
      const data = await getDashboard(nextToken, nextUser.roleGroup);
      setDashboard(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load your dashboard.";
      setDashboardError(message);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setDashboard(null);
    setDashboardError("");
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      dashboard,
      initializing,
      dashboardLoading,
      dashboardError,
      signIn,
      signOut,
      refreshDashboard,
    }),
    [
      token,
      user,
      dashboard,
      initializing,
      dashboardLoading,
      dashboardError,
      signIn,
      signOut,
      refreshDashboard,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
