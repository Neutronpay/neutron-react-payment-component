import type { CSSProperties } from "react";

export interface ThemeColors {
  bg: string;
  cardBg: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentText: string;
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  expiredBg: string;
}

const lightTheme: ThemeColors = {
  bg: "#ffffff",
  cardBg: "#f9fafb",
  text: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  accent: "#f7931a", // Bitcoin orange
  accentText: "#ffffff",
  success: "#059669",
  successBg: "#ecfdf5",
  error: "#dc2626",
  errorBg: "#fef2f2",
  expiredBg: "#fefce8",
};

const darkTheme: ThemeColors = {
  bg: "#111827",
  cardBg: "#1f2937",
  text: "#f9fafb",
  textSecondary: "#9ca3af",
  border: "#374151",
  accent: "#f7931a",
  accentText: "#ffffff",
  success: "#34d399",
  successBg: "#064e3b",
  error: "#f87171",
  errorBg: "#7f1d1d",
  expiredBg: "#713f12",
};

export function getTheme(theme: "light" | "dark"): ThemeColors {
  return theme === "dark" ? darkTheme : lightTheme;
}

export function getStyles(t: ThemeColors) {
  return {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "380px",
      width: "100%",
      textAlign: "center" as const,
      color: t.text,
    } satisfies CSSProperties,

    header: {
      marginBottom: "16px",
    } satisfies CSSProperties,

    amount: {
      fontSize: "28px",
      fontWeight: "700",
      margin: "0 0 4px",
      color: t.text,
    } satisfies CSSProperties,

    amountSecondary: {
      fontSize: "14px",
      color: t.textSecondary,
      margin: "0 0 16px",
    } satisfies CSSProperties,

    qrContainer: {
      display: "flex",
      justifyContent: "center",
      marginBottom: "16px",
    } satisfies CSSProperties,

    qrImage: {
      borderRadius: "8px",
      border: `1px solid ${t.border}`,
    } satisfies CSSProperties,

    invoiceText: {
      fontSize: "11px",
      fontFamily: "monospace",
      color: t.textSecondary,
      backgroundColor: t.cardBg,
      border: `1px solid ${t.border}`,
      borderRadius: "8px",
      padding: "10px",
      wordBreak: "break-all" as const,
      marginBottom: "12px",
      maxHeight: "60px",
      overflow: "hidden",
      lineHeight: "1.4",
    } satisfies CSSProperties,

    buttonRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "16px",
    } satisfies CSSProperties,

    button: {
      flex: "1",
      padding: "10px 16px",
      borderRadius: "8px",
      border: `1px solid ${t.border}`,
      backgroundColor: t.cardBg,
      color: t.text,
      fontSize: "13px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "opacity 0.15s",
    } satisfies CSSProperties,

    primaryButton: {
      flex: "1",
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: t.accent,
      color: t.accentText,
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "opacity 0.15s",
    } satisfies CSSProperties,

    timer: {
      fontSize: "13px",
      color: t.textSecondary,
      marginBottom: "8px",
    } satisfies CSSProperties,

    statusContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    } satisfies CSSProperties,

    statusIcon: {
      fontSize: "48px",
      marginBottom: "12px",
    } satisfies CSSProperties,

    statusText: {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "8px",
    } satisfies CSSProperties,

    statusSubtext: {
      fontSize: "14px",
      color: t.textSecondary,
    } satisfies CSSProperties,

    successContainer: {
      backgroundColor: t.successBg,
      borderRadius: "12px",
      border: `1px solid ${t.success}`,
    } satisfies CSSProperties,

    errorContainer: {
      backgroundColor: t.errorBg,
      borderRadius: "12px",
      border: `1px solid ${t.error}`,
    } satisfies CSSProperties,

    expiredContainer: {
      backgroundColor: t.expiredBg,
      borderRadius: "12px",
    } satisfies CSSProperties,

    spinner: {
      width: "24px",
      height: "24px",
      border: `3px solid ${t.border}`,
      borderTopColor: t.accent,
      borderRadius: "50%",
      animation: "neutron-spin 0.8s linear infinite",
    } satisfies CSSProperties,

    poweredBy: {
      fontSize: "11px",
      color: t.textSecondary,
      marginTop: "12px",
      opacity: 0.6,
    } satisfies CSSProperties,
  };
}
