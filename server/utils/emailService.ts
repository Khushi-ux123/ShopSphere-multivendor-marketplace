import dotenv from 'dotenv';
import { db } from '../db/jsonDb';
import { Order, OrderItem } from '../../src/types';

dotenv.config();

export interface EmailLog {
  id: string;
  recipient: string;
  recipientRole: 'customer' | 'vendor';
  subject: string;
  body: string;
  status: 'api_sent' | 'simulated' | 'error';
  errorMessage?: string;
  timestamp: string;
  orderId: string;
}

// Global in-memory log of sent/simulated emails so the UI can display them on a "Sandbox Sandbox" dashboard visualizer
export const emailLogs: EmailLog[] = [];

/**
 * Clean floating-point decimal standardizer
 */
function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Triggers Email Alerts to Customer & Vendors after Checkout.
 */
export async function triggerOrderEmails(order: Order) {
  try {
    // 1. Prepare Customer Confirmation Alert
    const customerHtml = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e1e7ec; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 25px;">
          <span style="font-size: 40px;">🎉</span>
          <h1 style="font-size: 24px; font-weight: 800; color: #4f46e5; margin: 10px 0 5px 0; letter-spacing: -0.025em;">Order Confirmed!</h1>
          <p style="font-size: 13px; color: #64748b; margin: 0;">Thank you for shopping with us, ${order.customerName}</p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">Order ID</td>
              <td style="text-align: right; font-weight: 700; color: #0f172a; padding-bottom: 6px;">#${order.id}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">Date</td>
              <td style="text-align: right; color: #0f172a; padding-bottom: 6px;">${new Date(order.createdAt).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 6px;">Payment Method</td>
              <td style="text-align: right; font-weight: 600; color: #0f172a; padding-bottom: 6px;">${order.paymentMethod}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">Payment Status</td>
              <td style="text-align: right; font-weight: bold; color: ${order.paymentStatus === 'paid' ? '#16a34a' : '#ea580c'}; text-transform: uppercase;">${order.paymentStatus}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Items Receipt</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          ${order.items.map(item => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; width: 50px;">
                <img src="${item.image}" alt="${item.title}" style="width: 44px; height: 44px; object-cover: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
              </td>
              <td style="padding: 10px 10px; font-size: 13px; font-weight: 600; color: #1e293b;">
                ${item.title} <br/>
                <span style="font-size: 11px; font-weight: normal; color: #64748b;">Qty: ${item.quantity}</span>
              </td>
              <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 13px; font-weight: 700; color: #4f46e5;">
                ${formatCurrency(item.price * item.quantity)}
              </td>
            </tr>
          `).join('')}
        </table>

        <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            ${order.discountAmount ? `
              <tr>
                <td style="color: #64748b; padding-bottom: 6px;">Discount Applied</td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; color: #dc2626; padding-bottom: 6px;">-${formatCurrency(order.discountAmount)}</td>
              </tr>
            ` : ''}
            <tr>
              <td style="font-weight: 700; color: #0f172a;">Grand Total</td>
              <td style="text-align: right; font-family: monospace; font-size: 16px; font-weight: 900; color: #4f46e5;">${formatCurrency(order.totalAmount)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Delivery Destination</h3>
          <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px;">
            <strong>${order.shippingAddress.fullName}</strong><br/>
            ${order.shippingAddress.addressLine1}<br/>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br/>
            ${order.shippingAddress.country}<br/>
            <span style="font-size: 11px; color: #94a3b8;">Phone: ${order.shippingAddress.phone}</span>
          </p>
        </div>

        <div style="text-align: center; border-t: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This utility email matches API triggers for verified order placement. Thank you!</p>
        </div>
      </div>
    `;

    await sendEmailAPI({
      to: order.customerEmail,
      recipientRole: 'customer',
      subject: `🎉 Order Confirmed! - #${order.id}`,
      body: customerHtml,
      orderId: order.id
    });

    // 2. Identify and trigger alerts for involved Vendors
    // Group order items by vendorId
    interface VendorGroup {
      vendorId: string;
      items: OrderItem[];
    }
    const vendorGroups: { [vid: string]: OrderItem[] } = {};
    order.items.forEach(item => {
      if (!vendorGroups[item.vendorId]) {
        vendorGroups[item.vendorId] = [];
      }
      vendorGroups[item.vendorId].push(item);
    });

    for (const vendorId of Object.keys(vendorGroups)) {
      const vendorUser = db.getUsers().find(u => u.id === vendorId);
      const vendorProfile = db.getVendors().find(v => v.userId === vendorId);
      const vendorEmail = vendorUser?.email;
      
      if (!vendorEmail) {
        console.warn(`Could not trigger vendor email for vendorUserId "${vendorId}" because no user email was found.`);
        continue;
      }

      const vendorItems = vendorGroups[vendorId];
      const itemsSubtotal = vendorItems.reduce((acc, current) => acc + (current.price * current.quantity), 0);

      const vendorHtml = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e1e7ec; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="font-size: 40px;">🎁</span>
            <h1 style="font-size: 24px; font-weight: 800; color: #10b981; margin: 10px 0 5px 0; letter-spacing: -0.025em;">New Order Received!</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">A buyer placed an order for items in your store, ${vendorProfile?.storeName || 'Vendor'}</p>
          </div>

          <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 25px; border: 1px solid #f1f5f9;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="color: #64748b; padding-bottom: 6px;">Order Identifier</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a; padding-bottom: 6px;">#${order.id}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding-bottom: 6px;">Fulfillment Status</td>
                <td style="text-align: right; font-weight: bold; color: #3b82f6; text-transform: uppercase; padding-bottom: 6px;">PENDING SETUP</td>
              </tr>
              <tr>
                <td style="color: #64748b;">Store Payout (Items Value)</td>
                <td style="text-align: right; font-family: monospace; font-size: 14px; font-weight: bold; color: #10b981;">${formatCurrency(itemsSubtotal)}</td>
              </tr>
            </table>
          </div>

          <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px dashed #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">Customer Purchased Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            ${vendorItems.map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 10px 0; width: 50px;">
                  <img src="${item.image}" alt="${item.title}" style="width: 44px; height: 44px; object-cover: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
                </td>
                <td style="padding: 10px 10px; font-size: 13px; font-weight: 600; color: #1e293b;">
                  ${item.title} <br/>
                  <span style="font-size: 11px; font-weight: normal; color: #64748b;">Qty: ${item.quantity} × ${formatCurrency(item.price)}</span>
                </td>
                <td style="padding: 10px 0; text-align: right; font-family: monospace; font-size: 13px; font-weight: 700; color: #10b981;">
                  ${formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            `).join('')}
          </table>

          <div style="margin-bottom: 25px;">
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Delivery & Logistics Details</h3>
            <p style="font-size: 13px; color: #475569; margin: 0; line-height: 1.5; background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px;">
              <strong>Recipient:</strong> ${order.shippingAddress.fullName}<br/>
              <strong>Address:</strong> ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}<br/>
              <strong>Contact Line:</strong> ${order.shippingAddress.phone}
            </p>
          </div>

          <div style="text-align: center; border-t: 1px solid #f1f5f9; padding-top: 20px;">
            <p style="font-size: 11px; color: #94a3b8; margin: 0;">Please visit your Vendor Core Dashboard to verify logistics, print barcodes, and update tracking details.</p>
          </div>
        </div>
      `;

      await sendEmailAPI({
        to: vendorEmail,
        recipientRole: 'vendor',
        subject: `📦 New Order Received! - #${order.id}`,
        body: vendorHtml,
        orderId: order.id
      });
    }

  } catch (error) {
    console.error('Trigger order email service failed:', error);
  }
}

/**
 * Executes a REAL REST call to the Resend API or logs a simulated mail event.
 */
async function sendEmailAPI(payload: { to: string; recipientRole: 'customer' | 'vendor'; subject: string; body: string; orderId: string }) {
  const apiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  let status: 'api_sent' | 'simulated' | 'error' = 'simulated';
  let errorMessage: string | undefined;

  if (apiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev', // Default sender for Resend free tier accounts
          to: payload.to,
          subject: payload.subject,
          html: payload.body,
        })
      });

      if (response.ok) {
        status = 'api_sent';
        console.log(`[SUCCESS] Email successfully sent to ${payload.to} via RESEND API!`);
      } else {
        const errJson = await response.json().catch(() => ({}));
        
        // Check for unverified recipient 403 error in Resend sandbox
        const hasUnverifiedMessage = errJson.message && (
          errJson.message.includes('You can only send testing emails to') ||
          errJson.message.includes('validation_error')
        );

        if (response.status === 403 && hasUnverifiedMessage) {
          // Parse out the owner's email address from the error message
          // example: "You can only send testing emails to your own email address (khushi905sharma@gmail.com)."
          const match = errJson.message.match(/\(([^)]+)\)/);
          const devEmail = match ? match[1] : 'khushi905sharma@gmail.com';

          console.log(`[SANDBOX REDIRECT] Target recipient ${payload.to} is unverified. Auto-routing transaction to sandbox developer: ${devEmail}`);

          // Retry sending the email to the verified owner's email address
          const retryResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              from: 'onboarding@resend.dev',
              to: devEmail,
              subject: `[Sandbox Rerouted for ${payload.to}] ${payload.subject}`,
              html: `
                <div style="background-color: #fffbeb; border: 1px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 12px; font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: #78350f; line-height: 1.5;">
                  <strong style="color: #d97706; font-size: 14px;">⚡ Sandbox Redirect Enabled</strong><br/>
                  This notification was dispatched to <strong>${payload.to}</strong> (${payload.recipientRole === 'customer' ? 'Customer' : 'Vendor' }).
                  Because the recipient email is unverified in your Resend Sandbox, we have automatically rerouted it to your registered account email (<strong>${devEmail}</strong>) so you can preview layout, order details, and receipt templates seamlessly in your live inbox.
                </div>
                ${payload.body}
              `
            })
          });

          if (retryResponse.ok) {
            status = 'api_sent';
            errorMessage = `Rerouted to verified owner (${devEmail}) because ${payload.to} is unverified.`;
            console.log(`[SUCCESS] Rerouted email successfully sent to verified dev: ${devEmail}`);
          } else {
            const retryErrJson = await retryResponse.json().catch(() => ({}));
            status = 'error';
            errorMessage = JSON.stringify(retryErrJson) || `HTTP Error ${retryResponse.status}`;
            console.error(`[ERROR] Resend API route retry failed:`, errorMessage);
          }
        } else {
          status = 'error';
          errorMessage = JSON.stringify(errJson) || `HTTP Error ${response.status}`;
          console.error(`[ERROR] Resend API responded with error:`, errorMessage);
        }
      }
    } catch (apiErr: any) {
      status = 'error';
      errorMessage = apiErr?.message || 'Network request failed';
      console.error(`[CRITICAL] Network error while testing Resend Email service:`, apiErr);
    }
  } else {
    console.log(`[SIMULATION] Email triggered successfully! To: ${payload.to}, Subject: ${payload.subject}. Configure RESEND_API_KEY inside your Secrets manager for live outbound emails.`);
  }

  // Record details into historical visual notification dashboard feed
  const newEmailLog: EmailLog = {
    id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    recipient: payload.to,
    recipientRole: payload.recipientRole,
    subject: payload.subject,
    body: payload.body,
    status,
    errorMessage,
    timestamp: new Date().toISOString(),
    orderId: payload.orderId
  };

  emailLogs.unshift(newEmailLog);
}
