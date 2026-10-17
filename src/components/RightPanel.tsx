'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Bot, ExternalLink, RefreshCw, CheckCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { NewsItem, ApiProvider } from '@/types';

interface RightPanelProps {
  news: NewsItem[];
  apiProviders: ApiProvider[];
  onTestApi: (providerCode: string) => void;
  onOpenApiCenter: () => void;
  onOpenAiAssistant: () => void;
  testingProvider?: string | null;
}

export default function RightPanel({
  news,
  apiProviders,
  onTestApi,
  onOpenApiCenter,
  onOpenAiAssistant,
  testingProvider,
}: RightPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string; model?: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const samplePrompts = [
    'Phân tích cổ phiếu FPT',
    'Tìm cổ phiếu có thể tăng trong 1 tuần (T+3)',
    'Đánh giá danh mục của tôi',
    'So sánh VNM và MCH',
    'Những rủi ro thị trường cần lưu ý?',
  ];

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg = promptText.trim();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: nowTime }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: 'ai', 
            text: data.data.reply, 
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            model: data.data.model 
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { 
            sender: 'ai', 
            text: `⚠️ ${data.message || 'Lỗi kết nối AI.'}`, 
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { 
          sender: 'ai', 
          text: '⚠️ Không thể gửi yêu cầu tới máy chủ AI.', 
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-full xl:w-80 space-y-4 shrink-0">
      {/* 1. Trợ lý AI - StockAI */}
      <div className="bg-[#0f172a] rounded-2xl p-4.5 border border-slate-800 text-white shadow-sm flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center">
              <span className="font-bold text-xs text-blue-400">ai</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-100">Trợ lý AI - StockAI</h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/60 font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  GPT-4o
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hỏi đáp, phân tích và tìm cơ hội đầu tư</p>
            </div>
          </div>
        </div>

        {/* Prompt Suggestions */}
        <div className="my-3 space-y-1.5">
          <p className="text-[11px] text-slate-400 font-medium">Bạn có thể hỏi tôi:</p>
          <div className="space-y-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(p)}
                className="w-full text-left text-[11px] px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-emerald-400 transition"></span>
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Dialogue Display if messages exist */}
        {chatMessages.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2.5 my-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600/30 border border-blue-500/30 text-white ml-4' 
                    : 'bg-slate-800/90 border border-slate-700 text-slate-200 mr-2'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>{msg.sender === 'user' ? 'Bạn' : 'StockAI'}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="whitespace-pre-line leading-relaxed text-[11px]">
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-2 text-xs text-slate-400 animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>StockAI đang truy xuất dữ liệu & suy luận...</span>
              </div>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="relative mt-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendPrompt(chatInput);
            }}
            disabled={isAiLoading}
            placeholder="Nhập câu hỏi của anh..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <button
            onClick={() => handleSendPrompt(chatInput)}
            disabled={isAiLoading || !chatInput.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 flex items-center justify-center transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Tin tức nổi bật */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-slate-800">Tin tức nổi bật</h4>
          <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">
            Xem tất cả
          </span>
        </div>

        <div className="space-y-3">
          {news.map((item) => (
            <div key={item.id} className="flex gap-3 items-start group cursor-pointer">
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden font-bold text-[10px]">
                {item.source}
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                  {item.title}
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">
                  {item.source} • {item.timeAgo}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Kết nối API */}
      <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-sm text-slate-800">Kết nối API</h4>
          <button 
            onClick={onOpenApiCenter}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            Quản lý
          </button>
        </div>

        <div className="space-y-2.5">
          {apiProviders.map((provider) => {
            const isConnected = provider.status === 'CONNECTED';
            const isTesting = testingProvider === provider.code;

            return (
              <div 
                key={provider.id} 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}></span>
                    <span className={`text-[11px] font-medium ${
                      isConnected ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {isConnected ? 'Đang hoạt động' : 'Chưa kết nối'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onTestApi(provider.code)}
                  disabled={isTesting}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                    provider.code === 'BMSC'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isTesting ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  ) : (
                    <span>{provider.code === 'BMSC' ? 'Kết nối' : 'Kiểm tra'}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
