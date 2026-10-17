import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase, createBackup, restoreBackup } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      data: db,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi xuất sao lưu', error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, backupData } = body;

    if (action === 'CREATE_SNAPSHOT') {
      const fileName = createBackup();
      return NextResponse.json({
        success: true,
        message: `Đã tạo bản sao lưu an toàn: ${fileName}`,
        fileName,
      });
    }

    if (action === 'RESTORE' && backupData) {
      const jsonStr = typeof backupData === 'string' ? backupData : JSON.stringify(backupData);
      const ok = restoreBackup(jsonStr);
      if (ok) {
        return NextResponse.json({
          success: true,
          message: 'Khôi phục cơ sở dữ liệu thành công!',
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Dữ liệu sao lưu không hợp lệ',
        }, { status: 400 });
      }
    }

    return NextResponse.json({ success: false, message: 'Thao tác không hợp lệ' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Lỗi thao tác sao lưu/khôi phục', error: String(error) }, { status: 500 });
  }
}
