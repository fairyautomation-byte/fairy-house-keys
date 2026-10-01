import { NextResponse } from 'next/server';
import { KEY_INFO, KEY_PRICES, KEY_DURATIONS, KEY_SCAN_LIMITS, KeyType } from '@/lib/key-generator';

export async function GET() {
  const plans = (Object.keys(KEY_INFO) as KeyType[])
    // .filter(type => type !== 'trial') // You can filter out trial if needed
    .map(type => {
      const scanLimitVal = KEY_SCAN_LIMITS[type];
      const scanLimitText = scanLimitVal === -1 ? 'Quét không giới hạn' : `Tối đa ${scanLimitVal} lượt quét/ngày`;
      
      const durationVal = KEY_DURATIONS[type];
      const durationText = durationVal === null ? 'Sử dụng vĩnh viễn' : `Sử dụng trong ${durationVal} ngày`;

      return {
        id: type,
        name: KEY_INFO[type].name,
        price: KEY_PRICES[type],
        duration: durationText,
        scanLimit: scanLimitText,
        features: [
          'Truy cập đầy đủ tính năng Extension',
          'Cập nhật dữ liệu BĐS theo thời gian thực',
          'Hỗ trợ kỹ thuật 24/7',
          'Bảo mật dữ liệu tuyệt đối'
        ],
        popular: KEY_INFO[type].badge === 'PHỔ BIẾN'
      };
    });

  return NextResponse.json(plans);
}
