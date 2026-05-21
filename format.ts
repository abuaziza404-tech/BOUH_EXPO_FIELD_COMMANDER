export function fixed4(value: number): string {
  if (!Number.isFinite(value)) return "0.0000";
  return value.toFixed(4);
}

export function fixed3(value: number): string {
  if (!Number.isFinite(value)) return "0.000";
  return value.toFixed(3);
}

export function pct2(value: number): string {
  if (!Number.isFinite(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
}

export function clamp(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
