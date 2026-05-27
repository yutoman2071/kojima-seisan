import { NextRequest, NextResponse } from 'next/server';
import { db, productionResults, products, processes, workers } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');

    let query = db
      .select({
        id: productionResults.id,
        resultDate: productionResults.resultDate,
        actualQuantity: productionResults.actualQuantity,
        actualHours: productionResults.actualHours,
        defectQuantity: productionResults.defectQuantity,
        note: productionResults.note,
        productId: productionResults.productId,
        processId: productionResults.processId,
        workerId: productionResults.workerId,
        productCode: products.code,
        productName: products.name,
        processCode: processes.code,
        processName: processes.name,
        workerName: workers.name,
      })
      .from(productionResults)
      .leftJoin(products, eq(productionResults.productId, products.id))
      .leftJoin(processes, eq(productionResults.processId, processes.id))
      .leftJoin(workers, eq(productionResults.workerId, workers.id));

    if (month) {
      const start = `${month}-01`;
      const end = `${month}-31`;
      const rows = await query.where(
        sql`${productionResults.resultDate} >= ${start} AND ${productionResults.resultDate} <= ${end}`
      ).orderBy(productionResults.resultDate);
      return NextResponse.json(rows);
    }

    const rows = await query.orderBy(productionResults.resultDate);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '実績データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.insert(productionResults).values({
      resultDate: body.resultDate,
      productId: body.productId,
      processId: body.processId,
      workerId: body.workerId ?? null,
      actualQuantity: body.actualQuantity,
      actualHours: body.actualHours ?? null,
      defectQuantity: body.defectQuantity ?? 0,
      note: body.note ?? null,
    }).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '実績の登録に失敗しました' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [row] = await db.update(productionResults)
      .set({
        resultDate: body.resultDate,
        productId: body.productId,
        processId: body.processId,
        workerId: body.workerId ?? null,
        actualQuantity: body.actualQuantity,
        actualHours: body.actualHours ?? null,
        defectQuantity: body.defectQuantity ?? 0,
        note: body.note ?? null,
      })
      .where(eq(productionResults.id, body.id))
      .returning();
    return NextResponse.json(row);
  } catch (error) {
    return NextResponse.json({ error: '実績の更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    await db.delete(productionResults).where(eq(productionResults.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '実績の削除に失敗しました' }, { status: 500 });
  }
}
