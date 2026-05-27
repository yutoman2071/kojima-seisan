import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productionPlans, productionResults, products, processes } from '@/lib/db/schema';
import { sql, eq, gte, lte } from 'drizzle-orm';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.substring(0, 7) + '-01';

    // 今月の計画合計
    const planTotal = await db
      .select({ total: sql<number>`sum(${productionPlans.plannedQuantity})` })
      .from(productionPlans)
      .where(
        sql`${productionPlans.planDate} >= ${monthStart} AND ${productionPlans.planDate} <= ${today}`
      );

    // 今月の実績合計
    const resultTotal = await db
      .select({ total: sql<number>`sum(${productionResults.actualQuantity})` })
      .from(productionResults)
      .where(
        sql`${productionResults.resultDate} >= ${monthStart} AND ${productionResults.resultDate} <= ${today}`
      );

    // 今月の不良品合計
    const defectTotal = await db
      .select({ total: sql<number>`sum(${productionResults.defectQuantity})` })
      .from(productionResults)
      .where(
        sql`${productionResults.resultDate} >= ${monthStart} AND ${productionResults.resultDate} <= ${today}`
      );

    // 直近7日間の日別実績
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const dailyResults = await db
      .select({
        date: productionResults.resultDate,
        total: sql<number>`sum(${productionResults.actualQuantity})`,
      })
      .from(productionResults)
      .where(sql`${productionResults.resultDate} >= ${sevenDaysAgoStr}`)
      .groupBy(productionResults.resultDate)
      .orderBy(productionResults.resultDate);

    const plannedQty = Number(planTotal[0]?.total ?? 0);
    const actualQty = Number(resultTotal[0]?.total ?? 0);
    const defectQty = Number(defectTotal[0]?.total ?? 0);
    const achievementRate = plannedQty > 0 ? Math.round((actualQty / plannedQty) * 100) : 0;
    const defectRate = actualQty > 0 ? Math.round((defectQty / actualQty) * 1000) / 10 : 0;

    return NextResponse.json({
      plannedQty,
      actualQty,
      achievementRate,
      defectRate,
      dailyResults: dailyResults.map(r => ({
        date: r.date,
        quantity: Number(r.total),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
