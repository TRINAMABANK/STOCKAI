'use client';

import React, { useState } from 'react';
import { Bell, Plus, Trash2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { StockAlert } from '@/types';

export default function AlertsView() {
  const [alerts, setAlerts] = useState<StockAlert[]>([
    { id: 'alt-1', symbol: 'HPG', condition: 'PRICE_ABOVE', targetValue: 28000, isActive: true, createdAt: '2025-03-25' },
    { id: 'alt-2', symbol: 'FPT', condition: 'PRICE_ABOVE', targetValue: 140000, isActive: true, createdAt: '2025-03-24' },
    { id: 'alt-3', symbol: 'TCB', condition: 'PRICE_BELOW', targetValue: 31800, isActive: true, createdAt: '2025-03-23' },
    { id: 'alt-4', symbol: 'SSI', condition: 'RSI_OVERSOLD', targetValue: 35, isActive: false, createdAt: '2025-03-20' },
  ]);

  const [symbol, setSymbol] = useState('');
  const [condition, setCondition] = useState<'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT'>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState('');

  const handleAdd = () => {
    if (!symbol.trim() || !targetValue.trim()) return;
    const newAlert: StockAlert = {
      id: `alt-${Date.now()}`,
      symbol: symbol.trim().toUpperCase(),
      condition,
      targetValue: Number(targetValue),
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAlerts(prev => [newAlert, ...prev]);
    setSymbol('');
    setTargetValue('');
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const getConditionLabel = (cond: string) => {
    switch (cond) {
      case 'PRICE_ABOVE': return 'Giá vượt lên trên';
      case 'PRICE_BELOW': return 'Giá giảm xuống dưới';
      case 'RSI_OVERSOLD': return 'RSI chạm vùng quá bán (<)';
      case 'RSI_OVERBOUGHT': return 'RSI chạm vùng quá mua (>)';
      default: return cond;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Trung tâm Cảnh báo Kỹ thuật & Giá</h2>
          <p className="text-xs text-slate-500 mt-0.5">Tự động giám sát giá mục tiêu, ngưỡng cắt lỗ và chỉ báo kỹ thuật</p>
        </div>
      </div>

      {/* Add Alert Form */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-800">Thiết lập quy tắc cảnh báo mới</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-slate-500 font-medium block mb-1">Mã cổ phiếu</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="VD: HPG"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold uppercase text-slate-900"
            />
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Điều kiện kích hoạt</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
            >
              <option value="PRICE_ABOVE">Giá vượt lên trên (&gt;=)</option>
              <option value="PRICE_BELOW">Giá giảm xuống dưới (&lt;=)</option>
              <option value="RSI_OVERSOLD">RSI quá bán (&lt;=)</option>
              <option value="RSI_OVERBOUGHT">RSI quá mua (&gt;=)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 font-medium block mb-1">Giá trị mục tiêu</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="VD: 28000 hoặc 35"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!symbol.trim() || !targetValue.trim()}
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo cảnh báo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold">Điều kiện</th>
                <th className="py-3 px-4 font-semibold text-right">Ngưỡng mục tiêu</th>
                <th className="py-3 px-4 font-semibold">Ngày tạo</th>
                <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {alerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900 text-sm">{alt.symbol}</td>
                  <td className="py-3 px-4 text-slate-700">{getConditionLabel(alt.condition)}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                    {alt.targetValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{alt.createdAt}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleAlert(alt.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition ${
                        alt.isActive 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {alt.isActive ? 'ĐANG BẬT' : 'TẠM TẮT'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => removeAlert(alt.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Xóa cảnh báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
