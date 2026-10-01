import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    // Delete both user and admin tokens
    cookieStore.set('fh_user_token', '', { maxAge: 0, path: '/' });
    cookieStore.set('fh_admin_token', '', { maxAge: 0, path: '/' });
    
    return NextResponse.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error: any) {
    console.error('Lỗi khi đăng xuất:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
