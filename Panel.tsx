import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/core/constants";

export function Panel(props: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.panel}>
      {props.title ? <Text style={styles.title}>{props.title}</Text> : null}
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(10,17,16,0.92)",
    borderColor: COLORS.panelBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10
  },
  title: {
    color: COLORS.sovereignGold,
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 8
  }
});
