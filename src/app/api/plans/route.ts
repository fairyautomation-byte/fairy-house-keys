import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  KEY_INFO,
  KEY_PRICES,
  KEY_DURATIONS,
  KEY_SCAN_LIMITS,
  KeyType,
} from "@/lib/key-generator";

export async function GET() {
  try {
    const plansRef = db.collection("plans");
    const snapshot = await plansRef.get();

    const plans: any[] = [];

    // Nếu Firebase chưa có dữ liệu Plans, tự động khởi tạo từ file cứng
    if (snapshot.empty) {
      const defaultTypes = Object.keys(KEY_INFO) as KeyType[];

      for (const type of defaultTypes) {
        const planData = {
          id: type,
          name: KEY_INFO[type].name,
          price: KEY_PRICES[type],
          duration: KEY_DURATIONS[type],
          scanLimit: KEY_SCAN_LIMITS[type],
          features: [
            "Truy cập đầy đủ tính năng Extension",
            "Cập nhật dữ liệu theo thời gian thực",
            "Hỗ trợ kỹ thuật 24/7",
            "Quản lý quyền truy cập dữ liệu",
          ],
          badge: KEY_INFO[type].badge || null,
          color: KEY_INFO[type].color,
          gradient: KEY_INFO[type].gradient,
          icon: KEY_INFO[type].icon,
          active: true, // Cho phép Admin tắt/bật gói
          created_at: new Date(),
        };

        if (planData.active) {
          plans.push(planData);
        }
      }
    } else {
      // Đọc từ Firebase
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.active !== false) {
          // Hide inactive
          plans.push({ ...data, id: doc.id });
        }
      });
      // Sort by price
      plans.sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    // Map format cho Frontend (StorePage PlanCard)
    const formattedPlans = plans.map((p) => {
      const scanLimitText =
        p.scanLimit === -1
          ? "Quét không giới hạn"
          : `Tối đa ${p.scanLimit} lượt quét/ngày`;
      const durationText =
        p.duration === null
          ? "Sử dụng vĩnh viễn"
          : `Sử dụng trong ${p.duration} ngày`;

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        duration: durationText,
        scanLimit: scanLimitText,
        features: (p.features || []).map((f: string) => f.replace("BĐS ", "")),
        popular: p.badge === "PHỔ BIẾN",
      };
    });

    return NextResponse.json(formattedPlans);
  } catch (error) {
    console.error("Lỗi khi lấy plans:", error);
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}
