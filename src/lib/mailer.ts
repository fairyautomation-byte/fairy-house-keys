import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Fairy House Auto Data';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://fairyautomation.io.vn';
const ADMIN_EMAIL = process.env.GMAIL_USER || '';
const SUPPORT_ZALO = '0378791667';

const PACKAGE_LABELS: Record<string, { label: string; price: string; scanLimit: string }> = {
  trial:     { label: '🆓 Dùng Thử (3 ngày)',    price: 'Miễn phí',  scanLimit: '100 lần/ngày' },
  monthly:   { label: '⭐ Gói Tháng (1 tháng)',   price: '69.000đ',   scanLimit: '1.000 lần/ngày' },
  quarterly: { label: '🚀 Tiết Kiệm (3 tháng)',   price: '179.000đ',  scanLimit: '3.000 lần/ngày' },
  yearly:    { label: '💎 Doanh Nghiệp (1 năm)',  price: '629.000đ',  scanLimit: 'Không giới hạn' },
  // Legacy
  standard:  { label: '⭐ Standard (30 ngày)',    price: 'Liên hệ',   scanLimit: '500 lần/ngày' },
  pro:       { label: '🚀 Pro (90 ngày)',          price: 'Liên hệ',   scanLimit: 'Không giới hạn' },
  lifetime:  { label: '💎 Lifetime (Vĩnh viễn)',  price: 'Liên hệ',   scanLimit: 'Không giới hạn' },
};

// ─── Gửi email cho Admin khi có đơn mới ─────────────────────────────────────
export async function sendAdminNotification(data: {
  fullName: string;
  email: string;
  zalo: string;
  packageType: string;
  purpose: string;
  requestId: string;
}) {
  const pkg = PACKAGE_LABELS[data.packageType] || { label: data.packageType, price: '?', scanLimit: '?' };

  await transporter.sendMail({
    from: `"${APP_NAME} System" <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 [Fairy House Auto Data] Đơn xin key mới từ ${data.fullName} — ${pkg.label}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🔔 Đơn Xin Key Mới</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85);">Fairy House Auto Data — AI Automation Facebook</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">👤 Họ tên:</td><td style="padding: 8px 0; color: #f1f5f9; font-weight: bold;">${data.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📧 Email:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📱 Zalo:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.zalo}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📦 Gói:</td><td style="padding: 8px 0; color: #a78bfa; font-weight: bold;">${pkg.label}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">💰 Giá:</td><td style="padding: 8px 0; color: #10b981; font-weight: bold;">${pkg.price}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">🔍 Giới hạn:</td><td style="padding: 8px 0; color: #f1f5f9;">${pkg.scanLimit}</td></tr>
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
  const pkg = PACKAGE_LABELS[data.packageType] || { label: data.packageType, price: '?', scanLimit: '?' };

  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: data.email,
    subject: `✅ [Fairy House Auto Data] Chúng tôi đã nhận yêu cầu của bạn`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 22px;">🎯 Fairy House Auto Data</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8);">AI Automation Facebook Extension</p>
          </div>
          <div style="padding: 24px;">
            <p>Chào <strong>${data.fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký <strong>${pkg.label}</strong>.</p>
            <div style="background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #94a3b8; font-size: 14px;">📦 Gói: <strong style="color: #a78bfa;">${pkg.label}</strong></p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">🔍 Giới hạn quét: <strong style="color: #10b981;">${pkg.scanLimit}</strong></p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">⏱️ Thời gian xử lý: <strong style="color: #a78bfa;">1-2 giờ</strong> sau khi xác nhận thanh toán</p>
              <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">📧 Key sẽ được gửi qua email này</p>
            </div>
            <div style="background: #1e3a2f; border: 1px solid #166534; border-radius: 8px; padding: 12px; margin: 16px 0;">
              <p style="margin: 0; color: #86efac; font-size: 13px;">⚠️ Nếu chưa thanh toán, vui lòng chuyển khoản và gửi ảnh xác nhận qua Zalo để được xử lý nhanh.</p>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">📱 Liên hệ hỗ trợ: <strong style="color: #06b6d4;">Zalo ${SUPPORT_ZALO}</strong></p>
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
  const pkg = PACKAGE_LABELS[data.packageType] || { label: data.packageType, price: '?', scanLimit: '?' };

  const expiryText = data.expiresAt
    ? data.expiresAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Không giới hạn ♾️';

  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: data.email,
    subject: `🎉 [Fairy House Auto Data] Đơn hàng của bạn đã được duyệt thành công!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #10b981, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🎉 Kích Hoạt Thành Công!</h1>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9);">Fairy House Auto Data — Hệ thống tự động</p>
          </div>
          <div style="padding: 24px;">
            <p>Chào <strong>${data.fullName}</strong>,</p>
            <p>Tin vui! Đơn hàng đăng ký gói <strong>${pkg.label}</strong> của bạn đã được Admin phê duyệt thành công.</p>
            
            <table style="width: 100%; margin: 20px 0; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden;">
              <tr><td style="color: #94a3b8; padding: 12px 16px; border-bottom: 1px solid #334155;">📦 Gói dịch vụ:</td><td style="color: #f1f5f9; font-weight: bold; padding: 12px 16px; border-bottom: 1px solid #334155;">${pkg.label}</td></tr>
              <tr><td style="color: #94a3b8; padding: 12px 16px; border-bottom: 1px solid #334155;">🔍 Giới hạn quét:</td><td style="color: #10b981; font-weight: bold; padding: 12px 16px; border-bottom: 1px solid #334155;">${pkg.scanLimit}</td></tr>
              <tr><td style="color: #94a3b8; padding: 12px 16px;">📅 Hạn sử dụng:</td><td style="color: #10b981; font-weight: bold; padding: 12px 16px;">${expiryText}</td></tr>
            </table>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; letter-spacing: 0.5px;">
                ĐĂNG NHẬP ĐỂ LẤY KEY NGAY 👉
              </a>
            </div>

            <div style="background: #1e3a2f; border: 1px solid #166534; border-radius: 8px; padding: 12px; margin: 12px 0;">
              <p style="margin: 0; color: #86efac; font-size: 13px;">💡 <strong>Lưu ý:</strong> Vui lòng đăng nhập vào trang quản lý để copy Key kích hoạt và dán vào Extension nhé.</p>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; margin-top: 24px; border-top: 1px solid #334155; pt-4">📱 Cần hỗ trợ thêm? Zalo ngay: <strong style="color: #06b6d4;">${SUPPORT_ZALO}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Gửi email cho Admin khi có ĐĂNG KÝ USER MỚI ─────────────────────────────────────
export async function sendNewUserAdminNotification(data: {
  fullName: string;
  email: string;
  zalo: string;
}) {
  await transporter.sendMail({
    from: `"${APP_NAME} System" <${ADMIN_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `🔔 [Fairy House Auto Data] User mới đăng ký tài khoản: ${data.fullName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🔔 User Mới Đăng Ký</h1>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #94a3b8; width: 140px;">👤 Họ tên:</td><td style="padding: 8px 0; color: #f1f5f9; font-weight: bold;">${data.fullName}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📧 Email:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #94a3b8;">📱 Zalo:</td><td style="padding: 8px 0; color: #f1f5f9;">${data.zalo}</td></tr>
            </table>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Gửi email chào mừng cho Khách khi ĐĂNG KÝ TÀI KHOẢN ─────────────────────────────────────
export async function sendNewUserWelcome(data: {
  fullName: string;
  email: string;
}) {
  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: data.email,
    subject: `🎉 Chào mừng bạn đến với Fairy House Auto Data!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">🎉 Tạo Tài Khoản Thành Công!</h1>
          </div>
          <div style="padding: 24px;">
            <p>Chào <strong>${data.fullName}</strong>,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại hệ thống <strong>Fairy House Auto Data</strong>.</p>
            <p>Bây giờ bạn đã có thể đăng nhập vào trang quản lý và trải nghiệm tự động đăng ký các gói Dịch Vụ.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${APP_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #06b6d4, #7c3aed); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đăng nhập ngay</a>
            </div>
            <p>Nếu cần hỗ trợ, đừng ngần ngại liên hệ Zalo Admin nhé!</p>
          </div>
          <div style="background: #0f172a; padding: 16px 24px; text-align: center; border-top: 1px solid #334155;">
            <p style="margin: 0; color: #94a3b8; font-size: 14px;">📱 Zalo hỗ trợ: <strong style="color: #06b6d4;">${SUPPORT_ZALO}</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─── Gửi email OTP xác thực ─────────────────────────────────────
export async function sendOTPEmail(email: string, otp: string) {
  await transporter.sendMail({
    from: `"${APP_NAME}" <${ADMIN_EMAIL}>`,
    to: email,
    subject: `[Fairy House Auto Data] Mã xác thực của bạn: ${otp}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 20px;">Xác Thực Email</h1>
          </div>
          <div style="padding: 24px;">
            <p>Xin chào,</p>
            <p>Mã xác thực của bạn là:</p>
            <div style="background: #0f172a; border: 2px solid #7c3aed; border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="margin: 0; font-family: monospace; font-size: 24px; font-weight: bold; color: #a78bfa; letter-spacing: 8px;">${otp}</p>
            </div>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
            <p>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.<br/>Không chia sẻ mã này với bất kỳ ai.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
