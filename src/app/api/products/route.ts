import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db.select().from(products).orderBy(products.code);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '製品データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(products).values({
      code: body.code,
      name: body.name,
      unit: body.unit ?? '個',
      standardTime: body.standardTime ?? null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '製品の登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.update(products)
      .set({ code: body.code, name: body.name, unit: body.unit, standardTime: body.standardTime })
      .where(eq(products.id, body.id))
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '製品の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '製品の削除に失敗しました' }, { status: 500 });
  }
}
