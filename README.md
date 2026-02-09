# Neutron React

[![npm version](https://img.shields.io/npm/v/neutron-react.svg)](https://www.npmjs.com/package/neutron-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Drop-in React components for Bitcoin Lightning payments. Add a payment checkout to your app in one line.

## Install

```bash
npm install neutron-react
```

## Quick Start

```jsx
import { NeutronPay } from "neutron-react";

function Checkout() {
  return (
    <NeutronPay
      amountSats={10000}
      createUrl="/api/neutron/create-invoice"
      statusUrl="/api/neutron/status"
      onPaid={(data) => console.log("Paid!", data.txnId)}
    />
  );
}
```

That's it. The component handles:
- ⚡ QR code generation
- 📋 Copy-to-clipboard
- 📱 "Open in Wallet" deep link
- ⏰ Countdown timer
- 🔄 Auto-polling for payment status
- ✅ Success / expired / error states
- 🌙 Light and dark themes

## Backend Setup

The component talks to YOUR backend (never exposes API keys in the browser).

You need two endpoints:

### 1. Create Invoice (`POST /api/neutron/create-invoice`)

```typescript
// Next.js API route example
import { Neutron } from "neutron-sdk";

const neutron = new Neutron({
  apiKey: process.env.NEUTRON_API_KEY!,
  apiSecret: process.env.NEUTRON_API_SECRET!,
});

export async function POST(req: Request) {
  const { amountSats, memo, orderId } = await req.json();

  const invoice = await neutron.lightning.createInvoice({
    amountSats,
    memo,
    extRefId: orderId,
  });

  return Response.json({
    invoice: invoice.invoice,
    txnId: invoice.txnId,
    amountSats: invoice.amountSats,
    expiresAt: Date.now() + 3600000, // 1 hour
    qrPageUrl: invoice.qrPageUrl,
  });
}
```

### 2. Check Status (`GET /api/neutron/status?txnId=xxx`)

```typescript
export async function GET(req: Request) {
  const txnId = new URL(req.url).searchParams.get("txnId")!;
  const txn = await neutron.transactions.get(txnId);

  return Response.json({ status: txn.txnState });
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `amountSats` | `number` | required | Amount in satoshis |
| `createUrl` | `string` | required | Your backend endpoint to create invoices |
| `statusUrl` | `string` | required | Your backend endpoint to check payment status |
| `memo` | `string` | — | Invoice description |
| `orderId` | `string` | — | Your reference ID (sent to createUrl) |
| `onPaid` | `(data) => void` | — | Called when payment is confirmed |
| `onExpired` | `(data) => void` | — | Called when invoice expires |
| `onError` | `(error) => void` | — | Called on any error |
| `theme` | `"light" \| "dark"` | `"light"` | Color theme |
| `qrSize` | `number` | `256` | QR code size in pixels |
| `showAmount` | `boolean` | `true` | Show amount display |
| `showCopyButton` | `boolean` | `true` | Show copy invoice button |
| `showWalletButton` | `boolean` | `true` | Show "Open Wallet" button |
| `pollIntervalMs` | `number` | `3000` | Status polling interval |
| `displayCurrency` | `string` | — | Fiat currency label (e.g. "USD") |
| `exchangeRate` | `number` | — | Sats per fiat unit for display |
| `style` | `CSSProperties` | — | Custom container styles |
| `className` | `string` | — | Custom CSS class |
| `header` | `ReactNode` | — | Custom header content |
| `footer` | `ReactNode` | — | Custom footer content |
| `createParams` | `object` | — | Extra params sent to createUrl |

## useNeutronPayment Hook

For full control, use the hook directly:

```jsx
import { useNeutronPayment } from "neutron-react";

function CustomCheckout() {
  const { status, invoice, qrDataUrl, error, create, reset } = useNeutronPayment({
    createInvoice: async () => {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountSats: 10000 }),
      });
      return res.json();
    },
    checkStatus: async (txnId) => {
      const res = await fetch(`/api/status?txnId=${txnId}`);
      const data = await res.json();
      return data.status;
    },
    onPaid: (data) => console.log("Paid!", data),
    onExpired: (data) => console.log("Expired"),
  });

  return (
    <div>
      <p>Status: {status}</p>
      {qrDataUrl && <img src={qrDataUrl} alt="QR" />}
      {invoice && <p>{invoice.invoice}</p>}
      {status === "expired" && <button onClick={create}>Retry</button>}
    </div>
  );
}
```

### Hook Return Values

| Value | Type | Description |
|-------|------|-------------|
| `status` | `PaymentStatus` | `"idle" \| "creating" \| "waiting" \| "paid" \| "expired" \| "error"` |
| `invoice` | `InvoiceData \| null` | Invoice data after creation |
| `qrDataUrl` | `string \| null` | QR code as a data URL |
| `error` | `Error \| null` | Error if any |
| `create` | `() => void` | Create or recreate an invoice |
| `reset` | `() => void` | Reset to idle state |

## useCountdown Hook

Standalone countdown timer:

```jsx
import { useCountdown } from "neutron-react";

const { formatted, isExpired, timeLeft } = useCountdown(expiresAt);
// formatted: "4:32"
// isExpired: false
// timeLeft: 272000 (ms)
```

## Dark Theme

```jsx
<NeutronPay
  amountSats={10000}
  createUrl="/api/create-invoice"
  statusUrl="/api/status"
  theme="dark"
/>
```

## Custom Styling

```jsx
<NeutronPay
  amountSats={10000}
  createUrl="/api/create-invoice"
  statusUrl="/api/status"
  style={{ borderRadius: "20px", maxWidth: "400px" }}
  className="my-payment-widget"
  header={<h2>Pay with Bitcoin</h2>}
  footer={<p>Questions? Contact support</p>}
/>
```

## Complete Next.js Example

```
your-app/
├── app/
│   ├── api/neutron/
│   │   ├── create-invoice/route.ts    # POST: creates invoice
│   │   └── status/route.ts            # GET: checks payment
│   └── checkout/page.tsx              # Frontend checkout page
├── package.json
```

```bash
npm install neutron-sdk neutron-react
```

**Frontend** (`app/checkout/page.tsx`):
```tsx
"use client";
import { NeutronPay } from "neutron-react";
import { useRouter } from "next/navigation";

export default function Checkout() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
      <NeutronPay
        amountSats={50000}
        memo="Premium subscription"
        orderId="order-123"
        createUrl="/api/neutron/create-invoice"
        statusUrl="/api/neutron/status"
        onPaid={() => router.push("/success")}
        theme="light"
      />
    </div>
  );
}
```

## Links

- [neutron-sdk](https://www.npmjs.com/package/neutron-sdk) — TypeScript SDK for the backend
- [neutron-mcp](https://www.npmjs.com/package/neutron-mcp) — MCP server for AI agents
- [Docs](https://docs.neutron.me)
- [GitHub](https://github.com/Neutronpay/neutron-react-payment-component)

## License

MIT
