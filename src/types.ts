import type { CSSProperties, ReactNode } from "react";

// ── Payment states ──────────────────────────────────────────

export type PaymentStatus =
  | "idle"       // Not started
  | "creating"   // Creating invoice
  | "waiting"    // Invoice created, waiting for payment
  | "detecting"  // Payment detected, confirming
  | "paid"       // Payment confirmed
  | "expired"    // Invoice expired
  | "error";     // Something went wrong

// ── Invoice data ────────────────────────────────────────────

export interface InvoiceData {
  /** BOLT11 Lightning invoice string */
  invoice: string;
  /** Transaction ID for status polling */
  txnId: string;
  /** Amount in satoshis */
  amountSats: number;
  /** Invoice expiry timestamp (ms) */
  expiresAt?: number;
  /** Hosted QR code page URL */
  qrPageUrl?: string;
}

// ── Hook options ────────────────────────────────────────────

export interface UseNeutronPaymentOptions {
  /**
   * Function to create an invoice on your backend.
   * Should POST to your server and return InvoiceData.
   *
   * @example
   * createInvoice: async () => {
   *   const res = await fetch("/api/create-invoice", {
   *     method: "POST",
   *     body: JSON.stringify({ amountSats: 10000 }),
   *   });
   *   return res.json();
   * }
   */
  createInvoice: () => Promise<InvoiceData>;

  /**
   * Function to check payment status on your backend.
   * Should return the current transaction state.
   *
   * @example
   * checkStatus: async (txnId) => {
   *   const res = await fetch(`/api/status/${txnId}`);
   *   const data = await res.json();
   *   return data.status; // "completed", "pending", etc.
   * }
   */
  checkStatus: (txnId: string) => Promise<string>;

  /** Called when payment is confirmed */
  onPaid?: (data: InvoiceData) => void;

  /** Called when invoice expires */
  onExpired?: (data: InvoiceData) => void;

  /** Called on any error */
  onError?: (error: Error) => void;

  /** Polling interval in ms (default: 3000) */
  pollIntervalMs?: number;

  /** Auto-create invoice on mount (default: true) */
  autoCreate?: boolean;
}

// ── Component props ─────────────────────────────────────────

export interface NeutronPayProps {
  /** Amount in satoshis */
  amountSats: number;

  /** Your backend endpoint to create an invoice (POST) */
  createUrl: string;

  /** Your backend endpoint to check status (GET, appends ?txnId=xxx) */
  statusUrl: string;

  /** Invoice memo/description */
  memo?: string;

  /** Your order/reference ID (sent to createUrl) */
  orderId?: string;

  /** Currency to display alongside sats (e.g. "USD") */
  displayCurrency?: string;

  /** Exchange rate for display currency (sats per unit) */
  exchangeRate?: number;

  /** Called when payment is confirmed */
  onPaid?: (data: InvoiceData) => void;

  /** Called when invoice expires */
  onExpired?: (data: InvoiceData) => void;

  /** Called on error */
  onError?: (error: Error) => void;

  /** Polling interval in ms (default: 3000) */
  pollIntervalMs?: number;

  /** QR code size in pixels (default: 256) */
  qrSize?: number;

  /** Theme */
  theme?: "light" | "dark";

  /** Custom styles override */
  style?: CSSProperties;

  /** Custom class name */
  className?: string;

  /** Custom header content */
  header?: ReactNode;

  /** Custom footer content */
  footer?: ReactNode;

  /** Show amount display (default: true) */
  showAmount?: boolean;

  /** Show copy button (default: true) */
  showCopyButton?: boolean;

  /** Show "Open in wallet" button (default: true) */
  showWalletButton?: boolean;

  /** Additional body params to send to createUrl */
  createParams?: Record<string, any>;

  /** CSP nonce for injected style tags */
  nonce?: string;
}
