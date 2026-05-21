import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/core/constants";

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: "rgba(255,255,255,0.07)",
    borderBottomWidth: 1,
    paddingVertical: 5
  },
  label: { color: "rgba(255,255,255,0.70)", fontSize: 12 },
  value: { color: COLORS.cyberCyan, fontWeight: "800", fontSize: 12 }
});
