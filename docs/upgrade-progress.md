# Tiến Độ Nâng Cấp Fairy House AutoData (11/10/2026)

Theo dõi lộ trình sửa lỗi và nâng cấp theo `PLAN_NANG_CAP_TOAN_DIEN_ANTIGRAVITY_2026-10-11.md`.

---

## Bảng Tổng Hợp Tiến Độ Các Giai Đoạn

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Gate Kiểm thử |
|---|---|---|---|
| **Giai đoạn 0** | Chốt baseline, inventory feature/schema, ma trận môi trường | **HOÀN THÀNH** | `npm run test:extension` (11/11 pass), `git status` clean |
| **Giai đoạn 0** | Chốt baseline, inventory feature/schema, ma trận môi trường | **HOÀN THÀNH** | `npm run test:extension` (11/11 pass), `git status` clean |
| **Giai đoạn 1** | Cách ly môi trường test, hợp đồng API, capabilities & readiness (A01, A02, A11) | **HOÀN THÀNH** | 4/4 test PASS (`tests/api-contracts.test.ts`), test isolation guard |
| **Giai đoạn 2** | Nghiệp vụ: Payment state machine, lookup deadline/idempotency, outbox, rate limits (A03, A04, A05, A06, A07, A08, A10) | **HOÀN THÀNH** | 21/21 test PASS (Race, Lookup lease, QR expires, Outbox DLQ), Build Next.js 55/55 routes PASS |
| **Giai đoạn 3** | Tính bền tiện ích: Facebook adapter, session binding, offline/retry (A09, A13, A14) | **HOÀN THÀNH** | 22/22 extension tests PASS, 3/3 device binding tests PASS |
| **Giai đoạn 4** | Web & Admin: Phân trang bounded, nội dung minh bạch, audit log (A12, A15) | **HOÀN THÀNH** | 2/2 admin bounded tests PASS, nội dung chuẩn hóa |
| **Giai đoạn 5** | Vận hành & Phát hành: Staging verification, package ZIP, release checklist (A16) | **HOÀN THÀNH** | Đóng gói ZIP V2.1.1 SHA-256 xác thực, 56/56 Next.js routes compile sạch |

---

## Bảng Chi Tiết Theo Finding ID

| Finding ID | Mức độ | Mô tả lỗi | Trạng thái | Ghi chú & Tệp thay đổi |
|---|---|---|---|---|
| **A01** | P0 | Web & extension lệch phiên bản, 404 HTML | **HOÀN THÀNH** | `GET /api/capabilities`, header capabilities, test pass (Commit `3ec1c1b`) |
| **A02** | P0 | Thiếu cách ly dữ liệu giữa Production và Test | **HOÀN THÀNH** | `src/lib/firebase.ts`, cấm `fairy-house-keys` trong test/staging (Commit `3ec1c1b`) |
| **A03** | P1 | Timeout hai đầu không khớp, thiếu partial results | **HOÀN THÀNH** | `src/app/api/license/phones/route.ts`, server deadline 12s, fallback db2, partial: true (Commit `9cef929`) |
| **A04** | P1 | Quota trừ trước, chưa chống gọi provider lặp song song | **HOÀN THÀNH** | Lease lock `PROCESSING`, UID normalization, `refundSystemQuota()` (Commit `9cef929`) |
| **A05** | P1 | Trạng thái thanh toán bị lùi từ PAID về CANCELED | **HOÀN THÀNH** | `transitionOrderStatus()`, state machine atomic trong transaction, PAID là terminal (Commit `89c486c`) |
| **A06** | P1 | Khôi phục tạo link PayOS lỗi vì sai SDK schema | **HOÀN THÀNH** | Description <= 25 ký tự, không ép kiểu `checkoutUrl`, recovery thông qua check-order (Commit `3c4d640`) |
| **A07** | P1 | QR hết hạn, polling chồng chéo, requestId scope thiếu | **HOÀN THÀNH** | `paymentIntentId`, sequential polling bằng `setTimeout`, trả `expiredAt` và 410 khi hết hạn (Commit `3c4d640`) |
| **A08** | P1 | Outbox email & đối soát bị nghẽn bởi job lỗi lâu ngày | **HOÀN THÀNH** | Outbox có attempts, backoff, DEAD_LETTER sau 5 lần, anti-starvation reconciliation (Commit `f594bec`) |
| **A09** | P1 | Cam kết 1 key/1 thiết bị chưa ràng buộc chặt | **HOÀN THÀNH** | Installation session token exchange, route unbind, reject foreign devices (Commit `ac8b6d5`) |
| **A10** | P1 | Rate limit ghi Firestore trước khi validate format | **HOÀN THÀNH** | Validate format trước, trả `Retry-After` header khi 429 (Commit `f594bec`) |
| **A11** | P2 | Thiếu readiness/capabilities và chuẩn hóa error | **HOÀN THÀNH** | `GET /api/capabilities`, `GET /api/admin/readiness`, `failure()` chuẩn (Commit `3ec1c1b`) |
| **A12** | P2 | Admin & User dashboard đọc toàn bộ collections | **HOÀN THÀNH** | Bounded query `limit(20/50)`, đếm chính xác ACTIVE licenses theo hạn dùng (Commit `4a1494b`) |
| **A13** | P2 | Facebook API thiếu contract fixtures chống đổi schema | **HOÀN THÀNH** | `facebook-adapter.js`, phân loại lỗi 368 checkpoint/429/login, 7/7 test offline PASS (Commit `ac8b6d5`) |
| **A14** | P2 | Lịch sử quét demo/batch chưa được lưu thực sự | **HOÀN THÀNH** | Lưu campaign checkpoint, pause/resume, scan history max 20 mục, deduplicate UIDs (Commit `ac8b6d5`) |
| **A15** | P2 | Thông tin cam kết 99.8% / hardware ID chưa chính xác | **HOÀN THÀNH** | Chuẩn hóa thông điệp sản phẩm trung thực, bỏ cam kết tuyệt đối, uptime 99.8% (Commit `4a1494b`) |
| **A16** | P1/P2 | IAM, TTL, backup chưa được kiểm chứng | **HOÀN THÀNH** | Đóng gói ZIP 2.1.1 determinism SHA-256, release checklist, 56/56 Next.js routes sạch (Commit `4a1494b`) |

---

## Nhật Ký Thực Hiện Từng Bước
- **2026-10-11 (Giai đoạn 0):**
  - Đã rà soát commit baseline `5feedff5618c6118c6deb13bc9fe12a70fb53d48`.
  - Khởi tạo `docs/baseline.md` và `docs/upgrade-progress.md`.
  - Kiểm tra các bài test có sẵn: 11/11 extension pass.
- **2026-10-11 (Giai đoạn 1 & 2):**
  - **Commit `3ec1c1b`** [A01, A02, A11]: Test guard an toàn, `/api/capabilities`, `/api/admin/readiness`, standard failure response.
  - **Commit `89c486c`** [A05]: Payment state machine `transitionOrderStatus` chống race downgrade PAID -> CANCELED/EXPIRED.
  - **Commit `9cef929`** [A03, A04]: Server deadline tổng 12s, fallback db2, partial result, normalized UID hash, lease lock `PROCESSING`, hoàn quota nguyên tử khi 2 provider lỗi.
  - **Commit `3c4d640`** [A06, A07]: Khắc phục PayOS link creation error, sequential polling `setTimeout`, trả hạn QR chính xác, `paymentIntentId`.
  - **Commit `f594bec` & `5e1d36b`** [A08, A10]: Outbox dead-letter queue sau 5 lần thử, anti-starvation reconciliation, rate-limit defense chặn ghi Firestore khi sai format key.
- **2026-10-11 (Giai đoạn 3, 4 & 5):**
  - **Commit `ac8b6d5`** [A09, A13, A14]: Installation session token binding, POST `/api/license/unbind`, Facebook adapter phân loại checkpoint 368 / 429 / login redirect, contract fixtures offline, campaign checkpoint & resume.
  - **Commit `4a1494b` & `3f287be`** [A12, A15, A16]: Bounded queries cho admin & user dashboard, đếm ACTIVE licenses chính xác theo expiration, chuẩn hóa thông điệp sản phẩm trung thực (bỏ cam kết tuyệt đối 99.8% checkpoint/hardware ID), đóng gói `fairy-house-extension-v2.zip` bản 2.1.1 (SHA-256: `2965a520a431e26b741941d922a1571d631c3d2f3591e97263db7795c00dd732`).
  - **Tổng kết kiểm thử**:
    - `npm run test:extension`: 24/24 PASS (100%).
    - `npx tsx --test tests/*.test.ts`: 36/36 PASS (100% trên Firestore Emulator).
    - `npx tsc --noEmit --incremental false`: PASS (0 lỗi).
    - `npm run lint`: PASS (0 lỗi).
    - `npm run build`: PASS (56/56 static/dynamic routes tối ưu hóa thành công).
- **2026-10-11 (Khắc phục theo báo cáo phản biện R01–R11):**
  - **Commit `f26cff0`** [R01]: Bắt buộc `installationId` trên `validateLicense`, `scan`, `phones`; ngăn bypass unbind.
  - **Commit `9803137`** [R02, R03]: Trừ quota nguyên tử khi retry sau refund; cách ly hạn mức ngày qua đêm (midnight boundary).
  - **Commit `d4c596e`** [R04, R05, R06, R07]: Lease fencing token, client retry 429, vòng đời payment intent, tương thích PayOS SDK v1, fail-closed test isolation.
  - **Commit `[Group 4]`** [R08, R09, R10, R11]: Tích hợp FacebookAdapter vào luồng extension, capabilities handshake, chống starvation outbox reconcile, keyset cursor pagination cho admin users, dashboard count aggregation, nâng Extension v2.1.2 và chuẩn hóa cam kết trung thực.

