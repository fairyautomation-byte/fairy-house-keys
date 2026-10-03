# TIÊU CHUẨN KIẾN TRÚC WEBSITE THƯƠNG MẠI BÁN KEY CHO CHROME EXTENSION
> **Tài liệu chuẩn hóa kiến trúc Full-Stack (Master Specification SOP)**  
> **Áp dụng cho:** Tất cả các dự án website thương mại bán bản quyền phần mềm / Chrome Extension trong tương lai.  
> **Phiên bản chuẩn:** V2.0 Full Layout Redesign & Automated PayOS Integration.

---

## 📌 HƯỚNG DẪN KÍCH HOẠT NHANH KHI LÀM WEB MỚI
Khi bạn vừa hoàn thiện một tiện ích Chrome mới và muốn AI xây dựng website hoàn chỉnh từ A-Z, bạn chỉ cần gửi yêu cầu ngắn gọn:
```
"Hãy đọc file webthuongmai.md và tạo một website SaaS thương mại mới cho tiện ích của tôi:
- Tên tiện ích: [Tên Extension mới của bạn]
- Nền tảng: [Facebook / TikTok / Shopee / YouTube / Canva...]
- Tính năng chính: [Mô tả ngắn chức năng quét hoặc tự động hóa]
- Giá các gói: [Gói dùng thử, Gói tháng, Gói 3 tháng, Gói 1 năm]
Hãy tuân thủ đúng 100% kiến trúc kỹ thuật, bảo mật, API, cơ chế PayOS và quy chuẩn bố cục UI/UX trong file webthuongmai.md."
```

---

## 1. TỔNG QUAN KIẾN TRÚC KỸ THUẬT (TECH STACK)

| Thành phần | Công nghệ sử dụng | Mục đích & Tiêu chuẩn |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) + TypeScript | SSR/SSG tối ưu SEO, tốc độ cao, hỗ trợ Serverless API Routes trên Vercel. |
| **Styling** | Tailwind CSS + Hairline Custom Tokens | Chuẩn thiết kế Hairline Flat Design (viền 1px sắc nét, font `Be_Vietnam_Pro`). |
| **Database** | Google Cloud Firebase Firestore Admin SDK | Lưu trữ dữ liệu NoSQL phân tán, hỗ trợ ACID Transactions (`db.runTransaction`). |
| **Thanh toán** | Cổng thanh toán PayOS (`@payos/node`) | Tự động hóa 100% bằng VietQR động, webhook kiểm tra chữ ký HMAC Checksum. |
| **Authentication** | JWT (`jose`) + Cookie `httpOnly` | Phiên đăng nhập an toàn chống XSS, kiểm soát luồng bởi Next.js Edge Middleware. |
| **Email Service** | `nodemailer` (Gmail App Password) | Gửi mã xác thực OTP 6 số và gửi mã License Key tự động sau khi mua. |
| **Bảo mật API** | In-Memory / Firestore IP Rate Limiting | Chặn brute-force và DDoS API kiểm tra key từ Extension (60 - 120 req/phút). |
| **Triển khai** | Vercel (Serverless Edge) | Tự động CI/CD khi đẩy mã nguồn lên Git. |

---

## 2. CẤU TRÚC THƯ MỤC CHUẨN (FOLDER ARCHITECTURE)

```
project-root/
├── src/
│   ├── app/                                # Next.js App Router
│   │   ├── (auth)/                         # Nhóm trang xác thực
│   │   │   ├── login/page.tsx              # Split-Screen 50/50
│   │   │   ├── register/page.tsx           # Split-Screen 50/50
│   │   │   ├── verify-otp/page.tsx         # Split-Screen 50/50 (OTP 6 số)
│   │   │   └── forgot-password/page.tsx    # Split-Screen 50/50
│   │   ├── dashboard/                      # Khu vực khách hàng (Cần đăng nhập)
│   │   │   ├── page.tsx                    # Command Center (Quota Battery + 8/4 Workspace)
│   │   │   ├── licenses/page.tsx           # Digital Credential Cards
│   │   │   ├── store/page.tsx              # Plan Matrix & Dual-Action Checkout
│   │   │   ├── wallet/page.tsx             # 2-Column Cashier Desk (VietQR PayOS)
│   │   │   ├── transactions/page.tsx       # Lịch sử đơn hàng
│   │   │   └── settings/page.tsx           # Đổi mật khẩu, cài đặt tài khoản
│   │   ├── admin/                          # Cổng quản trị viên
│   │   │   ├── page.tsx                    # Thống kê doanh thu & license
│   │   │   ├── orders/page.tsx             # Quản lý & duyệt đơn hàng
│   │   │   ├── licenses/page.tsx           # Quản lý tất cả License Keys
│   │   │   └── users/page.tsx              # Danh sách người dùng
│   │   ├── checkout/page.tsx               # 2-Column Split E-Commerce Checkout
│   │   ├── activate/page.tsx               # Hướng dẫn kỹ thuật cài đặt Extension
│   │   ├── page.tsx                        # Homepage (Asymmetric Split Hero + Bento)
│   │   └── api/                            # Backend Serverless Endpoints
│   │       ├── auth/                       # login, register, logout, otp, forgot...
│   │       ├── license/                    # validate, scan (API cho Extension)
│   │       ├── payos/                      # create-payment-link, check-order, webhook
│   │       ├── orders/                     # pay-with-wallet, submit
│   │       ├── user/                       # dashboard, change-password
│   │       └── admin/                      # dashboard, orders, licenses, users
│   ├── components/                         # UI/UX Components
│   │   ├── auth/AuthSplitLayout.tsx        # Khung bố cục 50/50 Split Screen
│   │   ├── landing/                        # LiveExtensionPreview, RoiEstimator, BentoFeatures, WorkflowSteps, AnchorPricing, GroupedFAQ
│   │   ├── layout/                         # Navbar, Sidebar (3 cụm logic), BottomNav, AdminSidebar
│   │   ├── features/                       # QRPayment, LicenseKey, OTPInput, PlanCard, StatusBadge
│   │   └── ui/                             # Button, Input, PasswordInput, Modal, Card, Alert, Skeleton
│   ├── lib/                                # Core Services & Security
│   │   ├── auth.ts                         # Trích xuất session cookie
│   │   ├── firebase.ts                     # Khởi tạo Firestore Admin SDK
│   │   ├── payos.ts                        # Khởi tạo PayOS client
│   │   ├── mailer.ts                       # Mẫu email HTML gửi OTP & Key
│   │   ├── jwt.ts                          # Ký và xác thực JWT token (HS256)
│   │   ├── otp.ts                          # Sinh mã OTP 6 số ngẫu nhiên
│   │   ├── key-generator.ts                # Sinh mã Key độc quyền (FH-XXXX-XXXX-XXXX)
│   │   └── rate-limit.ts                   # Chặn spam IP
│   └── middleware.ts                       # Chặn truy cập trái phép bằng Edge Middleware
├── webthuongmai.md                         # File đặc tả kiến trúc này
└── package.json
```

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (FIREBASE FIRESTORE SCHEMA)

### 3.1 Collection `users`
```typescript
interface UserDocument {
  id: string;                    // UID do Firestore tự sinh
  email: string;                 // Địa chỉ email (duy nhất)
  full_name: string;             // Họ và tên khách hàng
  zalo: string;                  // Số điện thoại / Zalo hỗ trợ
  password_hash: string;         // Mật khẩu đã mã hoá bằng bcryptjs
  role: 'USER' | 'ADMIN';        // Phân quyền tài khoản
  wallet_balance: number;        // Số dư ví tài khoản (VNĐ)
  email_verified: boolean;       // Đã xác thực OTP hay chưa
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### 3.2 Collection `licenses` (Bản quyền phần mềm)
```typescript
interface LicenseDocument {
  id: string;
  license_key: string;           // Mã Key định dạng: PREFIX-XXXX-XXXX-XXXX
  user_id: string;               // Liên kết tới users.id
  plan_id: 'trial' | 'monthly' | 'quarterly' | 'yearly';
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  device_id: string | null;      // Mã Hardware ID phần cứng của thiết bị đã liên kết
  daily_limit: number;           // Hạn mức scan/ngày (-1 là không giới hạn)
  daily_used: number;            // Số lượt đã quét trong ngày hiện tại
  last_reset_date: string;       // Ngày làm mới gần nhất (định dạng YYYY-MM-DD theo giờ VN)
  total_scans: number;           // Tổng số lần đã quét tích luỹ
  expires_at: Timestamp | null;  // Thời điểm hết hạn bản quyền (null là vĩnh viễn)
  created_at: Timestamp;
}
```

### 3.3 Collection `orders` (Lịch sử giao dịch)
```typescript
interface OrderDocument {
  id: string;
  user_id: string;
  plan_id: string | null;
  type: 'DEPOSIT' | 'BUY_KEY';   // Nạp tiền vào ví hoặc Mua Key
  amount: number;                // Số tiền giao dịch (VNĐ)
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  payos_order_code?: number;     // Mã đơn hàng PayOS sinh ra
  transaction_code: string;      // Mã đối soát ngân hàng
  created_at: Timestamp;
  paid_at?: Timestamp;
}
```

### 3.4 Collection `payos_orders` (Đơn hàng chờ khớp Webhook)
```typescript
interface PayOSOrderDocument {
  id: string;
  payosOrderCode: number;        // Mã giao dịch số nguyên duy nhất
  userId: string;
  amount: number;                // Số tiền cần thanh toán
  transactionCode: string;       // Mã tham chiếu nội bộ
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: Timestamp;
  paidAt?: Timestamp;
}
```

### 3.5 Collection `otps` (Lưu mã xác thực email)
```typescript
interface OTPDocument {
  email: string;
  otp: string;                   // Mã OTP 6 chữ số
  attempts: number;              // Số lần nhập sai (tối đa 5 lần)
  expiresAt: Timestamp;          // Thời hạn 5 phút kể từ lúc tạo
  created_at: Timestamp;
}
```

---

## 4. ĐẶC TẢ CHI TIẾT CÁC API BACKEND QUAN TRỌNG

### 4.1 API Dành Cho Chrome Extension Gọi Lên

#### A. Kiểm tra & Kích hoạt bản quyền (`POST /api/license/validate`)
* **Request Body:** `{ "licenseKey": "FH-98AF-72E1-44B2", "deviceId": "HW-883921" }`
* **Xử lý cốt lõi:**
  1. Kiểm tra Rate Limit theo IP (tối đa 60 request / phút).
  2. Tìm license trong database:
     * Nếu chưa có `device_id` $\rightarrow$ Lưu `device_id` của máy này vào database (Khóa 1 key / 1 máy).
     * Nếu đã có `device_id` mà không khớp máy gửi lên $\rightarrow$ Trả về mã lỗi `HARDWARE_MISMATCH`.
  3. Kiểm tra ngày theo múi giờ `Asia/Ho_Chi_Minh`: nếu `last_reset_date !== today` $\rightarrow$ reset `daily_used = 0`.
  4. Trả về: `{ valid: true, plan: "monthly", daily_limit: 1000, daily_used: 140, remaining: 860, expires_at: "..." }`.

#### B. Trừ lượt quét thời gian thực (`POST /api/license/scan`)
* **Request Body:** `{ "licenseKey": "FH-...", "count": 25 }`
* **Xử lý cốt lõi:**
  1. Kiểm tra tính hợp lệ của `count` ($1 \le count \le 500$).
  2. Sử dụng **Firestore Transaction (`db.runTransaction`)** để bảo vệ dữ liệu chống race-condition:
     ```typescript
     await db.runTransaction(async (transaction) => {
       const freshDoc = await transaction.get(licenseRef);
       let currentUsed = freshData.daily_used || 0;
       if (freshData.last_reset_date !== today) currentUsed = 0;
       
       // Cho phép grace margin 10 lượt trước khi chặn
       if (dailyLimit !== -1 && (currentUsed + count) > (dailyLimit + 10)) {
         throw new Error('DAILY_LIMIT_REACHED');
       }
       transaction.update(licenseRef, {
         daily_used: currentUsed + count,
         total_scans: FieldValue.increment(count),
         last_reset_date: today
       });
     });
     ```

### 4.2 API Thanh Toán PayOS Tự Động 100%

#### A. Tạo link thanh toán VietQR (`POST /api/payos/create-payment-link`)
* Dùng thư viện `@payos/node` sinh đơn hàng có mã `orderCode` ngẫu nhiên.
* Trả về URL VietQR động theo chuẩn Napas 247:  
  `https://img.vietqr.io/image/{bin}-{accountNumber}-compact2.jpg?amount={amount}&addInfo={orderCode}&accountName={name}`

#### B. Xử lý Webhook PayOS tự động (`POST /api/payos/webhook`)
* **Bảo mật cấp 1:** Gọi `payos.verifyPaymentWebhookData(body)` để xác thực chữ ký điện tử HMAC.
* **Bảo mật cấp 2:** So khớp số tiền ngân hàng gửi sang với số tiền lưu trong `payos_orders` (chặn gian lận thay đổi số tiền).
* **Bảo mật cấp 3:** Dùng `db.runTransaction` cộng tiền vào ví tài khoản `wallet_balance` và cập nhật đơn hàng thành `PAID`.

---

### 4.3 TIÊU CHUẨN BẢO MẬT NÂNG CAO CHỐNG CRACK (ENTERPRISE ANTI-CRACKING)

Để bảo vệ bản quyền tuyệt đối cho các sản phẩm Chrome Extension thương mại, bắt buộc áp dụng 5 chốt chặn sau:

#### 1. Khóa Cứng Định Danh Thiết Bị (Hardware ID Lock)
* **Nguyên lý:** Phía Extension tạo mã `deviceId` duy nhất dựa trên `chrome.storage.local.get('device_id')` hoặc thông số phần cứng kết hợp `crypto.randomUUID()`.
* **Kích hoạt lần đầu:** Server kiểm tra, nếu `license.device_id === null` $\rightarrow$ ghi nhận `license.device_id = deviceId`.
* **Chặn dùng chung:** Nếu máy khác gửi key này với `deviceId` khác $\rightarrow$ Server lập tức trả về `403 FORBIDDEN (HARDWARE_MISMATCH)`. Người dùng muốn đổi máy phải liên hệ hỗ trợ để Admin bấm nút "Reset Thiết Bị" trên trang Admin.

#### 2. Chống Dịch Ngược Code Extension (Extension Code Obfuscation)
* **Nguyên lý:** Code JavaScript chạy trên Chrome rất dễ bị người dùng mở DevTools để sửa `if (valid)`.
* **Biện pháp:** Trước khi nén file `.zip` phát hành cho khách hàng, toàn bộ code Extension phải được đóng gói qua **Terser** hoặc **JavaScript-Obfuscator** (xáo trộn tên biến, mã hóa chuỗi ký tự, làm rối luồng điều khiển Control Flow Flattening).

#### 3. Cấp Token Ký Số Theo Phiên (Signed Session Token)
* Khi gọi `validate` thành công, server trả về 1 JWT `scan_token` được ký bằng bí mật server (thời hạn 24 giờ).
* Khi Extension gọi `scan`, server bắt buộc kiểm tra `scan_token`. Khách hàng không thể tự gửi request giả mạo nếu không có token do server cấp.

#### 4. Mã Hóa Mật Khẩu Bằng Bcrypt
* Toàn bộ mật khẩu người dùng trong collection `users` phải được băm bằng thuật toán `bcryptjs` với hệ số làm chậm `saltRounds = 10` hoặc `12`, vô hiệu hóa hoàn toàn nguy cơ quét từ điển bằng GPU nếu chẳng may database bị rò rỉ.

#### 5. Bảo Vệ Concurrency Bằng Firestore Transaction
* Mọi hành động nhạy cảm liên quan đến tiền bạc (Nạp ví PayOS, Trừ tiền mua Key, Trừ lượt scan) bắt buộc phải bọc trong `db.runTransaction()`. Cơ chế khoá nguyên tử này ngăn chặn triệt để tấn công Race-Condition (gửi 100 request đồng thời để mua nhiều key với cùng 1 số dư).

---

## 5. QUY CHUẨN THIẾT KẾ BỐ CỤC UI/UX (SKILL `ui-ux`)

Tuyệt đối không sử dụng cùng một bố cục chung cho tất cả các trang. Từng màn hình phải có cấu trúc riêng biệt đáp ứng mục tiêu người dùng:

### 5.1 Trang Chủ (Homepage - `src/app/page.tsx`)
* **Top Announcement Ribbon:** Băng thông báo cập nhật phiên bản mới chống checkpoint.
* **Asymmetric Split Hero (60% Trái / 40% Phải):**
  * *Trái:* Headline phân tầng + Subtext thuyết phục + Cặp nút kép ("Dùng thử 3 ngày 0đ" & "Xem bảng giá") + 3 huy hiệu bảo mật.
  * *Phải:* Component `LiveExtensionPreview` mô phỏng trực tiếp popup Chrome đang chạy quét data live, đếm lùi thời gian nghỉ an toàn và nút "Xuất Excel".
* **Social Proof Ticker:** 4 thông số thương mại (Số UID/ngày, Tỷ lệ an toàn 99.8%, Duyệt tự động 5s, Hỗ trợ 24/7).
* **Công cụ tính hiệu quả (`RoiEstimator`):** Kéo thanh trượt để tính số giờ tiết kiệm thủ công và số khách hàng chốt đơn ước tính.
* **Lưới tính năng Bento (`BentoFeatures`):** Lưới không cân xứng tôn vinh tính năng át chủ bài (Mô phỏng người thật, Lọc UID sạch, Auto kết bạn, Xuất Excel/CSV).
* **Lộ trình 3 bước trực quan (`WorkflowSteps`):** 01. Nhận key qua PayOS $\rightarrow$ 02. Cài Extension vào Chrome $\rightarrow$ 03. Quét tệp nhóm.
* **Bảng giá có neo giá trị (`AnchorPricing`):** Làm nổi bật gói 3 Tháng (tiết kiệm 40%), cam kết hoàn tiền 1-đổi-1 trong 24h.
* **Hỏi đáp phân nhóm (`GroupedFAQ`):** Chia 3 tab (Bản quyền & Thiết bị, Kỹ thuật & Checkpoint, Thanh toán PayOS).
* **Split Final CTA:** 2 cột chuyển đổi nhanh.

### 5.2 Nhóm Trang Xác Thực (`/login`, `/register`, `/verify-otp`, `/forgot-password`)
* Dùng chung layout `AuthSplitLayout` bố cục **Split-Screen 50/50**:
  * *Cột trái (Desktop 50%):* Thương hiệu, số liệu uy tín, lời khen của khách hàng thực tế và chứng chỉ bảo mật TLS.
  * *Cột phải (50% Desktop / 100% Mobile):* Form nhập liệu chuẩn hóa, nút quay về trang chủ và link hỗ trợ Zalo.

### 5.3 Bảng Điều Khiển Tổng Quan (`/dashboard`)
* Thiết kế theo mô hình **Trung Tâm Chỉ Huy (Command Center)**:
  * *Tầng 1 (Visual Anchor):* Banner bản quyền to nhất trên cùng hiển thị mã Key, hạn sử dụng và **Thanh pin đo tiến độ Quota hôm nay (Gauge bar)** kèm cảnh báo reset 00:00 VN.
  * *Tầng 2 (Lưới 8 / 4):*
    * Cột 8 phần: Bàn làm việc Chrome (Tải file zip, Kích hoạt key, Hướng dẫn Ultraview).
    * Cột 4 phần: Thẻ số dư ví + Nút nạp tiền PayOS 1 chạm.
  * *Tầng 3:* Bảng lịch sử giao dịch có bộ lọc Tab (Tất cả / Thành công / Chờ thanh toán).

### 5.4 Bàn Thu Ngân & Nạp Ví (`/dashboard/wallet`)
* Bố cục **2-Column Cashier Desk**:
  * *Cột trái:* Thẻ số dư ví + Ô nhập tiền kèm 5 chip mệnh giá chọn nhanh (50k, 100k, 200k, 500k, 1 Triệu).
  * *Cột phải:* Màn hình thanh toán hiển thị mã VietQR PayOS quét tự động hoặc bảng hướng dẫn 3 bước nạp tiền tự động.

### 5.5 Quản Lý License (`/dashboard/licenses`)
* Bố cục **Thẻ Chứng Chỉ Số (Digital Credential Card)**:
  * Huy hiệu `1 Thiết Bị Độc Quyền • Hardware Lock Enabled`.
  * Ô hiển thị License Key dạng Monospace có nút sao chép 1 chạm.
  * Thanh đo hạn mức quota tiêu thụ trong ngày đổi màu theo mức độ an toàn.
  * Nút "Gia Hạn / Nâng Cấp" riêng cho từng License.

### 5.6 Trang Thanh Toán Checkout (`/checkout`)
* Bố cục **Split E-Commerce 2 Cột**:
  * *Cột trái (7 phần):* Lựa chọn gói cước và màn hình quét mã PayOS tự động cấp Key tại chỗ.
  * *Cột phải (5 phần - Sticky cố định):* Bảng tóm tắt đơn hàng (Order Summary) gồm chiết khấu khuyến mại, miễn phí cổng thanh toán 0đ, tổng tiền in đậm và 3 cam kết bảo mật.

---

## 6. DANH SÁCH BIẾN MÔI TRƯỜNG CẦN CÓ TRÊN VERCEL

Khi deploy lên Vercel, bắt buộc cấu hình 10 biến môi trường sau:
```env
# 1. CỔNG THANH TOÁN PAYOS
PAYOS_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYOS_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PAYOS_CHECKSUM_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. GOOGLE CLOUD FIREBASE ADMIN
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n"

# 3. AUTH & BẢO MẬT
JWT_SECRET=your-random-super-secret-jwt-token-key-minimum-32-chars

# 4. NODEMAILER (GMAIL GỬI OTP & KEY)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# 5. DOMAIN WEBSITE
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

---

## 7. QUY TRÌNH THỰC HIỆN 3 BƯỚC BẮT BUỘC KHI XÂY DỰNG
1. **Bước 1 (Lập Kế Hoạch):** Luôn tạo file `LAYOUT_REDESIGN_PLAN.md` phân tích Information Architecture và cấu trúc các trang trước để khách hàng duyệt, **tuyệt đối không code vội vàng**.
2. **Bước 2 (Triển khai Chuẩn Hóa):** Code toàn bộ Frontend + Backend API + PayOS + Firebase đồng bộ theo đúng đặc tả trên.
3. **Bước 3 (Kiểm thử Toàn Diện):** Chạy lệnh `npx tsc --noEmit` và `npm run build` để đảm bảo 100% routes được biên dịch thành công với 0 lỗi cú pháp trước khi bàn giao.
