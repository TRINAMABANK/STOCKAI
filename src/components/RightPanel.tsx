'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Bot, ExternalLink, RefreshCw, CheckCircle, AlertCircle, ShieldAlert, ChevronRight, PanelRightClose } from 'lucide-react';
import { NewsItem, ApiProvider } from '@/types';
import Logo from './Logo';

interface RightPanelProps {
  news: NewsItem[];
  apiProviders: ApiProvider[];
  onTestApi: (providerCode: string) => void;
  onOpenApiCenter?: () => void;
  onOpenAiAssistant: () => void;
  testingProvider?: string | null;
  onCollapse?: () => void;
  onRefreshNews?: () => void;
  isRefreshingNews?: boolean;
}

export default function RightPanel({
  news,
  apiProviders,
  onTestApi,
  onOpenApiCenter,
  onOpenAiAssistant,
  testingProvider,
  onCollapse,
  onRefreshNews,
  isRefreshingNews,
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
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <Logo size="xs" variant="default" onClick={onOpenAiAssistant} />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-[14px] font-semibold text-[#172554] tracking-tight">Trợ lý StockAI</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#8B36FF] font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  GPT-4o
                </span>
              </div>
              <p className="text-[11px] text-[#647293]">Hỏi đáp, phân tích và tìm cơ hội đầu tư</p>
            </div>
          </div>

          {/* Nút thu nhỏ Cột 3 về bên phải */}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[#647293] hover:text-[#087CFF] hover:bg-[#F0F9FF] border border-[#DCE5FF] hover:border-[#DCE5FF] text-[11px] font-semibold transition-all duration-200 shadow-2xs group"
              title="Thu nhỏ cột 3 về bên phải"
            >
              <span className="text-[10px] text-[#647293] group-hover:text-[#087CFF]">Thu gọn</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#647293] group-hover:text-[#087CFF] group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="my-3 space-y-1.5">
          <p className="text-[12px] text-[#647293] font-medium">Bạn có thể hỏi tôi:</p>
          <div className="space-y-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(p)}
                className="w-full text-left text-[12px] px-3 py-1.5 rounded-xl bg-[#F4F7FF] hover:bg-[#EBF3FF] border border-[#DCE5FF] text-[#172554] hover:text-[#087CFF] transition flex items-center gap-2 group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8] group-hover:bg-[#087CFF] transition"></span>
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Dialogue Display if messages exist */}
        {chatMessages.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2.5 my-2 p-2.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-xs">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-2.5 rounded-xl ${
                  msg.sender === 'user' 
                    ? 'bg-[#EBF3FF] border border-[#DCE5FF] text-[#087CFF] font-medium ml-4' 
                    : 'bg-[#FFFFFF] border border-[#DCE5FF] text-[#172554] mr-2 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-[#647293] mb-1">
                  <span className="font-bold">{msg.sender === 'user' ? 'Bạn' : 'StockAI'}</span>
                  <span>{msg.time}</span>
                </div>
                <div className="whitespace-pre-line leading-relaxed text-[11px]">
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="p-2 text-xs text-[#647293] animate-pulse flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#087CFF]" />
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
            className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-[#172554] placeholder-[#647293] focus:outline-none focus:ring-2 focus:ring-[#087CFF]/20 focus:border-[#087CFF] transition"
          />
          <button
            onClick={() => handleSendPrompt(chatInput)}
            disabled={isAiLoading || !chatInput.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 rounded-lg bg-gradient-to-r from-[#8B36FF] to-[#EF4CBF] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Tin tức nổi bật (CafeF & VnExpress RSS) */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4F7FF]">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Tin tức nổi bật</h4>
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" title="Cập nhật trực tiếp RSS" />
          </div>
          <div className="flex items-center gap-2">
            {onRefreshNews && (
              <button
                onClick={onRefreshNews}
                disabled={isRefreshingNews}
                className="p-1 rounded-lg text-[#647293] hover:text-[#087CFF] hover:bg-[#F0F9FF] transition"
                title="Làm mới tin tức"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNews ? 'animate-spin text-[#087CFF]' : ''}`} />
              </button>
            )}
            <a
              href="https://cafef.vn/thi-truong-chung-khoan.chn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-medium text-[#087CFF] hover:text-[#0066D6] transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="space-y-2.5">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url || (item as any).link || 'https://cafef.vn'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 items-start group cursor-pointer p-2 -mx-2 rounded-xl hover:bg-[#F8FAFC] transition duration-150 block"
              title="Bấm để đọc bài viết gốc"
            >
              <div className={`w-14 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[10px] px-1 text-center leading-tight transition-colors border ${
                item.source.toLowerCase().includes('cafef')
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] group-hover:bg-[#DBEAFE]'
                  : 'bg-[#FDF2F8] border-[#FBCFE8] text-[#BE185D] group-hover:bg-[#FCE7F3]'
              }`}>
                {item.source}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-[13px] font-semibold text-[#172554] group-hover:text-[#087CFF] transition line-clamp-2 leading-snug">
                  {item.title}
                </h5>
                <div className="flex items-center gap-1.5 text-[11px] text-[#647293] mt-1 font-medium">
                  <span>{item.source}</span>
                  <span>•</span>
                  <span>{item.timeAgo}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-[#087CFF] transition-opacity shrink-0 ml-auto" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 3. Kết nối API */}
      <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCE5FF] shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F4F7FF]">
          <h4 className="text-[15px] font-semibold text-[#172554] tracking-tight">Trạng thái Nguồn dữ liệu</h4>
        </div>

        <div className="space-y-2.5">
          {apiProviders.map((provider) => {
            const isConnected = provider.status === 'CONNECTED';
            const isTesting = testingProvider === provider.code;

            return (
              <div 
                key={provider.id} 
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#F4F7FF] border border-[#DCE5FF] text-[13px]"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#172554] text-[13px]">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-[#16A34A]' : 'bg-[#EF4444]'
                    }`}></span>
                    <span className={`text-[11px] font-medium ${
                      isConnected ? 'text-[#16A34A]' : 'text-[#EF4444]'
                    }`}>
                      {isConnected ? 'Đang hoạt động' : 'Chưa kết nối'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onTestApi(provider.code)}
                  disabled={isTesting}
                  className={`px-3 py-1 rounded-lg text-[12px] font-semibold transition flex items-center gap-1 ${
                    provider.code === 'BMSC'
                      ? 'bg-[#EBF3FF] text-[#087CFF] border border-[#DCE5FF] hover:bg-[#DCE5FF]'
                      : 'bg-white text-[#172554] border border-[#DCE5FF] hover:bg-[#F4F7FF]'
                  }`}
                >
                  {isTesting ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-[#087CFF]" />
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
