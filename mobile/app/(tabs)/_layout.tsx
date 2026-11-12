import { Tabs } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function TabLayout() {
  const { token, user, initializing } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4DE1C1",
        tabBarInactiveTintColor: "#8190A8",
        tabBarStyle: {
          display: initializing || !token ? "none" : "flex",
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: "#111C2E",
          borderTopColor: "#26364D",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarLabel: "Overview",
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: "Exam room",
          tabBarLabel: "Exam room",
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Tools",
          tabBarLabel: "Tools",
          href: user && user.roleGroup === "STUDENT" ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}
