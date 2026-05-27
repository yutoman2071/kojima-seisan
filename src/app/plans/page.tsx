'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Product { id: number; code: string; name: string; unit: string; }
interface Process { id: number; code: string; name: string; }
interface Plan {
  id: number;
  planDate: string;
  productId: number;
  processId: number;
  plannedQuantity: number;
  plannedHours: string | null;
  note: string | null;
  productCode: string;
  productName: string;
  processName: string;
}

const EMPTY_FORM = {
  planDate: new Date().toISOString().split('T')[0],
  productId: '',
  processId: '',
  plannedQuantity: '',
  plannedHours: '',
  note: '',
};

export default function PlansPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.toISOString().substring(0, 7));
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/plans?month=${month}`).then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/processes').then(r => r.json()),
    ]).then(([p, pr, pc]) => {
      setPlans(p);
      setProducts(pr);
      setProcesses(pc);
    }).finally(() => setLoading(false));
  }, [month]);

  const fetchPlans = () =>
    fetch(`/api/plans?month=${month}`)
      .then(r => r.json())
      .then(setPlans);

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError('');
  };

  const openEdit = (p: Plan) => {
    setEditId(p.id);
    setForm({
      planDate: p.planDate,
      productId: String(p.productId),
      processId: String(p.processId),
      plannedQuantity: String(p.plannedQuantity),
      plannedHours: p.plannedHours ?? '',
      note: p.note ?? '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.planDate || !form.productId || !form.processId || !form.plannedQuantity) {
      setError('日付・製品・工程・計画数量は必須です');
      return;
    }
    setSaving(true);
    try {
      const body = {
        planDate: form.planDate,
        productId: Number(form.productId),
        processId: Number(form.processId),
        plannedQuantity: Number(form.plannedQuantity),
        plannedHours: form.plannedHours ? Number(form.plannedHours) : null,
        note: form.note || null,
        ...(editId ? { id: editId } : {}),
      };
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch('/api/plans', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchPlans();
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この計画を削除しますか？')) return;
    await fetch(`/api/plans?id=${id}`, { method: 'DELETE' });
    await fetchPlans();
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">生産計画入力</h1>
          <p className="text-sm text-gray-500 mt-1">月別の生産計画を登録します</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 計画を追加
        </button>
      </div>

      {/* 月選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">表示月</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        />
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-blue-800 mb-4">{editId ? '計画を編集' : '新しい計画を追加'}</h2>
          {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">計画日 *</label>
              <input type="date" value={form.planDate} onChange={e => setForm(f => ({ ...f, planDate: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">製品 *</label>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">選択してください</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">工程 *</label>
              <select value={form.processId} onChange={e => setForm(f => ({ ...f, processId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">選択してください</option>
                {processes.map(p => <option key={p.id} value={p.id}>{p.code} {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">計画数量 *</label>
              <input type="number" value={form.plannedQuantity} onChange={e => setForm(f => ({ ...f, plannedQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">計画工数（時間）</label>
              <input type="number" value={form.plannedHours} onChange={e => setForm(f => ({ ...f, plannedHours: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" step="0.5" min="0" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">備考</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4" /> キャンセル
            </button>
          </div>
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">読み込み中...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">計画データがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">計画日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">製品</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">工程</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">計画数量</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">計画工数(h)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">備考</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.planDate}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 mr-1">{p.productCode}</span>
                    {p.productName}
                  </td>
                  <td className="px-4 py-3">{p.processName}</td>
                  <td className="px-4 py-3 text-right font-medium">{p.plannedQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{p.plannedHours ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.note ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
