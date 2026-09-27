# 🏠 Fairy House Keys — Web Cấp License Key

Web quản lý và cấp license key cho **Fairy House AutoData V2.0**.

## 🚀 Deploy

- **GitHub** → **Vercel** (auto-deploy khi push)
- URL: `https://fairy-house-keys.vercel.app`

## 📁 Cấu Trúc

```
src/
├── app/
│   ├── register/        # Trang đăng ký xin key (Public)
│   ├── activate/        # Trang xác nhận sau đăng ký
│   ├── admin/
│   │   ├── login/       # Đăng nhập admin
│   │   ├── requests/    # Danh sách đơn xin key ⭐
│   │   └── keys/        # Quản lý key đã cấp
│   └── api/
│       ├── register/    # Nhận đơn đăng ký
│       ├── verify-key/  # Extension xác thực key
│       └── admin/       # Admin APIs
└── lib/
    ├── firebase.ts      # Firebase Admin SDK
    ├── mailer.ts        # Gmail SMTP (Nodemailer)
    ├── key-generator.ts # Sinh & validate key
    └── auth.ts          # JWT admin auth
```

## ⚙️ Setup

1. Copy `.env.local.example` → `.env.local`
2. Điền Firebase credentials
3. Điền Gmail App Password
4. Đặt mật khẩu admin

```bash
npm install
npm run dev
```

## 🔑 Format Key

```
FH-{TYPE}-{RANDOM_16}-{CHECKSUM_4}

Ví dụ:
FH-TRIAL-A3X9K2M7P1Q8N5R6-B7C2
FH-PRO-Z8Y3W1V6U4T2S9R0-K4L8
FH-LIFE-E5D2C9B7A4F1G3H6-M1N5
```

## 📡 API cho Extension

```
POST /api/verify-key
Headers: x-fh-secret: <EXTENSION_API_SECRET>
Body: { key, machineId }
```

## 🛡️ Admin

- URL: `/admin/login`
- Credentials: set trong `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars
