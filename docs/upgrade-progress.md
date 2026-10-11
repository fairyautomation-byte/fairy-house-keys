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
| **Giai đoạn 3** | Tính bền tiện ích: Facebook adapter, session binding, offline/retry (A09, A13, A14) | **ĐANG THỰC HIỆN** | Extension suite & browser harness |
| **Giai đoạn 4** | Web & Admin: Phân trang bounded, nội dung minh bạch, audit log (A12, A15) | **CHỜ THỰC HIỆN** | Admin query test, UI validation |
| **Giai đoạn 5** | Vận hành & Phát hành: Staging verification, package ZIP, release checklist (A16) | **CHỜ THỰC HIỆN** | Staging smoke, release hash check |

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
| **A09** | P1 | Cam kết 1 key/1 thiết bị chưa ràng buộc chặt | **ĐANG THỰC HIỆN** | Session/installation token exchange & validation |
| **A10** | P1 | Rate limit ghi Firestore trước khi validate format | **HOÀN THÀNH** | Validate format trước, trả `Retry-After` header khi 429 (Commit `f594bec`) |
| **A11** | P2 | Thiếu readiness/capabilities và chuẩn hóa error | **HOÀN THÀNH** | `GET /api/capabilities`, `GET /api/admin/readiness`, `failure()` chuẩn (Commit `3ec1c1b`) |
| **A12** | P2 | Admin & User dashboard đọc toàn bộ collections | Planned | Keyset pagination, query bounded |
| **A13** | P2 | Facebook API thiếu contract fixtures chống đổi schema | Planned | Schema adapter theo từng context |
| **A14** | P2 | Lịch sử quét demo/batch chưa được lưu thực sự | Planned | Local storage campaign / checkpoint recovery |
| **A15** | P2 | Thông tin cam kết 99.8% / hardware ID chưa chính xác | Planned | Chuẩn hóa thông điệp sản phẩm |
| **A16** | P1/P2 | IAM, TTL, backup chưa được kiểm chứng | Planned | Cấu hình TTL application-side check |

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
  - **Build Verification**: `next build --webpack` thành công 55/55 static/dynamic routes. Toàn bộ 21 unit/integration test pass, 11/11 extension test pass.
