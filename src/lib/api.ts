import { API_BASE_URL } from "./config";

export type FieldType = "select" | "number" | "scale";
export type GroupName = "Thông tin chung" | "Học tập" | "Đời sống";

export interface SchemaOption {
  value: string | number;
  label: string;
}

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  group: string;
  options?: (SchemaOption | string | number)[];
  min?: number;
  max?: number;
  default?: number | string | null;
  hint?: string;
}

export interface SchemaResponse {
  fields: SchemaField[];
  disclaimer: string;
}

export type RiskLevel = "low" | "moderate" | "high";

export interface Contribution {
  feature: string;
  contribution: number;
  direction: "increase" | "decrease";
  text: string;
}

export interface PredictResponse {
  percent: number;
  risk_level: RiskLevel;
  risk_label: string;
  model_used: string;
  model_reason: string;
  n_missing: number;
  recommendation: string;
  contributions: Contribution[];
  disclaimer: string;
}

export interface ThresholdRow {
  capacity_pct: number;
  threshold: number;
  precision: number;
  recall: number;
}

export class ApiError extends Error {}

const CONNECT_MESSAGE = "Không kết nối được máy chủ. Hãy kiểm tra API đã chạy chưa.";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(CONNECT_MESSAGE);
  }
  if (!res.ok) {
    throw new ApiError("Máy chủ phản hồi lỗi. Vui lòng thử lại sau ít phút.");
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError("Dữ liệu trả về không hợp lệ. Vui lòng thử lại.");
  }
}

export const getSchema = () => request<SchemaResponse>("/schema");

export const postPredict = (payload: Record<string, unknown>) =>
  request<PredictResponse>("/predict", { method: "POST", body: JSON.stringify(payload) });

export const getThresholds = () =>
  request<ThresholdRow[] | { thresholds: ThresholdRow[] }>("/thresholds").then((data) =>
    Array.isArray(data) ? data : (data.thresholds ?? []),
  );

export function normalizeOptions(field: SchemaField): SchemaOption[] {
  return (field.options ?? []).map((o) =>
    typeof o === "object" && o !== null
      ? (o as SchemaOption)
      : { value: o as string | number, label: String(o) },
  );
}

export const RISK_COLOR: Record<RiskLevel, string> = {
  low: "#5B8C6E",
  moderate: "#D89B4A",
  high: "#C4614F",
};
