import "react-native-gesture-handler";
import React from "react";
import { Tabs } from "expo-router";
import { COLORS } from "@/core/constants";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.obsidian },
        headerTintColor: COLORS.sovereignGold,
        tabBarStyle: { backgroundColor: COLORS.matteTeal, borderTopColor: COLORS.panelBorder },
        tabBarActiveTintColor: COLORS.sovereignGold,
        tabBarInactiveTintColor: COLORS.cyberCyan
      }}
    >
      <Tabs.Screen name="index" options={{ title: "MAP" }} />
      <Tabs.Screen name="klemm" options={{ title: "KLEMM" }} />
      <Tabs.Screen name="data" options={{ title: "DATA" }} />
      <Tabs.Screen name="security" options={{ title: "SECURITY" }} />
    </Tabs>
  );
}
