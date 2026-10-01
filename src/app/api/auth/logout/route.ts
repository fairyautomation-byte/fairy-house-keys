import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    // Delete the session cookie by setting maxAge to 0
    cookieStore.set('session', '', { maxAge: 0, path: '/' });
    
    return NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error: any) {
    console.error('Lỗi khi đăng xuất:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
