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
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172033] tracking-tight">Sổ lệnh & Nhật ký giao dịch</h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">Lưu trữ toàn bộ lịch sử mua, bán, phí môi giới và thuế TNCN</p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'BUY', 'SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterType === type 
                  ? 'bg-[#008FD3] text-white shadow-xs' 
                  : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F5F8FC]'
              }`}
            >
              {type === 'ALL' ? 'Tất cả lệnh' : type === 'BUY' ? 'Lệnh Mua' : 'Lệnh Bán'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                <th className="py-3 px-4 font-medium text-left">Mã lệnh</th>
                <th className="py-3 px-3 font-medium text-left">Ngày khớp</th>
                <th className="py-3 px-3 font-medium text-center">Loại</th>
                <th className="py-3 px-3 font-medium text-left">Mã CP</th>
                <th className="py-3 px-3 font-medium text-right">Khối lượng</th>
                <th className="py-3 px-3 font-medium text-right">Giá khớp</th>
                <th className="py-3 px-3 font-medium text-right">Giá trị gộp</th>
                <th className="py-3 px-3 font-medium text-right">Phí</th>
                <th className="py-3 px-3 font-medium text-right">Thuế</th>
                <th className="py-3 px-4 font-medium text-right">Giá trị ròng</th>
                <th className="py-3 px-4 font-medium text-left">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.length > 0 ? (
                filtered.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition h-[42px]">
                      <td className="py-2.5 px-4 font-mono text-[#64748B] text-xs tabular-nums">{tx.id}</td>
                      <td className="py-2.5 px-3 text-[#172033] font-medium">{tx.date}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          isBuy ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FFE4E6] text-[#F43F5E]'
                        }`}>
                          {isBuy ? 'MUA' : 'BÁN'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#008FD3]">{tx.symbol || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#172033] font-mono tabular-nums">{tx.shares?.toLocaleString() || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#172033]">{tx.price?.toLocaleString('vi-VN') || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#172033] font-mono tabular-nums">{tx.grossAmount.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-right text-[#64748B] font-mono tabular-nums">{tx.fee.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-right text-[#64748B] font-mono tabular-nums">{tx.tax.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#172033] font-mono tabular-nums">
                        {isBuy ? '-' : '+'}{tx.netAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-4 text-[#64748B] text-[12px] max-w-[200px] truncate">{tx.notes || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#64748B] text-xs">
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
