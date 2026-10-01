---
name: security-credentials-rule
description: Quy định nghiêm ngặt về việc lưu trữ các khóa bảo mật và thông tin nhạy cảm.
---

# Nguyên Tắc Quản Lý Thông Tin Bảo Mật
**Luôn luôn tuân thủ nguyên tắc sau đây khi làm việc với API keys, Passwords, và các thông tin nhạy cảm:**

1. **Không bao giờ hardcode:** TUYỆT ĐỐI KHÔNG hardcode (gắn cứng) bất kỳ khóa bảo mật nào (như `CLIENT_ID`, `API_KEY`, `CHECKSUM_KEY`, v.v.) vào trực tiếp trong mã nguồn (source code).
2. **Không lưu trên GitHub:** Không được phép commit các file chứa secret (ví dụ: `.env.local`, `service-account.json`) lên GitHub.
3. **Không để lộ ở Frontend:** Tránh rò rỉ secret xuống môi trường trình duyệt, trừ khi biến đó an toàn để công khai (như `NEXT_PUBLIC_...`).
4. **Chỉ cấu hình ở môi trường thực tế:** Thông tin nhạy cảm chỉ được thiết lập thông qua **Environment Variables** trực tiếp trên Vercel hoặc config của Firebase.

Nguyên tắc này là bắt buộc để tránh hậu quả lộ thông tin bảo mật của User.
