import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { PixelSpectralResult } from "@/core/types";
import { SYSTEM } from "@/core/constants";
import { encryptJsonAes256 } from "./crypto";

const ENDPOINT_KEY = `${SYSTEM.storagePrefix}:alertEndpoint`;
const PASSWORD_KEY = `${SYSTEM.storagePrefix}:alertPassword`;

export async function setAlertEndpoint(endpoint: string) {
  await SecureStore.setItemAsync(ENDPOINT_KEY, endpoint);
}

export async function setAlertPassword(password: string) {
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
}

export async function sendHighConfidenceAlert(result: PixelSpectralResult): Promise<{ sent: boolean; code: string }> {
  if (result.targetConfidence < SYSTEM.alertThreshold) return { sent: false, code: "BELOW_THRESHOLD" };
  const net = await NetInfo.fetch();
  if (!net.isConnected) return { sent: false, code: "OFFLINE" };
  const endpoint = await SecureStore.getItemAsync(ENDPOINT_KEY);
  const password = await SecureStore.getItemAsync(PASSWORD_KEY);
  if (!endpoint || !password) return { sent: false, code: "MISSING_SECURE_ENDPOINT" };
  const encrypted = encryptJsonAes256({ system: SYSTEM.name, result, createdAt: new Date().toISOString() }, password);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(encrypted)
  });
  return { sent: response.ok, code: response.ok ? "SENT_AES256" : `HTTP_${response.status}` };
}
