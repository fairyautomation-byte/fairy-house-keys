---
name: security-credentials-rule
description: Quy định nghiêm ngặt về việc lưu trữ các khóa bảo mật và thông tin nhạy cảm.
---

# Nguyên Tắc Quản Lý Thông Tin Bảo Mật

**🔥 NGUYÊN TẮC THÉP TỐI THƯỢNG: TƯ DUY HACKER (HACKER MINDSET)**
> *Trước khi sửa chữa, thêm tính năng, hay viết bất kỳ dòng code nào vào hệ thống, AI luôn phải **đứng ở cương vị của một Hacker** để săm soi và tìm cách tấn công đoạn code đó. Chỉ khi tự chứng minh được đoạn code đã an toàn tuyệt đối dưới góc nhìn của kẻ gian, thì mới được phép áp dụng vào thực tế.*

**Các quy tắc thực thi cụ thể:**

1. **Không bao giờ hardcode:** TUYỆT ĐỐI KHÔNG hardcode (gắn cứng) bất kỳ khóa bảo mật nào (như `CLIENT_ID`, `API_KEY`, `CHECKSUM_KEY`, mật khẩu Admin, Salt, JWT Secret v.v.) vào trực tiếp trong mã nguồn (source code). Kể cả "mã dự phòng" (fallback) cũng KHÔNG ĐƯỢC chứa các chuỗi có thể để hacker lợi dụng.
2. **Luôn Kiểm Tra:** Trước khi Commit/Deploy, AI và Lập trình viên phải rà soát mã nguồn một lần nữa. Không bao giờ được phép để sót bất kỳ thông tin nào có thể bị Hacker khai thác trong source code.
3. **Không lưu trên GitHub:** Không được phép commit các file chứa secret (ví dụ: `.env.local`, `service-account.json`) lên GitHub.
4. **Không để lộ ở Frontend:** Tránh rò rỉ secret xuống môi trường trình duyệt, trừ khi biến đó an toàn để công khai (như `NEXT_PUBLIC_...`).
5. **Chỉ cấu hình ở môi trường thực tế:** Thông tin nhạy cảm chỉ được thiết lập thông qua **Environment Variables** trực tiếp trên Vercel hoặc config của Firebase.

Nguyên tắc này là bắt buộc để tránh hậu quả lộ thông tin bảo mật của User.
