import { NextRequest, NextResponse } from 'next/server';
import { db, productionPlans, products, processes } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM

    let query = db
      .select({
        id: productionPlans.id,
        planDate: productionPlans.planDate,
        plannedQuantity: productionPlans.plannedQuantity,
        plannedHours: productionPlans.plannedHours,
        note: productionPlans.note,
        productId: productionPlans.productId,
        processId: productionPlans.processId,
        productCode: products.code,
        productName: products.name,
        processCode: processes.code,
        processName: processes.name,
      })
      .from(productionPlans)
      .leftJoin(products, eq(productionPlans.productId, products.id))
      .leftJoin(processes, eq(productionPlans.processId, processes.id));

    if (month) {
      const start = `${month}-01`;
      const end = `${month}-31`;
      const rows = await query.where(
        sql`${productionPlans.planDate} >= ${start} AND ${productionPlans.planDate} <= ${end}`
      ).orderBy(productionPlans.planDate);
      return NextResponse.json(rows);
    }

    const rows = await query.orderBy(productionPlans.planDate);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '計画データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(productionPlans).values({
      planDate: body.planDate,
      productId: body.productId,
      processId: body.processId,
      plannedQuantity: body.plannedQuantity,
      plannedHours: body.plannedHours ?? null,
      note: body.note ?? null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '計画の登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.update(productionPlans)
      .set({
        planDate: body.planDate,
        productId: body.productId,
        processId: body.processId,
        plannedQuantity: body.plannedQuantity,
        plannedHours: body.plannedHours ?? null,
        note: body.note ?? null,
      })
      .where(eq(productionPlans.id, body.id))
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: '計画の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await db.delete(productionPlans).where(eq(productionPlans.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '計画の削除に失敗しました' }, { status: 500 });
  }
}
