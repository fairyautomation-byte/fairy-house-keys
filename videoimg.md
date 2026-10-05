# KẾ HOẠCH THIẾT KẾ UI/UX TÍCH HỢP VIDEO & HÌNH ẢNH SẢN PHẨM THẬT
> **Tài liệu chuẩn hóa thiết kế theo Skill UI-UX**  
> **Dự án:** Fairy House AutoData (Website thương mại & quản trị License Key)  
> **Tập tin lập kế hoạch:** `videoimg.md`  
> **Quy trình áp dụng:** Nhánh `U` (Thiết kế từ đầu như một designer - `references/design-process.md`)  
> **Trạng thái:** Chờ người dùng duyệt Cổng 1 (Gate 1)  

---

## 0. AUDIT HỆ THỐNG THEO MỤC 0 CỦA SKILL UI-UX

Skill UI-UX yêu cầu chạy audit 3 tầng bắt buộc trước khi lập bố cục và viết code:

* **Tầng 1 — Tech Stack:**
  - Framework: Next.js 14.2.5 (App Router) + React 18 + TypeScript.
  - CSS: Tailwind CSS v3.4.1 phối hợp biến CSS Token (`src/styles/tokens.css` và `src/app/globals.css`).
  - Hệ thống dữ liệu & thanh toán: Firebase Firestore Admin SDK + PayOS VietQR (`@payos/node`).
  - Dòng audit: Next.js 14 + Tailwind v3 + PayOS, token tiền tố `--fha-*`.
* **Tầng 2 — Component đã có sẵn:**
  - Thư mục `src/components/ui/` đã có: `Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx`, `Alert.tsx`, `Skeleton.tsx`.
  - Quy tắc: Tái sử dụng 100% component gốc của dự án, không tự tạo thêm biến thể cồng kềnh.
* **Tầng 3 — Phong cách thị giác (Visual Style):**
  - Phong cách: **Hairline Flat Light** (Hướng A trong skill: Nền sáng `#F6F7F9`, Card trắng tinh `#FFFFFF`, tách khối bằng viền mảnh 1px `#E3E6EA`, không dùng đổ bóng nặng nề, màu nhấn thương hiệu Teal `#0E7490`, phông chữ `Be Vietnam Pro`).

---

## 1. BRIEF THIẾT KẾ (LUẬT U1) & VIỆC CHÍNH CỦA TỪNG MÀN (LUẬT U2)

### 1.1. Brief U1 (Khối 5 dòng theo chuẩn skill)
1. **Sản phẩm gì:** Fairy House AutoData 2.0 — Tiện ích Chrome Extension quét khách hàng Facebook và nền tảng SaaS cấp Key / nạp ví tự động VietQR PayOS. *(nguồn: đọc code & tài nguyên người dùng gửi)*
2. **Cho ai:** Chủ shop kinh doanh online, nhà quảng cáo, môi giới bất động sản, spa, bán hàng trên Facebook cần data SĐT và auto kết bạn. *(nguồn: đọc code & 4 ảnh chụp)*
3. **Việc chính:**
   - Chứng minh năng lực quét SĐT thật & auto kết bạn an toàn thông qua video quay thực tế và ảnh chụp màn hình Extension (xóa tan nghi ngại checkpoint).
   - Thúc đẩy đăng ký nhận key dùng thử 3 ngày 0đ hoặc thanh toán mua key tức thì qua PayOS trong 5 giây.
   - Hướng dẫn tải file `.ZIP`, cài vào Chrome và dán key chỉ với 3 bước. *(nguồn: đọc code & webthuongmai.md)*
4. **Nền tảng dùng nhiều:** Máy tính (Desktop/Laptop) là chủ đạo vì tiện ích chạy trên trình duyệt Chrome PC; Mobile tối ưu cho xem bảng giá, nạp tiền ví VietQR và quản lý mã bản quyền. *(nguồn: đọc code)*
5. **Điểm khác biệt:** Công nghệ Human-Emulation 2.0 chống checkpoint, quét trực tiếp ra SĐT thật ngay trên giao diện Facebook, hệ thống cấp bản quyền và nạp ví tự động 100% qua PayOS VietQR. *(nguồn: đọc code & ảnh 2.jpg)*

### 1.2. Việc chính của từng màn & khối (Luật U2)

| Màn / Khối | Đến để làm gì | So sánh, quyết định bằng gì | Hành động cuối | Quy ước thiết kế theo Skill UI-UX |
| :--- | :--- | :--- | :--- | :--- |
| **Hero & Video Thực Tế (Trang chủ)** | Nắm bắt ngay giá trị phần mềm và xem thực chứng hoạt động | Headline rõ ràng, video quay thật 1080p quét data Facebook, cam kết an toàn | Bấm "Dùng Thử 0đ" hoặc xem video demo | Cột trái là thông điệp & CTA; cột phải là khung máy tính chạy preview video [`video.mov`](file:///e:/Target/fairy-house-keys-main/public/video.mov) có nút mở toàn màn hình / phát inline |
| **Showcase Tính Năng (Ảnh 1-4)** | Thấy tận mắt 4 bước cốt lõi của sản phẩm | Giao diện thực tế sạch đẹp, số liệu thật (30 UID ra 9 SĐT, log gửi kết bạn) | Tin tưởng công cụ làm được việc thật | Sử dụng cấu trúc Bento Grid kết hợp ảnh thật:<br>• **Ảnh 3**: Bảng khách hàng ra SĐT + nút Call/Zalo<br>• **Ảnh 1**: Thiết lập chiến dịch (Quét nhanh/Quét sâu)<br>• **Ảnh 4**: Auto kết bạn với terminal log thời gian thực<br>• **Ảnh 2**: Dashboard web quản lý hạn mức & ví PayOS |
| **Bảng Giá & Gói Bản Quyền (Pricing)** | Chọn thời hạn gói phù hợp với ngân sách | Giá trung bình/ngày, hạn mức quét UID/ngày, bảo hành 1 đổi 1 | Bấm "Mua Ngay" (mở modal PayOS VietQR) | 3 card chuẩn: 1 Tháng (phổ biến) - 3 Tháng - 1 Năm, có badge nổi bật gói khuyên dùng |
| **Quy Trình 3 Bước Cài Đặt (Workflow)** | Biết cách đưa tool vào Chrome để dùng ngay | 3 bước trực quan: Tải ZIP ➔ Bật Developer Mode ➔ Dán Key | Bấm "Tải File Cài Đặt (.ZIP)" | Hàng ngang 3 bước có đánh số, nút tải file trực tiếp từ [`/fairy-house-extension-v2.zip`](file:///e:/Target/fairy-house-keys-main/public/fairy-house-extension-v2.zip) |
| **Dashboard Khách Hàng (Đã có sẵn)** | Quản lý mã key, xem pin hạn mức UID quét, nạp tiền ví | Hạn mức còn lại trong ngày (pin tiến trình), ngày hết hạn | Sao chép mã Key, nạp tiền VietQR | Bám sát thiết kế thực tế ở [`2.jpg`](file:///e:/Target/fairy-house-keys-main/public/2.jpg) với layout Hairline chuẩn |

---

## 2. BẢNG ĐỐI CHIẾU TIÊU CHUẨN KỸ THUẬT (RULE MAPPING TỪ SKILL UI-UX)

Để đảm bảo website đạt chất lượng cao nhất và không rơi vào các lỗi phổ biến của AI dựng giao diện, kế hoạch tuân thủ các quy tắc sau:

| Mã luật | Nội dung luật trong Skill UI-UX | Cách áp dụng vào kế hoạch này |
| :--- | :--- | :--- |
| **Luật S1 & S5** | **Kiểm soát phạm vi:** Không tự ý đẻ thêm các section lan man; giữ cấu trúc gọn gàng, đúng mục tiêu bán hàng SaaS. | Giữ nguyên 7 khối trọng tâm của trang chủ, không đẻ thêm form rườm rà. |
| **Luật S12 & S16** | **Tài nguyên thật:** Cấm dùng hình vẽ minh họa trừu tượng hoặc khối xám vô nghĩa khi đã có ảnh sản phẩm thật. | Sử dụng 100% video gốc [`video.mov`](file:///e:/Target/fairy-house-keys-main/public/video.mov) và 4 ảnh chụp màn hình thật [`1.jpg`](file:///e:/Target/fairy-house-keys-main/public/1.jpg), [`2.jpg`](file:///e:/Target/fairy-house-keys-main/public/2.jpg), [`3.jpg`](file:///e:/Target/fairy-house-keys-main/public/3.jpg), [`4.jpg`](file:///e:/Target/fairy-house-keys-main/public/4.jpg). |
| **Luật M13 & M15** | **Tách khối phẳng (Hairline):** Tách khối bằng viền 1px (`--fha-border`), cấm lạm dụng shadow nặng làm bẩn giao diện; shadow chỉ cho phép ở lớp nổi (modal/popover). | Các Card bento và video container sử dụng viền `border border-[var(--fha-border)]` sắc sảo, chỉ dùng `shadow-fha-overlay` khi mở modal phóng to video/ảnh. |
| **Luật F1 & F8** | **Thang nhịp & Bo góc:** Tuân thủ hệ số lưới 4px/8px, bo góc đồng bộ (card 12px, button 8px, badge tròn). | Toàn bộ thẻ Bento và khung video đều dùng `rounded-fha-lg` (12px) thống nhất với Design Token của dự án. |
| **Luật I1 & I13** | **Tương tác nút & Focus:** Nút bấm có đủ trạng thái hover, focus ring rõ ràng, phân cấp thứ bậc (1 nút Primary, còn lại Outline/Ghost). | CTA chính màu Teal nổi bật, CTA phụ viền mảnh; video player có nút Play tương phản cao, focus ring chống trôi. |
| **Luật R (Responsive)** | **Ngưỡng kiểm thử di động 375px:** Không để xảy ra cuộn ngang màn hình trên mobile. | Trên màn hình nhỏ (< 768px), khung video tự co dãn theo tỷ lệ 16:9, Bento Grid chuyển từ dạng 2 cột sang 1 cột cuộn dọc mượt mà. |
| **Tối ưu Media** | **Hiệu năng tải trang (Web Vitals):** Không tải 73MB video ngay khi vào trang. | Video sử dụng `preload="metadata"`, có poster preview khung hình đầu, chỉ tải dữ liệu stream khi người dùng bấm phát hoặc mở phóng to. |

---

## 3. CẤU TRÚC CHI TIẾT TỪNG KHỐI TRÊN LANDING PAGE

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. NAVBAR (Logo, Tính năng, Bảng giá, Hướng dẫn, Đăng nhập/Đăng ký)   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. HERO SECTION + CHROME VIDEO PLAYER                                  │
│    - Cột trái: Headline giá trị cốt lõi + 2 nút CTA (Dùng thử 0đ & Giá)│
│    - Cột phải: Chrome Window Mockup chạy video.mov (Play/Pause, Zoom) │
├────────────────────────────────────────────────────────────────────────┤
│ 3. METRIC TICKER (15.000+ UID/ngày, 99.8% An toàn, 5s cấp Key)        │
├────────────────────────────────────────────────────────────────────────┤
│ 4. BENTO GRID 4 TÍNH NĂNG VÀNG (Sử dụng 1.jpg, 2.jpg, 3.jpg, 4.jpg)     │
│    • Thẻ lớn (Hero Card): Bảng trích xuất SĐT + nút Call/Zalo (3.jpg)  │
│    • Thẻ 2: Thiết lập chiến dịch Quét nhanh / Quét sâu (1.jpg)         │
│    • Thẻ 3: Auto kết bạn an toàn + Terminal log (4.jpg)                │
│    • Thẻ 4: Trung tâm quản lý License & ví PayOS (2.jpg)               │
├────────────────────────────────────────────────────────────────────────┤
│ 5. QUY TRÌNH 3 BƯỚC CÀI ĐẶT (Tải ZIP -> Cài Chrome -> Dán Key)         │
├────────────────────────────────────────────────────────────────────────┤
│ 6. BẢNG GIÁ THEO CHU KỲ (Tháng - 3 Tháng - 1 Năm, PayOS VietQR)        │
├────────────────────────────────────────────────────────────────────────┤
│ 7. NHÓM CÂU HỎI THƯỜNG GẶP (FAQ Accordion)                             │
├────────────────────────────────────────────────────────────────────────┤
│ 8. FINAL CTA + FOOTER BẢN QUYỀN                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. CHI TIẾT CÁC COMPONENT SẼ XÂY DỰNG

1. **`src/components/landing/ProductVideoPlayer.tsx`**:
   - Khung giao diện cửa sổ Chrome (3 chấm màu Mac/Win, thanh địa chỉ `facebook.com/groups/...`, badge xanh "Đang quét trực tiếp").
   - Video player tích hợp `video.mov` với thanh điều khiển mượt mà, nút Play trung tâm.
   - Nút mở Fullscreen / Modal Lightbox để xem ở độ phân giải gốc 1080p sắc nét.

2. **`src/components/landing/RealProductShowcase.tsx`**:
   - Thay thế toàn bộ mockup vẽ bằng code trước đây bằng 4 hình ảnh thực tế của Extension & Dashboard (`1.jpg` – `4.jpg`).
   - Bố cục Bento Grid bất đối xứng chuẩn Hairline Flat.
   - Tích hợp Lightbox Modal: bấm vào bất kỳ ảnh nào đều xem được ảnh to sắc nét kèm chú giải chi tiết.

3. **Tích hợp vào `src/app/page.tsx`**:
   - Ghép nối các component vào trang chủ, đảm bảo luồng cuộn trang mượt mà.
   - Tối ưu SEO Semantic HTML (`<main>`, `<section>`, `<h1>`, `<h2>`, thẻ `<video>`).

4. **Kiểm thử khép kín (Probe & Checklist)**:
   - Kiểm tra hiển thị ở 1280px (Desktop) và 375px (Mobile).
   - Đảm bảo 0 lỗi cuộn ngang, 0 lỗi tương phản màu sắc.

---

## 5. TRẠNG THÁI PHÊ DUYỆT (CỔNG 1)

Kế hoạch này đã tuân thủ 100% cấu trúc của Skill UI-UX:

* Đúng thì trả lời **`ok`**, sai dòng nào thì sửa dòng đó.
* Muốn bỏ wireframe, dựng luôn thì trả lời **`dựng luôn`**.
