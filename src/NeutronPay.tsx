import React, { useCallback, useState, useEffect } from "react";
import { useNeutronPayment } from "./hooks/useNeutronPayment.js";
import { useCountdown } from "./hooks/useCountdown.js";
import { getTheme, getStyles } from "./styles.js";
import type { NeutronPayProps, InvoiceData } from "./types.js";

// Inject keyframe animation once
let styleInjected = false;
function injectStyles(nonce?: string) {
  if (styleInjected || typeof document === "undefined") return;
  try {
    const style = document.createElement("style");
    if (nonce) style.setAttribute("nonce", nonce);
    style.textContent = `@keyframes neutron-spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    styleInjected = true;
  } catch {
    // CSP may block this — spinner won't animate but component still works
  }
}

export function NeutronPay({
  amountSats,
  createUrl,
  statusUrl,
  memo,
  orderId,
  displayCurrency,
  exchangeRate,
  onPaid,
  onExpired,
  onError,
  pollIntervalMs = 3000,
  qrSize = 256,
  theme = "light",
  style,
  className,
  header,
  footer,
  showAmount = true,
  showCopyButton = true,
  showWalletButton = true,
  createParams,
  nonce,
}: NeutronPayProps) {
  const [copied, setCopied] = useState(false);
  const colors = getTheme(theme);
  const s = getStyles(colors);

  useEffect(() => injectStyles(nonce), [nonce]);

  const createInvoice = useCallback(async (): Promise<InvoiceData> => {
    const res = await fetch(createUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountSats, memo, orderId, ...createParams }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || `Create invoice failed (${res.status})`);
    }
    return res.json();
  }, [createUrl, amountSats, memo, orderId, createParams]);

  const checkStatus = useCallback(async (txnId: string): Promise<string> => {
    const res = await fetch(`${statusUrl}?txnId=${encodeURIComponent(txnId)}`);
    if (!res.ok) throw new Error(`Status check failed (${res.status})`);
    const data = await res.json();
    return data.status || data.txnState || data.state;
  }, [statusUrl]);

  const { status, invoice, qrDataUrl, error, create, reset } = useNeutronPayment({
    createInvoice,
    checkStatus,
    onPaid,
    onExpired,
    onError,
    pollIntervalMs,
  });

  const { formatted: timeFormatted, isExpired } = useCountdown(invoice?.expiresAt);

  // Handle expiry from countdown
  useEffect(() => {
    if (isExpired && status === "waiting") {
      onExpired?.(invoice!);
    }
  }, [isExpired]);

  const copyInvoice = useCallback(async () => {
    if (!invoice?.invoice) return;
    try {
      await navigator.clipboard.writeText(invoice.invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silent fail
      console.warn("[neutron-react] Clipboard API unavailable");
    }
  }, [invoice]);

  const openInWallet = useCallback(() => {
    if (!invoice?.invoice) return;
    // Validate invoice format to prevent URL injection
    const inv = invoice.invoice.toLowerCase();
    if (!inv.startsWith("lnbc") && !inv.startsWith("lntb") && !inv.startsWith("lnbcrt")) {
      console.warn("[neutron-react] Invalid invoice format, refusing to open wallet link");
      return;
    }
    window.location.href = `lightning:${invoice.invoice}`;
  }, [invoice]);

  const formatAmount = (sats: number): string => {
    return sats.toLocaleString("en-US");
  };

  // ── Render states ──────────────────────────────────────

  // Loading / Creating
  if (status === "idle" || status === "creating") {
    return (
      <div style={{ ...s.container, ...style }} className={className}>
        <div style={s.statusContainer}>
          <div style={s.spinner} />
          <p style={{ ...s.statusText, marginTop: "16px" }}>Creating invoice...</p>
        </div>
      </div>
    );
  }

  // Paid
  if (status === "paid") {
    return (
      <div style={{ ...s.container, ...style }} className={className}>
        <div style={{ ...s.statusContainer, ...s.successContainer }}>
          <div style={s.statusIcon}>✓</div>
          <p style={{ ...s.statusText, color: colors.success }}>Payment Received!</p>
          <p style={s.statusSubtext}>{formatAmount(amountSats)} sats confirmed</p>
        </div>
        {footer}
      </div>
    );
  }

  // Expired
  if (status === "expired" || (isExpired && status === "waiting")) {
    return (
      <div style={{ ...s.container, ...style }} className={className}>
        <div style={{ ...s.statusContainer, ...s.expiredContainer }}>
          <div style={s.statusIcon}>⏰</div>
          <p style={s.statusText}>Invoice Expired</p>
          <p style={s.statusSubtext}>The payment window has closed</p>
          <button style={{ ...s.primaryButton, marginTop: "16px" }} onClick={() => { reset(); create(); }}>
            Generate New Invoice
          </button>
        </div>
      </div>
    );
  }

  // Error
  if (status === "error") {
    return (
      <div style={{ ...s.container, ...style }} className={className}>
        <div style={{ ...s.statusContainer, ...s.errorContainer }}>
          <div style={s.statusIcon}>✕</div>
          <p style={{ ...s.statusText, color: colors.error }}>Payment Failed</p>
          <p style={s.statusSubtext}>{error?.message || "Something went wrong"}</p>
          <button style={{ ...s.primaryButton, marginTop: "16px" }} onClick={() => { reset(); create(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting for payment (main state) ───────────────────

  return (
    <div style={{ ...s.container, ...style }} className={className}>
      {header}

      {/* Amount */}
      {showAmount && (
        <div style={s.header}>
          <p style={s.amount}>{formatAmount(amountSats)} sats</p>
          {displayCurrency && exchangeRate && (
            <p style={s.amountSecondary}>
              ≈ {(amountSats / exchangeRate).toFixed(2)} {displayCurrency}
            </p>
          )}
          {memo && <p style={s.amountSecondary}>{memo}</p>}
        </div>
      )}

      {/* QR Code */}
      <div style={s.qrContainer}>
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Lightning Invoice QR Code"
            width={qrSize}
            height={qrSize}
            style={s.qrImage}
          />
        ) : (
          <div style={{ ...s.qrImage, width: qrSize, height: qrSize, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.cardBg }}>
            <div style={s.spinner} />
          </div>
        )}
      </div>

      {/* Invoice string (truncated) */}
      {invoice?.invoice && (
        <div style={s.invoiceText}>
          {invoice.invoice}
        </div>
      )}

      {/* Action buttons */}
      <div style={s.buttonRow}>
        {showCopyButton && (
          <button style={s.button} onClick={copyInvoice}>
            {copied ? "✓ Copied!" : "Copy Invoice"}
          </button>
        )}
        {showWalletButton && (
          <button style={s.primaryButton} onClick={openInWallet}>
            ⚡ Open Wallet
          </button>
        )}
      </div>

      {/* Timer */}
      {invoice?.expiresAt && (
        <p style={s.timer}>
          Expires in {timeFormatted}
        </p>
      )}

      {/* Powered by */}
      <p style={s.poweredBy}>Powered by Neutron</p>

      {footer}
    </div>
  );
}
