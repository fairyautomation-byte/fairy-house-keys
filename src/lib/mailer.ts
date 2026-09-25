import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Fairy House AutoData';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fairy-house-keys.vercel.app';
const ADMIN_EMAIL = process.env.GMAIL_USER || '';

// ─── Gửi email cho Admin khi có đơn mới ─────────────────────────────────────
export async function sendAdminNotification(data: {
  fullName: string;
  email: string;
  zalo: string;
  packageType: string;
  purpose: string;
  requestId: string;
}) {
  const packageLabels: Record<string, string> = {
    trial: '🆓 Trial (1 ngày)',
    standard: '⭐ Standard (30 ngày)',
    pro: '🚀 Pro (90 ngày)',
    lifetime: '💎 Lifetime (Vĩnh viễn)',
  };

  await transporter.sendMail({
    from: `"${APP_NAME} System" <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 [Fairy House] Đơn xin key mới từ ${data.fullName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🔔 Đơn Xin Key Mới</h1>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">👤 Họ tên:</td><td style="padding: 8px 0; color: #f1f5f9; font-weight: bold;">${data.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📧 Email:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📱 Zalo:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.zalo}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📦 Gói:</td><td style="padding: 8px 0; color: #a78bfa; font-weight: bold;">${packageLabels[data.packageType] || data.packageType}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">💬 Mục đích:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.purpose || 'Không ghi'}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">🕐 Thời gian:</td><td style="padding: 8px 0; color: #f1f5f9;">${new Date().toLocaleString('vi-VN')}</td></tr>
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="${APP_URL}/admin/requests" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                👉 Vào Admin Panel Xử Lý
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Gửi email xác nhận cho Khách sau khi submit ─────────────────────────────
export async function sendCustomerConfirmation(data: {
  fullName: string;
  email: string;
  packageType: string;
}) {
  const packageLabels: Record<string, string> = {
    trial: 'Trial (1 ngày)',
    standard: 'Standard (30 ngày)',
    pro: 'Pro (90 ngày)',
    lifetime: 'Lifetime (Vĩnh viễn)',
  };

  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: data.email,
    subject: `✅ [Fairy House] Chúng tôi đã nhận yêu cầu của bạn`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">Fairy House AutoData</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">Cảm ơn bạn đã đăng ký!</p>
          </div>
          <div style="padding: 24px;">
            <p>Chào <strong>${data.fullName}</strong>,</p>
            <p>Chúng tôi đã nhận yêu cầu <strong>${packageLabels[data.packageType] || data.packageType}</strong> của bạn.</p>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">⏱️ Thời gian xử lý: <strong style="color: #a78bfa;">trong vòng 24 giờ</strong></p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">📧 Key sẽ được gửi qua email này khi được duyệt</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">📱 Liên hệ hỗ trợ: <strong style="color: #06b6d4;">Zalo 0378791667</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Gửi email KEY cho Khách khi được cấp ────────────────────────────────────
export async function sendKeyToCustomer(data: {
  fullName: string;
  email: string;
  key: string;
  packageType: string;
  expiresAt: Date | null;
}) {
  const packageLabels: Record<string, string> = {
    trial: 'Trial (1 ngày)',
    standard: 'Standard (30 ngày)',
    pro: 'Pro (90 ngày)',
    lifetime: 'Lifetime (Vĩnh viễn)',
  };

  const expiryText = data.expiresAt
    ? data.expiresAt.toLocaleDateString('vi-VN')
    : 'Vĩnh viễn ♾️';

  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: data.email,
    subject: `🎉 [Fairy House] Key kích hoạt của bạn đã sẵn sàng!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🎉 Key Của Bạn Đã Sẵn Sàng!</h1>
          </div>
          <div style="padding: 24px;">
            <p>Chào <strong>${data.fullName}</strong>,</p>
            <p>Key kích hoạt <strong>Fairy House AutoData</strong> của bạn:</p>
            <div style="background: #0f172a; border: 2px solid #7c3aed; border-radius: 10px; padding: 20px; margin: 16px 0; text-align: center;">
              <p style="margin: 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #a78bfa; letter-spacing: 2px;">${data.key}</p>
            </div>
            <table style="width: 100%; margin: 16px 0;">
              <tr><td style="color: #94a3b8; padding: 4px 0;">📦 Gói:</td><td style="color: #f1f5f9; font-weight: bold;">${packageLabels[data.packageType] || data.packageType}</td></tr>
              <tr><td style="color: #94a3b8; padding: 4px 0;">📅 Hết hạn:</td><td style="color: #10b981; font-weight: bold;">${expiryText}</td></tr>
            </table>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0 0 8px; font-weight: bold; color: #f1f5f9;">📖 Hướng dẫn kích hoạt:</p>
              <ol style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 14px; line-height: 1.8;">
                <li>Mở Extension <strong style="color: #a78bfa;">Fairy House AutoData</strong> trên Chrome</li>
                <li>Vào tab <strong style="color: #a78bfa;">"License Key"</strong></li>
                <li>Dán key vào ô nhập và bấm <strong style="color: #a78bfa;">"Kích hoạt"</strong></li>
              </ol>
            </div>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">📱 Hỗ trợ kỹ thuật: <strong style="color: #06b6d4;">Zalo 0378791667</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
