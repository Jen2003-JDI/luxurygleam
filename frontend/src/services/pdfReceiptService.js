import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Generates a styled HTML receipt and prints/shares it as a PDF.
 * Uses expo-print to render HTML → PDF on-device, then expo-sharing to export.
 * @param {Object} order  - The full order object from the backend
 * @param {Object} user   - The current user object
 */
export const exportOrderReceipt = async (order, user) => {
  if (!order) throw new Error('Order data is required');

  const orderId = order._id?.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const itemRows = order.orderItems
    ?.map(
      (item) => `
      <tr>
        <td class="td-name">${escapeHtml(item.name)}</td>
        <td class="td-center">${item.quantity}</td>
        <td class="td-right">₱${item.price.toLocaleString()}</td>
        <td class="td-right">₱${(item.price * item.quantity).toLocaleString()}</td>
      </tr>`
    )
    .join('') || '';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Receipt #${orderId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #fff;
      color: #1a0e02;
      padding: 40px;
      max-width: 680px;
      margin: 0 auto;
    }

    /* ── Header ─────────────────────────────────── */
    .header {
      text-align: center;
      border-bottom: 3px solid #C9A84C;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .brand-logo {
      font-size: 32px;
      margin-bottom: 6px;
    }
    .brand-name {
      font-size: 26px;
      font-weight: 700;
      color: #C9A84C;
      letter-spacing: 6px;
      text-transform: uppercase;
    }
    .brand-tagline {
      font-size: 11px;
      color: #8A6030;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .receipt-title {
      font-size: 14px;
      color: #6B5030;
      margin-top: 16px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* ── Gold separator ─────────────────────────── */
    .gold-line {
      height: 1px;
      background: linear-gradient(to right, transparent, #C9A84C, transparent);
      margin: 16px 0;
    }

    /* ── Info Grid ──────────────────────────────── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .info-box {
      background: #fdf9f0;
      border: 1px solid #e8d5a0;
      border-radius: 8px;
      padding: 16px;
    }
    .info-box-title {
      font-size: 10px;
      font-weight: 700;
      color: #C9A84C;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .info-label { font-size: 11px; color: #8A6030; }
    .info-value { font-size: 11px; color: #1a0e02; font-weight: 600; text-align: right; max-width: 55%; }

    /* ── Status Badge ───────────────────────────── */
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .status-Delivered { background: #e0f7e9; color: #1a7a3a; }
    .status-Pending { background: #fff3cd; color: #7a5500; }
    .status-Processing { background: #e3eeff; color: #1a3a8a; }
    .status-Shipped { background: #f0e3ff; color: #5a1a8a; }
    .status-Out-for-Delivery { background: #fff0e3; color: #8a3a00; }
    .status-Cancelled { background: #ffe3e3; color: #8a0000; }
    .status-Refunded { background: #f0f0f0; color: #444; }

    /* ── Items Table ────────────────────────────── */
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1a0e02;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead tr {
      background: #C9A84C;
    }
    thead th {
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 10px 12px;
    }
    .th-right { text-align: right; }
    .th-center { text-align: center; }
    tbody tr { border-bottom: 1px solid #f0e4c4; }
    tbody tr:nth-child(even) { background: #fffbf2; }
    .td-name { padding: 10px 12px; font-size: 12px; color: #1a0e02; }
    .td-center { padding: 10px 12px; font-size: 12px; color: #4a3010; text-align: center; }
    .td-right { padding: 10px 12px; font-size: 12px; color: #4a3010; text-align: right; }

    /* ── Totals ─────────────────────────────────── */
    .totals-box {
      background: #fdf9f0;
      border: 1px solid #e8d5a0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0e4c4;
    }
    .total-row:last-child { border-bottom: none; }
    .total-label { font-size: 12px; color: #8A6030; }
    .total-value { font-size: 12px; color: #1a0e02; font-weight: 600; }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      margin-top: 6px;
      border-top: 2px solid #C9A84C;
    }
    .grand-label { font-size: 14px; font-weight: 700; color: #1a0e02; letter-spacing: 1px; }
    .grand-value { font-size: 18px; font-weight: 700; color: #C9A84C; }

    /* ── Footer ─────────────────────────────────── */
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e8d5a0;
    }
    .footer-brand { font-size: 14px; color: #C9A84C; font-weight: 700; letter-spacing: 3px; margin-bottom: 6px; }
    .footer-text { font-size: 11px; color: #8A6030; line-height: 1.6; }
    .footer-website { font-size: 11px; color: #C9A84C; margin-top: 4px; }

    .thank-you {
      text-align: center;
      font-size: 16px;
      color: #C9A84C;
      font-weight: 700;
      letter-spacing: 2px;
      margin: 20px 0;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div class="brand-logo">💎</div>
    <div class="brand-name">Luxury Gleam</div>
    <div class="brand-tagline">Fine Jewelry &amp; Precious Gems</div>
    <div class="receipt-title">Official Order Receipt</div>
  </div>

  <!-- Order & Customer Info -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">📋 Order Details</div>
      <div class="info-row">
        <span class="info-label">Order ID</span>
        <span class="info-value">#${orderId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${orderDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Payment</span>
        <span class="info-value">${escapeHtml(order.paymentMethod || 'COD')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value">
          <span class="status-badge status-${(order.status || 'Pending').replace(/ /g, '-')}">${order.status || 'Pending'}</span>
        </span>
      </div>
    </div>
    <div class="info-box">
      <div class="info-box-title">👤 Customer</div>
      <div class="info-row">
        <span class="info-label">Name</span>
        <span class="info-value">${escapeHtml(user?.name || order.shippingAddress?.fullName || '')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${escapeHtml(user?.email || '')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Phone</span>
        <span class="info-value">${escapeHtml(order.shippingAddress?.phone || '—')}</span>
      </div>
    </div>
  </div>

  <!-- Shipping Address -->
  <div class="info-box" style="margin-bottom: 24px;">
    <div class="info-box-title">📍 Delivery Address</div>
    <div style="font-size: 12px; color: #1a0e02; line-height: 1.8;">
      ${escapeHtml(order.shippingAddress?.fullName || '')}<br/>
      ${escapeHtml(order.shippingAddress?.address || '')}<br/>
      ${escapeHtml(order.shippingAddress?.city || '')}, ${escapeHtml(order.shippingAddress?.postalCode || '')}<br/>
      ${escapeHtml(order.shippingAddress?.country || '')}
    </div>
  </div>

  <div class="gold-line"></div>

  <!-- Items Table -->
  <div class="section-title">🛒 Items Ordered</div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th class="th-center">Qty</th>
        <th class="th-right">Unit Price</th>
        <th class="th-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-box">
    <div class="total-row">
      <span class="total-label">Items Subtotal</span>
      <span class="total-value">₱${(order.itemsPrice || 0).toLocaleString()}</span>
    </div>
    <div class="total-row">
      <span class="total-label">Shipping Fee</span>
      <span class="total-value">${order.shippingPrice === 0 ? '<span style="color:#1a7a3a">FREE</span>' : '₱' + (order.shippingPrice || 0).toLocaleString()}</span>
    </div>
    ${order.taxPrice > 0 ? `
    <div class="total-row">
      <span class="total-label">Tax</span>
      <span class="total-value">₱${(order.taxPrice || 0).toLocaleString()}</span>
    </div>` : ''}
    <div class="grand-total-row">
      <span class="grand-label">TOTAL AMOUNT</span>
      <span class="grand-value">₱${(order.totalPrice || 0).toLocaleString()}</span>
    </div>
  </div>

  <div class="gold-line"></div>

  <div class="thank-you">✨ Thank You for Your Purchase ✨</div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-brand">LUXURY GLEAM</div>
    <div class="footer-text">
      This is your official order receipt.<br/>
      Please keep this for your records.<br/>
      For inquiries, contact our customer support.
    </div>
    <div class="footer-website">www.luxurygleam.com</div>
  </div>

</body>
</html>`;

  // Print to PDF file
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Check if sharing is available
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Order Receipt #${orderId}`,
      UTI: 'com.adobe.pdf',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }

  return uri;
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
