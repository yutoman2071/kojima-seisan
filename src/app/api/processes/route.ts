import { NextRequest, NextResponse } from 'next/server';
import { db, processes } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db.select().from(processes).orderBy(processes.code);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: '工程データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(processes).values({
      code: body.code,
      name: body.name,
      description: body.description ?? null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '工程の登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.update(processes)
      .set({ code: body.code, name: body.name, description: body.description })
      .where(eq(processes.id, body.id))
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: '工程の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await db.delete(processes).where(eq(processes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '工程の削除に失敗しました' }, { status: 500 });
  }
}
