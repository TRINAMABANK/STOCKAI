'use client';

import React, { useState } from 'react';
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, Filter, Plus } from 'lucide-react';
import { Transaction } from '@/types';

interface TransactionsViewProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export default function TransactionsView({
  transactions,
  onRefresh,
}: TransactionsViewProps) {
  const [filterType, setFilterType] = useState<string>('ALL');

  const filtered = filterType === 'ALL'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sổ lệnh & Nhật ký giao dịch</h2>
          <p className="text-xs text-slate-500 mt-0.5">Lưu trữ toàn bộ lịch sử mua, bán, phí môi giới và thuế TNCN</p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'BUY', 'SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === type 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' ? 'Tất cả lệnh' : type === 'BUY' ? 'Lệnh Mua' : 'Lệnh Bán'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Mã lệnh</th>
                <th className="py-3 px-4 font-semibold">Ngày khớp</th>
                <th className="py-3 px-4 font-semibold">Loại</th>
                <th className="py-3 px-4 font-semibold">Mã CP</th>
                <th className="py-3 px-4 font-semibold text-right">Khối lượng</th>
                <th className="py-3 px-4 font-semibold text-right">Giá khớp</th>
                <th className="py-3 px-4 font-semibold text-right">Giá trị gộp</th>
                <th className="py-3 px-4 font-semibold text-right">Phí</th>
                <th className="py-3 px-4 font-semibold text-right">Thuế</th>
                <th className="py-3 px-4 font-semibold text-right">Giá trị ròng</th>
                <th className="py-3 px-4 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length > 0 ? (
                filtered.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{tx.id}</td>
                      <td className="py-3 px-4 text-slate-700">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isBuy ? 'MUA' : 'BÁN'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tx.symbol || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold font-mono">{tx.shares?.toLocaleString() || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono">{tx.price?.toLocaleString('vi-VN') || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold font-mono">{tx.grossAmount.toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{tx.fee.toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right text-slate-500 font-mono">{tx.tax.toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {isBuy ? '-' : '+'}{tx.netAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">{tx.notes || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không có giao dịch nào thỏa điều kiện lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
