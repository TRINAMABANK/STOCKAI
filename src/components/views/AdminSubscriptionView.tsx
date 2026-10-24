'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Users, 
  FileText, 
  CreditCard,
  UserCheck,
  UserX,
  Plus,
  ArrowRight,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Settings,
  History,
  Lock,
  QrCode,
  X
} from 'lucide-react';
import { 
  SubscriptionOrder, 
  UserProfile, 
  AdminAuditLog, 
  BankConfig, 
  AdminOverviewKpis, 
  SubscriptionTier,
  OrderStatus 
} from '@/types';
import AdminReconcileModal from '@/components/AdminReconcileModal';
import Logo from '@/components/Logo';

export default function AdminSubscriptionView() {
  const [activeTab, setActiveTab] = useState<'payments' | 'subscribers' | 'bank_config' | 'audit_logs'>('payments');
  const [kpis, setKpis] = useState<AdminOverviewKpis>({
    totalOrders: 0,
    pendingApproval: 0,
    confirmedPaid: 0,
    rejected: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
  });
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [subscribers, setSubscribers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [bankConfig, setBankConfig] = useState<BankConfig>({
    isConfigured: false,
    bankId: 'MB',
    bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
    accountNumber: '',
    accountHolder: '',
    template: 'compact2',
  });

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Reconciliation Modal
  const [selectedOrder, setSelectedOrder] = useState<SubscriptionOrder | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Manual Grant Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantTier, setGrantTier] = useState<SubscriptionTier>('PRO');
  const [grantDuration, setGrantDuration] = useState('30');
  const [grantReason, setGrantReason] = useState('');

  // Revoke Modal
  const [revokeTargetUser, setRevokeTargetUser] = useState<UserProfile | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Bank Form State
  const [bankForm, setBankForm] = useState({
    bankId: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    template: 'compact2',
    isConfigured: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
        tier: tierFilter,
        search: searchTerm,
        page: String(page),
        limit: '15',
      });

      const res = await fetch(`/api/admin/payments?${q.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setKpis(data.data.kpis);
        setOrders(data.data.orders);
        setSubscribers(data.data.subscribers || []);
        setAuditLogs(data.data.auditLogs || []);
        setBankConfig(data.data.bankConfig);
        setTotalPages(data.data.totalPages || 1);
        setTotalCount(data.data.totalCount || 0);

        setBankForm({
          bankId: data.data.bankConfig.bankId || 'MB',
          bankName: data.data.bankConfig.bankName || 'Ngân hàng TMCP Quân Đội (MB Bank)',
          accountNumber: data.data.bankConfig.accountNumber || '',
          accountHolder: data.data.bankConfig.accountHolder || '',
          template: data.data.bankConfig.template || 'compact2',
          isConfigured: data.data.bankConfig.isConfigured,
        });
      } else {
        showToast(`❌ ${data.message || 'Không thể tải dữ liệu quản trị.'}`);
      }
    } catch {
      showToast('❌ Lỗi kết nối máy chủ quản trị.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, tierFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleOpenReconcile = (order: SubscriptionOrder) => {
    setSelectedOrder(order);
    setIsReconcileModalOpen(true);
  };

  // Submit Bank Config
  const handleSaveBankConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BANK_CONFIG',
          ...bankForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Đã lưu cấu hình tài khoản ngân hàng thành công!');
        loadData();
      } else {
        showToast(`❌ ${data.message}`);
      }
    } catch {
      showToast('❌ Lỗi lưu cấu hình ngân hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Manual Grant
  const handleConfirmGrant = async () => {
    if (!grantUserId || !grantReason.trim()) {
      showToast('⚠️ Vui lòng chọn người dùng và nhập lý do cấp quyền.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GRANT_SUBSCRIPTION',
          targetUserId: grantUserId,
          tier: grantTier,
          durationDays: parseInt(grantDuration, 10),
          reason: grantReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ ' + data.message);
        setIsGrantModalOpen(false);
        setGrantReason('');
        loadData();
      } else {
        showToast('❌ ' + data.message);
      }
    } catch {
      showToast('❌ Lỗi kết nối khi cấp quyền.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Revoke
  const handleConfirmRevoke = async () => {
    if (!revokeTargetUser || !revokeReason.trim()) {
      showToast('⚠️ Vui lòng nhập lý do thu hồi quyền.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE_SUBSCRIPTION',
          targetUserId: revokeTargetUser.id,
          reason: revokeReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ ' + data.message);
        setRevokeTargetUser(null);
        setRevokeReason('');
        loadData();
      } else {
        showToast('❌ ' + data.message);
      }
    } catch {
      showToast('❌ Lỗi kết nối khi thu hồi quyền.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#BBF7D0] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
          </span>
        );
      case 'PENDING_CONFIRMATION':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] inline-flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Chờ đối soát
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F4F7FF] text-[#647293] border border-[#DCE5FF] inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Mới tạo (Chờ CK)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF1F2] text-[#EF4444] border border-[#FEE2E2] inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F4F7FF] text-[#647293]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#FFFFFF] border border-[#DCE5FF] shadow-2xl text-[13px] font-semibold text-[#172554] flex items-center gap-2 animate-in slide-in-from-top-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Status with Official Logo */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Logo size="md" variant="default" />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-[24px] lg:text-[26px] font-bold text-[#172554] tracking-tight">
                Quản trị Thuê bao & Đối soát Thanh toán QR
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3FF] text-[#087CFF] text-[11px] font-bold border border-[#DCE5FF] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ADMIN ONLY
              </span>
            </div>
            <p className="text-[13px] text-[#647293] mt-0.5">
              Xác minh chuyển khoản thực tế qua sao kê ngân hàng, đối soát và kích hoạt gói bản quyền StockAI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#DCE5FF] hover:bg-[#F4F7FF] text-[#172554] text-[13px] font-medium flex items-center gap-1.5 transition shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#087CFF]' : ''}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* SECTION A: Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#DCE5FF] shadow-xs">
          <span className="text-[12px] text-[#647293] font-medium block">Tổng đơn hàng</span>
          <h4 className="text-[22px] font-bold text-[#172554] font-mono tabular-nums mt-1">
            {kpis.totalOrders}
          </h4>
          <span className="text-[11px] text-[#647293] mt-0.5 block">Toàn hệ thống</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#FDE68A] shadow-xs bg-linear-to-b from-white to-[#FFFBEB]/40">
          <span className="text-[12px] text-[#D97706] font-semibold block flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Đơn chờ duyệt
          </span>
          <h4 className="text-[22px] font-bold text-[#D97706] font-mono tabular-nums mt-1">
            {kpis.pendingApproval}
          </h4>
          <span className="text-[11px] text-[#B45309] mt-0.5 block">Cần đối soát</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#BBF7D0] shadow-xs bg-linear-to-b from-white to-[#ECFDF5]/40">
          <span className="text-[12px] text-[#16A34A] font-semibold block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
          </span>
          <h4 className="text-[22px] font-bold text-[#16A34A] font-mono tabular-nums mt-1">
            {kpis.confirmedPaid}
          </h4>
          <span className="text-[11px] text-[#15803D] mt-0.5 block">Đã kích hoạt</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#FEE2E2] shadow-xs bg-linear-to-b from-white to-[#FFF1F2]/40">
          <span className="text-[12px] text-[#EF4444] font-semibold block flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Đã từ chối
          </span>
          <h4 className="text-[22px] font-bold text-[#EF4444] font-mono tabular-nums mt-1">
            {kpis.rejected}
          </h4>
          <span className="text-[11px] text-[#DC2626] mt-0.5 block">Không hợp lệ</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#DCE5FF] shadow-xs bg-linear-to-b from-white to-[#EBF3FF]/40">
          <span className="text-[12px] text-[#087CFF] font-semibold block flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Doanh thu thực
          </span>
          <h4 className="text-[20px] font-bold text-[#087CFF] font-mono tabular-nums mt-1">
            {kpis.totalRevenue.toLocaleString('vi-VN')} đ
          </h4>
          <span className="text-[11px] text-[#0066D6] mt-0.5 block">Đã đối soát 100%</span>
        </div>

        <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#E9D5FF] shadow-xs bg-linear-to-b from-white to-[#F3E8FF]/40">
          <span className="text-[12px] text-[#8B36FF] font-semibold block flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Thuê bao hoạt động
          </span>
          <h4 className="text-[22px] font-bold text-[#8B36FF] font-mono tabular-nums mt-1">
            {kpis.activeSubscriptions}
          </h4>
          <span className="text-[11px] text-[#7C3AED] mt-0.5 block">
            {kpis.expiringSubscriptions > 0 ? `⚠️ ${kpis.expiringSubscriptions} sắp hết hạn` : 'Đang hoạt động tốt'}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#DCE5FF] pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-[#087CFF] text-white shadow-xs'
              : 'bg-white text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Danh sách Đơn & Đối soát ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition flex items-center gap-2 ${
            activeTab === 'subscribers'
              ? 'bg-[#087CFF] text-white shadow-xs'
              : 'bg-white text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Quản lý Thuê bao ({subscribers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bank_config')}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition flex items-center gap-2 ${
            activeTab === 'bank_config'
              ? 'bg-[#087CFF] text-white shadow-xs'
              : 'bg-white text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cấu hình Tài khoản Ngân hàng</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition flex items-center gap-2 ${
            activeTab === 'audit_logs'
              ? 'bg-[#087CFF] text-white shadow-xs'
              : 'bg-white text-[#647293] hover:text-[#172554] hover:bg-[#F4F7FF]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Nhật ký Kiểm toán ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Danh sách Đơn hàng & Đối soát */}
      {activeTab === 'payments' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-[#647293] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, email, mã GD ngân hàng..."
                className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl pl-9 pr-3 py-2 text-[13px] text-[#172554] focus:outline-none focus:ring-1 focus:ring-[#087CFF]"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[12px] font-medium text-[#172554] focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING_ALL">Chờ xử lý (Chờ CK + Chờ đối soát)</option>
                <option value="PENDING_CONFIRMATION">Khách đã báo CK (Chờ đối soát)</option>
                <option value="PAID">Đã duyệt (PAID)</option>
                <option value="REJECTED">Đã từ chối</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => {
                  setTierFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[12px] font-medium text-[#172554] focus:outline-none"
              >
                <option value="ALL">Tất cả gói</option>
                <option value="PRO">Gói PRO (199.000 đ)</option>
                <option value="ENTERPRISE">Gói ENTERPRISE (299.000 đ)</option>
                <option value="FREE">Gói FREE</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5FF] text-[12px] font-semibold text-[#647293] bg-[#F4F7FF]">
                  <th className="py-3 px-3">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Gói</th>
                  <th className="py-3 px-3 text-right">Số tiền</th>
                  <th className="py-3 px-3">Nội dung CK</th>
                  <th className="py-3 px-3">Thời gian tạo</th>
                  <th className="py-3 px-3">Báo chuyển</th>
                  <th className="py-3 px-3">Mã GD Ngân hàng</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5FF] text-[13px]">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-[#647293]">
                      Không có đơn hàng nào khớp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F4F7FF]/60 transition">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#172554]">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#172554]">{ord.userName}</div>
                        <div className="text-[11px] text-[#647293]">{ord.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          ord.tier === 'ENTERPRISE' ? 'bg-[#F3E8FF] text-[#8B36FF]' :
                          ord.tier === 'PRO' ? 'bg-[#EBF3FF] text-[#087CFF]' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {ord.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#172554] tabular-nums">
                        {ord.formattedAmount}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[#087CFF] text-[12px]">
                        {ord.transferContent}
                      </td>
                      <td className="py-3.5 px-3 text-[12px] text-[#647293] font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('vi-VN')} {new Date(ord.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-[12px] text-[#647293] font-mono">
                        {ord.customerReportedAt ? (
                          <span className="text-[#D97706] font-medium">
                            {new Date(ord.customerReportedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-[12px]">
                        {ord.bankTransactionRef ? (
                          <span className="font-bold text-[#16A34A]">{ord.bankTransactionRef}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {getStatusBadge(ord.status)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {ord.status !== 'PAID' ? (
                          <button
                            onClick={() => handleOpenReconcile(ord)}
                            className="px-3 py-1.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-medium text-[12px] transition shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Đối soát</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#16A34A] font-semibold">
                            ✓ {ord.reconciledBy?.name || 'Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-3 border-t border-[#DCE5FF] text-[12px] text-[#647293]">
            <span>Hiển thị trang {page} / {totalPages} (Tổng {totalCount} đơn)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-[#DCE5FF] disabled:opacity-30 hover:bg-[#F4F7FF]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-[#DCE5FF] disabled:opacity-30 hover:bg-[#F4F7FF]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Quản lý Thuê bao */}
      {activeTab === 'subscribers' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-[#172554]">Danh sách Người dùng & Thuê bao</h3>
              <p className="text-[12px] text-[#647293]">Theo dõi thời hạn và cấp quyền/gia hạn thủ công có lưu vết</p>
            </div>
            <button
              onClick={() => {
                setGrantUserId(subscribers[0]?.id || '');
                setIsGrantModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-medium text-[13px] flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp quyền thủ công</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5FF] text-[12px] font-semibold text-[#647293] bg-[#F4F7FF]">
                  <th className="py-3 px-3">Họ tên & Email</th>
                  <th className="py-3 px-3">Vai trò</th>
                  <th className="py-3 px-3">Gói hiện tại</th>
                  <th className="py-3 px-3">Ngày hết hạn</th>
                  <th className="py-3 px-3">Tình trạng</th>
                  <th className="py-3 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5FF] text-[13px]">
                {subscribers.map((u) => {
                  const isExpired = u.tier !== 'FREE' && u.validUntil < new Date().toISOString().split('T')[0];
                  return (
                    <tr key={u.id} className="hover:bg-[#F4F7FF]/60 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#172554]">{u.name}</div>
                        <div className="text-[11px] text-[#647293]">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${u.role === 'ADMIN' ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded font-bold text-[11px] ${
                          u.tier === 'ENTERPRISE' ? 'bg-[#F3E8FF] text-[#8B36FF]' :
                          u.tier === 'PRO' ? 'bg-[#EBF3FF] text-[#087CFF]' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-medium text-[#172554]">
                        {u.validUntil}
                      </td>
                      <td className="py-3.5 px-3">
                        {isExpired ? (
                          <span className="text-[11px] text-[#EF4444] font-bold">Hết hạn</span>
                        ) : u.tier === 'FREE' ? (
                          <span className="text-[11px] text-[#647293]">Miễn phí</span>
                        ) : (
                          <span className="text-[11px] text-[#16A34A] font-bold">Đang hiệu lực</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setGrantUserId(u.id);
                            setGrantTier(u.tier === 'FREE' ? 'PRO' : u.tier);
                            setIsGrantModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#DCE5FF] hover:bg-[#F4F7FF] text-[#087CFF] font-medium text-[11px] transition"
                        >
                          Gia hạn/Cấp gói
                        </button>
                        {u.tier !== 'FREE' && (
                          <button
                            onClick={() => {
                              setRevokeTargetUser(u);
                              setRevokeReason('Thu hồi quyền theo yêu cầu quản trị.');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[#FEE2E2] hover:bg-[#FFF1F2] text-[#EF4444] font-medium text-[11px] transition"
                          >
                            Thu hồi
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Cấu hình Tài khoản Ngân hàng */}
      {activeTab === 'bank_config' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs p-5 max-w-2xl space-y-5">
          <div>
            <h3 className="font-semibold text-[15px] text-[#172554] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#087CFF]" />
              <span>Cấu hình Tài khoản Ngân hàng Nhận tiền VietQR</span>
            </h3>
            <p className="text-[13px] text-[#647293] mt-1">
              Thông tin tài khoản chính thức của chủ sở hữu StockAI để sinh mã QR VietQR chuẩn cho khách hàng
            </p>
          </div>

          <form onSubmit={handleSaveBankConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Mã Ngân hàng (VietQR Bank ID) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={bankForm.bankId}
                  onChange={(e) => setBankForm(prev => ({ ...prev, bankId: e.target.value.toUpperCase() }))}
                  placeholder="VD: MB, VCB, TCB, ACB, OCB..."
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] font-mono font-bold text-[#172554]"
                  required
                />
                <p className="text-[11px] text-[#647293] mt-1">Theo mã chuẩn VietQR (MB, VCB, TCB...)</p>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Tên đầy đủ Ngân hàng
                </label>
                <input
                  type="text"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                  placeholder="VD: Ngân hàng TMCP Quân Đội"
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] text-[#172554]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Số tài khoản nhận tiền <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value.trim() }))}
                  placeholder="Nhập số tài khoản ngân hàng thật..."
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[14px] font-mono font-bold text-[#172554]"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Tên chủ tài khoản (In hoa không dấu) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={bankForm.accountHolder}
                  onChange={(e) => setBankForm(prev => ({ ...prev, accountHolder: e.target.value.toUpperCase() }))}
                  placeholder="VD: LE TRI ANH"
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl px-3 py-2 text-[13px] font-bold text-[#172554]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankForm.isConfigured}
                  onChange={(e) => setBankForm(prev => ({ ...prev, isConfigured: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
              </label>
              <span className="text-[13px] font-medium text-[#172554]">
                Kích hoạt hiển thị VietQR tự động cho khách hàng
              </span>
            </div>

            <div className="pt-3 border-t border-[#DCE5FF] flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] text-white font-medium text-[13px] transition flex items-center gap-2 shadow-xs"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Lưu cấu hình ngân hàng</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Nhật ký Kiểm toán */}
      {activeTab === 'audit_logs' && (
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-xs p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-[15px] text-[#172554]">Nhật ký Kiểm toán Hoạt động Quản trị (Audit Trail)</h3>
            <p className="text-[12px] text-[#647293]">Ghi vết toàn bộ hành vi duyệt thanh toán, từ chối, cấp quyền và đổi cấu hình</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5FF] text-[12px] font-semibold text-[#647293] bg-[#F4F7FF]">
                  <th className="py-3 px-3">Thời gian</th>
                  <th className="py-3 px-3">Người thực hiện</th>
                  <th className="py-3 px-3">Hành động</th>
                  <th className="py-3 px-3">Mã đơn / Tài khoản mục tiêu</th>
                  <th className="py-3 px-3">Chi tiết & Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE5FF] text-[12px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#647293]">
                      Chưa có nhật ký kiểm toán nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F4F7FF]/60 transition">
                      <td className="py-3 px-3 font-mono text-[#647293]">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#172554]">{log.performedBy?.email || 'Admin'}</span>
                        <span className="text-[10px] text-[#647293] block">({log.performedBy?.role || 'ADMIN'})</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          log.action === 'VERIFY_PAYMENT' ? 'bg-[#ECFDF5] text-[#16A34A]' :
                          log.action === 'REJECT_PAYMENT' ? 'bg-[#FFF1F2] text-[#EF4444]' :
                          log.action === 'MANUAL_GRANT' ? 'bg-[#EBF3FF] text-[#087CFF]' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {log.orderCode ? (
                          <span className="font-bold text-[#172554]">{log.orderCode}</span>
                        ) : (
                          <span className="text-[#647293]">{log.targetUserEmail || log.targetUserId}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#647293] max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      <AdminReconcileModal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        order={selectedOrder}
        onSuccess={(msg) => {
          showToast('✅ ' + msg);
          loadData();
        }}
      />

      {/* Manual Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172554]/60 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE5FF] pb-3">
              <h3 className="font-bold text-[16px] text-[#172554] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#087CFF]" />
                <span>Cấp quyền Thuê bao Thủ công</span>
              </h3>
              <button onClick={() => setIsGrantModalOpen(false)} className="text-[#647293] hover:text-[#172554]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">Chọn người dùng:</label>
                <select
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2.5 text-[13px] font-medium text-[#172554]"
                >
                  {subscribers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} - {u.email} (Hiện tại: {u.tier})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">Gói cấp:</label>
                <select
                  value={grantTier}
                  onChange={(e) => setGrantTier(e.target.value as SubscriptionTier)}
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2.5 text-[13px] font-medium text-[#172554]"
                >
                  <option value="PRO">PRO (Chuyên nghiệp)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Nâng cao)</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">Thời hạn cấp:</label>
                <select
                  value={grantDuration}
                  onChange={(e) => setGrantDuration(e.target.value)}
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2.5 text-[13px] font-medium text-[#172554]"
                >
                  <option value="7">7 ngày (Trải nghiệm)</option>
                  <option value="30">30 ngày (1 tháng)</option>
                  <option value="90">90 ngày (3 tháng)</option>
                  <option value="365">365 ngày (1 năm)</option>
                </select>
              </div>

              <div>
                <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                  Lý do cấp quyền (bắt buộc lưu vết): <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="VD: Khách hàng VIP, Chuyển khoản trực tiếp qua phòng giao dịch..."
                  className="w-full bg-[#F4F7FF] border border-[#DCE5FF] rounded-xl p-2.5 text-[13px] text-[#172554]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5FF]">
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#DCE5FF] text-[13px] font-medium text-[#172554]"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmGrant}
                disabled={isLoading || !grantReason.trim()}
                className="px-5 py-2 rounded-xl bg-[#087CFF] hover:bg-[#0066D6] disabled:opacity-40 text-white font-medium text-[13px]"
              >
                Xác nhận cấp quyền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#172554]/60 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCE5FF] shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCE5FF] pb-3">
              <h3 className="font-bold text-[16px] text-[#EF4444] flex items-center gap-2">
                <UserX className="w-5 h-5 text-[#EF4444]" />
                <span>Xác nhận Thu hồi Quyền Thuê bao</span>
              </h3>
              <button onClick={() => setRevokeTargetUser(null)} className="text-[#647293] hover:text-[#172554]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#172554]">
              Bạn đang thu hồi quyền gói <strong>{revokeTargetUser.tier}</strong> của người dùng{' '}
              <strong>{revokeTargetUser.name}</strong> ({revokeTargetUser.email}). Tài khoản sẽ bị chuyển về gói Miễn Phí (FREE).
            </p>

            <div>
              <label className="text-[12px] font-semibold text-[#172554] block mb-1">
                Lý do thu hồi (bắt buộc): <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="VD: Hết hạn dùng thử, vi phạm điều khoản..."
                className="w-full bg-[#F4F7FF] border border-[#FEE2E2] rounded-xl p-2.5 text-[13px] text-[#172554]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE5FF]">
              <button
                onClick={() => setRevokeTargetUser(null)}
                className="px-4 py-2 rounded-xl border border-[#DCE5FF] text-[13px] font-medium text-[#172554]"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={isLoading || !revokeReason.trim()}
                className="px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 text-white font-medium text-[13px]"
              >
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
