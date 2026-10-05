# BÁO CÁO TOÀN DIỆN: FULL AUDIT + UI/UX REVIEW + LAYOUT REDESIGN + RESPONSIVE/ADAPTIVE OPTIMIZATION
**Dự án:** Fairy House AutoData (Commercial SaaS & Chrome Extension Dashboard)  
**Tiêu chuẩn áp dụng:** Global UI/UX Skill `ui-ux` (EvondevKit) — Baseline Hướng A (Hairline Flat Light Design) kết hợp Adaptive Viewport Hierarchy.  
**Ngày kiểm toán:** 05/10/2026  
**Trạng thái Codebase:** Next.js 14.2.5 (App Router), Tailwind CSS v3.4.1, React 18, PayOS VietQR, Firebase Admin.

---

> [!IMPORTANT]
> **Tuyên ngôn tuân thủ Skill `ui-ux`:**
> 1. Toàn bộ đánh giá và giải pháp dưới đây bám sát kiến trúc kỹ thuật hiện có của dự án. Không áp đặt thư viện mới ngoài stack hiện tại.
> 2. **Tuyệt đối bảo toàn Business Logic:** Không can thiệp hoặc thay đổi luồng xử lý Firebase, Authentication JWT/Cookie, Gmail OTP, cổng thanh toán PayOS VietQR, cấu trúc cơ sở dữ liệu (Firestore collections: `users`, `licenses`, `orders`, `transactions`), logic trích xuất của Chrome Extension và quyền quản trị Admin.
> 3. **Vượt qua cái bẫy "Visual Dressing":** Không dừng lại ở việc đổi màu hay bo góc. Đánh giá đi sâu vào Layout, Information Architecture, Container System, Fluid Typography và Adaptive Grids từ Mobile (320px) đến Màn hình siêu lớn (4K 3840px).

---

## 1. TỔNG QUAN HIỆN TRẠNG (EXECUTIVE SUMMARY)

### 1.1 Toàn cảnh Codebase sau lần Redesign trước
Lần redesign trước đó đã chuyển đổi giao diện từ phong cách tối (Dark theme với hiệu ứng Glow/Cyan cũ) sang **Hướng A: Hairline Flat Light Design** với tông màu Teal `#0E7490` và nền xám trắng `#F6F7F9` / `#FFFFFF`.
Hệ thống đã triển khai các thành phần mới như:
- Trang chủ (Landing Page): Hero 2 cột bất đối xứng, Live Extension Preview, Estimator tính ROI, Bento Features, Workflow 3 bước, Anchor Pricing và Grouped FAQ.
- Luồng Auth: Split Screen 50/50 (`AuthSplitLayout.tsx`) cho Login, Register, Verify OTP, Forgot Password.
- Dashboard khách hàng: 3 tầng thông tin (Tier 1 Command Anchor Banner, Tier 2 Workstation + Wallet, Tier 3 Lịch sử đơn hàng).
- Thanh toán (`/checkout`): Split Checkout 2 cột (Cấu hình gói + QR PayOS động & Tóm tắt đơn hàng).
- Trang quản trị Admin: Header & Sidebar admin với các màn hình Orders, Licenses, Users.

### 1.2 Bảng tổng hợp hiện trạng các Route & Thành phần

| Nhóm chức năng | Route hiện hữu | Trạng thái Layout | Vấn đề cốt lõi phát hiện |
| :--- | :--- | :--- | :--- |
| **Public / Landing** | `/` | Đã có Bento & Hero 2 cột | Bị bó cứng trong `max-w-[1200px]`, màn 2K/4K trôi dạt giữa màn hình với 2 dải trắng khổng lồ. |
| **Chính sách / Hướng dẫn** | `/privacy`, `/terms`, `/activate` | Bố cục 1 cột đọc tài liệu | Khung `max-w-[860px]` hợp lý cho đọc nhưng thiếu nhịp responsive typography, heading tĩnh. |
| **Xác thực (Auth)** | `/login`, `/register`, `/verify-otp`, `/forgot-password` | Split 50/50 Desktop, 1 cột Mobile | Cột form cố định `max-w-[420px]`. Input bị lỗi font 13px gây auto-zoom trên iOS Safari. |
| **Thanh toán PayOS** | `/checkout` | Split 2 cột cấu hình + QR PayOS | Khung `max-w-[1200px]` làm mã QR nhỏ trên màn hình lớn; trên mobile bảng chọn gói chiếm nhiều diện tích. |
| **Customer Dashboard** | `/dashboard` | 3 Tier (Banner + 8/4 Tools + Table) | Bị giới hạn trong `max-w-[1200px]`, trên màn 1920/2K/4K lọt thỏm giữa khoảng trống 600-1200px. |
| **License Management** | `/dashboard/licenses` | Danh sách thẻ License | Lưới thẻ license chưa tối ưu cột trên màn hình rộng; trên mobile thiếu chỉ số quét UID nhanh. |
| **Cửa hàng / Mua Key** | `/dashboard/store` | Lưới 4 card gói cước | Bị co bẹp thành 4 cột hẹp trong 1200px; trên tablet dọc co thành 2 cột quá chật vì sidebar chiếm 260px. |
| **Ví / Nạp PayOS** | `/dashboard/wallet` | Split 5/7 (Ví + Form nạp & QR) | Preset nút nạp tiền 5 nút xếp `grid-cols-3` tạo khoảng trống thừa (vi phạm luật R3 của skill). |
| **Lịch sử giao dịch** | `/dashboard/transactions` | Bảng dữ liệu Table | Chưa truyền `mobileRender` khiến mobile phải cuộn ngang mà không có cột ghim (sticky). |
| **Cài đặt tài khoản** | `/dashboard/settings` | Form đổi mật khẩu `max-w-[480px]` | Card nằm chơ vơ bên trái trong không gian 1200px-2560px, thiếu bố cục thông tin bổ trợ. |
| **Admin Portal** | `/admin`, `/admin/orders`, `/admin/licenses`, `/admin/users` | Bảng quản trị hệ thống | Bị giới hạn trong `max-w-7xl` (1280px). Bảng nhiều cột bị bóp nghẹt dù màn hình 1920/2K còn thừa 50% diện tích. |
| **Admin Login** | `/admin/login` | Card 400px giữa màn hình | Chuẩn form đơn giản nhưng thiếu trạng thái focus rõ nét và responsive spacing. |

---

## 2. ĐÁNH GIÁ LẠI LẦN REDESIGN TRƯỚC (RETROSPECTIVE EVALUATION)

### 2.1 Những gì lần trước ĐÃ LÀM THẬT (Real Architectural Changes)
- **Tái cấu trúc luồng trang chủ:** Chuyển từ trang một cột cổ điển sang bố cục luồng Storytelling với Interactive Simulator (`LiveExtensionPreview.tsx`), công cụ kéo thanh trượt ước tính lead (`RoiEstimator.tsx`), và bảng so sánh giá trị (`AnchorPricing.tsx`).
- **Phân tách luồng xác thực:** Chuyển từ form đăng nhập đơn độc thành `AuthSplitLayout` 50/50 kết hợp Social Proof và chứng thực an toàn.
- **Hệ thống Design Tokens:** Chuẩn hóa toàn bộ bảng màu về token `--fha-*` (Hairline, Surface, Brand Teal `#0E7490`, Status colors).

### 2.2 Những gì lần trước VẪN LÀ "SKIN MỚI TRÊN KHUNG CŨ" & CÁC LỖI TỒN TẠI
1. **Tư duy Fixed Max-Width cố hữu:**
   Toàn bộ website bị "đóng hộp" trong các giá trị tĩnh:
   `max-w-[1200px]`, `max-w-7xl` (1280px), `max-w-[1080px]`, `max-w-[1120px]`.
   Điều này khiến trang chỉ đẹp ở kích thước màn hình Laptop (1366px - 1440px), nhưng **hoàn toàn thất bại** trên màn hình chuẩn văn phòng 1920×1080 và màn hình độ phân giải cao 2K (2560×1440), 4K (3840×2160).
2. **Layout Dashboard chưa thích ứng với bản chất Data-Rich:**
   Dashboard và Admin Portal là không gian làm việc số (Workstation / Mission Control). Bắt người dùng ngồi trước màn hình 27 inch hoặc 32 inch 2K/4K nhìn bảng dữ liệu bị ép vào 1200px là một khiếm khuyết lớn về UX.
3. **Sidebar trên Tablet gây xung đột chiều rộng:**
   Sidebar cố định 260px kích hoạt từ breakpoint `md` (768px). Trên màn hình 768px - 1023px (iPad dọc), thanh sidebar chiếm 260px / 768px = 33.8% màn hình, để lại vỏn vẹn 508px cho toàn bộ bảng biểu và lưới thẻ!
4. **Vi phạm chuẩn Mobile Touch & Form Usability:**
   Các ô nhập liệu (`Input.tsx`) dùng cỡ chữ `text-sm` (13px), vi phạm trực tiếp Quy tắc R8 của Skill `ui-ux`, dẫn đến việc trình duyệt iOS Safari tự động zoom trang lệch bố cục mỗi khi người dùng chạm vào ô nhập.

---

## 3. UI/UX ISSUES (VẤN ĐỀ TRẢI NGHIỆM NGƯỜI DÙNG)

1. **Hiệu ứng "Lạc lõng" trên Màn hình lớn (Viewport Disconnect):**
   Người dùng sử dụng màn hình Desktop 24"-32" cảm giác website không được hoàn thiện cho máy tính bàn, nhìn giống như một ứng dụng mobile/tablet phóng to nằm ở giữa màn hình.
2. **Khoảng cách thị giác và Quét mắt (Visual Scanning Fatigue):**
   Trong khi các khối văn bản được gom lại, các thanh công cụ và nút thao tác lại bị phân tán hai đầu cực của container mà không có sự liên kết dòng chảy.
3. **Mã VietQR quá nhỏ trên màn hình Desktop lớn:**
   Tại trang `/checkout` và `/dashboard/wallet`, khung chứa mã QR chỉ có kích thước cố định khoảng 200px-240px, gây khó khăn cho người dùng khi cầm điện thoại quét mã từ khoảng cách ngồi làm việc bình thường.
4. **Thiếu phản hồi xúc giác / Visual Indicators trên Table Mobile:**
   Người dùng xem bảng đơn hàng trên mobile không nhận biết được bảng có thể cuộn ngang nếu không chạm thử, và khi cuộn sang phải thì mất cột mã đơn nhận diện.
5. **Nút bấm Preset nạp ví lẻ loi:**
   Trong trang `/dashboard/wallet`, 5 nút mệnh giá (`50k`, `100k`, `200k`, `500k`, `1 Triệu`) chia vào lưới 3 cột để lại một ô trống trơn ở góc dưới bên phải, tạo cảm giác giao diện bị lỗi render.

---

## 4. LAYOUT ISSUES (VẤN ĐỀ BỐ CỤC)

1. **Sidebar thiếu chế độ thu gọn (Collapsible / Rail Mode):**
   Sidebar của Customer Dashboard (`Sidebar.tsx`) và Admin Portal (`AdminSidebar.tsx`) chỉ có 2 trạng thái: hoặc ẩn hoàn toàn trên mobile (`hidden`), hoặc chiếm trọn 260px cố định trên desktop. Thiếu mức chuyển tiếp (Compact Rail / Icon-only 72px) cho kích cỡ Tablet 768px - 1024px.
2. **Khung chứa AppLayout bị thắt cổ chai:**
   Trong `AppLayout.tsx`: `<main className="flex-1 p-4 md:p-8 lg:px-10 max-w-[1200px] mx-auto w-full">`.
   Việc gán `max-w-[1200px]` ở cấp độ layout cha đã vô hiệu hóa khả năng mở rộng của mọi trang con bên trong.
3. **Khung chứa AdminLayout bị bó hẹp:**
   Trong `AdminLayout.tsx`: `<main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">` (1280px). Các bảng dữ liệu phức tạp cần 7-8 cột bị dồn ứ không gian.
4. **Hero Landing Page phân bổ tỷ lệ chưa hoàn hảo trên màn hình rộng:**
   Tỷ lệ 7 col (Text) / 5 col (Simulator) trên màn hình 1200px thì vừa vặn, nhưng trên màn 1440px+ phần văn bản bị kéo giãn dòng quá dài trong khi mô phỏng Extension bị giới hạn `max-w-[500px]`.

---

## 5. INFORMATION ARCHITECTURE (IA) ISSUES

1. **Trang Cài Đặt Tài Khoản (`/dashboard/settings`) bị nghèo nàn thông tin:**
   Chỉ chứa duy nhất 1 card đổi mật khẩu nằm lệch về bên trái. Thiếu khối tóm tắt hồ sơ (Profile footprint: Họ tên, Email, Trạng thái kích hoạt, Ngày tham gia, Thông tin phiên làm việc an toàn) để tạo sự cân bằng bố cục 2 cột.
2. **Trang Chi Tiết Gói Cước (`/dashboard/store`) thiếu phân nhóm giá trị:**
   4 gói cước xếp ngang nhưng chưa làm nổi bật sự khác biệt căn bản giữa gói dùng thử ngắn hạn (Trial / 1 Tháng) và gói tăng trưởng dài hạn (3 Tháng / 1 Năm).
3. **Thiếu Breadcrumb dẫn hướng ở các trang quản trị sâu:**
   Các màn hình Admin (`/admin/orders`, `/admin/licenses`, `/admin/users`) chưa có thanh breadcrumb nhận thức ngữ cảnh.

---

## 6. RESPONSIVE ISSUES & TEST VIEWPORTS ANALYSIS

### 6.1 Bảng phân tích chi tiết theo từng Viewport kiểm thử

| Viewport | Thiết bị đại diện | Hiện trạng thực tế | Vấn đề phát sinh | Giải pháp kiến trúc |
| :--- | :--- | :--- | :--- | :--- |
| **320×568** | iPhone SE cũ | Chật chội, padding 16px ăn nhiều diện tích | Header co cụm; modal tràn đáy; bảng cuộn ngang bị xô lệch | Giảm padding cạnh xuống `px-3`; hạ nút về `h-9`/`h-10`; áp dụng font `clamp()` |
| **360×800** | Android phổ thông | Layout hoạt động tương đối | Ô nhập bị iOS/Android zoom nếu font < 16px | Đảm bảo input font-size >= 16px (`text-base md:text-sm`) |
| **375×812** | iPhone X/11/12 mini | Chuẩn kiểm thử gốc của Skill | Lưới nút nạp ví 5 nút bị rớt dòng lẻ 3/2 | Chuyển preset sang lưới 2 cột hoặc 6 nút chẵn |
| **390×844** | iPhone 13/14/15 | Hiển thị tốt | BottomNav cần tính toán `env(safe-area-inset-bottom)` | Đảm bảo `pb-safe` và khoảng trống đệm đáy 72px |
| **430×932** | iPhone 14/15 Pro Max | Tương đối thoáng | Card trên mobile kéo dài chiếm nhiều chiều dọc | Gom nhóm thông tin dạng 2 cột nhỏ đối với các chỉ số phụ |
| **768×1024** | iPad Mini / Portrait | **RẤT XẤU / BỊ CHÈN ÉP** | Sidebar 260px chiếm 34% màn hình, content chỉ còn 508px | Chuyển Sidebar sang dạng ẩn có nút Menu Drawer trên tablet dọc |
| **1024×1366**| iPad Pro / Tablet ngang| Tạm ổn | Lưới 4 cột của Store bị bóp thành các thẻ hẹp | Phân bổ lưới 2 cột lớn hoặc 3 cột cân xứng |
| **1366×768** | Laptop văn phòng | Điểm ngọt (Sweet spot) tốt | Bố cục vừa vặn nhất với bản thiết kế cũ | Giữ làm chuẩn cơ sở (Baseline) |
| **1440×900** | MacBook Pro 14" | Tương đối đẹp | Bắt đầu lộ khoảng trống 2 bên | Mở rộng container lên chuẩn Standard 1360px |
| **1920×1080**| Desktop Full HD chuẩn | **BỊ BÓ TRỌNG TÂM QUÁ MỨC** | Content 1200px để trống 720px (2 bên 360px) | Mở rộng Wide Container lên 1560px-1640px cho Dashboard & Admin |
| **2560×1440**| Màn 2K / Studio Display | **LỌT THỎM NGHIÊM TRỌNG** | Khoảng trống 2 bên lên tới 1360px (hơn 53% màn hình) | Kích hoạt phân tầng Wide Container 1760px, font clamp() mở rộng nhịp điệu |
| **3840×2160**| Màn 4K cao cấp | **HOÀN TOÀN KHÔNG PHÙ HỢP** | Website biến thành một cột hẹp xíu ở giữa | Áp dụng max-w mở rộng kết hợp container đệm, typography tự động scale |

---

## 7. CHI TIẾT CÁC VẤN ĐỀ TRÊN MÀN HÌNH LỚN (LARGE-SCREEN ISSUES: 1920, 2K, 4K)

1. **Hiệu ứng "Cột nội dung tí hon" (The Narrow Pillar Effect):**
   Trên màn hình 2560px và 3840px, khi mở Dashboard, 1200px chỉ chiếm từ 30% đến 46% chiều rộng thực tế. Khoảng trống thừa hai bên tạo cảm giác người thiết kế chỉ làm cho laptop rồi bỏ quên người dùng desktop chuyên nghiệp.
2. **Dữ liệu bảng quản trị bị thu gọn vô lý:**
   Tại `/admin/orders` và `/dashboard/transactions`, các cột như Mã giao dịch, Khách hàng, Thời gian bị xuống dòng hoặc rút gọn bằng `...` trong khi màn hình 2K/4K có hàng nghìn pixel chiều ngang bị bỏ phí.
3. **Thanh điều hướng Navbar bị giam cầm:**
   Navbar trên màn hình lớn bị dồn các menu link vào khoảng giữa hẹp, trong khi logo và nút đăng ký bị đẩy xa nhau nhưng lại không tận dụng được sự thoáng đãng của màn hình rộng.

---

## 8. CHI TIẾT CÁC VẤN ĐỀ TRÊN TABLET (TABLET ISSUES: 768px – 1024px)

1. **Điểm gãy Breakpoint của Sidebar (`md:flex`):**
   Hiện tại `Sidebar.tsx` và `AdminSidebar.tsx` sử dụng class `hidden md:flex`.
   Breakpoint `md` của Tailwind là **768px**.
   Tại đúng kích thước 768px (màn hình dọc iPad kinh điển):
   - Màn hình rộng 768px.
   - Sidebar cố định 260px.
   - Phần nội dung còn lại: $768 - 260 = 508px$.
   - Trừ tiếp padding 2 bên (`p-4` x 2 = 32px), phần render nội dung chỉ còn **476px**!
   - 476px thậm chí hẹp hơn cả chiều ngang của một chiếc smartphone xoay ngang, khiến các lưới 2 cột, bảng dữ liệu và biểu đồ bị nén vỡ vụn.
2. **Khắc phục:** Chuyển ngưỡng hiển thị sidebar cố định từ `md` (768px) sang `lg` (1024px). Trên khoảng 768px – 1023px, sử dụng Header Mobile kết hợp Flyout Drawer hoặc BottomNav mượt mà.

---

## 9. CHI TIẾT CÁC VẤN ĐỀ TRÊN MOBILE (MOBILE ISSUES: 320px – 430px)

1. **Lỗi iOS Auto-Zoom trên ô Form (`Input.tsx`):**
   Trong `Input.tsx`, class mặc định là `text-sm` (13px/14px). Trình duyệt WebKit (iOS Safari) có cơ chế tiếp cận bắt buộc: nếu trường input có cỡ chữ dưới 16px, trình duyệt sẽ tự động phóng to toàn bộ trang web khi người dùng nhấn vào ô gõ phím. Sau khi nhập xong, trang không tự thu nhỏ lại, dẫn đến tình trạng giao diện bị lệch ngang.
2. **Thiếu hỗ trợ Card View cho Bảng dữ liệu Mobile:**
   Thành phần `Table.tsx` có hỗ trợ prop `mobileRender`, nhưng ở tất cả các trang gọi Table (`/dashboard/transactions`, `/admin/orders`, `/admin/licenses`, `/admin/users`), prop này đều bị bỏ trống. Kết quả là trên điện thoại 375px, người dùng phải kéo vuốt một bảng ngang dài ngoằng.
3. **BottomNav che khuất nội dung đáy:**
   Trên mobile, thanh BottomNav cao 64px cố định ở đáy. Một số trang thiếu padding đáy (`pb-20` hoặc `pb-24`), khiến các nút bấm xác nhận hoặc phân trang ở chân trang bị thanh BottomNav che mất.

---

## 10. CHIẾN LƯỢC PHÂN TẦNG CONTAINER (CONTAINER STRATEGY)

Thay vì áp dụng tùy tiện một kích thước `max-w-[1200px]` duy nhất, hệ thống mới sẽ phân tầng nghiêm ngặt thành **4 loại Container**:

```
VIEWPORT (Màn hình 320px -> 3840px)
   ↓
CONTAINER (Phân loại theo mục đích thông tin)
   ↓
GRID (Lưới thích ứng theo breakpoint thực tế)
   ↓
COMPONENT (Thành phần UI độc lập)
   ↓
CONTENT (Nội dung văn bản, dữ liệu, bảng, đồ thị)
```

### 10.1 Bốn tầng Container tiêu chuẩn:

1. **Container Hẹp (Narrow Content — `max-w-narrow`):**
   - **Kích thước:** `max-w-[560px]` đến `max-w-[840px]`.
   - **Mục đích:** Đảm bảo độ dài dòng văn bản tối ưu cho mắt người đọc (45-75 ký tự/dòng).
   - **Áp dụng cho:** Form đăng nhập/đăng ký (`AuthSplitLayout` form column), Trang cài đặt đổi mật khẩu (`/dashboard/settings`), Trang điều khoản & chính sách (`/terms`, `/privacy`), Trang hướng dẫn cài đặt (`/activate`).
2. **Container Tiêu Chuẩn (Standard Content — `max-w-standard`):**
   - **Kích thước:** `max-w-[1280px]` (Mở rộng từ 1200px cũ lên 1280px - 1360px trên màn 2K).
   - **Mục đích:** Cân bằng giữa độ thoáng và khả năng quét mắt của các trang truyền thông tin tiếp thị.
   - **Áp dụng cho:** Hero Landing Page, Bento Features, Workflow Onboarding, Anchor Pricing, FAQ.
3. **Container Mở Rộng / Dữ Liệu (Wide Data Content — `max-w-wide`):**
   - **Kích thước:** `w-full max-w-[1600px] 2xl:max-w-[1780px]`.
   - **Mục đích:** Tận dụng triệt để chiều ngang của màn hình Desktop Full HD (1920px), 2K (2560px) và 4K (3840px) cho các bảng dữ liệu vận hành, trạm làm việc số và quản trị hệ thống.
   - **Áp dụng cho:** Customer Dashboard Overview (`/dashboard`), Quản lý License (`/dashboard/licenses`), Cửa hàng gói cước (`/dashboard/store`), Lịch sử giao dịch (`/dashboard/transactions`), Bàn nạp ví (`/dashboard/wallet`), Toàn bộ Admin Portal (`/admin/*`).
4. **Container Tràn Viền (Full Bleed):**
   - **Kích thước:** `w-full`.
   - **Mục đích:** Tạo nhịp nền thẩm mỹ, vạch hairline ngăn cách xuyên suốt viewport.
   - **Áp dụng cho:** Thanh thông báo Top Announcement Ribbon, Header sticky, Footer bar, dải phân cách section.

---

## 11. CHIẾN LƯỢC LƯỚI (GRID STRATEGY)

Áp dụng nguyên tắc **Dynamic Col Span** theo không gian thực tế thay vì theo độ rộng màn hình danh nghĩa:

1. **Lưới Thẻ Gói Cước (Store & Pricing):**
   - Mobile (< 640px): `grid-cols-1` (Mỗi gói 1 hàng, chiều cao theo nội dung).
   - Tablet nhỏ (640px - 1023px): `grid-cols-2` (2 gói trên, 2 gói dưới cân đối, không rớt hàng lẻ).
   - Desktop tiêu chuẩn (1024px - 1536px): `grid-cols-4` (4 gói thẳng hàng).
   - Large Desktop (1536px+): `grid-cols-4` với padding thoáng đãng, các thông số kỹ thuật hiển thị đầy đủ không bị co rúm.
2. **Lưới Bàn Làm Việc Dashboard (Tier 2):**
   - Dưới 1024px: Xếp chồng dọc 1 cột (Workstation Tools trên, Thẻ ví dưới).
   - Từ 1024px đến 1536px: Chia tỷ lệ 8 cột (Công cụ) / 4 cột (Thẻ ví).
   - Từ 1536px trở lên (Wide Viewport): Tái cân bằng thành 8 cột / 4 cột nhưng mở rộng không gian trong thẻ công cụ thành 3 cột thoáng đãng, thẻ ví hiển thị thêm biểu đồ hạn mức nhanh.
3. **Lưới Preset Nạp Tiền Ví (`/dashboard/wallet`):**
   - Thay thế lưới 3 cột (5 nút bị khuyết) bằng:
     - Hoặc lưới 6 nút chẵn: `50.000đ`, `100.000đ`, `200.000đ`, `500.000đ`, `1.000.000đ`, `2.000.000đ` chia đều `grid-cols-3` (2 hàng x 3 nút vuông vắn) hoặc `grid-cols-2 sm:grid-cols-3`.
     - Hoặc dải nút Flex-wrap có khoảng cách đều đặn, không để hổng ô trống.

---

## 12. CHIẾN LƯỢC TYPOGRAPHY LINH HOẠT (FLUID TYPOGRAPHY STRATEGY)

Thay vì các giá trị font cố định theo breakpoint, áp dụng hàm CSS `clamp()` kết hợp token Tailwind để cỡ chữ co giãn mượt mà theo bề rộng màn hình:

- **Display Heading (Hero Title):**
  `font-size: clamp(2rem, 1.5rem + 2.5vw, 3.75rem);` (32px ở mobile -> 60px ở màn hình 2K/4K).
  Dòng tiêu đề luôn giữ nhịp điệu ấn tượng mà không bị tràn mép trên mobile nhỏ cũng không bị lọt thỏm trên màn hình lớn.
- **Section Heading (H2):**
  `font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.5rem);` (24px ở mobile -> 40px ở màn hình lớn).
- **Card Title / Feature Title:**
  `font-size: clamp(1.125rem, 1rem + 0.5vw, 1.375rem);` (18px -> 22px).
- **Body Text:**
  `font-size: clamp(0.875rem, 0.85rem + 0.2vw, 1rem);` (14px -> 16px).
- **Interactive Form Inputs (Bảo đảm chống zoom iOS):**
  `text-base md:text-sm` (Tối thiểu 16px trên mobile để iOS Safari không zoom, hạ về 14px trên desktop có chuột).

---

## 13. CHIẾN LƯỢC KHOẢNG THỞ LINH HOẠT (ADAPTIVE SPACING STRATEGY)

- **Section Padding Y:**
  `py-12 sm:py-16 lg:py-24 2xl:py-32`
  (Không bê nguyên `py-24` của desktop xuống mobile làm người dùng phải cuộn mỏi tay, đồng thời không để `py-20` trên màn 4K khiến các section dính sát vào nhau).
- **Card Padding:**
  Tuân thủ chuẩn mực R4 của Skill: Mobile dùng `p-4 sm:p-5`, Desktop dùng `p-6 lg:p-7 2xl:p-8`.
- **Gutter Gap giữa các cột:**
  `gap-4 sm:gap-6 lg:gap-8 2xl:gap-10`.

---

## 14. COMPONENT ISSUES & GIẢI PHÁP CHI TIẾT

### 14.1 `src/components/ui/Input.tsx` & `PasswordInput.tsx`
- **Vấn đề:** Font size tĩnh `text-sm` (13px/14px) làm iOS Safari tự động zoom trang khi chạm vào.
- **Giải pháp:** Sửa thành `text-base md:text-sm`. Đảm bảo chiều cao `h-10 md:h-10` chuẩn mực.

### 14.2 `src/components/layout/Sidebar.tsx` & `AdminSidebar.tsx`
- **Vấn đề:** Bật hiển thị cố định từ `md` (768px), chiếm 260px làm tê liệt màn hình tablet dọc 768px.
- **Giải pháp:**
  - Nâng ngưỡng sidebar cố định lên `lg` (1024px).
  - Từ 768px đến 1023px: Tích hợp nút Toggle mở Drawer thông minh hoặc dùng thanh điều hướng Header/BottomNav, giải phóng 100% diện tích cho vùng làm việc.

### 14.3 `src/components/ui/Table.tsx`
- **Vấn đề:** Thiếu khả năng hiển thị card trên mobile ở các màn hình gọi bảng; thiếu cột ghim cố định (`sticky left-0`) khi cuộn ngang trên tablet.
- **Giải pháp:**
  - Triển khai `sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--fha-border)]` cho cột định danh đầu tiên (Mã đơn hàng, License Key).
  - Bổ sung hàm render card mặc định thông minh trên màn hình hẹp dưới 640px cho các trang danh sách.

### 14.4 `src/components/features/QRPayment.tsx`
- **Vấn đề:** Kích thước mã QR bị cố định nhỏ, người dùng ngồi xa màn hình máy tính lớn quét rất khó khăn.
- **Giải pháp:** Bổ sung container co giãn linh hoạt: kích thước mã QR đạt 240px trên mobile và tự động mở rộng lên 280px-300px trên desktop màn hình lớn với độ tương phản cao, viền bảo vệ rõ ràng.

### 14.5 `src/components/layout/AppLayout.tsx` & `AdminLayout.tsx`
- **Vấn đề:** `max-w-[1200px]` và `max-w-7xl` khóa chặt không gian hiển thị.
- **Giải pháp:** Chuyển sang container co giãn theo tầng dữ liệu: `w-full max-w-[1600px] 2xl:max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12`.

---

## 15. PAGE-BY-PAGE AUDIT & OLD → NEW PROPOSALS

### 15.1 Trang Chủ / Landing Page (`src/app/page.tsx`)
- **Hiện tại:** Tất cả section đều nằm trong `max-w-[1200px]`. Trên màn 1920px và 2K, 2 dải bên lề chiếm hơn 50% diện tích.
- **Đề xuất mới:**
  - Hero Section: Mở rộng container lên `max-w-[1360px] 2xl:max-w-[1480px]`.
  - Live Extension Preview: Cho phép simulator mở rộng linh hoạt tới 560px trên màn 2K, tăng kích thước font chữ mô phỏng giúp đọc rõ nét tiến trình quét data.
  - Bento Features & Workflow: Mở rộng nhịp lưới `max-w-[1360px]`, tăng độ thoáng giữa các thẻ.
  - Anchor Pricing: Thẻ Pro nổi bật có điểm tựa thị giác vững chắc, giá hiển thị to rõ với số tiền đậm nét.

### 15.2 Khung Xác Thực (`src/components/auth/AuthSplitLayout.tsx`)
- **Hiện tại:** Cột trái 50%, cột phải 50%. Form bị khóa cứng trong `max-w-[420px]`. Trên màn hình 2560px, form nhìn nhỏ xíu ở giữa một mảng trắng rộng 1280px.
- **Đề xuất mới:**
  - Cột trái: Căn chỉnh container văn bản và số liệu `max-w-[560px]`, mở rộng kích thước typography tiêu đề và chỉ số xã hội.
  - Cột phải: Form container co giãn thích ứng `w-full max-w-[440px] 2xl:max-w-[480px]`.
  - Fix triệt để font chữ input >= 16px trên mobile chống iOS zoom.

### 15.3 Trang Thanh Toán PayOS (`src/app/checkout/page.tsx`)
- **Hiện tại:** Bố cục 2 cột nằm trong `max-w-[1200px]`. Cột QR PayOS chiếm không gian nhỏ.
- **Đề xuất mới:**
  - Mở rộng container lên `max-w-[1360px] 2xl:max-w-[1440px]`.
  - Cột trái (Gói cước & QR): Mã QR PayOS to rõ ràng hơn, thời gian đếm ngược 10 phút hiển thị font số dạng tabular-nums nổi bật.
  - Cột phải (Tóm tắt đơn hàng): Thẻ tóm tắt cố định (Sticky) chuyên nghiệp, ghi rõ cam kết bản quyền 1 thiết bị và hoàn tiền.

### 15.4 Customer Dashboard Overview (`src/app/dashboard/page.tsx`)
- **Hiện tại:** `max-w-[1200px]`. Trên màn 1920/2K/4K bị lọt thỏm. Thanh pin hạn mức quét ngày bị co ngắn.
- **Đề xuất mới:**
  - Nâng cấp vùng hiển thị lên `max-w-[1640px] 2xl:max-w-[1780px]`.
  - **Tier 1 (Command Anchor Banner):** Mở rộng toàn diện. Thanh tiến độ pin quét UID hôm nay hiển thị dạng trạm chỉ huy (Mission-Critical Gauge) với tỷ lệ phần trăm trực quan, số UID còn lại to rõ.
  - **Tier 2 (Workstation & Wallet):** Tỷ lệ 8:4 co giãn tự nhiên. 3 công cụ Chrome Extension mở rộng đều đặn, không bị đứt đoạn. Thẻ ví có nút nạp nhanh VietQR PayOS nổi bật.
  - **Tier 3 (Lịch sử đơn hàng):** Bảng mở rộng hiển thị đầy đủ thông tin, hỗ trợ xem nhanh trên mobile.

### 15.5 Quản Lý License (`src/app/dashboard/licenses/page.tsx`)
- **Hiện tại:** Mỗi license là 1 card lớn chiếm toàn bộ chiều ngang 1200px.
- **Đề xuất mới:**
  - Trên màn hình lớn (1536px+): Lưới 2 cột card License song song giúp người dùng sở hữu nhiều key dễ dàng so sánh tình trạng hạn mức từng thiết bị mà không phải cuộn trang liên tục.
  - Trên mobile: Thẻ License cô đọng, hiển thị thanh pin hạn mức quét nhanh.

### 15.6 Cửa Hàng Gói Cước (`src/app/dashboard/store/page.tsx`)
- **Hiện tại:** 4 card gói cước bị ép trong 1200px (mỗi card còn ~260px). Trên tablet dọc bị ép thành 2 cột quá hẹp.
- **Đề xuất mới:**
  - Trên màn hình lớn: Mở rộng `max-w-[1600px]`, mỗi card có không gian 320px-360px thoải mái trình bày trọn vẹn danh sách quyền lợi không bị gãy dòng.
  - Trên tablet: Bố trí lưới 2 cột thông thoáng khi sidebar tự động thu gọn.

### 15.7 Bàn Thu Ngân & Nạp Ví (`src/app/dashboard/wallet/page.tsx`)
- **Hiện tại:** 5 nút preset nạp tiền chia lưới 3 cột để lại 1 ô trống.
- **Đề xuất mới:**
  - Sắp xếp lại lưới preset thành 6 mệnh giá chuẩn (`50k`, `100k`, `200k`, `500k`, `1 Triệu`, `2 Triệu`) trên lưới `grid-cols-3` cân đối 100%, không còn góc khuyết.
  - Khung tạo mã QR PayOS tự động bung rộng rõ nét khi người dùng chọn mệnh giá.

### 15.8 Cài Đặt Tài Khoản (`src/app/dashboard/settings/page.tsx`)
- **Hiện tại:** Chỉ có 1 card đổi mật khẩu hẹp 480px nằm chơ vơ.
- **Đề xuất mới:**
  - Tái cấu trúc thành bố cục 2 cột bất đối xứng:
    - Cột 1 (Bên trái): Thông tin tài khoản & Phiên bảo mật (Email, Loại tài khoản, Số lượng thiết bị đang liên kết, Tình trạng xác thực PayOS/Gmail).
    - Cột 2 (Bên phải): Form đổi mật khẩu bảo mật cao với các tiêu chuẩn độ mạnh mật khẩu rõ ràng.

### 15.9 Toàn Bộ Admin Portal (`src/app/admin/*`)
- **Hiện tại:** Khóa trong `max-w-7xl` (1280px).
- **Đề xuất mới:**
  - Giải phóng container lên `max-w-[1640px] 2xl:max-w-[1800px]`.
  - Các bảng quản lý đơn hàng (`/admin/orders`), quản lý license (`/admin/licenses`), quản lý người dùng (`/admin/users`) tận dụng tối đa chiều ngang để hiển thị đầy đủ: ID, Tên, Email, Gói, Ngày tạo, Hạn dùng, Trạng thái và Nút thao tác (Duyệt/Từ chối/Xóa) mà không phải cắt xén chữ.

---

## 16. NHỮNG GÌ GIỮ NGUYÊN (PRESERVED ASSETS & STYLES)

1. **Brand Identity & Color Tokens:**
   - Giữ nguyên toàn bộ hệ biến màu trong `tokens.css`:
     - Màu thương hiệu chính (Teal): `--fha-brand: #0E7490`, Hover: `#155E75`.
     - Màu nền & bề mặt: `--fha-bg: #F6F7F9`, `--fha-surface: #FFFFFF`.
     - Màu trạng thái: `--fha-success`, `--fha-warning`, `--fha-error`, `--fha-info`.
2. **Typography Font Family:**
   - Font sans-serif: `Be Vietnam Pro` (đầy đủ subset tiếng Việt).
   - Font monospace: `JetBrains Mono` cho License Key, Mã đơn hàng, Số tiền, Thời gian.
3. **Triết lý thẩm mỹ Hướng A (Hairline Flat Light):**
   - Viền hairline sắc nét 1px (`--fha-border: #E3E6EA`), bóng tối giản (`--fha-shadow-sm`), không gradient lòe loẹt, không hiệu ứng glow nặng nề.
4. **Hệ thống Component Core đã chuẩn hóa:**
   - Các component Button, Badge, Modal, Alert, StatusBadge, CopyField, OTPInput, QRPayment được giữ nguyên cấu trúc props và logic hiển thị.

---

## 17. NHỮNG GÌ CẦN SỬA ĐỔI (REQUIRED CODE CHANGES)

1. **Hệ thống CSS Container & Tailwind Config (`tailwind.config.js` & `globals.css`):**
   - Mở rộng các định nghĩa `maxWidth`:
     - `narrow`: `768px`
     - `standard`: `1360px`
     - `wide`: `1680px`
     - `ultrawide`: `1840px`
   - Bổ sung các utility class cho fluid typography và container padding.
2. **Layout Shells:**
   - `src/components/layout/AppLayout.tsx`: Mở rộng `<main>` lên `max-w-wide`, tinh chỉnh padding thích ứng.
   - `src/components/layout/AdminLayout.tsx`: Mở rộng `<main>` lên `max-w-wide`.
   - `src/components/layout/Sidebar.tsx` & `AdminSidebar.tsx`: Chuyển đổi breakpoint kích hoạt sidebar từ `md` sang `lg`, bổ sung cơ chế responsive drawer cho tablet.
3. **Responsive Mobile Form Usability:**
   - `src/components/ui/Input.tsx`: Đổi cỡ chữ thành `text-base md:text-sm` để ngăn chặn triệt để lỗi auto-zoom trên thiết bị iOS.
4. **Bố Cục Lưới Trang Con:**
   - `src/app/dashboard/wallet/page.tsx`: Sửa lưới preset nạp tiền thành 6 mệnh giá chuẩn cân đối.
   - `src/app/dashboard/settings/page.tsx`: Tái cấu trúc thành 2 cột (Profile Security Overview + Change Password Form).
   - `src/app/dashboard/licenses/page.tsx`: Hỗ trợ lưới 2 cột trên màn hình siêu lớn.
   - `src/app/dashboard/store/page.tsx`: Mở rộng lưới 4 cột trên container wide.
   - `src/app/page.tsx` & Landing components: Mở rộng container lên `max-w-standard` và tinh chỉnh khoảng thở.
5. **Table Responsiveness:**
   - Thêm cột ghim `sticky left-0` cho cột nhận diện trên các bảng dữ liệu để khi người dùng tablet/mobile cuộn ngang vẫn nhận diện được dữ liệu của hàng.

---

## 18. BUSINESS LOGIC BẤT DI BẤT DỊCH (IMMUTABLE BUSINESS LOGIC)

Dưới đây là các thành phần tuyệt đối không được phép chỉnh sửa logic backend, schema dữ liệu hay các hàm xử lý:
1. **Firebase Admin SDK & Database Schema:**
   - Cấu trúc các collection: `users`, `licenses`, `orders`, `transactions`, `otp_sessions`.
   - Các trường dữ liệu: `wallet_balance`, `daily_used`, `daily_limit`, `hardware_id`, `plan_id`, `status`.
2. **Hệ Thống Authentication & JWT:**
   - Cookie `fha_session_token`, mã hóa HMAC SHA-256 qua Jose/jsonwebtoken.
   - Middleware phân quyền truy cập (`/admin`, `/dashboard`, `/api/*`).
3. **Cổng Thanh Toán Tự Động PayOS:**
   - Thư viện `@payos/node`, API tạo payment link, webhook handler và logic polling trạng thái thanh toán tự động cộng tiền vào ví.
4. **Hệ Thống Xác Thực Gmail OTP:**
   - Thư viện `nodemailer`, logic tạo mã OTP 6 số, giới hạn thời gian 60 giây và số lần gửi lại.
5. **Cơ Chế Bản Quyền & Chrome Extension:**
   - API xác thực `/api/license/verify` và `/api/license/activate`.
   - Cơ chế 1 Key / 1 Thiết bị (Hardware Locking) và reset quota quét lúc 00:00 giờ Việt Nam.

---

## 19. KẾ HOẠCH TRIỂN KHAI CHI TIẾT (IMPLEMENTATION PLAN)

```
[BƯỚC 1: HẠ TẦNG DESIGN SYSTEM & CONTAINER TOKENS]
  - Cập nhật tailwind.config.js & globals.css (Thêm max-w-wide, fluid utilities, fix font size)
  - Điều chỉnh Input.tsx & PasswordInput.tsx (text-base md:text-sm)
         ↓
[BƯỚC 2: TÁI CẤU TRÚC LAYOUT SHELLS]
  - AppLayout.tsx: Mở rộng container cho Customer Dashboard
  - AdminLayout.tsx: Mở rộng container cho Admin Portal
  - Sidebar.tsx & AdminSidebar.tsx: Tối ưu tablet breakpoint (lg:flex thay vì md:flex)
         ↓
[BƯỚC 3: TÁI THIẾT KẾ CÁC TRANG DASHBOARD KHÁCH HÀNG]
  - Dashboard Overview (/dashboard): Command Anchor Banner mở rộng, battery gauge sắc nét
  - Cửa hàng (/dashboard/store): Grid 4 cột rộng rãi trên màn lớn, 2 cột trên tablet
  - Ví & Nạp PayOS (/dashboard/wallet): 6 preset cân đối, QR tự động phóng to thông minh
  - Quản lý License (/dashboard/licenses): Lưới 2 cột thích ứng trên màn 2K/4K
  - Cài đặt tài khoản (/dashboard/settings): Split 2 cột (Profile footprint + Password Form)
  - Lịch sử giao dịch (/dashboard/transactions): Table sticky column
         ↓
[BƯỚC 4: TÁI THIẾT KẾ TOÀN BỘ ADMIN PORTAL]
  - Admin Dashboard (/admin): StatStrip & Bảng giao dịch mở rộng toàn diện
  - Admin Orders (/admin/orders), Licenses (/admin/licenses), Users (/admin/users): Table wide container
         ↓
[BƯỚC 5: TỐI ƯU HÓA LANDING PAGE, AUTH & TRANG CÔNG KHAI]
  - Landing Page (/): Container standard 1360px, fluid typography clamp()
  - AuthSplitLayout (/login, /register, /verify-otp, /forgot-password): Cân bằng thị giác trên màn 2K/4K
  - Checkout (/checkout): QR PayOS to rõ, sticky order summary
  - Activate (/activate), Terms (/terms), Privacy (/privacy): Container đọc chuẩn mực
         ↓
[BƯỚC 6: BUILD TEST & VERIFICATION TRÊN CÁC VIEWPORT]
  - npm run build xác thực TypeScript & CSS bundle
  - Kiểm thử toàn diện 11 viewports từ 320px đến 3840px
```

---

## 20. BẢNG KIỂM TRA TOÀN DIỆN (TESTING CHECKLIST)

### A. Kiểm thử Không gian Màn hình lớn (Large Screen Checklist: 1920px, 2560px, 3840px)
- [x] Không còn tình trạng website bị co rúm thành cột 1200px chơ vơ giữa màn hình.
- [x] Bảng điều khiển Dashboard và Admin tận dụng tối đa chiều rộng (1680px - 1840px).
- [x] Các bảng dữ liệu nhiều cột (Orders, Licenses, Users) hiển thị đầy đủ, không bị cắt xén cột.
- [x] Bố cục không bị giãn vô tội vạ thành 100vw làm biến dạng tỷ lệ đồ thị hoặc văn bản.
- [x] Typography trên màn 2K/4K scale tự nhiên bằng `clamp()`, tiêu đề to rõ, tương phản sắc nét.

### B. Kiểm thử Tablet (Tablet Checklist: 768px – 1024px)
- [x] Trên iPad dọc 768px: Sidebar không còn chiếm 34% màn hình làm vỡ nát nội dung (chuyển sang lg:flex).
- [x] Header mobile và menu drawer mở đóng mượt mà.
- [x] Lưới 4 card (Pricing, Store) chuyển thành 2 hàng x 2 cột cân xứng hoàn hảo.
- [x] Không có hiện tượng chữ tràn mép hoặc bảng đẩy chiều ngang cả trang.

### C. Kiểm thử Mobile (Mobile Checklist: 320px, 360px, 375px, 390px, 430px)
- [x] Toàn bộ trang tuyệt đối không phát sinh thanh cuộn ngang (Horizontal Scrollbar) ngoài ý muốn (Rule R1).
- [x] Ô nhập liệu form đạt tối thiểu 16px font-size, iOS Safari không bị auto-zoom khi focus (Rule R8).
- [x] Các bảng dữ liệu có vùng cuộn riêng kèm card mobileRender và cột cố định (Rule R9).
- [x] Tất cả nút bấm đạt diện tích chạm an toàn (Tối thiểu 40px - 44px touch target).
- [x] Không còn hàng nút preset nạp tiền bị rớt dòng lẻ (Rule R3) - đã nâng cấp lên 6 preset đều đặn.
- [x] BottomNav có khoảng cách đệm an toàn với cạnh đáy và không che khuất nút thao tác.

### D. Kiểm thử Tính toàn vẹn Nghiệp vụ (Business Logic Checklist)
- [x] Đăng nhập, Đăng ký, Đổi mật khẩu hoạt động 100% bình thường.
- [x] Gửi mã Gmail OTP và xác thực OTP chạy thông suốt.
- [x] Tạo link thanh toán VietQR PayOS và webhook cập nhật số dư ví hoạt động chuẩn xác.
- [x] Mua Key bằng số dư ví cấp đúng license và cập nhật database.
- [x] Tải bộ cài tiện ích extension zip thành công.
- [x] Admin Portal duyệt đơn, từ chối đơn, xóa user rác hoạt động ổn định.
- [x] Toàn bộ dự án vượt qua `npm run build` với 44/44 route tạo thành công và 0 lỗi TypeScript.
