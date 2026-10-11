# Tiến Độ Nâng Cấp Fairy House AutoData (11/10/2026)

Theo dõi lộ trình sửa lỗi và nâng cấp theo `PLAN_NANG_CAP_TOAN_DIEN_ANTIGRAVITY_2026-10-11.md`.

---

## Bảng Tổng Hợp Tiến Độ Các Giai Đoạn

| Giai đoạn | Nội dung trọng tâm | Trạng thái | Gate Kiểm thử |
|---|---|---|---|
| **Giai đoạn 0** | Chốt baseline, inventory feature/schema, ma trận môi trường | **HOÀN THÀNH** | `npm run test:extension` (11/11 pass), `git status` clean |
| **Giai đoạn 1** | Cách ly môi trường test, hợp đồng API, capabilities & readiness (A01, A02, A11) | **ĐANG THỰC HIỆN** | Test isolation guard, capabilities check, readiness test |
| **Giai đoạn 2** | Nghiệp vụ: Payment state machine, lookup deadline/idempotency, outbox, rate limits (A03, A04, A05, A06, A07, A08, A10) | **CHỜ THỰC HIỆN** | Race interleaving test, phone idempotency test, outbox test |
| **Giai đoạn 3** | Tính bền tiện ích: Facebook adapter, session binding, offline/retry (A09, A13, A14) | **CHỜ THỰC HIỆN** | Extension suite & browser harness |
| **Giai đoạn 4** | Web & Admin: Phân trang bounded, nội dung minh bạch, audit log (A12, A15) | **CHỜ THỰC HIỆN** | Admin query test, UI validation |
| **Giai đoạn 5** | Vận hành & Phát hành: Staging verification, package ZIP, release checklist (A16) | **CHỜ THỰC HIỆN** | Staging smoke, release hash check |

---

## Bảng Chi Tiết Theo Finding ID

| Finding ID | Mức độ | Mô tả lỗi | Trạng thái | Ghi chú & Tệp thay đổi |
|---|---|---|---|---|
| **A01** | P0 | Web & extension lệch phiên bản, 404 HTML | In Progress | Thêm `/api/capabilities`, xử lý version handshake |
| **A02** | P0 | Thiếu cách ly dữ liệu giữa Production và Test | In Progress | `src/lib/firebase.ts`, chặn kết nối `fairy-house-keys` trong test |
| **A03** | P1 | Timeout hai đầu không khớp, thiếu partial results | In Progress | `src/app/api/license/phones/route.ts`, server deadline tổng < 20s |
| **A04** | P1 | Quota trừ trước, chưa chống gọi provider lặp song song | In Progress | Thêm lease token/PROCESSING lock vào `phone_requests` |
| **A05** | P1 | Trạng thái thanh toán bị lùi từ PAID về CANCELED | In Progress | Chuyển trạng thái bằng transaction, PAID là terminal state |
| **A06** | P1 | Khôi phục tạo link PayOS lỗi vì sai SDK schema | In Progress | Không ép kiểu checkoutUrl từ getPaymentLinkInformation |
| **A07** | P1 | QR hết hạn, polling chồng chéo, requestId scope thiếu | In Progress | Payment intent gắn amount/plan, sequential polling, expiresAt |
| **A08** | P1 | Outbox email & đối soát bị nghẽn bởi job lỗi lâu ngày | In Progress | Thêm attempts, backoff, next_attempt_at, dead-letter |
| **A09** | P1 | Cam kết 1 key/1 thiết bị chưa ràng buộc chặt | Planned | Session/installation token exchange |
| **A10** | P1 | Rate limit ghi Firestore trước khi validate format | In Progress | Validate format trước, trả Retry-After header |
| **A11** | P2 | Thiếu readiness/capabilities và chuẩn hóa error | In Progress | `GET /api/capabilities`, `GET /api/admin/readiness` |
| **A12** | P2 | Admin & User dashboard đọc toàn bộ collections | Planned | Keyset pagination, query bounded |
| **A13** | P2 | Facebook API thiếu contract fixtures chống đổi schema | Planned | Schema adapter theo từng context |
| **A14** | P2 | Lịch sử quét demo/batch chưa được lưu thực sự | Planned | Local storage campaign / explicit handling |
| **A15** | P2 | Thông tin cam kết 99.8% / hardware ID chưa chính xác | Planned | Chuẩn hóa thông điệp sản phẩm |
| **A16** | P1/P2 | IAM, TTL, backup chưa được kiểm chứng | Planned | Cấu hình TTL application-side check |

---

## Nhật Ký Thực Hiện Từng Bước
- **2026-10-11 (Giai đoạn 0):**
  - Đã rà soát commit baseline `5feedff5618c6118c6deb13bc9fe12a70fb53d48`.
  - Khởi tạo `docs/baseline.md` và `docs/upgrade-progress.md`.
  - Kiểm tra các bài test có sẵn: 11/11 extension pass; 8/8 web crypto/security pass (10 integration tests skip do thiếu Firestore emulator/java).
