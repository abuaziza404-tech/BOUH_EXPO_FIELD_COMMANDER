import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "@/core/constants";
import { Panel } from "@/components/Panel";
import { setAlertEndpoint, setAlertPassword } from "@/services/alerts";

export default function SecurityScreen() {
  const [endpoint, setEndpoint] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("SECURE_STORE_EMPTY");

  async function save() {
    await setAlertEndpoint(endpoint.trim());
    await setAlertPassword(password);
    setStatus("SECURE_STORE_UPDATED");
  }

  return (
    <View style={styles.root}>
      <Text style={styles.header}>SOVEREIGN SECURITY</Text>
      <Panel title="AES-256 ALERT SETTINGS">
        <TextInput value={endpoint} onChangeText={setEndpoint} style={styles.input} placeholder="REST endpoint for encrypted alert" placeholderTextColor="rgba(255,255,255,0.35)" />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="Ahmed password / key phrase" placeholderTextColor="rgba(255,255,255,0.35)" />
        <Pressable style={styles.button} onPress={save}><Text style={styles.buttonText}>SAVE SECURE SETTINGS</Text></Pressable>
        <Text style={styles.status}>{status}</Text>
      </Panel>
      <Panel title="KEY POLICY">
        <Text style={styles.text}>SMTP/API keys are never hardcoded. The app stores only the endpoint and password phrase in SecureStore. Alert payloads are encrypted AES-256-CBC with PBKDF2-SHA256 before network dispatch.</Text>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, backgroundColor: COLORS.obsidian },
  header: { color: COLORS.sovereignGold, fontWeight: "900", fontSize: 16, marginBottom: 10 },
  input: { borderColor: COLORS.panelBorder, borderWidth: 1, borderRadius: 10, padding: 10, color: "white", marginBottom: 8 },
  button: { backgroundColor: COLORS.sovereignGold, padding: 12, borderRadius: 10, marginBottom: 8 },
  buttonText: { color: COLORS.obsidian, fontWeight: "900" },
  status: { color: COLORS.cyberCyan },
  text: { color: "rgba(255,255,255,0.70)", fontSize: 12 }
});
