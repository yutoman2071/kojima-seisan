import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DailyResult {
  date: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plannedQty, actualQty, achievementRate, defectRate, dailyResults } = body as {
      plannedQty: number;
      actualQty: number;
      achievementRate: number;
      defectRate: number;
      dailyResults: DailyResult[];
    };

    const today = new Date();
    const monthLabel = `${today.getFullYear()}年${today.getMonth() + 1}月`;

    const dailySummary = dailyResults.length > 0
      ? dailyResults.map((r: DailyResult) => {
          const d = new Date(r.date);
          return `${d.getMonth() + 1}/${d.getDate()}: ${r.quantity.toLocaleString()}個`;
        }).join('、')
      : 'データなし';

    const prompt = `あなたは製造業の生産管理の専門家です。以下の${monthLabel}の生産データを分析し、実践的なアドバイスを日本語で提供してください。

【生産データ】
- 計画数量: ${plannedQty.toLocaleString()}個
- 実績数量: ${actualQty.toLocaleString()}個
- 達成率: ${achievementRate}%
- 不良率: ${defectRate}%
- 直近7日間の日別実績: ${dailySummary}

以下の観点から、簡潔で実践的なアドバイスを3点、箇条書き（・）で提供してください：
1. 現状の評価（達成率・不良率の状況）
2. 注目すべき課題または好調点
3. 今後の改善・維持のための具体的アクション

各項目は1〜2文で簡潔にまとめてください。`;

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return NextResponse.json({ advice: text });
  } catch (error) {
    console.error('AI advice error:', error);
    return NextResponse.json(
      { error: 'AIアドバイスの生成に失敗しました' },
      { status: 500 }
    );
  }
}
