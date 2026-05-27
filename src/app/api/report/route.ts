import { NextRequest, NextResponse } from 'next/server';
import { db, productionPlans, productionResults, products, processes } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ?? new Date().toISOString().substring(0, 7);
    const start = `${month}-01`;
    const end = `${month}-31`;

    // 製品×工程ごとの計画集計
    const plans = await db
      .select({
        productId: productionPlans.productId,
        processId: productionPlans.processId,
        productCode: products.code,
        productName: products.name,
        processName: processes.name,
        plannedQty: sql<number>`sum(${productionPlans.plannedQuantity})`,
        plannedHours: sql<number>`sum(${productionPlans.plannedHours})`,
      })
      .from(productionPlans)
      .leftJoin(products, eq(productionPlans.productId, products.id))
      .leftJoin(processes, eq(productionPlans.processId, processes.id))
      .where(sql`${productionPlans.planDate} >= ${start} AND ${productionPlans.planDate} <= ${end}`)
      .groupBy(
        productionPlans.productId,
        productionPlans.processId,
        products.code,
        products.name,
        processes.name
      );

    // 製品×工程ごとの実績集計
    const results = await db
      .select({
        productId: productionResults.productId,
        processId: productionResults.processId,
        actualQty: sql<number>`sum(${productionResults.actualQuantity})`,
        actualHours: sql<number>`sum(${productionResults.actualHours})`,
        defectQty: sql<number>`sum(${productionResults.defectQuantity})`,
      })
      .from(productionResults)
      .where(sql`${productionResults.resultDate} >= ${start} AND ${productionResults.resultDate} <= ${end}`)
      .groupBy(productionResults.productId, productionResults.processId);

    // 結合してレポートデータ作成
    const reportMap = new Map<string, {
      productCode: string;
      productName: string;
      processName: string;
      plannedQty: number;
      actualQty: number;
      plannedHours: number;
      actualHours: number;
      defectQty: number;
      achievementRate: number;
      defectRate: number;
    }>();

    for (const p of plans) {
      const key = `${p.productId}-${p.processId}`;
      reportMap.set(key, {
        productCode: p.productCode ?? '',
        productName: p.productName ?? '',
        processName: p.processName ?? '',
        plannedQty: Number(p.plannedQty),
        actualQty: 0,
        plannedHours: Number(p.plannedHours ?? 0),
        actualHours: 0,
        defectQty: 0,
        achievementRate: 0,
        defectRate: 0,
      });
    }

    for (const r of results) {
      const key = `${r.productId}-${r.processId}`;
      if (reportMap.has(key)) {
        const item = reportMap.get(key)!;
        item.actualQty = Number(r.actualQty);
        item.actualHours = Number(r.actualHours ?? 0);
        item.defectQty = Number(r.defectQty ?? 0);
      } else {
        // 計画がないが実績がある場合は実績のみで追加（製品名等が取れないため簡易対応）
        reportMap.set(key, {
          productCode: '',
          productName: `製品ID:${r.productId}`,
          processName: `工程ID:${r.processId}`,
          plannedQty: 0,
          actualQty: Number(r.actualQty),
          plannedHours: 0,
          actualHours: Number(r.actualHours ?? 0),
          defectQty: Number(r.defectQty ?? 0),
          achievementRate: 0,
          defectRate: 0,
        });
      }
    }

    const report = Array.from(reportMap.values()).map(item => ({
      ...item,
      achievementRate: item.plannedQty > 0
        ? Math.round((item.actualQty / item.plannedQty) * 100)
        : null,
      defectRate: item.actualQty > 0
        ? Math.round((item.defectQty / item.actualQty) * 1000) / 10
        : 0,
      variance: item.actualQty - item.plannedQty,
    }));

    return NextResponse.json({ month, report });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'レポートの生成に失敗しました' }, { status: 500 });
  }
}
