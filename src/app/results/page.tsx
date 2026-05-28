'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check, Sparkles } from 'lucide-react';

interface Product { id: number; code: string; name: string; unit: string; }
interface Process { id: number; code: string; name: string; }
interface Worker { id: number; code: string; name: string; }
interface Result {
  id: number;
  resultDate: string;
  productId: number;
  processId: number;
  workerId: number | null;
  actualQuantity: number;
  actualHours: string | null;
  defectQuantity: number;
  note: string | null;
  productCode: string;
  productName: string;
  processName: string;
  workerName: string | null;
}

const EMPTY_FORM = {
  resultDate: new Date().toISOString().split('T')[0],
  productId: '',
  processId: '',
  workerId: '',
  actualQuantity: '',
  actualHours: '',
  defectQuantity: '0',
  note: '',
};

// AIコメントポップアップ
function AiCommentModal({
  comment,
  onClose,
}: {
  comment: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AIからのコメント</h3>
            <p className="text-xs text-gray-500">Claude AI による実績評価</p>
          </div>
        </div>
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{comment}</p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.toISOString().substring(0, 7));
  const [results, setResults] = useState<Result[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // AIコメント
  const [aiComment, setAiComment] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/results?month=${month}`).then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/processes').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
    ]).then(([re, pr, pc, wk]) => {
      setResults(re);
      setProducts(pr);
      setProcesses(pc);
      setWorkers(wk);
    }).finally(() => setLoading(false));
  }, [month]);

  const fetchResults = () =>
    fetch(`/api/results?month=${month}`).then(r => r.json()).then(setResults);

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
    setError('');
  };

  const openEdit = (r: Result) => {
    setEditId(r.id);
    setForm({
      resultDate: r.resultDate,
      productId: String(r.productId),
      processId: String(r.processId),
      workerId: r.workerId ? String(r.workerId) : '',
      actualQuantity: String(r.actualQuantity),
      actualHours: r.actualHours ?? '',
      defectQuantity: String(r.defectQuantity),
      note: r.note ?? '',
    });
    setShowForm(true);
    setError('');
  };

  const generateAiComment = async (savedResult: {
    resultDate: string;
    productId: number;
    processId: number;
    workerId: number | null;
    actualQuantity: number;
    actualHours: number | null;
    defectQuantity: number;
    note: string | null;
  }) => {
    setAiLoading(true);
    try {
      const product = products.find(p => p.id === savedResult.productId);
      const process = processes.find(p => p.id === savedResult.processId);
      const worker = savedResult.workerId ? workers.find(w => w.id === savedResult.workerId) : null;

      const res = await fetch('/api/ai-result-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultDate: savedResult.resultDate,
          productName: product?.name ?? '不明',
          processName: process?.name ?? '不明',
          workerName: worker?.name ?? undefined,
          actualQuantity: savedResult.actualQuantity,
          actualHours: savedResult.actualHours ?? undefined,
          defectQuantity: savedResult.defectQuantity,
          note: savedResult.note ?? undefined,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAiComment(json.comment);
      setShowAiModal(true);
    } catch (e) {
      console.error('AI comment error:', e);
      // エラーの場合はモーダルを表示しない（サイレントに失敗）
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.resultDate || !form.productId || !form.processId || !form.actualQuantity) {
      setError('日付・製品・工程・実績数量は必須です');
      return;
    }
    setSaving(true);
    try {
      const body = {
        resultDate: form.resultDate,
        productId: Number(form.productId),
        processId: Number(form.processId),
        workerId: form.workerId ? Number(form.workerId) : null,
        actualQuantity: Number(form.actualQuantity),
        actualHours: form.actualHours ? Number(form.actualHours) : null,
        defectQuantity: Number(form.defectQuantity) || 0,
        note: form.note || null,
        ...(editId ? { id: editId } : {}),
      };
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch('/api/results', { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchResults();
      setShowForm(false);

      // 新規登録の場合のみAIコメントを生成
      if (!editId) {
        generateAiComment(body);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('この実績を削除しますか？')) return;
    await fetch(`/api/results?id=${id}`, { method: 'DELETE' });
    await fetchResults();
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* AIコメントモーダル */}
      {showAiModal && (
        <AiCommentModal
          comment={aiComment}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* AIコメント生成中のインジケーター */}
      {aiLoading && (
        <div className="fixed bottom-6 right-6 bg-violet-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 z-40">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">AIコメントを生成中...</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">実績記録</h1>
          <p className="text-sm text-gray-500 mt-1">生産実績を登録します</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> 実績を追加
        </button>
      </div>

      {/* 月選択 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">表示月</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-green-800 mb-4">{editId ? '実績を編集' : '新しい実績を追加'}</h2>
          {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">実績日 *</label>
              <input type="date" value={form.resultDate} onChange={e => setForm(f => ({ ...f, resultDate: e.target.value }))}
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
              <label className="text-xs text-gray-600 mb-1 block">作業者</label>
              <select value={form.workerId} onChange={e => setForm(f => ({ ...f, workerId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">（未指定）</option>
                {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">実績数量 *</label>
              <input type="number" value={form.actualQuantity} onChange={e => setForm(f => ({ ...f, actualQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">実績工数（時間）</label>
              <input type="number" value={form.actualHours} onChange={e => setForm(f => ({ ...f, actualHours: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" step="0.5" min="0" />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">不良数量</label>
              <input type="number" value={form.defectQuantity} onChange={e => setForm(f => ({ ...f, defectQuantity: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">備考</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              <Check className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 border border-gray-300 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4" /> キャンセル
            </button>
          </div>
          {!editId && (
            <p className="text-xs text-violet-600 mt-3 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              保存後、AIが実績データを自動評価してコメントを生成します
            </p>
          )}
        </div>
      )}

      {/* テーブル */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-400">読み込み中...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 text-gray-400">実績データがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">実績日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">製品</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">工程</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">作業者</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">実績数量</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">工数(h)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">不良数</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{r.resultDate}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400 mr-1">{r.productCode}</span>
                    {r.productName}
                  </td>
                  <td className="px-4 py-3">{r.processName}</td>
                  <td className="px-4 py-3">{r.workerName ?? '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.actualQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{r.actualHours ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={r.defectQuantity > 0 ? 'text-red-600 font-medium' : ''}>
                      {r.defectQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
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
