import { NextRequest, NextResponse } from 'next/server';
import { db, workers } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db.select().from(workers).orderBy(workers.code);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: '作業者データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(workers).values({
      code: body.code,
      name: body.name,
      department: body.department ?? null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '作業者の登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.update(workers)
      .set({ code: body.code, name: body.name, department: body.department })
      .where(eq(workers.id, body.id))
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: '作業者の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await db.delete(workers).where(eq(workers.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '作業者の削除に失敗しました' }, { status: 500 });
  }
}
