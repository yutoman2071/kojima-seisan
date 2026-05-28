import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resultDate,
      productName,
      processName,
      workerName,
      actualQuantity,
      actualHours,
      defectQuantity,
      note,
    } = body as {
      resultDate: string;
      productName: string;
      processName: string;
      workerName?: string;
      actualQuantity: number;
      actualHours?: number;
      defectQuantity: number;
      note?: string;
    };

    const defectRate = actualQuantity > 0
      ? Math.round((defectQuantity / actualQuantity) * 1000) / 10
      : 0;

    const productivity = actualHours && actualHours > 0
      ? Math.round(actualQuantity / actualHours)
      : null;

    const prompt = `あなたは製造業の生産管理の専門家です。以下の生産実績について、簡潔な評価コメントを1〜2文の日本語で生成してください。

【実績データ】
- 日付: ${resultDate}
- 製品: ${productName}
- 工程: ${processName}
${workerName ? `- 作業者: ${workerName}` : ''}
- 実績数量: ${actualQuantity.toLocaleString()}個
${actualHours ? `- 実績工数: ${actualHours}時間（生産性: ${productivity}個/時間）` : ''}
- 不良数量: ${defectQuantity}個（不良率: ${defectRate}%）
${note ? `- 備考: ${note}` : ''}

不良率や生産性の状況を踏まえて、励ましや改善提案を含む前向きなコメントを1〜2文で生成してください。`;

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 256,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    return NextResponse.json({ comment: text });
  } catch (error) {
    console.error('AI result comment error:', error);
    return NextResponse.json(
      { error: 'AIコメントの生成に失敗しました' },
      { status: 500 }
    );
  }
}
