import { useState, useEffect, useRef, useCallback } from "react";
import type { PaymentStatus, InvoiceData, UseNeutronPaymentOptions } from "../types.js";

const FINAL_STATES = ["completed", "failed", "expired", "rejected", "error", "usercanceled"];
const PAID_STATES = ["completed"];
const EXPIRED_STATES = ["expired"];

export function useNeutronPayment(options: UseNeutronPaymentOptions) {
  const {
    createInvoice,
    checkStatus,
    onPaid,
    onExpired,
    onError,
    pollIntervalMs = 3000,
    autoCreate = true,
  } = options;

  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Generate QR code when invoice changes
  useEffect(() => {
    if (!invoice?.invoice) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const QRCode = await import("qrcode");
        const url = await QRCode.toDataURL(invoice.invoice.toUpperCase(), {
          width: 512,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
        if (!cancelled && mountedRef.current) setQrDataUrl(url);
      } catch {
        // QR generation failed — fallback to hosted URL
        if (!cancelled && mountedRef.current && invoice.qrPageUrl) {
          setQrDataUrl(null);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [invoice?.invoice]);

  // Poll for payment status
  const startPolling = useCallback((data: InvoiceData) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let consecutiveErrors = 0;
    const MAX_CONSECUTIVE_ERRORS = 10;

    pollRef.current = setInterval(async () => {
      if (!mountedRef.current) return;

      try {
        const txnState = await checkStatus(data.txnId);
        consecutiveErrors = 0; // Reset on success

        if (!mountedRef.current) return;

        if (PAID_STATES.includes(txnState)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("paid");
          onPaid?.(data);
        } else if (EXPIRED_STATES.includes(txnState)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus("expired");
          onExpired?.(data);
        } else if (FINAL_STATES.includes(txnState) && !PAID_STATES.includes(txnState)) {
          if (pollRef.current) clearInterval(pollRef.current);
          const err = new Error(`Payment ${txnState}`);
          setError(err);
          setStatus("error");
          onError?.(err);
        }
      } catch (err) {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          if (pollRef.current) clearInterval(pollRef.current);
          const error = new Error("Unable to check payment status. Please check your connection.");
          setError(error);
          setStatus("error");
          onError?.(error);
        }
      }
    }, pollIntervalMs);
  }, [checkStatus, pollIntervalMs, onPaid, onExpired, onError]);

  // Create invoice
  const create = useCallback(async () => {
    if (!mountedRef.current) return;

    setStatus("creating");
    setError(null);
    setInvoice(null);
    setQrDataUrl(null);

    try {
      const data = await createInvoice();
      if (!mountedRef.current) return;

      setInvoice(data);
      setStatus("waiting");
      startPolling(data);
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setStatus("error");
      onError?.(error);
    }
  }, [createInvoice, startPolling, onError]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus("idle");
    setInvoice(null);
    setError(null);
    setQrDataUrl(null);
  }, []);

  // Auto-create on mount
  useEffect(() => {
    if (autoCreate) create();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return {
    /** Current payment status */
    status,
    /** Invoice data (null until created) */
    invoice,
    /** QR code as data URL (null until generated) */
    qrDataUrl,
    /** Error if any */
    error,
    /** Manually create/recreate an invoice */
    create,
    /** Reset to idle state */
    reset,
  };
}
