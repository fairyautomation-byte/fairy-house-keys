# Baseline Kỹ Thuật Dự Án Fairy House AutoData (11/10/2026)

## 1. Thông Tin Mã Nguồn & Baseline
- **Repository:** `E:\Target\fairy-house-keys-main`
- **Nhánh baseline:** `codex/security-hardening-2026-10-10`
- **Commit SHA:** `5feedff5618c6118c6deb13bc9fe12a70fb53d48`
- **Trạng thái PR:** PR #1 (Draft, chưa merge vào main)
- **Framework & Runtimes:**
  - Next.js: `16.4.0` (Turbopack/Webpack)
  - React: `19.2.0`
  - Node engine: `>=20.9.0`
  - Firebase Admin: `14.5.0`
  - PayOS Node SDK: `1.0.7`
  - Chrome Extension Manifest: V3 (phiên bản `2.1.1` trong `extension/manifest.json`)
- **Tệp phân phối hiện tại:** `public/fairy-house-extension-v2.zip` (SHA-256: `662edf21972cf66ccc77b9c7025a38bed7030d36b1c29c8ed2b5d1a11a6f58e8`)

---

## 2. Feature Inventory
| Nhóm tính năng | Thành phần hiện tại | Trạng thái bảo mật & vận hành |
|---|---|---|
| **Extension Core** | Service worker V3, content scripts FB, UI injection | Đã cô lập trusted storage, sender verification; cần đồng bộ version/capabilities với backend. |
| **Tra cứu SĐT** | `POST /api/license/phones` gọi `phone.zooinbox.com` (db1, db2) | Đã có deduplication cơ bản; cần server deadline < client timeout, lease lock chống gọi provider lặp, partial result handling. |
| **Xác thực License** | `POST /api/license/validate`, cache extension | Đã tính quota theo múi giờ Việt Nam; cần validate format trước rate limit DB và bind session. |
| **Mời bạn bè** | `POST /api/license/invite` | Cần reservation rõ ràng và xử lý checkpoint. |
| **Thanh toán PayOS** | `create-payment-link`, `webhook`, `check-order`, `cancel` | Webhook idempotent; phát hiện bug trạng thái có thể bị hạ từ PAID về CANCELED ngoài transaction, QR expiry chưa đồng bộ. |
| **Ví & Đơn hàng** | `buyWithWallet`, `settlePayment`, admin approve/reject | Đã có atomic transaction trong ví và quota. |
| **Email thông báo** | `email_outbox`, `deliverLicenseEmail` (SMTP Gmail) | Lease 60s cơ bản; thiếu attempts/backoff/dead-letter và dễ bị nghẽn job cũ. |

---

## 3. Schema Inventory Hiện Tại (Firestore Collections)
1. `users`:
   - Fields: `email`, `full_name`, `zalo`, `role`, `wallet_balance`, `trial_used`, `auth_version`, `status`, `email_verified`, `password` (scrypt), `created_at`.
2. `plans`:
   - Documents: `trial`, `monthly`, `quarterly`, `yearly`.
   - Fields: `price`, `duration` (ngày/null), `scanLimit` (-1 hoặc số), `active`.
3. `licenses`:
   - ID: order ID / payos order code / custom.
   - Fields: `license_key`, `user_id`, `plan_id`, `status` (`ACTIVE`/`REVOKED`), `daily_limit`, `daily_used`, `total_scans`, `last_reset_date` (YYYY-MM-DD), `expires_at`, `created_at`, `activated_at`.
4. `orders`:
   - Ledger bất biến lưu lịch sử đơn ví hoặc thanh toán đã settle.
5. `payos_orders`:
   - Orders thanh toán PayOS: `payosOrderCode`, `transactionCode`, `userId`, `amount`, `status` (`CREATING`, `PENDING`, `PAID`, `CANCELED`, `EXPIRED`), `type` (`PURCHASE`/`DEPOSIT`), `payment`, `created_at`, `paid_at`.
6. `payos_order_codes`:
   - Reservation độc quyền tránh collision số đơn hàng PayOS.
7. `phone_requests`:
   - Idempotency lookup: ID hash `licenseId:requestId`, `fingerprint` (hash UIDs), `result`, `created_at`, `expires_at`.
8. `email_outbox`:
   - ID ledger order: `user_id`, `license_id`, `status` (`PENDING`, `SENDING`, `SENT`), `lease`, `lease_until`, `created_at`, `sent_at`.
9. `rate_limits`:
   - Hash khóa rate limit: `count`, `resetAt`, `expires_at`.

---

## 4. Ma Trận Môi Trường (Environment Matrix)
| Môi trường | Database / Firebase | PayOS | SMTP Email | Extension Host | Ghi chú an toàn |
|---|---|---|---|---|---|
| **Production** | `fairy-house-keys` (Khách thật) | Webhook + Khóa sản xuất | Gmail SMTP thật | `https://www.fairyautomation.io.vn` | TUYỆT ĐỐI không ghi/xóa, seed, test tự động. |
| **Staging** | Dự án Firebase Staging riêng (ví dụ `fairy-house-staging`) | Mock / Test channel | Test sink / no-op | Host staging | Cần biến `FIREBASE_STAGING_PROJECT_ID` cô lập hoàn toàn. |
| **Local / Test** | In-memory Mock / Firebase Emulator (`demo-*`) | Mock PayOS adapter | In-memory / Mock mailer | `http://localhost:3000` | Cấm dùng credentials thật. Chặn `fairy-house-keys`. |

---

## 5. Phân Loại Trạng Thái Các Mục Đã & Chưa Sửa
- **Đã sửa bảo mật ở baseline 5feedff:**
  - Mật khẩu scrypt + migration legacy SHA-256 + KEY_SECRET_SALT.
  - OTP purpose check, single-use, brute-force lockout.
  - JWT auth_version revocation.
  - Atomic transactions cho ví, quota, settle payment.
  - Extension trusted storage, sender origin verification, CSV formula sanitization.
- **Chưa deploy lên Production (Live check 11/10/2026):**
  - Production `www.fairyautomation.io.vn` trả 404 cho `/api/license/phones` và `/extension-release.json`.
  - Preview branch chưa có đủ biến môi trường và bị chặn bởi Vercel authentication.
- **Chưa hoàn thiện trong mã nguồn (Cần sửa trong các giai đoạn tiếp theo):**
  - A01: Version handshake / Capabilities contract giữa web và extension.
  - A02: Test & staging guard cô lập môi trường.
  - A03: Timeout server vs client, schema validation & partial results cho phone lookup.
  - A04: Lookup idempotency lease lock & quota settlement.
  - A05: Payment state machine chống downgrade từ PAID sang CANCELED.
  - A06: PayOS create link recovery.
  - A07: QR expiration, sequential polling, payment intent scoping.
  - A08: Outbox worker lease fencing, attempts & anti-starvation.
  - A10: Rate limit input validation defense & Retry-After header.
  - A11: Health & admin readiness check.
