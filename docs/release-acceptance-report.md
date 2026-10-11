# BÁO CÁO NGHIỆM THU NÂNG CẤP FAIRY HOUSE AUTODATA (11/10/2026)

Dành cho: **Chủ dự án Fairy House AutoData**  
Người thực hiện: **Antigravity AI Pair Programmer**  
Mã nhánh: `codex/security-hardening-2026-10-10`  
Baseline commit gốc: `5feedff5618c6118c6deb13bc9fe12a70fb53d48`  
Trạng thái: **SẴN SÀNG DUYỆT (CHƯA MERGE GITHUB / CHƯA DEPLOY PRODUCTION)**

---

## 1. TỔNG QUAN KẾT QUẢ TRIỂN KHAI VÀ XỬ LÝ LỖI R01–R11

Dự án đã hoàn thành rà soát và xử lý tuần tự theo đúng thứ tự ưu tiên trong báo cáo phản biện độc lập `REVIEW_ANTIGRAVITY_2026-10-11.md`:

### Nhóm 1: R01 (P1 — Bảo mật & Thiết bị) [Commit `f26cff0`]
- **R01**: Thực thi bắt buộc `installationId` khi kiểm tra bản quyền đã bind (`validateLicense`); từ chối mọi yêu cầu thiếu thiết bị với mã 403 `DEVICE_LIMIT_EXCEEDED`; tuyệt đối không tiết lộ `installation_id` cho client; truyền `installationId` xuyên suốt qua route `/api/license/scan` và `/api/license/phones`.

### Nhóm 2: R02 & R03 (P1 — Quota & Idempotency) [Commit `9803137`]
- **R02**: Ngăn chặn trục lợi retry sau khi refund. Trong `consumeQuota`, nếu phát hiện biên lai cùng `requestId` đã được refund (`prevData.refunded === true`), hệ thống kiểm tra lại hạn mức ngày và trừ quota nguyên tử thay vì trả kết quả miễn phí.
- **R03**: Cách ly bucket hạn mức khi hoàn tiền qua đêm (midnight boundary). `refundSystemQuota` chỉ trừ `daily_used` nếu `recData.usage_date === today`. Nếu hoàn tiền cho lượt dùng của ngày trước, hệ thống chỉ giảm `total_scans` mà không làm âm hay ảnh hưởng đến hạn mức ngày mới.

### Nhóm 3: R04, R05, R06, R07 (P1 — Core Reliability & State Machine) [Commit `d4c596e`]
- **R04**: Bổ sung `lease_token` fencing vào biên lai tra cứu số điện thoại. Khi background worker gặp lỗi hoặc hoàn thành, hệ thống đối soát `lease_token` trước khi cập nhật `FAILED` hoặc rollback quota, ngăn stale worker ghi đè worker mới; áp dụng server deadline 12s đồng bộ và client retry khi gặp HTTP 429 (`OPERATION_IN_PROGRESS`).
- **R05**: Khắc phục vòng đời `paymentIntentId`: dọn dẹp chính xác key sessionStorage `payment:deposit:<amount>` và `payment:purchase:<plan>` khi hủy đơn, QR hết hạn hoặc gặp HTTP 410, cho phép người dùng mở lại đơn mới ngay lập tức.
- **R06**: Chuẩn hóa schema PayOS theo SDK `@payos/node` v1 (`PaymentLinkDataType`), khôi phục an toàn qua dữ liệu đơn hàng và đối soát nghiêm ngặt `amountPaid === result.amount`.
- **R07**: Siết chặt cách ly môi trường test / preview: fail-closed guard kiểm tra `APP_ENV=test`, `VERCEL_ENV=preview` và xác thực với `FIREBASE_STAGING_PROJECT_ID`, cấm tuyệt đối kết nối `fairy-house-keys` trong môi trường thử nghiệm.

### Nhóm 4: R08, R09, R10, R11 (P2 — Tích hợp, Quản trị, Phiên bản & Nội dung) [Commit hiện tại]
- **R08**: Tích hợp `FacebookAdapter` vào luồng nghiệp vụ thực tế của Extension (`sendFriendRequest`, `fetchGroupMembersPage`) để phân loại checkpoint (mã 368), giới hạn tần suất (mã 429) và điều hướng login HTML; thực hiện handshake `/api/capabilities` khi extension khởi động.
- **R09**: Loại bỏ nguy cơ starvation trong hàng đợi outbox đối soát (`/api/admin/reconcile-payments`): mở rộng tập ứng viên lên 200 đơn và 100 email, sắp xếp theo thời gian đến hạn (`next_reconcile_at asc`, `next_attempt_at asc`) để các tác vụ back-off không chặn đứng các đơn mới.
- **R10**: Bổ sung phân trang Keyset/Cursor cho `/api/admin/users` (`?cursor=...`, `startAfter()`), cung cấp header `x-next-cursor` và `x-has-more`; áp dụng Firestore `.count()` aggregation cho Dashboard quản trị để không bị giới hạn 100 bản ghi.
- **R11**: Nâng phiên bản Extension lên **2.1.2** trong `manifest.json` và `clientVersion`; đóng gói lại file ZIP và đồng bộ mã hash SHA-256; chuẩn hóa thông điệp thương mại trung thực (bỏ cam kết 99.8% uptime và tự động bù ngày, thay bằng giám sát 24/7 và quy trình hỗ trợ đối soát thủ công; bỏ hướng dẫn `git reset --hard`).

---

## 2. BẰNG CHỨNG KIỂM THỬ TỰ ĐỘNG

Tất cả kiểm thử được chạy cục bộ với công cụ trong `E:\Target\test-tools`:

```text
================================================================================
1. KIỂM THỬ TIỆN ÍCH EXTENSION (Node.js test runner)
Command: node --test extension/tests/*.test.cjs
- Tổng số bài test: 24
- PASS: 24 / 24
- FAIL: 0
- SKIPPED: 0
- Chi tiết các nhóm test:
  ✔ A14: getOrCreateInstallationId persists unique installation identifier
  ✔ A14: ZT_CAMPAIGN_CHECKPOINT_SAVE and GET allow campaign pause & resume
  ✔ A14: ZT_EXTENSION_SCAN_LOG caps history to 20 recent items
  ✔ A14: ZT_EXTENSION_UID_DEMO_BATCH deduplicates UIDs correctly
  ✔ A13 & R08: classifies HTTP 429 as RATE_LIMITED with safe cooldown
  ✔ A13 & R08: classifies HTML login redirect as LOGIN_REQUIRED
  ✔ A13 & R08: classifies error code 368 as CHECKPOINT_OR_BLOCKED to prevent account suspension
  ✔ A13 & R08: adaptGroupMembers extracts members list and pagination cursor correctly
  ✔ A13 & R08: adaptFriendInvite parses OUTGOING_REQUEST as successful invitation
  ✔ A13 & R08: adaptFriendInvite parses rejected/failed status accurately
  ✔ A13 & R08: handles malformed JSON response safely as SCHEMA_MISMATCH
  ✔ R08: sendFriendRequest catches checkpoint 368 and classifies error via FacebookAdapter
  ✔ R08: fetchGroupMembersPage catches rate limit 429 and classifies error via FacebookAdapter
  ✔ server denial clears ACTIVE authorization
  ✔ late validation never restores key after logout
  ✔ refresh cache follows current key
  ✔ old denial never alters a new key session
  ✔ offline keeps key and marks authorization stale
  ✔ missing Facebook cookie is not ready
  ✔ content cannot read license or arbitrary storage; foreign sender is denied
  ✔ Graph paging rejects outside host
  ✔ phone transport retry uses stable request ID and backend only
  ✔ CSV escapes spreadsheet formulas and quotes
  ✔ HTML 404 reports backend upgrade and never leaks JSON parser error or retries

================================================================================
2. KIỂM THỬ BACKEND API VỚI FIRESTORE EMULATOR (Node.js test runner)
Command: $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8085"; npx tsx --test tests/*.test.ts
- Tổng số bài test: 36
- PASS: 36 / 36
- FAIL: 0
- SKIPPED: 0
- Chi tiết các nhóm test trọng yếu:
  ✔ R01: validateLicense rejects requests without installationId when bound (403)
  ✔ R01: validateLicense succeeds with matching installationId
  ✔ R01: scan endpoint enforces installation binding
  ✔ R01: phones endpoint rejects lookup without installationId when bound
  ✔ R02: retry after refund recharges daily quota atomically instead of returning free lookup
  ✔ R03: refunding previous day charge decrements total_scans without decrementing new day daily_used
  ✔ R04: lookup lease fencing token check prevents stale worker race condition
  ✔ R05: payment intent scope lifecycle clears session on cancel, expiry, or 410
  ✔ R06: payos link creation handles v1 SDK schema safely
  ✔ R07: test isolation guard verifies APP_ENV, VERCEL_ENV and staging project ID
  ✔ R09: admin reconcile query avoids starvation by backed-off jobs
  ✔ R10: admin users endpoint supports keyset cursor pagination
  ✔ R10: admin dashboard uses accurate count aggregations
  ✔ A05: transitionOrderStatus prevents downgrading PAID to CANCELED/EXPIRED
  ✔ A05: interleaving race between Webhook PAID and Poll CANCELLED preserves PAID
  ✔ A05: concurrent settlePayment and cancel operations guarantee PAID consistency
  ✔ Outbox email respects attempts, lease fencing and dead-letter queue
  ✔ TOTP, JWT, password hash, rate-limit format defense tests pass

================================================================================
3. KIỂM THỬ TĨNH & DỰNG DỰ ÁN
- TypeScript: `npx tsc --noEmit --incremental false` -> PASS (0 error)
- Lint: `npm run lint` -> PASS (0 error)
- Next.js Build: `npm run build` -> PASS (56/56 routes compiled)
================================================================================
```

---

## 3. THÔNG TIN GÓI PHÁT HÀNH EXTENSION (V2.1.2)

- **Đường dẫn tệp:** `public/fairy-house-extension-v2.zip`
- **Tệp metadata:** `public/extension-release.json`
- **Phiên bản:** `2.1.2`
- **Số lượng tệp trong gói:** 27
- **Mã băm SHA-256:**
  ```text
  3be516c017fb915c1aaea2a77d4689b85c0d2b1e3d78548b160adb0aff573806
  ```

---

## 4. BẢNG PHÂN ĐỊNH TRUNG THỰC: ĐÃ XÁC MINH VS CHƯA KIỂM CHỨNG

Để đảm bảo tính trung thực theo yêu cầu của báo cáo phản biện, dưới đây là phân định rõ ràng giữa những phần đã chứng minh bằng bài test thật và những phần phụ thuộc vào hạ tầng cloud chưa nghiệm thu:

| Hạng mục | Trạng thái | Hình thức kiểm chứng | Ghi chú vận hành |
|---|---|---|---|
| **R01: Ràng buộc thiết bị** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator | Chặn truy cập khi thiếu `installationId` hoặc sai thiết bị; unbind an toàn. |
| **R02: Nạp lại quota khi retry sau refund** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator | Kiểm tra nguyên tử hạn mức ngày và nạp lại quota, không cho dùng chùa. |
| **R03: Hoàn tiền qua đêm** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator | Chỉ trừ `daily_used` của đúng ngày phát sinh; bảo toàn hạn mức ngày mới. |
| **R04: Lease fencing & Client retry** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator & Node | Fencing token ngăn worker cũ ghi đè; client có back-off khi gặp 429. |
| **R05: Vòng đời paymentIntentId** | **ĐÃ XÁC MINH** | Test logic & UI component | Xóa đúng key scope trong sessionStorage khi hết hạn hoặc hủy. |
| **R06: Schema PayOS SDK v1** | **ĐÃ XÁC MINH** | Unit test hợp đồng API | Phục hồi qua dữ liệu đơn hàng; đối soát `amountPaid` chính xác. |
| **R07: Cách ly test/preview** | **ĐÃ XÁC MINH** | Test guard trong `firebase.ts` | Chặn đứng kết nối vào project production khi chạy test hoặc preview. |
| **R08: Facebook Adapter & Handshake** | **ĐÃ XÁC MINH** | Extension test runner (24/24 pass) | Phân loại chính xác 368, 429, login HTML; handshake capabilities khi khởi động. |
| **R09: Chống starvation outbox** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator | Query 200 đơn / 100 email, sắp xếp theo thời hạn gần nhất. |
| **R10: Keyset pagination & dashboard** | **ĐÃ XÁC MINH** | Test tự động trên Firestore Emulator | Hỗ trợ cursor phân trang và aggregation count. |
| **R11: Phiên bản & Nội dung** | **ĐÃ XÁC MINH** | Rà soát mã nguồn & build ZIP | Version 2.1.2 đồng bộ hash; bỏ cam kết 99.8% uptime và bù ngày tự động. |
| **IAM Roles & Quyền tối thiểu GCP** | *CHƯA KIỂM CHỨNG* | Cần thao tác trên Google Cloud Console | Cần phân quyền Service Account thực tế trên GCP trước khi deploy. |
| **TTL Policies & Backup/Restore Drill** | *CHƯA KIỂM CHỨNG* | Cần diễn tập trên Firebase Cloud | Cần chạy kịch bản export/import thực tế trên Firestore backup bucket. |
| **Thanh toán PayOS Sandbox E2E thật** | *CHƯA KIỂM CHỨNG* | Cần quét QR qua app ngân hàng thật | Đã kiểm thử logic và hợp đồng SDK; cần test 1 đơn thật trên staging. |
| **Tác vụ Facebook thực tế trên nick cá nhân** | *CHƯA KIỂM CHỨNG* | Không chạy tự động để tránh checkpoint | Logic xử lý đã test qua fixture mẫu; người dùng cần kiểm tra thủ công. |

---

## 5. HƯỚNG DẪN HOÀN NGUYÊN AN TOÀN (ROLLBACK GUIDELINES)

> [!WARNING]
> Tuyệt đối **không** sử dụng `git reset --hard` trên môi trường làm việc có thay đổi chưa commit, vì lệnh này sẽ xóa vĩnh viễn các tệp chưa theo dõi hoặc các nhánh đang phát triển song song.

Nếu cần hoàn nguyên một phần hoặc toàn bộ thay đổi sau khi kiểm thử trên Staging:
1. **Hoàn nguyên bằng Git Revert (Khuyến nghị):**
   ```bash
   # Hoàn nguyên nhóm R08-R11:
   git revert <commit-r08-r11>
   # Hoàn nguyên nhóm R04-R07:
   git revert d4c596e
   # Hoàn nguyên nhóm R02-R03:
   git revert 9803137
   # Hoàn nguyên nhóm R01:
   git revert f26cff0
   ```
2. **Chuyển nhánh sạch để đối chiếu:**
   ```bash
   git checkout -b review-baseline 5feedff5618c6118c6deb13bc9fe12a70fb53d48
   ```
3. **Rollback trên nền tảng Cloud (Vercel / Hosting):**
   - Sử dụng chức năng *Instant Rollback* của Vercel về bản deployment ổn định trước đó. Không phụ thuộc vào lệnh git cục bộ.

---

## 6. KẾT LUẬN & TRẠNG THÁI HIỆN TẠI

- Mã nguồn đã hoàn tất đầy đủ 11 lỗi R01–R11 với kiểm thử hồi quy tương ứng.
- **CHƯA PUSH GITHUB** và **CHƯA DEPLOY PRODUCTION**.
- Toàn bộ công việc nằm trên nhánh cục bộ `codex/security-hardening-2026-10-10`.
