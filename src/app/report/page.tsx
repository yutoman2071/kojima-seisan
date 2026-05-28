'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ReportItem {
  productCode: string;
  productName: string;
  processName: string;
  plannedQty: number;
  actualQty: number;
  variance: number;
  achievementRate: number | null;
  plannedHours: number;
  actualHours: number;
  defectQty: number;
  defectRate: number;
}

export default function ReportPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.toISOString().substring(0, 7));
  const [report, setReport] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = (m: string) => {
    setLoading(true);
    fetch(`/api/report?month=${m}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setReport(d.report);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReport(month); }, [month]);

  const chartData = report.map(r => ({
    name: r.productCode || r.productName.substring(0, 8),
    計画: r.plannedQty,
    実績: r.actualQty,
  }));

  const totalPlanned = report.reduce((s, r) => s + r.plannedQty, 0);
  const totalActual = report.reduce((s, r) => s + r.actualQty, 0);
  const totalRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : null;

  const rateColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-500';
    if (rate >= 100) return 'text-emerald-600 font-bold';
    if (rate >= 90) return 'text-green-600 font-semibold';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600 font-semibold';
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">計画実績比較</h1>
        <p className="text-sm text-gray-500 mt-1">月別の計画数量と実績数量を比較します</p>
      </div>

      {/* 月選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">対象月</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">⚠️ {error}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">読み込み中...</div>
      ) : report.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          {month}のデータがありません
        </div>
      ) : (
        <>
          {/* サマリ */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">計画合計</p>
              <p className="text-2xl font-bold text-blue-600">{totalPlanned.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">個</span></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">実績合計</p>
              <p className="text-2xl font-bold text-green-600">{totalActual.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">個</span></p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">達成率</p>
              <p className={`text-2xl font-bold ${rateColor(totalRate)}`}>
                {totalRate !== null ? `${totalRate}%` : '-'}
              </p>
            </div>
          </div>

          {/* グラフ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4">製品別 計画・実績比較</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val: unknown) => `${Number(val).toLocaleString()} 個`} />
                <Legend />
                <Bar dataKey="計画" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="実績" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 明細テーブル */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">製品</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">工程</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">計画数量</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">実績数量</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">差異</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">達成率</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">不良率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 mr-1">{r.productCode}</span>
                      {r.productName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.processName}</td>
                    <td className="px-4 py-3 text-right">{r.plannedQty.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{r.actualQty.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${r.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {r.variance >= 0 ? '+' : ''}{r.variance.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right ${rateColor(r.achievementRate)}`}>
                      {r.achievementRate !== null ? `${r.achievementRate}%` : '-'}
                    </td>
                    <td className={`px-4 py-3 text-right ${r.defectRate > 3 ? 'text-red-600 font-medium' : r.defectRate > 1 ? 'text-yellow-600' : ''}`}>
                      {r.defectRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-4 py-3 font-semibold">合計</td>
                  <td className="px-4 py-3 text-right font-semibold">{totalPlanned.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-semibold">{totalActual.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${(totalActual - totalPlanned) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(totalActual - totalPlanned) >= 0 ? '+' : ''}{(totalActual - totalPlanned).toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${rateColor(totalRate)}`}>
                    {totalRate !== null ? `${totalRate}%` : '-'}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
