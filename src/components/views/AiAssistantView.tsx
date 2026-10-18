'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, ShieldAlert, CheckCircle, Info } from 'lucide-react';
import Logo from '@/components/Logo';

export default function AiAssistantView() {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; model?: string }>>([
    {
      sender: 'ai',
      text: 'Xin chào anh Trí! Tôi là Trợ lý StockAI Personal, chuyên sâu về phân tích dữ liệu thị trường Việt Nam (HOSE, HNX, UPCoM), quản lý danh mục BMSC và nhận diện cơ hội T+3.\n\nAnh có thể hỏi tôi bất kỳ câu hỏi nào về cổ phiếu, đánh giá danh mục hoặc yêu cầu xây dựng kịch bản thị trường.',
      time: '14:35',
      model: 'StockAI Assistant',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const prompts = [
    'Phân tích chi tiết cổ phiếu FPT',
    'Tìm cổ phiếu có tín hiệu T+3 tốt nhất phiên hôm nay',
    'Đánh giá danh mục đầu tư BMSC của tôi',
    'So sánh tiềm năng VNM và MCH',
    'Kịch bản thị trường khi VN-Index tiệm cận vùng 1,300 điểm?',
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: nowTime }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: data.data.reply,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            model: data.data.model,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'ai',
            text: `⚠️ ${data.message || 'Lỗi xử lý yêu cầu AI.'}`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: '⚠️ Không thể kết nối với máy chủ AI.',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-3">
          <Logo size="md" variant="default" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] lg:text-[22px] font-bold text-[#172033] tracking-tight">Trợ lý Phân tích StockAI Copilot</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#8B5CF6] text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GPT-4o Backend
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">Tích hợp dữ liệu danh mục thật, thị trường HOSE, HNX, UPCoM và động cơ định lượng T+3</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#008FD3] text-[#172033] hover:text-[#008FD3] text-[12px] font-medium whitespace-nowrap shadow-2xs transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 text-[11px] text-[#64748B] mb-1 px-1">
              <span className="font-semibold">{m.sender === 'user' ? 'Anh Trí' : (m.model || 'StockAI')}</span>
              <span>•</span>
              <span className="font-mono">{m.time}</span>
            </div>
            <div
              className={`p-4 rounded-2xl max-w-[85%] text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-line shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-[#E0F2FE] border border-[#BAE6FD] text-[#008FD3] font-medium rounded-tr-none'
                  : 'bg-[#F5F8FC] border border-[#E2E8F0] text-[#172033] rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-[13px] text-[#64748B] p-3 bg-[#F5F8FC] rounded-xl border border-[#E2E8F0] max-w-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-[#008FD3]" />
            <span>StockAI đang truy vấn dữ liệu thị trường & suy luận...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 shrink-0 bg-[#FFFFFF] p-2 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(input);
          }}
          disabled={isLoading}
          placeholder="Đặt câu hỏi về cổ phiếu, kịch bản giá, hoặc phân tích danh mục..."
          className="flex-1 bg-transparent px-3 py-2 text-[13px] sm:text-[14px] text-[#172033] placeholder-[#64748B] focus:outline-none"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] disabled:opacity-40 text-white font-medium text-[13px] transition flex items-center gap-1.5 shadow-2xs"
        >
          <span>Gửi</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
