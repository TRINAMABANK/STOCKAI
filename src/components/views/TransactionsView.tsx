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
          <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">Sổ lệnh & Nhật ký giao dịch</h2>
          <p className="text-[11pt] text-[#647293] mt-0.5">Lưu trữ toàn bộ lịch sử mua, bán, phí môi giới và thuế TNCN</p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'BUY', 'SELL'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3.5 py-1.5 rounded-xl text-[11pt] font-semibold transition ${
                filterType === type 
                  ? 'bg-[#087CFF] text-white shadow-xs' 
                  : 'bg-white text-[#647293] border border-[#DCE5FF] hover:bg-[#F4F7FF]'
              }`}
            >
              {type === 'ALL' ? 'Tất cả lệnh' : type === 'BUY' ? 'Lệnh Mua' : 'Lệnh Bán'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11pt]">
            <thead>
              <tr className="bg-[#F4F7FF] text-[#647293] text-[11pt] font-semibold border-b border-[#DCE5FF]">
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Mã lệnh</th>
                <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Ngày khớp</th>
                <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Loại</th>
                <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Mã CP</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Khối lượng</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá khớp</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Giá trị gộp</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Phí</th>
                <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Thuế</th>
                <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Giá trị ròng</th>
                <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F7FF] text-[11pt]">
              {filtered.length > 0 ? (
                filtered.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  return (
                    <tr key={tx.id} className="hover:bg-[#F8FAFC] transition h-[44px]">
                      <td className="py-2.5 px-4 font-mono text-[#647293] text-[11pt] tabular-nums whitespace-nowrap">{tx.id}</td>
                      <td className="py-2.5 px-3 text-[#172554] font-medium text-[11pt] whitespace-nowrap">{tx.date}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11pt] font-bold ${
                          isBuy ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'
                        }`}>
                          {isBuy ? 'MUA' : 'BÁN'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#087CFF] text-[11pt] whitespace-nowrap">{tx.symbol || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">{tx.shares?.toLocaleString() || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#172554] text-[11pt] whitespace-nowrap">{tx.price?.toLocaleString('vi-VN') || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">{tx.grossAmount.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-right text-[#647293] font-mono tabular-nums text-[11pt] whitespace-nowrap">{tx.fee.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-3 text-right text-[#647293] font-mono tabular-nums text-[11pt] whitespace-nowrap">{tx.tax.toLocaleString('vi-VN')}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-[#172554] font-mono tabular-nums text-[11pt] whitespace-nowrap">
                        {isBuy ? '-' : '+'}{tx.netAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-2.5 px-4 text-[#647293] text-[11pt] max-w-[200px] truncate whitespace-nowrap">{tx.notes || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-[#647293] text-[11pt]">
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
