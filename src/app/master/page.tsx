'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

type Tab = 'products' | 'processes' | 'workers';

interface Product { id: number; code: string; name: string; unit: string; standardTime: string | null; }
interface Process { id: number; code: string; name: string; description: string | null; }
interface Worker { id: number; code: string; name: string; department: string | null; }

function MasterTable<T extends { id: number; code: string; name: string }>({
  title,
  items,
  columns,
  onEdit,
  onDelete,
  loading,
}: {
  title: string;
  items: T[];
  columns: { key: keyof T; label: string; className?: string }[];
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {loading ? (
        <div className="text-center py-12 text-gray-400">読み込み中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{title}データがありません</div>
      ) : (
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(c => (
                <th key={String(c.key)} className={`text-left px-4 py-3 font-medium text-gray-600 ${c.className ?? ''}`}>
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map(c => (
                  <td key={String(c.key)} className={`px-4 py-3 ${c.className ?? ''}`}>
                    {String(item[c.key] ?? '-')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [p, pc, w] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/processes').then(r => r.json()),
      fetch('/api/workers').then(r => r.json()),
    ]);
    setProducts(p);
    setProcesses(pc);
    setWorkers(w);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openNew = () => {
    setEditId(null);
    setForm({ code: '', name: '', unit: '個', standardTime: '', description: '', department: '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (item: Product | Process | Worker) => {
    setEditId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      unit: (item as Product).unit ?? '',
      standardTime: (item as Product).standardTime ?? '',
      description: (item as Process).description ?? '',
      department: (item as Worker).department ?? '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.code || !form.name) { setError('コードと名称は必須です'); return; }
    setSaving(true);
    try {
      const api = tab === 'products' ? '/api/products' : tab === 'processes' ? '/api/processes' : '/api/workers';
      const body: Record<string, unknown> = { code: form.code, name: form.name };
      if (tab === 'products') { body.unit = form.unit || '個'; body.standardTime = form.standardTime || null; }
      if (tab === 'processes') { body.description = form.description || null; }
      if (tab === 'workers') { body.department = form.department || null; }
      if (editId) body.id = editId;
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(api, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchAll();
      setShowForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return;
    const api = tab === 'products' ? '/api/products' : tab === 'processes' ? '/api/processes' : '/api/workers';
    await fetch(`${api}?id=${id}`, { method: 'DELETE' });
    await fetchAll();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'products', label: '製品マスタ' },
    { key: 'processes', label: '工程マスタ' },
    { key: 'workers', label: '作業者マスタ' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">マスタ管理</h1>
          <p className="text-sm text-gray-500 mt-1">製品・工程・作業者のマスタデータを管理します</p>
        </div>
        <button onClick={openNew}
          className="flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 text-sm font-medium sm:w-auto">
          <Plus className="w-4 h-4" /> 新規登録
        </button>
      </div>

      {/* タブ */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
            className={`shrink-0 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* フォーム */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold mb-4">{editId ? '編集' : '新規登録'}</h2>
          {error && <p className="text-red-600 text-sm mb-3">⚠️ {error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">コード *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">名称 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            {tab === 'products' && (
              <>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">単位</label>
                  <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="個" />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">標準工数（時間/個）</label>
                  <input type="number" value={form.standardTime} onChange={e => setForm(f => ({ ...f, standardTime: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" step="0.01" min="0" />
                </div>
              </>
            )}
            {tab === 'processes' && (
              <div className="md:col-span-3">
                <label className="text-xs text-gray-600 mb-1 block">説明</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
            {tab === 'workers' && (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">部門</label>
                <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50">
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
      {tab === 'products' && (
        <MasterTable
          title="製品"
          items={products}
          columns={[
            { key: 'code', label: 'コード' },
            { key: 'name', label: '製品名' },
            { key: 'unit', label: '単位' },
            { key: 'standardTime', label: '標準工数(h/個)' },
          ]}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
      {tab === 'processes' && (
        <MasterTable
          title="工程"
          items={processes}
          columns={[
            { key: 'code', label: 'コード' },
            { key: 'name', label: '工程名' },
            { key: 'description', label: '説明' },
          ]}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
      {tab === 'workers' && (
        <MasterTable
          title="作業者"
          items={workers}
          columns={[
            { key: 'code', label: 'コード' },
            { key: 'name', label: '名前' },
            { key: 'department', label: '部門' },
          ]}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}
    </div>
  );
}
