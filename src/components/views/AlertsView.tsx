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
      case 'PRICE_ABOVE': return 'Giá vượt lên trên (>=)';
      case 'PRICE_BELOW': return 'Giá giảm xuống dưới (<=)';
      case 'RSI_OVERSOLD': return 'RSI chạm vùng quá bán (<=)';
      case 'RSI_OVERBOUGHT': return 'RSI chạm vùng quá mua (>=)';
      default: return cond;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">Trung tâm Cảnh báo Kỹ thuật & Giá</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Tự động giám sát giá mục tiêu, ngưỡng cắt lỗ và chỉ báo kỹ thuật</p>
        </div>
      </div>

      {/* Add Alert Form */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-[15px] font-semibold text-[#172033]">Thiết lập quy tắc cảnh báo mới</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[#64748B] font-medium block mb-1">Mã cổ phiếu</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="VD: HPG"
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold uppercase text-[#172033]"
            />
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">Điều kiện kích hoạt</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-semibold text-[#172033]"
            >
              <option value="PRICE_ABOVE">Giá vượt lên trên (&gt;=)</option>
              <option value="PRICE_BELOW">Giá giảm xuống dưới (&lt;=)</option>
              <option value="RSI_OVERSOLD">RSI quá bán (&lt;=)</option>
              <option value="RSI_OVERBOUGHT">RSI quá mua (&gt;=)</option>
            </select>
          </div>

          <div>
            <label className="text-[#64748B] font-medium block mb-1">Giá trị mục tiêu</label>
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="VD: 28000 hoặc 35"
              className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-bold text-[#172033] font-mono tabular-nums"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!symbol.trim() || !targetValue.trim()}
              className="w-full px-4 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] disabled:opacity-50 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo cảnh báo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-medium text-left">Mã CP</th>
                <th className="py-3 px-4 font-medium text-left">Điều kiện</th>
                <th className="py-3 px-4 font-medium text-right">Ngưỡng mục tiêu</th>
                <th className="py-3 px-4 font-medium text-left">Ngày tạo</th>
                <th className="py-3 px-4 font-medium text-center">Trạng thái</th>
                <th className="py-3 px-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {alerts.map((alt) => (
                <tr key={alt.id} className="hover:bg-[#F8FAFC] transition h-[42px]">
                  <td className="py-2.5 px-4 font-semibold text-[#008FD3] text-[14px]">{alt.symbol}</td>
                  <td className="py-2.5 px-4 text-[#172033] font-medium">{getConditionLabel(alt.condition)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-[#172033] font-mono tabular-nums">
                    {alt.targetValue.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-4 text-[#64748B] text-xs">{alt.createdAt}</td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => toggleAlert(alt.id)}
                      className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition ${
                        alt.isActive 
                          ? 'bg-[#D1FAE5] text-[#10B981]' 
                          : 'bg-[#F5F8FC] border border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {alt.isActive ? 'ĐANG BẬT' : 'TẠM TẮT'}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => removeAlert(alt.id)}
                      className="p-1 text-[#CBD5E1] hover:text-[#F43F5E] transition"
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
