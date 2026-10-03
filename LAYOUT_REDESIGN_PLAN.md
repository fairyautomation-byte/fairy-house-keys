# KẾ HOẠCH TÁI THIẾT KẾ BỐ CỤC TOÀN DIỆN (FULL LAYOUT REDESIGN PLAN)
**Dự án:** Fairy House AutoData (Chrome Extension Commercial Store & Dashboard)  
**Ngày lập:** 03/10/2026  
**Phương pháp:** UI/UX Skill `ui-ux` (EvondevKit) — Hướng A (Hairline Flat Design) kết hợp tái cấu trúc Information Architecture & Component Composition.

---

> [!NOTE]
> **Lưu ý theo quy chuẩn Skill `ui-ux`:** Skill chuyên sâu về các màn hình ứng dụng (App/Dashboard/Form/Bảng/Cài đặt). Đối với Landing Page công khai, kế hoạch này áp dụng các nguyên tắc thương mại chuyển đổi cao (High-Converting SaaS Landing Architecture) kết hợp hệ thống Design Tokens và linh hồn thiết kế Hairline đã được chuẩn hoá.

---

## 1. TỔNG QUAN: PHÂN BIỆT "LÀM ĐẸP VISUAL" VÀ "TÁI THIẾT KẾ BỐ CỤC"

| Tiêu chí | Bản Hiện Tại (Visual Dressing) | Bản Đề Xuất (Full Layout Redesign) |
| :--- | :--- | :--- |
| **Bản chất** | Giữ nguyên thứ tự và dạng khối của website cũ, chỉ thay class CSS (màu, font, viền, bo góc). | **Đập bỏ khung cũ.** Sắp xếp lại luồng nhận thức (Mental Model), thay đổi thứ bậc thị giác, gom/tách section theo mục tiêu người dùng. |
| **Cấu trúc lưới (Grid)** | 1 cột đồng dạng, lặp lại các lưới thẻ cân đối (4 cards tính năng, 4 cards bảng giá, 3 cards thống kê). | **Bento Grid & Asymmetric Layout.** Phân cấp thông tin rõ ràng: khối trọng tâm lớn (Hero/Anchor), khối bổ trợ nhỏ hơn, tránh lặp lại cùng một kiểu card. |
| **Landing Page** | Trình tự cổ điển: Hero chữ giữa → Lưới 4 tính năng → Bảng giá 4 cột → FAQ → CTA. | **Storytelling & Interactive Demo:** Hero 2 cột tương tác → Bảng tính ước lượng hiệu quả (Interactive Lead Estimator) → Bento Showcases → Quy trình 3 bước (How it works) → Bảng giá có neo giá trị (Anchor Pricing) → FAQ phân nhóm → Sticky Bar. |
| **Dashboard** | 4 thẻ số giống nhau + 1 bảng danh sách đơn hàng. | **Trung tâm chỉ huy (Command Center):** Banner License & Hạn mức scan hôm nay đặt vị trí số 1 (Visual Anchor) → Cột thao tác nhanh & Cài đặt Extension → Biểu đồ tiêu thụ quota → Lịch sử đơn hàng có tab phân loại. |
| **Checkout** | Khung chọn gói 4 ô đơn giản, dồn người dùng vào một khối duy nhất. | **Split Checkout 2 cột:** Cột trái cấu hình gói & Quét mã VietQR PayOS động → Cột phải Tóm tắt đơn hàng cố định (Sticky Order Summary), cam kết an toàn & hỗ trợ. |
| **Xác thực (Auth)** | 1 form nhỏ nằm lọt thỏm giữa màn hình xám. | **Split Screen 50/50:** Một bên là Brand & Chứng thực xã hội (Social Proof/Metrics), một bên là Form tương tác chuẩn hóa. |

---

## 2. KIẾN TRÚC ĐIỀU HƯỚNG MỚI (NAVIGATION & SHELL ARCHITECTURE)

### 2.1 Public Header (Navbar)
- **Cũ:** Logo trái — 3 link text ở giữa — 2 nút Đăng nhập/Đăng ký phải.
- **Mới:**
  - **Thanh thông báo đầu trang (Top Announcement Ribbon):** Nhấn mạnh *"Bản cập nhật V2.0 đã hỗ trợ thuật toán Facebook mới nhất — Quét data không lo checkpoint"*.
  - **Thanh điều hướng nổi tinh tế:** Đính kèm badge phiên bản Extension, nút "Bảng giá" có gắn chip khuyến mại, CTA chính *"Dùng thử miễn phí 3 ngày"* có hiệu ứng viền thương hiệu.
  - **Mobile:** Menu Drawer mở toàn màn hình (Flyout Sheet) có phân nhóm: Tính năng, Bảng giá, Hướng dẫn cài đặt, Cổng thanh toán tự động, Hỗ trợ Zalo trực tiếp.

### 2.2 App Shell (Dashboard Customer)
- **Cũ:** Sidebar 256px cố định gồm 6 mục rời rạc; Mobile chỉ có BottomNav 5 icon, thiếu thông tin License và số dư trực quan.
- **Mới:**
  - **Sidebar phân cụm logic (Logical Grouping):**
    - **Cụm 1 — Không gian làm việc (Workspace):** Tổng quan, License của tôi (Gắn kèm Badge trạng thái Active/Expired ngay trên menu).
    - **Cụm 2 — Cửa hàng & Nguồn vốn (Commerce):** Mua Key bản quyền, Nạp ví PayOS, Lịch sử giao dịch.
    - **Cụm 3 — Hệ thống & Hỗ trợ (System):** Cài đặt tài khoản, Hướng dẫn sử dụng Extension, Hỗ trợ Zalo 24/7.
    - **Chân Sidebar (Account Footprint):** Thẻ thông tin người dùng thu nhỏ (Tên, Email, Số dư ví rút gọn) + Nút Đăng xuất tiện lợi.
  - **Mobile Shell (Header + BottomNav):**
    - **Header Mobile:** Logo thương hiệu + Nút "Trang chủ" + Badge số dư ví + Nút Đăng xuất nhanh.
    - **BottomNav 5 điểm chạm vàng:** Tổng quan (Home) → Mua Key (Store) → Ví (Wallet) → License (Key) → Tài khoản.

### 2.3 Admin Shell
- **Cũ:** 4 mục menu xếp dọc, mobile bị ẩn hoàn toàn sidebar.
- **Mới:**
  - Header Admin có thanh trạng thái kết nối máy chủ + Bộ lọc nhanh ngày giao dịch.
  - Phân vùng menu: Vận hành (Đơn hàng, Khách hàng) và Quản trị hệ thống (Licenses, Dọn tài khoản rác).

---

## 3. CHI TIẾT TÁI THIẾT KẾ BỐ CỤC TỪNG TRANG (PAGE-BY-PAGE SPECIFICATION)

---

### PAGE 1: TRANG CHỦ / LANDING PAGE (`src/app/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
```
[Navbar: Logo | Links | CTA]
-------------------------------------------------------
[Hero: Text giữa + 2 Nút + Mockup khung chữ nhật giả lập]
-------------------------------------------------------
[Features: Lưới 4 Card đối xứng bằng nhau (Quét UID, Kết bạn, Checkpoint, Excel)]
-------------------------------------------------------
[Pricing: Lưới 4 Card gói cước ngang bằng nhau]
-------------------------------------------------------
[FAQ: Accordion 4 câu hỏi đơn giản]
-------------------------------------------------------
[Banner CTA: Text giữa + 1 Nút đăng ký]
-------------------------------------------------------
[Footer: Logo + 3 Link text]
```
**Nhược điểm:**
- Bố cục đều đều một cột giữa, không có nhịp điệu thị giác (Visual Rhythm).
- Khung Mockup trình duyệt chỉ chứa các khối xám tĩnh, không mô phỏng được sức mạnh thực tế của Extension.
- Không có phần "Cách hoạt động" (How it works) khiến người mới không hiểu cài vào Chrome thế nào và quét data ra sao.
- 4 Card tính năng bằng nhau làm mất đi tính năng át chủ bài (Human Emulation chống checkpoint).

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT)
```
[Top Announcement Bar: Thông báo cập nhật V2.0 chống checkpoint]
[Navbar: Brand + Version Badge | Quick Links | CTA Nổi Bật]
=======================================================
[SECTION 1: HERO KHÔNG ĐỐI XỨNG (ASYMMETRIC SPLIT HERO)]
  - Cột Trái (60%):
      * Pill Badge: "Chrome Extension Thế Hệ Mới V2.0"
      * Headline đậm nét, phân tầng: "Quét Khách Hàng Facebook Tự Động. Chuyển Đổi Thành Doanh Thu Trong 3 Giây."
      * Sub-headline thuyết phục: Giải quyết trực diện nỗi đau bị khoá nick & tốn thời gian tìm khách thủ công.
      * Cặp CTA kép: [Dùng Thử Miễn Phí 3 Ngày (0đ)] + [Xem Video Trải Nghiệm Thực Tế]
      * Trust Indicators: "1 Key / 1 Thiết bị • Kích hoạt tức thì qua PayOS • Không cần mật khẩu Facebook"
  - Cột Phải (40%):
      * Thẻ Mô phỏng Extension đang chạy thật (Interactive Live Preview Widget):
        Mô phỏng popup Chrome Extension với tiến trình quét thật:
        [Quét Nhóm: Hội Chủ Shop Kinh Doanh Online (45.000 mem)]
        -> Quét xong 120 UID chất lượng cao trong 4.2 giây
        -> Tiến trình tự động gửi lời mời kết bạn (Delay thông minh 15-30s chống checkpoint).
=======================================================
[SECTION 2: BẢNG TÍNH HIỆU QUẢ KINH DOANH (INTERACTIVE ROI ESTIMATOR)]
  - Khối giao diện tương tác: Người dùng kéo thanh trượt "Số lượng khách hàng bạn cần mỗi ngày" (vd: 500 khách)
  - Hệ thống tính toán trực quan:
      * Thời gian tiết kiệm: ~4.5 giờ/ngày
      * Số khách tiềm năng tiếp cận mỗi tháng: 15.000 khách
      * Chi phí: Chỉ từ 2.000đ/ngày (rẻ hơn 95% so với chạy Facebook Ads).
=======================================================
[SECTION 3: BENTO GRID TÍNH NĂNG ĐỘC BẢN (ASYMMETRIC BENTO SHOWCASE)]
  - Ô lớn 1 (2 cột): TÍNH NĂNG LÕI — Cơ chế Human Emulation chống checkpoint độc quyền (Mô phỏng hành vi lướt, dừng, click của người thật).
  - Ô 2: Bộ lọc UID thông minh (Lọc theo tương tác bài viết gần nhất, lọc avatar, giới tính, khu vực).
  - Ô 3: Xuất dữ liệu đa định dạng (Excel, CSV, TXT) đồng bộ trực tiếp vào CRM/Zalo.
  - Ô 4: Báo cáo hạn mức scan trực quan & Tự động reset vào 00:00 hàng ngày.
=======================================================
[SECTION 4: QUY TRÌNH 3 BƯỚC HOẠT ĐỘNG (HOW IT WORKS)]
  - Bố cục 3 bước theo chiều ngang có đường nối chỉ dẫn:
      * Bước 1: Đăng ký & Nhận License Key tự động trong 30 giây.
      * Bước 2: Cài Extension vào Chrome và dán Key kích hoạt.
      * Bước 3: Mở nhóm/bài viết Facebook và bấm "Quét tự động".
=======================================================
[SECTION 5: BẢNG GIÁ NEO GIÁ TRỊ (VALUE-ANCHORED PRICING MATRIX)]
  - Header: Công tắc gợi ý thời hạn + Cam kết hoàn tiền / hỗ trợ 24/7.
  - Bố cục 4 gói nhưng phân cấp rõ ràng:
      * Gói Dùng Thử (0đ): Thẻ tối giản, kích thích dùng ngay.
      * Gói 1 Tháng: Dành cho cá nhân trải nghiệm.
      * Gói 3 Tháng (POPULAR ANCHOR): Thẻ nổi bật viền đậm thương hiệu, gắn badge "Tiết kiệm 40% - Đa số khách hàng lựa chọn", nút CTA to và đậm nhất.
      * Gói 1 Năm: Dành cho doanh nghiệp / agency quét data số lượng lớn, hỗ trợ VIP 1-1.
=======================================================
[SECTION 6: CÂU HỎI THƯỜNG GẶP (FAQ CÓ PHÂN LOẠI TAB)]
  - Chia 2 nhóm câu hỏi: [Về Sản Phẩm & Kỹ Thuật] và [Về Thanh Toán & Kích Hoạt Key].
=======================================================
[SECTION 7: BANNER KẾT THÚC CHUYỂN ĐỔI CAO (FINAL IMPACT CTA)]
  - Bố cục Split Banner nền thương hiệu Hairline sạch sẽ: Trái là lời kêu gọi hành động + Phải là form nhập nhanh email để nhận ngay key dùng thử 3 ngày.
=======================================================
[Footer: 4 Cột hoàn chỉnh — Thương hiệu & Bản quyền, Sản phẩm, Pháp lý, Hỗ trợ Zalo/Hotline]
```

---

### PAGE 2: CHECKOUT & THANH TOÁN (`src/app/checkout/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
```
[Header: Logo + Tiêu đề]
[Alert Lỗi nếu có]
-------------------------------------------------------
[Khối Trắng Giữa: 4 ô chọn gói + Dòng tổng tiền + Nút thanh toán]
HOẶC (sau khi bấm):
[Khối Trắng: QR VietQR PayOS]
```
**Nhược điểm:**
- Bố cục đơn điệu 1 cột ở giữa, cảm giác như một biểu mẫu điền đơn chứ không phải một trang thanh toán thương mại điện tử chuyên nghiệp (E-commerce Checkout).
- Người dùng không nhìn thấy tóm tắt quyền lợi của gói trong lúc thanh toán.
- Thiếu các huy hiệu bảo mật và quy trình minh bạch (Trust Badges).

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — 2-COLUMN SPLIT CHECKOUT)
```
=============================================================================
CỘT TRÁI (60%): CẤU HÌNH GÓI & CỔNG THANH TOÁN | CỘT PHẢI (40%): TÓM TẮT ĐƠN HÀNG CỐ ĐỊNH
=============================================================================
CỘT TRÁI:
  [Bước 1: Chọn gói bản quyền mong muốn]
    - Hiển thị 4 gói dưới dạng List-Radio Cards hiện đại (Tên gói, giá, chu kỳ, tiết kiệm bao nhiêu %).
  
  [Bước 2: Phương thức thanh toán tự động]
    - Tab A (Khuyên dùng): Quét mã VietQR tự động qua PayOS.
    - Tab B: Thanh toán bằng Số dư ví (nếu tài khoản đã có sẵn số dư).
  
  [Bước 3: Vùng hiển thị VietQR PayOS Động]
    - Khi bấm chọn PayOS, mã QR VietQR động hiện ra mượt mà kèm đồng hồ đếm ngược 5 phút.
    - Trạng thái trực tiếp: "Đang chờ bạn quét mã... Hệ thống sẽ tự động kích hoạt key ngay khi nhận được thanh toán".
    - Nút phụ: Mở cổng PayOS trên tab mới (dành cho người muốn thanh toán thẻ/MoMo).

CỘT PHẢI (STICKY SUMMARY PANEL):
  [Card Tóm Tắt Đơn Hàng Cố Định]:
    * Chi tiết sản phẩm: Fairy House AutoData Extension
    * Gói dịch vụ đã chọn: Gói 3 Tháng (Tiết Kiệm)
    * Thời hạn sử dụng: 90 ngày (Hạn mức 3.000 lượt scan/ngày)
    * Số lượng thiết bị: 1 thiết bị kích hoạt
    -------------------------------------------------------
    * Giá niêm yết: 300.000đ
    * Giảm giá gói quý: -121.000đ
    * TỔNG THANH TOÁN: 179.000đ (Đã bao gồm VAT)
    -------------------------------------------------------
    * Cam kết & Bảo chứng (Trust Badges):
      ✓ Kích hoạt key tự động sau 2 giây
      ✓ Bảo hành 1 đổi 1 suốt thời gian sử dụng
      ✓ Hỗ trợ kỹ thuật qua Zalo 0378791667
```

---

### PAGE 3: TỔNG QUAN KHÁCH HÀNG / DASHBOARD OVERVIEW (`src/app/dashboard/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
```
[Header: Xin chào, Email]
-------------------------------------------------------
[Lưới 3 Card Thống kê: Số dư ví | License hoạt động | Đơn hàng]
-------------------------------------------------------
[Lưới 3 Nút Thao tác: Nạp tiền | Mua key | Quản lý license]
-------------------------------------------------------
[Bảng Đơn hàng gần đây]
```
**Nhược điểm:**
- Mọi thứ chia thành các card kích thước giống nhau, làm phẳng lì toàn bộ giao diện (Flat Hierarchy).
- Mục đích lớn nhất của khách hàng khi vào Dashboard là: **Xem trạng thái key của mình, copy key để dùng, hoặc xem hôm nay còn bao nhiêu lượt scan.** Hiện tại thông tin này bị chôn sâu ở trang `/dashboard/licenses`.
- Thẻ số dư ví và thao tác nạp tiền tách rời nhau không ăn nhập.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — COMMAND CENTER)
```
=============================================================================
TẦNG 1: HERO WORKSPACE BANNER (VISUAL ANCHOR CỦA TOÀN TRANG)
=============================================================================
  [Card Lớn - Bảng Trạng Thái Key Đang Dùng]:
    - Phía Trái:
        * Tên License đang hoạt động: "GÓI QUÝ (3 THÁNG) — CHÍNH THỨC"
        * License Key hiển thị dạng Masked Key kèm nút 1-Click Copy nhanh.
        * Hạn dùng: Còn 68 ngày (Hết hạn vào 10/12/2026).
    - Phía Phải:
        * Thanh đo hạn mức scan hôm nay (Daily Scan Gauge):
          [===================>      ] 1.840 / 3.000 lượt scan (Còn 1.160 lượt)
          *Ghi chú: Tự động hồi phục đầy đủ vào 00:00 đêm nay.*
        * Nút CTA nhanh: [Tải Extension V2.0] • [Gia hạn gói]

=============================================================================
TẦNG 2: BỐ CỤC BẤT ĐỐI XỨNG (ASYMMETRIC SPLIT: 8 CỘT CHÍNH - 4 CỘT PHỤ)
=============================================================================
CỘT CHÍNH (8 CỘT):
  [Khối 1: Hướng Dẫn Kích Hoạt Nhanh 3 Bước (Onboarding Checklist)]:
    - Chỉ hiện với người dùng mới hoặc có nút thu gọn tiện lợi:
      [✓] Tạo tài khoản thành công
      [✓] Nhận License Key
      [ ] Tải và cài đặt Extension từ file zip
      [ ] Dán License Key vào Extension để bắt đầu quét

  [Khối 2: Lịch Sử Giao Dịch & Đơn Hàng Gần Đây]:
    - Header có thanh Tab phân loại: [Tất Cả] • [Đơn Mua Key] • [Nạp Tiền PayOS]
    - Dạng danh sách thẻ tương tác (Interactive List Rows) có trạng thái rõ ràng, mã giao dịch font Mono, số tiền định dạng chuẩn.

CỘT PHỤ (4 CỘT):
  [Thẻ 1: Trạm Kiểm Soát Ví (Wallet Widget)]:
    - Số dư hiện tại hiển thị kích thước lớn (Bold Display).
    - Nút nạp tiền nhanh mở trực tiếp Modal/Drawer nạp PayOS trong 30 giây.
  
  [Thẻ 2: Trung Tâm Trợ Giúp Nhanh (Support Hub)]:
    - Link trực tiếp tới Admin hỗ trợ qua Zalo (0378791667).
    - Link tải file Extension mới nhất kèm checksum kiểm tra an toàn.
```

---

### PAGE 4: CỬA HÀNG MUA KEY / STORE (`src/app/dashboard/store/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- Lưới 4 card bằng nhau, nếu ví không đủ tiền thì hiện lỗi bắt người dùng tự chuyển sang trang ví.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — WORKFLOW TÍCH HỢP)
- **Header:** Bộ lọc thời hạn: Gói Dùng Thử • Gói Tháng • Gói Quý • Gói Năm.
- **Thẻ hiển thị:** Thiết kế dạng **Bảng So Sánh Quyền Lợi (Plan Comparison Table & Cards)**.
- **Tích hợp thanh toán kép (Dual Action Drawer):**
  - Khi bấm mua bất kỳ gói nào:
    - Nếu ví đủ tiền: Hiện modal xác nhận trừ tiền ví và cấp key trong 0.5 giây.
    - Nếu ví thiếu tiền: **Không bắt người dùng rời trang!** Modal lập tức hiển thị mã VietQR PayOS với đúng số tiền còn thiếu để người dùng quét thanh toán ngay và nhận key luôn tại chỗ!

---

### PAGE 5: VÍ & NẠP TIỀN PAYOS (`src/app/dashboard/wallet/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- Card số dư nhỏ + Form nhập số tiền với 4 chip gợi ý + Khi bấm nạp mới hiện một khối thông tin bên dưới.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — 2-PANEL CASHIER DESK)
- **Panel Trái (Bộ chọn số tiền thông minh):**
  - Lưới 6 thẻ mệnh giá trực quan (50k, 100k, 200k, 500k, 1tr, 2tr) có gắn nhãn gợi ý: *"Đủ mua gói Tháng"*, *"Đủ mua gói Quý — Khuyên dùng"*.
  - Ô nhập số tiền tuỳ chỉnh có định dạng tiền tệ tức thì (`100.000đ`).
- **Panel Phải (Khu vực Quét mã PayOS VietQR Trực Tiếp):**
  - Mã QR tự động cập nhật theo mệnh giá đã chọn.
  - Đồng hồ đếm ngược trực quan kèm trạng thái kiểm tra giao dịch tự động.
- **Khu vực Dưới (Sổ cái giao dịch ví):** Bảng lịch sử nạp/rút/mua key với nhãn phân loại màu sắc Hairline chuẩn mực.

---

### PAGE 6: QUẢN LÝ LICENSE CỦA TÔI (`src/app/dashboard/licenses/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- Danh sách các card viền mỏng đơn điệu, key hiển thị trong một input nhỏ.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — DIGITAL LICENSE VAULT)
- Mỗi License được trình bày dưới hình thức một **Thẻ Chứng Chỉ Bản Quyền Số (Digital License Card)**:
  - Header thẻ: Logo Fairy House + Badge trạng thái (Đang Hoạt Động / Hết Hạn / Tạm Khoá).
  - Thân thẻ:
    - Mã Key font Mono nổi bật kích thước lớn kèm nút Copy 1 chạm và nút Ẩn/Hiện mã.
    - Đồng hồ đo hạn mức quét trong ngày (Pin năng lượng: used / limit).
    - Ngày kích hoạt & Ngày hết hạn rõ ràng.
    - Trạng thái thiết bị ràng buộc (Hardware Binding: 1/1 Máy).
  - Chân thẻ: Các nút hành động chuyên dụng: [Gia Hạn Key] • [Hướng Dẫn Kích Hoạt] • [Báo Lỗi Key].
- Empty State: Được thiết kế lại với hình minh hoạ trực quan và nút dẫn thẳng tới luồng nhận Key Dùng Thử miễn phí.

---

### PAGE 7: CÁC TRANG XÁC THỰC (LOGIN, REGISTER, VERIFY-OTP, FORGOT-PASSWORD)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- 1 Card trắng nhỏ nằm ở tâm màn hình xám trên tất cả 4 trang. Giao diện trống trải và lạnh lẽo.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — SPLIT SCREEN 50/50)
- **Cột Trái (Desktop ≥ 1024px) — Brand & Value Showcase:**
  - Nền thương hiệu xám nhạt cao cấp (Hairline Surface).
  - Logo Fairy House AutoData lớn và sắc nét.
  - Đoạn giới thiệu tính năng nổi bật: *"Công cụ quét data Facebook & kết bạn tự động số 1 cho người kinh doanh online"*.
  - Thẻ trích dẫn đánh giá thực tế từ khách hàng uy tín (Testimonial Card).
  - Huy hiệu bảo mật: 100% Không giữ mật khẩu Facebook, Tuân thủ chính sách API an toàn.
- **Cột Phải — Form Thao Tác Chuyên Biệt Từng Trang:**
  - **Login:** Form đăng nhập tinh gọn + Ghi nhớ đăng nhập + Link quên mật khẩu + Nút đăng nhập nổi bật.
  - **Register:** Form đăng ký 2 cột trường thông tin (Họ tên, Email, Zalo, Mật khẩu) kèm thanh kiểm tra độ mạnh mật khẩu (Password Strength Meter).
  - **Verify-OTP:** Giao diện Trạm xác thực bảo mật với 6 ô nhập mã OTP tự động nhảy nét (Auto-jump), bộ đếm ngược 60s có hiệu ứng vòng tròn và nút gửi lại mã.
  - **Forgot-Password:** Quy trình 3 bước hiển thị tiến trình (Step Indicator): Nhập Email → Nhập OTP → Đổi mật khẩu mới.

---

### PAGE 8: TRANG HOÀN TẤT & HƯỚNG DẪN KÍCH HOẠT (`src/app/activate/page.tsx`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- 1 Card thông báo ngắn với 3 dòng text và 2 nút bấm.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — INTERACTIVE ONBOARDING GUIDE)
- Bố cục 2 phần:
  - **Phần 1 — Thẻ Chúc Mừng & License Key Của Bạn:** Mã Key được đóng khung trang trọng, có nút sao chép nhanh và hướng dẫn lưu trữ.
  - **Phần 2 — Hướng Dẫn Từng Bước Bằng Hình Ảnh (Visual Step-by-Step Guide):**
    - Bước 1: Bấm tải Extension (.zip hoặc link Chrome Store).
    - Bước 2: Bật "Chế độ dành cho nhà phát triển" (Developer Mode) trong Chrome.
    - Bước 3: Kéo file vào trình duyệt và dán License Key để kích hoạt.
  - Kênh hỗ trợ trực tiếp từ Admin qua Zalo với nút kết nối nhanh 1 chạm.

---

### PAGE 9: KHU VỰC QUẢN TRỊ ADMIN (`src/app/admin/*`)

#### A. Cấu trúc hiện tại (OLD LAYOUT)
- Overview: 4 thẻ số + 2 bảng đơn hàng/người dùng.
- Orders: Bảng 20 đơn hàng đơn giản với nút Duyệt/Từ chối.
- Users: Bảng danh sách người dùng với nút Xoá và Dọn acc rác.
- Licenses: Empty State trống.

#### B. Cấu trúc mới đề xuất (PROPOSED NEW LAYOUT — OPERATIONAL WORKSTATION)
- **Thanh Chỉ Huy (Admin Command Bar):**
  - Thống kê doanh thu hôm nay, tổng số key đang kích hoạt, tổng số tiền nạp PayOS.
  - Nút đồng bộ dữ liệu thời gian thực và thanh tìm kiếm toàn cục (Global Search theo Email, Mã đơn, License Key).
- **Trang Đơn Hàng (`/admin/orders`):**
  - Chuyển sang bố cục **Bảng Dữ Liệu Tương Tác Kèm Slide-Over Drawer (Thanh trượt xem chi tiết)**:
    - Bấm vào một đơn hàng sẽ mở Drawer trượt từ phải sang, hiển thị toàn bộ hồ sơ: Khách hàng là ai, số điện thoại Zalo, lịch sử mua key trước đây, mã PayOS, trạng thái webhook.
    - Nút duyệt/từ chối thao tác nhanh có kèm modal xác nhận an toàn.
- **Trang Quản Trị Khách Hàng (`/admin/users`):**
  - Bảng người dùng có bộ lọc trạng thái (Đã xác thực email / Chưa xác thực >24h).
  - Tích hợp thanh thao tác hàng loạt (Batch Actions): Dọn dẹp tài khoản rác, gửi thông báo.
- **Trang Quản Lý License (`/admin/licenses`):**
  - Giao diện tra cứu License Key và thiết bị: Tra cứu key bất kỳ để kiểm tra số lượt scan trong ngày, reset quota thủ công cho khách, hoặc thu hồi key khi có yêu cầu.

---

## 4. BẢNG TỔNG HỢP CÁC COMPONENT MỚI CẦN XÂY DỰNG

| Tên Component | Mục đích sử dụng | Vị trí áp dụng |
| :--- | :--- | :--- |
| `LiveExtensionPreview` | Widget mô phỏng extension Chrome đang quét data thật | Hero Section (Homepage) |
| `RoiEstimator` | Bảng kéo thanh trượt ước tính hiệu quả tiếp cận khách hàng | Homepage |
| `BentoGrid` & `BentoCard` | Lưới hiển thị tính năng bất đối xứng hiện đại | Homepage |
| `PricingMatrix` | Bảng giá có neo giá trị (Anchor Pricing) | Homepage, Checkout, Store |
| `SplitCheckout` | Bố cục thanh toán 2 cột (Cấu hình & Tóm tắt cố định) | `/checkout` |
| `LicenseCard` | Thẻ chứng chỉ bản quyền số có đồng hồ đo quota scan | `/dashboard/licenses`, `/dashboard` |
| `CommandBanner` | Banner trung tâm chỉ huy tổng hợp trạng thái key & quota | `/dashboard` |
| `AuthSplitLayout` | Khung 50/50 thương hiệu & biểu mẫu | `/login`, `/register`, `/forgot-password`, `/verify-otp` |
| `AdminDetailDrawer` | Thanh trượt chi tiết đơn hàng và khách hàng | `/admin/orders`, `/admin/users` |

---

## 5. CAM KẾT VÀ NGUYÊN TẮC BẢO VỆ DỰ ÁN

1. **Bảo toàn 100% Business Logic & Backend:**
   - Tuyệt đối không thay đổi bất kỳ file nào trong `src/app/api/**`.
   - Giữ nguyên cấu trúc dữ liệu Firebase, webhook PayOS, luồng gửi mail OTP, và mã hoá mật khẩu.
2. **Tuân thủ Design System Hairline Flat (Hướng A):**
   - Nền sáng sạch sẽ, viền mảnh 1px tinh tế, font chữ Be Vietnam Pro sắc nét, không dùng gradient loè loẹt hay hiệu ứng bóng mờ cẩu thả.
3. **Responsive Chuẩn Mực:**
   - Tối ưu hoàn hảo cho cả Desktop (≥1280px) và Mobile (375px), mọi bảng dữ liệu đều có chế độ hiển thị thẻ card tương ứng trên điện thoại.

---

*Kế hoạch này đã sẵn sàng để bạn xem xét và phê duyệt trước khi tiến hành viết code.*
