/**
 * ============================================================
 *  CẤU HÌNH DUY NHẤT — Sửa địa chỉ máy chủ API tại đây.
 * ============================================================
 * Có thể ghi đè bằng biến môi trường VITE_API_BASE_URL khi build.
 */
export const API_BASE_URL: string =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
