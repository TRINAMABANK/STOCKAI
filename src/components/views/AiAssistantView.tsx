'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, RefreshCw, ShieldAlert, CheckCircle, Info } from 'lucide-react';

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
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Trợ lý Phân tích StockAI Personal</h2>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> GPT-4o Backend
              </span>
            </div>
            <p className="text-xs text-slate-500">Tích hợp dữ liệu danh mục thật, thị trường Vietstock và động cơ định lượng T+3</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-xs font-medium whitespace-nowrap shadow-2xs transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1 px-1">
              <span>{m.sender === 'user' ? 'Anh Trí' : (m.model || 'StockAI')}</span>
              <span>•</span>
              <span>{m.time}</span>
            </div>
            <div
              className={`p-4 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-sm">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>StockAI đang truy vấn dữ liệu thị trường & suy luận...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(input);
          }}
          disabled={isLoading}
          placeholder="Đặt câu hỏi về cổ phiếu, kịch bản giá, hoặc phân tích danh mục..."
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
        >
          <span>Gửi</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
