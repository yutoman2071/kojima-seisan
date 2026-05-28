'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Package, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

interface DashboardData {
  plannedQty: number;
  actualQty: number;
  achievementRate: number;
  defectRate: number;
  dailyResults: { date: string; quantity: number }[];
}

function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: number | string;
  unit: string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-0.5">
          {value}
          <span className="text-base font-normal text-gray-500 ml-1">{unit}</span>
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function AiAdviceSection({ data }: { data: DashboardData }) {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);

  const generateAdvice = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAdvice(json.advice);
      setGenerated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [data]);

  // アドバイスのテキストを箇条書き行に分割して表示
  const renderAdviceLines = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map((line, i) => (
      <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {line}
      </p>
    ));
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-base font-semibold text-violet-900">AIアドバイス</h2>
          <span className="text-xs bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full font-medium">
            Claude AI
          </span>
        </div>
        <button
          onClick={generateAdvice}
          disabled={loading}
          className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '生成中...' : generated ? '再生成' : 'アドバイスを生成'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-violet-600">AIが生産データを分析しています...</span>
        </div>
      )}

      {!loading && !generated && !error && (
        <p className="text-sm text-gray-500 py-2">
          ボタンを押すと、今月の生産計画・実績データをAIが分析して改善アドバイスを生成します。
        </p>
      )}

      {!loading && advice && (
        <div className="space-y-2 mt-1">
          {renderAdviceLines(advice)}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const monthLabel = `${today.getFullYear()}年${today.getMonth() + 1}月`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">{monthLabel}の生産状況</p>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">読み込み中...</div>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="今月計画数量"
              value={data.plannedQty.toLocaleString()}
              unit="個"
              icon={ClipboardIcon}
              color="bg-blue-500"
            />
            <StatCard
              title="今月実績数量"
              value={data.actualQty.toLocaleString()}
              unit="個"
              icon={Package}
              color="bg-green-500"
            />
            <StatCard
              title="達成率"
              value={data.achievementRate}
              unit="%"
              icon={TrendingUp}
              color={data.achievementRate >= 90 ? 'bg-emerald-500' : data.achievementRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
              sub={data.achievementRate >= 90 ? '目標達成' : '目標未達'}
            />
            <StatCard
              title="不良率"
              value={data.defectRate}
              unit="%"
              icon={AlertTriangle}
              color={data.defectRate <= 1 ? 'bg-emerald-500' : data.defectRate <= 3 ? 'bg-yellow-500' : 'bg-red-500'}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold mb-4">直近7日間の生産実績</h2>
            {data.dailyResults.length === 0 ? (
              <p className="text-center text-gray-400 py-12">実績データがありません</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.dailyResults} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: unknown) => [`${Number(val).toLocaleString()} 個`, '実績数量']}
                    labelFormatter={(label: unknown) => {
                      const d = new Date(String(label));
                      return `${d.getMonth() + 1}月${d.getDate()}日`;
                    }}
                  />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* AIアドバイスセクション */}
          <AiAdviceSection data={data} />
        </>
      )}
    </div>
  );
}
