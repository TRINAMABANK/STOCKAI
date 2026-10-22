'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  CreditCard, 
  Layers, 
  FileText, 
  Settings, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Crown, 
  Clock, 
  DollarSign, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info,
  Calendar,
  AlertCircle,
  Key,
  Database,
  Eye,
  EyeOff,
  Trash2,
  Zap
} from 'lucide-react';
import { 
  SubscriptionOrder, 
  UserProfile, 
  SubscriptionTier, 
  BankConfig, 
  AdminAuditLog,
  SsiConfig,
  ApiProvider,
  ApiConnectionStatus
} from '@/types';
import { PlanConfig } from '@/lib/pricing';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import AdminChangePasswordModal from '@/components/admin/AdminChangePasswordModal';
import { LogOut, KeyRound, UserCheck } from 'lucide-react';

export type AdminTab = 
  | 'overview' 
  | 'users' 
  | 'orders' 
  | 'subscriptions' 
  | 'plans' 
  | 'api-center'
  | 'signals-alerts'
  | 'audit-logs' 
  | 'system';

export default function AdminPage() {
  // --- HỆ THỐNG XÁC THỰC QUẢN TRỊ VIÊN ---
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [adminProfile, setAdminProfile] = useState<{ id: string; username: string; email: string; name: string; role: string } | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const checkAdminAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/admin/auth-check');
      const json = await res.json();
      if (json.authenticated) {
        setIsAuthenticated(true);
        setMustChangePassword(json.mustChangePassword ?? false);
        setAdminProfile(json.user);
        loadOverview();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setAdminProfile(null);
    showToast('👋 Đã đăng xuất khỏi tài khoản Quản trị.');
  };

  const handleLoginSuccess = (user: any, mustChange: boolean) => {
    setIsAuthenticated(true);
    setAdminProfile(user);
    setMustChangePassword(mustChange);
    loadOverview();
    showToast('✅ Đăng nhập Quản trị viên thành công!');
  };

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. DATA STATE: OVERVIEW
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  const loadOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      if (json.success) {
        setOverviewData(json.data);
      }
    } catch {
      showToast('❌ Lỗi tải tổng quan Admin');
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // 2. DATA STATE: USERS
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userTierFilter, setUserTierFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}&tier=${userTierFilter}&status=${userStatusFilter}`);
      const json = await res.json();
      if (json.success && json.data) {
        setUsersList(json.data.users || []);
      }
    } catch {
      showToast('❌ Lỗi tải danh sách người dùng');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // 3. DATA STATE: ORDERS
  const [ordersList, setOrdersList] = useState<SubscriptionOrder[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const loadOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/orders?q=${encodeURIComponent(orderSearch)}&status=${orderStatusFilter}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrdersList(json.data.orders || []);
      }
    } catch {
      showToast('❌ Lỗi tải danh sách đơn hàng');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // 4. DATA STATE: PLANS
  const [plansList, setPlansList] = useState<PlanConfig[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch('/api/admin/plans');
      const json = await res.json();
      if (json.success && json.data) {
        setPlansList(json.data.plans || []);
      }
    } catch {
      showToast('❌ Lỗi tải cấu hình gói dịch vụ');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // 5. DATA STATE: AUDIT LOGS
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?q=${encodeURIComponent(logSearch)}&action=${logActionFilter}`);
      const json = await res.json();
      if (json.success && json.data) {
        setAuditLogs(json.data.logs || []);
      }
    } catch {
      showToast('❌ Lỗi tải nhật ký kiểm toán');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // 6. DATA STATE: SYSTEM
  const [systemData, setSystemData] = useState<any>(null);
  const [isLoadingSystem, setIsLoadingSystem] = useState(false);

  const loadSystem = async () => {
    setIsLoadingSystem(true);
    try {
      const res = await fetch('/api/admin/system');
      const json = await res.json();
      if (json.success) {
        setSystemData(json.data);
      }
    } catch {
      showToast('❌ Lỗi tải trạng thái hệ thống');
    } finally {
      setIsLoadingSystem(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadOverview();
  }, []);

  // Sync tab loading
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'users' || activeTab === 'subscriptions') loadUsers();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'plans') loadPlans();
    if (activeTab === 'api-center') loadApiCenter();
    if (activeTab === 'audit-logs') loadAuditLogs();
    if (activeTab === 'system') loadSystem();
  }, [activeTab]);


  // 8. DATA STATE: QUẢN TRỊ TÍN HIỆU & CẢNH BÁO THỊ TRƯỜNG
  const [signalsAlertsData, setSignalsAlertsData] = useState<{
    signals: any[];
    alerts: any[];
    stats: any;
  } | null>(null);
  const [isLoadingSignalsAlerts, setIsLoadingSignalsAlerts] = useState(false);
  const [signalsSubTab, setSignalsSubTab] = useState<'signals' | 'alerts'>('signals');
  const [signalsSearch, setSignalsSearch] = useState('');
  const [signalsExchangeFilter, setSignalsExchangeFilter] = useState('ALL');

  const loadSignalsAlerts = async () => {
    setIsLoadingSignalsAlerts(true);
    try {
      const params = new URLSearchParams();
      if (signalsSearch) params.append('q', signalsSearch);
      if (signalsExchangeFilter !== 'ALL') params.append('exchange', signalsExchangeFilter);
      const res = await fetch(`/api/admin/signals-alerts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSignalsAlertsData(json.data);
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi tải dữ liệu tín hiệu & cảnh báo');
    } finally {
      setIsLoadingSignalsAlerts(false);
    }
  };

  const handleDismissAlert = async (alertId: string, symbol: string) => {
    const reason = prompt(`Nhập lý do đóng/hủy cảnh báo cho mã ${symbol}:`, 'Không còn hiệu lực thị trường');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/signals-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DISMISS_ALERT', id: alertId, reason }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ ${json.message}`);
        loadSignalsAlerts();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi khi đóng cảnh báo');
    }
  };

  // 7. DATA STATE: API CENTER (SSI FASTCONNECT & DATA PROVIDERS)
  const [apiCenterData, setApiCenterData] = useState<{
    ssi_config?: SsiConfig;
    providers?: ApiProvider[];
    logs?: any[];
    activeProvider?: string;
  } | null>(null);
  const [isLoadingApiCenter, setIsLoadingApiCenter] = useState(false);
  const [isTestingSsi, setIsTestingSsi] = useState(false);
  const [isSyncingSsi, setIsSyncingSsi] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [formConsumerId, setFormConsumerId] = useState('');
  const [formConsumerSecret, setFormConsumerSecret] = useState('');
  const [formPrivateKey, setFormPrivateKey] = useState('');
  const [formApiUrl, setFormApiUrl] = useState('https://fc-data.ssi.com.vn/api/v2');
  const [formStreamingUrl, setFormStreamingUrl] = useState('wss://fc-data.ssi.com.vn/v2.0/signalr');
  const [formAutoSync, setFormAutoSync] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [apiLogFilter, setApiLogFilter] = useState('ALL');

  const loadApiCenter = async () => {
    setIsLoadingApiCenter(true);
    try {
      const res = await fetch('/api/api-center');
      const json = await res.json();
      if (json.success && json.data) {
        setApiCenterData(json.data);
        if (json.data.ssi_config) {
          setFormConsumerId(json.data.ssi_config.consumerId || '');
          setFormApiUrl(json.data.ssi_config.apiUrl || 'https://fc-data.ssi.com.vn/api/v2');
          setFormStreamingUrl(json.data.ssi_config.streamingUrl || 'wss://fc-data.ssi.com.vn/v2.0/signalr');
          setFormAutoSync(json.data.ssi_config.autoSync ?? true);
        }
      }
    } catch {
      showToast('❌ Lỗi tải dữ liệu Trung tâm API');
    } finally {
      setIsLoadingApiCenter(false);
    }
  };

  const handleSaveSsiConfig = async () => {
    if (!formConsumerId.trim()) {
      showToast('❌ Vui lòng nhập Consumer ID');
      return;
    }
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SSI_CONFIG',
          consumerId: formConsumerId.trim(),
          consumerSecret: formConsumerSecret.trim(),
          privateKey: formPrivateKey.trim(),
          apiUrl: formApiUrl.trim(),
          streamingUrl: formStreamingUrl.trim(),
          autoSync: formAutoSync,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('✅ Đã lưu cấu hình SSI FastConnect Data thành công');
        setIsConfigModalOpen(false);
        setFormConsumerSecret('');
        loadApiCenter();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi lưu cấu hình SSI');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleTestSsi = async () => {
    setIsTestingSsi(true);
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEST_CONNECTION',
          providerCode: 'SSI',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ ${json.data?.message || 'Kết nối SSI FastConnect thành công'}`);
      } else {
        showToast(`❌ ${json.data?.message || json.message || 'Kết nối SSI thất bại'}`);
      }
      loadApiCenter();
    } catch {
      showToast('❌ Lỗi kiểm tra kết nối SSI');
    } finally {
      setIsTestingSsi(false);
    }
  };

  const handleSyncSsi = async () => {
    setIsSyncingSsi(true);
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_DATA' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`⚡ ${json.message}`);
      } else {
        showToast(`❌ ${json.message}`);
      }
      loadApiCenter();
      loadOverview();
    } catch {
      showToast('❌ Lỗi đồng bộ dữ liệu SSI');
    } finally {
      setIsSyncingSsi(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/api-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_LOGS' }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('🗑️ Đã xóa toàn bộ nhật ký đồng bộ');
        loadApiCenter();
      }
    } catch {
      showToast('❌ Lỗi xóa nhật ký');
    }
  };

  // Search debounce / trigger
  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [userSearch, userTierFilter, userStatusFilter]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
  }, [orderSearch, orderStatusFilter]);

  useEffect(() => {
    if (activeTab === 'audit-logs') loadAuditLogs();
  }, [logSearch, logActionFilter]);

  // MODAL STATES
  const [selectedUserForAction, setSelectedUserForAction] = useState<any>(null);
  const [lockModalReason, setLockModalReason] = useState('');
  const [isLocking, setIsLocking] = useState(false);

  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState<SubscriptionOrder | null>(null);
  const [verifyAmount, setVerifyAmount] = useState<number>(0);
  const [verifyRef, setVerifyRef] = useState<string>('');
  const [verifyNotes, setVerifyNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [selectedOrderForReject, setSelectedOrderForReject] = useState<SubscriptionOrder | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState(false);

  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<PlanConfig | null>(null);
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [planDuration, setPlanDuration] = useState<number>(30);
  const [planDesc, setPlanDesc] = useState<string>('');
  const [planReason, setPlanReason] = useState<string>('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const [selectedUserForTierAdjust, setSelectedUserForTierAdjust] = useState<any>(null);
  const [adjustTier, setAdjustTier] = useState<SubscriptionTier>('PRO');
  const [adjustDays, setAdjustDays] = useState<number>(30);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isAdjustingTier, setIsAdjustingTier] = useState(false);

  // ACTION HANDLERS
  const handleLockUser = async () => {
    if (!selectedUserForAction || !lockModalReason.trim()) return;
    setIsLocking(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK_USER',
          userId: selectedUserForAction.id,
          reason: lockModalReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🔒 ${json.message}`);
        setSelectedUserForAction(null);
        setLockModalReason('');
        loadUsers();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi thao tác khóa tài khoản');
    } finally {
      setIsLocking(false);
    }
  };

  const handleUnlockUser = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNLOCK_USER',
          userId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`🔓 ${json.message}`);
        loadUsers();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi thao tác mở khóa');
    }
  };

  const handleAdjustTier = async () => {
    if (!selectedUserForTierAdjust) return;
    setIsAdjustingTier(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_TIER',
          userId: selectedUserForTierAdjust.id,
          tier: adjustTier,
          durationDays: adjustDays,
          reason: adjustReason.trim() || 'Admin cấp quyền thủ công',
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`👑 ${json.message}`);
        setSelectedUserForTierAdjust(null);
        setAdjustReason('');
        loadUsers();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi cấp quyền');
    } finally {
      setIsAdjustingTier(false);
    }
  };

  const handleVerifyOrder = async () => {
    if (!selectedOrderForVerify) return;
    setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_PAYMENT',
          orderId: selectedOrderForVerify.id,
          actualAmount: verifyAmount,
          bankTransactionRef: verifyRef.trim(),
          notes: verifyNotes.trim(),
          transactionTime: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ ${json.message}`);
        setSelectedOrderForVerify(null);
        setVerifyRef('');
        setVerifyNotes('');
        loadOrders();
        loadOverview();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi đối soát đơn hàng');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrderForReject || !rejectReason.trim()) return;
    setIsRejecting(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_PAYMENT',
          orderId: selectedOrderForReject.id,
          reason: rejectReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`⚠️ ${json.message}`);
        setSelectedOrderForReject(null);
        setRejectReason('');
        loadOrders();
        loadOverview();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi từ chối đơn hàng');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlanForEdit || !planReason.trim()) return;
    setIsUpdatingPlan(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PLAN',
          tier: selectedPlanForEdit.tier,
          price: planPrice,
          durationDays: planDuration,
          desc: planDesc,
          reason: planReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`✅ ${json.message}`);
        setSelectedPlanForEdit(null);
        setPlanReason('');
        loadPlans();
      } else {
        showToast(`❌ ${json.message}`);
      }
    } catch {
      showToast('❌ Lỗi cập nhật giá gói');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan KPI', icon: LayoutDashboard },
    { id: 'users', label: 'Quản lý Người dùng', icon: Users },
    { id: 'orders', label: 'Đơn hàng & Pay2S', icon: ShoppingBag },
    { id: 'subscriptions', label: 'Quản lý Thuê bao', icon: Crown },
    { id: 'plans', label: 'Gói dịch vụ SaaS', icon: Layers },
    { id: 'api-center', label: 'Trung tâm API (SSI)', icon: Radio },
    { id: 'audit-logs', label: 'Nhật ký Kiểm toán', icon: FileText },
    { id: 'system', label: 'Cấu hình & Tích hợp', icon: Settings },
  ];

  const kpis = overviewData?.kpis || {
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    newUsersLast7Days: 0,
    confirmedRevenue: 0,
    formattedRevenue: '0 đ',
    pendingOrders: 0,
    needsReconciliation: 0,
    failedTransactions: 0,
    successTransactions: 0,
  };

  return (
    <div className="flex-1 flex w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#E2E8F0] text-xs font-semibold animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Admin Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] p-4 flex flex-col justify-between shrink-0 hidden lg:flex select-none">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
            Menu Quản Trị Hệ Thống
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-200 ease-out text-left select-none ${
                  isActive
                    ? 'bg-[#008FD3] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FC]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.id === 'orders' && kpis.needsReconciliation > 0 && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white text-[#008FD3]' : 'bg-[#FFE4E6] text-[#F43F5E]'}`}>
                    {kpis.needsReconciliation}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Server & Security Status Box */}
        <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E2E8F0] text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-bold text-[#172033] text-[12px]">Hệ thống An toàn</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Phân quyền RBAC Backend • Xác thực HMAC Session • Lưu vết toàn bộ Audit Logs
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 min-w-0">
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Tổng quan Quản trị StockAI</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Số liệu thực tế trích xuất trực tiếp từ cơ sở dữ liệu hệ thống</p>
              </div>
              <button
                onClick={loadOverview}
                disabled={isLoadingOverview}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOverview ? 'animate-spin' : ''}`} />
                <span>Làm mới dữ liệu</span>
              </button>
            </div>

            {/* 6 Core KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Tổng người dùng</span>
                <span className="text-xl font-bold text-[#172033] font-mono tabular-nums block">{kpis.totalUsers}</span>
                <span className="text-[10px] text-[#10B981] font-semibold">+{kpis.newUsersLast7Days} trong 7 ngày</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Thuê bao hoạt động</span>
                <span className="text-xl font-bold text-[#008FD3] font-mono tabular-nums block">{kpis.activeSubscriptions}</span>
                <span className="text-[10px] text-[#64748B]">Gói Pro & Enterprise</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Thuê bao hết hạn</span>
                <span className="text-xl font-bold text-[#F43F5E] font-mono tabular-nums block">{kpis.expiredSubscriptions}</span>
                <span className="text-[10px] text-[#64748B]">Cần gửi nhắc gia hạn</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Doanh thu xác nhận</span>
                <span className="text-xl font-bold text-[#10B981] font-mono tabular-nums block truncate" title={kpis.formattedRevenue}>
                  {kpis.formattedRevenue}
                </span>
                <span className="text-[10px] text-[#10B981] font-semibold">{kpis.successTransactions} đơn đã khớp</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Chờ đối soát</span>
                <span className="text-xl font-bold text-[#D97706] font-mono tabular-nums block">{kpis.needsReconciliation}</span>
                <span className="text-[10px] text-[#D97706] font-semibold">Khách báo đã chuyển</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1 card-hover-smooth">
                <span className="text-[11px] text-[#64748B] font-medium block">Đơn chờ thanh toán</span>
                <span className="text-xl font-bold text-[#64748B] font-mono tabular-nums block">{kpis.pendingOrders}</span>
                <span className="text-[10px] text-[#64748B]">Trong hạn 15 phút</span>
              </div>
            </div>


            {/* Subscription Tier Breakdown & Signal KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#64748B] uppercase font-bold">Gói Free (0đ)</span>
                <div className="text-lg font-bold text-[#172033] font-mono tabular-nums">{kpis.freeUsers || 0} user</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#008FD3] uppercase font-bold">Gói Pro (199k)</span>
                <div className="text-lg font-bold text-[#008FD3] font-mono tabular-nums">{kpis.proUsers || 0} user</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#9333EA] uppercase font-bold">Enterprise (299k)</span>
                <div className="text-lg font-bold text-[#9333EA] font-mono tabular-nums">{kpis.enterpriseUsers || 0} user</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#059669] uppercase font-bold">Tín hiệu T+3 sẵn có</span>
                <div className="text-lg font-bold text-[#059669] font-mono tabular-nums">{kpis.t3SignalsCount || 0} mã</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#D97706] uppercase font-bold">Cảnh báo thị trường</span>
                <div className="text-lg font-bold text-[#D97706] font-mono tabular-nums">{kpis.marketAlertsCount || 0} sự kiện</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-0.5">
                <span className="text-[10px] text-[#EF4444] uppercase font-bold">Lỗi hệ thống</span>
                <div className="text-lg font-bold text-[#EF4444] font-mono tabular-nums">{kpis.systemErrorsCount || 0} lỗi</div>
              </div>
            </div>

            {/* Middle Grid: Recent Orders & System Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Recent Orders Queue */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#008FD3]" />
                    <h3 className="text-sm font-bold text-[#172033]">Giao dịch đơn hàng gần đây</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-semibold text-[#008FD3] hover:underline"
                  >
                    Xem tất cả &rarr;
                  </button>
                </div>

                {overviewData?.recentOrders?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#64748B]">Chưa có đơn hàng nào phát sinh</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {overviewData?.recentOrders?.map((ord: SubscriptionOrder) => (
                      <div key={ord.id} className="p-3.5 px-4 flex items-center justify-between hover:bg-[#F8FAFC] transition text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#172033] font-mono">{ord.orderCode}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-[#E0F2FE] text-[#008FD3]">
                              {ord.tier}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#64748B] block mt-0.5">{ord.userEmail}</span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-[#172033] font-mono block">{ord.formattedAmount}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                            ord.status === 'PAID' 
                              ? 'bg-[#D1FAE5] text-[#10B981]' 
                              : ord.status === 'PENDING_CONFIRMATION' 
                              ? 'bg-[#FEF3C7] text-[#D97706]' 
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}>
                            {ord.status === 'PAID' ? 'ĐÃ DUYỆT' : ord.status === 'PENDING_CONFIRMATION' ? 'CHỜ DUYỆT' : ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Integration & System Health */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#008FD3]" />
                      <h3 className="text-sm font-bold text-[#172033]">Trạng thái kết nối dịch vụ</h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('system')}
                      className="text-xs font-semibold text-[#008FD3] hover:underline"
                    >
                      Cấu hình
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
                      <div>
                        <span className="font-bold text-[#172033] block">SSI FastConnect API</span>
                        <span className="text-[11px] text-[#64748B]">Chứng khoán SSI • Độ trễ: {overviewData?.systemHealth?.ssi?.responseTimeMs || 24}ms</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-[10px]">
                        HOẠT ĐỘNG
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
                      <div>
                        <span className="font-bold text-[#172033] block">Cổng thanh toán Pay2S</span>
                        <span className="text-[11px] text-[#64748B]">Webhook IPN: {overviewData?.systemHealth?.pay2s?.webhookStatus || 'ACTIVE'}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-[10px]">
                        SẴN SÀNG
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0]">
                      <div>
                        <span className="font-bold text-[#172033] block">VietQR Ngân hàng ({overviewData?.systemHealth?.bankConfig?.bankName})</span>
                        <span className="text-[11px] text-[#64748B]">Số tài khoản: {overviewData?.systemHealth?.bankConfig?.accountNumber}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-[10px]">
                        CHÍNH THỨC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit quick link */}
                <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#172033] block">Nhật ký kiểm toán hệ thống</span>
                    <span className="text-[#64748B] text-[11px]">Ghi nhận toàn bộ thao tác duyệt tiền và điều chỉnh gói</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('audit-logs')}
                    className="px-3 py-1.5 rounded-xl bg-[#E0F2FE] text-[#008FD3] font-bold hover:bg-[#BAE6FD] transition"
                  >
                    Xem Log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Quản lý Người dùng & Khách hàng</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Tra cứu danh tính, lịch sử thuê bao, trạng thái tài khoản và phân quyền</p>
              </div>

              <button
                onClick={loadUsers}
                disabled={isLoadingUsers}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo tên, email, ID..."
                    className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value)}
                  className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-semibold text-[#172033]"
                >
                  <option value="ALL">Tất cả gói</option>
                  <option value="FREE">Gói Miễn Phí (Free)</option>
                  <option value="PRO">Gói Chuyên Nghiệp (Pro)</option>
                  <option value="ENTERPRISE">Gói Nâng Cao (Enterprise)</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-semibold text-[#172033]"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="LOCKED">Đã bị khóa</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 font-medium text-left">Họ tên / Email</th>
                      <th className="py-3 px-3 font-medium text-left">Vai trò</th>
                      <th className="py-3 px-3 font-medium text-left">Gói hiện tại</th>
                      <th className="py-3 px-3 font-medium text-left">Thời hạn thuê bao</th>
                      <th className="py-3 px-3 font-medium text-right">Tổng chi tiêu</th>
                      <th className="py-3 px-3 font-medium text-center">Trạng thái</th>
                      <th className="py-3 px-4 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#64748B]">
                          Không tìm thấy người dùng nào phù hợp với bộ lọc
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-[#F8FAFC] transition h-[44px]">
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-[#172033] block">{u.name}</span>
                            <span className="text-xs text-[#64748B] font-mono">{u.email}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN' ? 'bg-[#FFE4E6] text-[#F43F5E]' : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-xs text-[#008FD3]">{u.tier}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-[#172033]">
                            {u.validUntil || 'Vô hạn'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-[#172033]">
                            {u.formattedSpent}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {u.isLocked ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#F43F5E] font-bold text-[10px]" title={u.lockedReason}>
                                ĐÃ KHÓA
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-[10px]">
                                HOẠT ĐỘNG
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Adjust Tier Button */}
                              <button
                                onClick={() => {
                                  setSelectedUserForTierAdjust(u);
                                  setAdjustTier(u.tier || 'PRO');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#008FD3] text-xs font-semibold transition"
                                title="Cấp hoặc gia hạn gói"
                              >
                                Cấp gói
                              </button>

                              {/* Lock / Unlock Button */}
                              {u.isLocked ? (
                                <button
                                  onClick={() => handleUnlockUser(u.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#D1FAE5] hover:bg-[#A7F3D0] text-[#10B981] text-xs font-semibold transition"
                                >
                                  Mở khóa
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedUserForAction(u);
                                    setLockModalReason('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#F43F5E] text-xs font-semibold transition"
                                >
                                  Khóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS & PAY2S MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Quản lý Đơn hàng & Đối soát Pay2S</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Tra cứu đơn hàng, xác minh mã giao dịch ngân hàng/Pay2S và xử lý ngoại lệ</p>
              </div>

              <button
                onClick={loadOrders}
                disabled={isLoadingOrders}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Tra cứu mã đơn (VD: STOCKAI-...), email, mã GD Pay2S..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-semibold text-[#172033]"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING_CONFIRMATION">Chờ đối soát (Khách báo đã chuyển)</option>
                  <option value="PENDING">Chờ thanh toán (Trong hạn)</option>
                  <option value="PAID">Đã kích hoạt (Thành công)</option>
                  <option value="REJECTED">Đã từ chối</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 font-medium text-left">Mã đơn hàng</th>
                      <th className="py-3 px-3 font-medium text-left">Khách hàng</th>
                      <th className="py-3 px-3 font-medium text-left">Gói</th>
                      <th className="py-3 px-3 font-medium text-right">Số tiền</th>
                      <th className="py-3 px-3 font-medium text-left">Cổng / Mã GD</th>
                      <th className="py-3 px-3 font-medium text-center">Trạng thái</th>
                      <th className="py-3 px-4 font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {ordersList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs text-[#64748B]">
                          Không có đơn hàng nào khớp điều kiện tra cứu
                        </td>
                      </tr>
                    ) : (
                      ordersList.map((ord) => {
                        const isPendingConfirm = ord.status === 'PENDING_CONFIRMATION';
                        const isPaid = ord.status === 'PAID';
                        return (
                          <tr key={ord.id} className="hover:bg-[#F8FAFC] transition h-[44px]">
                            <td className="py-2.5 px-4 font-bold text-[#172033] font-mono text-xs">
                              {ord.orderCode}
                              <span className="block text-[10px] text-[#94A3B8] font-normal">
                                {new Date(ord.createdAt).toLocaleString('vi-VN')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-xs text-[#172033] block">{ord.userName}</span>
                              <span className="text-[11px] text-[#64748B] block truncate max-w-[180px]">{ord.userEmail}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-semibold text-xs text-[#008FD3]">{ord.tier}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-xs font-mono text-[#172033]">
                              {ord.formattedAmount}
                            </td>
                            <td className="py-2.5 px-3 text-xs">
                              <span className="text-[11px] font-semibold text-[#172033] block">
                                {ord.paymentGateway || 'VietQR'}
                              </span>
                              <span className="text-[10px] text-[#64748B] font-mono truncate max-w-[130px] block">
                                {ord.pay2sTransactionId || ord.bankTransactionRef || '-'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isPaid 
                                  ? 'bg-[#D1FAE5] text-[#10B981]' 
                                  : isPendingConfirm 
                                  ? 'bg-[#FEF3C7] text-[#D97706]' 
                                  : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}>
                                {isPaid ? 'ĐÃ DUYỆT' : isPendingConfirm ? 'CHỜ ĐỐI SOÁT' : ord.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isPaid ? (
                                <span className="text-xs text-[#10B981] font-semibold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Đã kích hoạt</span>
                                </span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForVerify(ord);
                                      setVerifyAmount(ord.amount);
                                      setVerifyRef(ord.bankTransactionRef || ord.pay2sTransactionId || `BANK_REF_${Date.now()}`);
                                      setVerifyNotes(`Duyệt kích hoạt đơn ${ord.orderCode}`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#008FD3] hover:bg-[#007bb8] text-white text-xs font-semibold transition shadow-2xs"
                                  >
                                    Đối soát & Duyệt
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrderForReject(ord);
                                      setRejectReason('');
                                    }}
                                    className="px-2 py-1 rounded-lg bg-[#FFE4E6] hover:bg-[#FECDD3] text-[#F43F5E] text-xs font-semibold transition"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUBSCRIPTIONS MANAGEMENT */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Quản lý Thuê bao Đang Hoạt động</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Giám sát chu kỳ thuê bao, gia hạn thủ công và xử lý ngoại lệ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-xs text-[#64748B]">Thuê bao đang hiệu lực</span>
                <span className="text-2xl font-bold text-[#10B981] font-mono block">{kpis.activeSubscriptions}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-xs text-[#64748B]">Thuê bao đã hết hạn</span>
                <span className="text-2xl font-bold text-[#F43F5E] font-mono block">{kpis.expiredSubscriptions}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-1">
                <span className="text-xs text-[#64748B]">Kích hoạt tự động qua IPN</span>
                <span className="text-2xl font-bold text-[#008FD3] font-mono block">100% Realtime</span>
              </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E2E8F0] font-bold text-sm text-[#172033]">
                Danh sách hội viên có thuê bao
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {usersList.filter(u => u.tier !== 'FREE').map((u) => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-[#F8FAFC] transition text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#172033]">{u.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] font-bold text-[10px]">
                          {u.tier}
                        </span>
                      </div>
                      <span className="text-xs text-[#64748B]">{u.email}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[11px] text-[#64748B] block">Hạn sử dụng</span>
                        <span className="font-mono font-bold text-xs text-[#172033]">{u.validUntil}</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUserForTierAdjust(u);
                          setAdjustTier(u.tier);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#008FD3] text-white font-semibold text-xs hover:bg-[#007bb8] transition shadow-2xs"
                      >
                        Gia hạn / Đổi gói
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PLANS MANAGEMENT */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Quản lý Gói dịch vụ SaaS</h1>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Thiết lập giá và quyền năng gói Free, Pro, Enterprise (Lưu vết thay đổi giá và không hồi tố đơn cũ)
                </p>
              </div>

              <button
                onClick={loadPlans}
                disabled={isLoadingPlans}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlans ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plansList.map((plan) => (
                <div key={plan.tier} className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] border border-[#BAE6FD]">
                        {plan.tier}
                      </span>
                      {plan.popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706]">
                          PHỔ BIẾN
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#172033]">{plan.name}</h3>
                      <p className="text-xs text-[#64748B] mt-1">{plan.desc}</p>
                    </div>

                    <div className="p-3 bg-[#F5F8FC] rounded-2xl border border-[#E2E8F0]">
                      <span className="text-[11px] text-[#64748B] block">Giá niêm yết Backend</span>
                      <span className="text-xl font-bold text-[#008FD3] font-mono tabular-nums block mt-0.5">
                        {plan.formattedPrice}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0] text-xs">
                      <span className="font-semibold text-[#172033] text-[11px] block">Tính năng chính:</span>
                      {plan.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-[#64748B]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="line-clamp-1">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlanForEdit(plan);
                      setPlanPrice(plan.price);
                      setPlanDuration(plan.durationDays || 30);
                      setPlanDesc(plan.desc);
                      setPlanReason('');
                    }}
                    className="w-full py-2.5 bg-white border border-[#008FD3] text-[#008FD3] hover:bg-[#E0F2FE] rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    Chỉnh sửa giá & Cấu hình
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Nhật ký Kiểm toán & Thao tác Quản trị</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Lưu vết minh bạch mọi hành động duyệt tiền, khóa tài khoản và thay đổi cấu hình</p>
              </div>

              <button
                onClick={loadAuditLogs}
                disabled={isLoadingLogs}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[280px] max-w-md">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Tìm theo email admin, user, mã đơn, hành động..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#172033] focus:outline-none focus:ring-1 focus:ring-[#008FD3]"
                />
              </div>

              <select
                value={logActionFilter}
                onChange={(e) => setLogActionFilter(e.target.value)}
                className="bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2 font-semibold text-xs text-[#172033]"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="VERIFY_PAYMENT">Duyệt thanh toán</option>
                <option value="REJECT_PAYMENT">Từ chối thanh toán</option>
                <option value="LOCK_USER">Khóa tài khoản</option>
                <option value="UNLOCK_USER">Mở khóa tài khoản</option>
                <option value="UPDATE_PLAN_PRICE">Đổi giá gói dịch vụ</option>
                <option value="UPDATE_BANK_CONFIG">Cập nhật ngân hàng / Pay2S</option>
              </select>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-[#F5F8FC] text-[#64748B] text-[12px] font-medium border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 font-medium text-left">Thời gian</th>
                      <th className="py-3 px-3 font-medium text-left">Người thực hiện</th>
                      <th className="py-3 px-3 font-medium text-left">Hành động</th>
                      <th className="py-3 px-3 font-medium text-left">Đối tượng tác động</th>
                      <th className="py-3 px-4 font-medium text-left">Chi tiết & Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-[#64748B]">
                          Chưa có nhật ký kiểm toán nào được ghi nhận
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F8FAFC] transition text-xs">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#172033] block">{log.performedBy?.email || 'System'}</span>
                            <span className="text-[10px] text-[#008FD3]">{log.performedBy?.role || 'SYSTEM'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-[#E0F2FE] text-[#008FD3]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#172033]">
                            {log.targetUserEmail || log.targetUserId || '-'}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            <p className="line-clamp-2">{JSON.stringify(log.details)}</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: API CENTER (SSI FASTCONNECT DATA & MARKET FEEDS) */}
        {activeTab === 'api-center' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Trung tâm Quản trị API & SSI FastConnect Data</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Kết nối dữ liệu chứng khoán HOSE, HNX, UPCoM chính thống; quản lý key, kiểm tra độ trễ và đồng bộ dữ liệu</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncSsi}
                  disabled={isSyncingSsi || isTestingSsi}
                  className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Đồng bộ chỉ số và bảng giá cổ phiếu toàn sàn từ SSI"
                >
                  <Zap className={`w-3.5 h-3.5 ${isSyncingSsi ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSsi ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'}</span>
                </button>

                <button
                  onClick={handleTestSsi}
                  disabled={isTestingSsi || isSyncingSsi}
                  className="px-4 py-2 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  title="Kiểm tra kết nối thực tế tới máy chủ SSI FastConnect"
                >
                  <Radio className={`w-3.5 h-3.5 ${isTestingSsi ? 'animate-pulse' : ''}`} />
                  <span>{isTestingSsi ? 'Đang ping SSI...' : 'Kiểm tra kết nối SSI'}</span>
                </button>

                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F5F8FC] text-[#172033] font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Key className="w-3.5 h-3.5 text-[#008FD3]" />
                  <span>Cấu hình SSI FastConnect</span>
                </button>

                <button
                  onClick={loadApiCenter}
                  disabled={isLoadingApiCenter}
                  className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F5F8FC] text-[#64748B] transition shadow-2xs"
                  title="Tải lại trạng thái"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingApiCenter ? 'animate-spin text-[#008FD3]' : ''}`} />
                </button>
              </div>
            </div>

            {/* SSI FastConnect Hero Card */}
            {(() => {
              const ssi = apiCenterData?.ssi_config || {
                consumerId: '',
                apiUrl: 'https://fc-data.ssi.com.vn/api/v2',
                streamingUrl: 'wss://fc-data.ssi.com.vn/v2.0/signalr',
                status: 'NOT_CONFIGURED',
                isConfigured: false,
              };
              const status: ApiConnectionStatus = ssi.status || (ssi.isConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED');

              return (
                <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-xs space-y-6">
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#008FD3]/20 to-[#8B5CF6]/20 border border-[#BAE6FD] flex items-center justify-center shrink-0">
                        <Radio className="w-6 h-6 text-[#008FD3]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-[#172033]">SSI FastConnect Data API v2.0</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#008FD3] font-mono font-bold">PROD</span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">Dữ liệu thị trường HOSE, HNX, UPCoM chính thống từ Công ty Cổ phần Chứng khoán SSI</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {status === 'NOT_CONFIGURED' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#64748B] text-xs font-bold inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                          CHƯA CẤU HÌNH
                        </span>
                      )}
                      {status === 'CONFIGURED' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#008FD3] text-xs font-bold inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#008FD3]"></span>
                          ĐÃ CẤU HÌNH
                        </span>
                      )}
                      {status === 'TESTING' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#E0F2FE] border border-[#008FD3] text-[#008FD3] text-xs font-bold inline-flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#008FD3]" />
                          ĐANG KIỂM TRA...
                        </span>
                      )}
                      {status === 'CONNECTED' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#D1FAE5] border border-[#6EE7B7] text-[#047857] text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></span>
                          KẾT NỐI THÀNH CÔNG
                        </span>
                      )}
                      {(status === 'CONNECTION_FAILED' || status === 'ERROR') && (
                        <span className="px-3.5 py-1 rounded-full bg-[#FFE4E6] border border-[#FECDD3] text-[#F43F5E] text-xs font-bold inline-flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-[#F43F5E]" />
                          KẾT NỐI THẤT BẠI
                        </span>
                      )}
                      {status === 'SYNCING' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#8B5CF6] text-xs font-bold inline-flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" />
                          ĐANG ĐỒNG BỘ DỮ LIỆU...
                        </span>
                      )}
                      {status === 'SYNC_ERROR' && (
                        <span className="px-3.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-xs font-bold inline-flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                          ĐỒNG BỘ LỖI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Warning / Error banner if any */}
                  {ssi.lastError && (
                    <div className="p-3.5 rounded-2xl bg-[#FFE4E6] border border-[#FECDD3] text-[#F43F5E] text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Thông báo từ hệ thống kiểm tra SSI:</strong>
                        <p className="mt-0.5">{ssi.lastError}</p>
                      </div>
                    </div>
                  )}

                  {/* Config & Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E2E8F0] space-y-1">
                      <span className="text-[#64748B] block">Consumer ID</span>
                      <strong className="font-mono text-[#172033] block truncate font-bold">
                        {ssi.consumerId ? ssi.consumerId : <span className="text-[#94A3B8] font-normal">Chưa cấu hình</span>}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E2E8F0] space-y-1">
                      <span className="text-[#64748B] block">Consumer Secret</span>
                      <strong className="font-mono text-[#64748B] block">
                        {ssi.maskedSecret ? ssi.maskedSecret : <span className="text-[#94A3B8] font-normal">Chưa cấu hình</span>}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E2E8F0] space-y-1">
                      <span className="text-[#64748B] block">Độ trễ phản hồi (Latency)</span>
                      <strong className="font-mono text-base font-bold text-[#172033] block">
                        {ssi.lastLatencyMs ? `${ssi.lastLatencyMs} ms` : <span className="text-[#94A3B8] font-normal text-xs">Chưa đo</span>}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#F5F8FC] border border-[#E2E8F0] space-y-1">
                      <span className="text-[#64748B] block">Đồng bộ gần nhất</span>
                      <strong className="font-mono text-[#172033] block">
                        {ssi.lastSyncTime || <span className="text-[#94A3B8] font-normal">Chưa đồng bộ</span>}
                      </strong>
                    </div>
                  </div>

                  {/* Advanced Spec Rows */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#64748B]">API Endpoint:</span>
                        <code className="block font-mono text-[#008FD3] mt-0.5 truncate">{ssi.apiUrl}</code>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Streaming Hub Endpoint:</span>
                        <code className="block font-mono text-[#8B5CF6] mt-0.5 truncate">{ssi.streamingUrl}</code>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Khóa ký RSA Private Key:</span>
                        <strong className="block text-[#172033] mt-0.5">
                          {ssi.hasPrivateKey ? '✅ Đã nạp RSA Key' : '⚪ Chưa thiết lập (Tùy chọn)'}
                        </strong>
                      </div>
                    </div>

                    {ssi.recordsSynced && (
                      <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between text-[#64748B]">
                        <span>Dữ liệu lưu trữ CSDL gần nhất ({ssi.recordsSynced.lastBatchTime}):</span>
                        <div className="flex gap-4 font-mono font-bold text-[#172033]">
                          <span>📈 {ssi.recordsSynced.indices} chỉ số thị trường</span>
                          <span>🏢 {ssi.recordsSynced.quotes} báo giá cổ phiếu</span>
                          <span>📜 {ssi.recordsSynced.securities} mã niêm yết</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-xs text-[#64748B] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      <span>Xác thực 2 chiều OAuth 2.0 / Access Token tự động gia hạn an toàn</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F5F8FC] text-[#172033] text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Chỉnh sửa cấu hình</span>
                      </button>

                      <button
                        onClick={handleTestSsi}
                        disabled={isTestingSsi}
                        className="px-4 py-2 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingSsi ? 'animate-spin' : ''}`} />
                        <span>Kiểm tra kết nối thực tế</span>
                      </button>

                      <button
                        onClick={handleSyncSsi}
                        disabled={isSyncingSsi}
                        className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isSyncingSsi ? 'animate-spin' : ''}`} />
                        <span>Đồng bộ toàn sàn</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Other Providers Grid */}
            <div>
              <h3 className="font-bold text-base text-[#172033] mb-3">Các nhà cung cấp dữ liệu phụ trợ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(apiCenterData?.providers || []).filter(p => p.code !== 'SSI').map(p => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#172033]">{p.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'CONNECTED' ? 'bg-[#D1FAE5] text-[#10B981]' : 
                          p.status === 'NOT_CONFIGURED' ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#FFE4E6] text-[#F43F5E]'
                        }`}>
                          {p.status === 'CONNECTED' ? 'HOẠT ĐỘNG' : p.status === 'NOT_CONFIGURED' ? 'CHƯA CẤU HÌNH' : 'LỖI'}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-mono">{p.responseTimeMs ? `${p.responseTimeMs} ms` : 'N/A'}</span>
                      <button
                        onClick={async () => {
                          const res = await fetch('/api/api-center', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'TEST_CONNECTION', providerCode: p.code }),
                          });
                          const json = await res.json();
                          showToast(json.success ? `✅ ${json.data.message}` : `❌ ${json.data?.message || json.message}`);
                          loadApiCenter();
                        }}
                        className="text-[#008FD3] hover:underline font-bold text-[11px]"
                      >
                        Kiểm tra
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Logs Table */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#008FD3]" />
                  <h3 className="font-bold text-base text-[#172033]">Nhật ký đồng bộ & Kiểm tra kết nối API (API Sync Logs)</h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span>Lọc:</span>
                    {['ALL', 'SUCCESS', 'ERROR'].map(f => (
                      <button
                        key={f}
                        onClick={() => setApiLogFilter(f)}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          apiLogFilter === f ? 'bg-[#008FD3] text-white' : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                        }`}
                      >
                        {f === 'ALL' ? 'Tất cả' : f === 'SUCCESS' ? 'Thành công' : 'Lỗi'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClearLogs}
                    className="p-1.5 text-[#94A3B8] hover:text-[#F43F5E] hover:bg-[#FFE4E6] rounded-xl transition"
                    title="Xóa lịch sử nhật ký"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11pt]">
                  <thead>
                    <tr className="bg-[#F5F8FC] text-[#64748B] text-[11pt] font-semibold border-b border-[#E2E8F0]">
                      <th className="py-3 px-4 font-semibold text-left whitespace-nowrap">Thời gian</th>
                      <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Nhà cung cấp</th>
                      <th className="py-3 px-3 font-semibold text-left whitespace-nowrap">Tác vụ</th>
                      <th className="py-3 px-3 font-semibold text-center whitespace-nowrap">Trạng thái</th>
                      <th className="py-3 px-3 font-semibold text-right whitespace-nowrap">Độ trễ</th>
                      <th className="py-3 px-4 font-semibold text-left">Thông điệp chi tiết / Số bản ghi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9] text-[11pt]">
                    {(() => {
                      const logs = (apiCenterData?.logs || []).filter(l => {
                        if (apiLogFilter === 'ALL') return true;
                        return l.status === apiLogFilter;
                      });

                      if (logs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-[#64748B] text-[11pt]">
                              Chưa có nhật ký đồng bộ nào được ghi nhận.
                            </td>
                          </tr>
                        );
                      }

                      return logs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-[#F8FAFC] transition h-[44px]">
                          <td className="py-2.5 px-4 font-mono text-[#64748B] text-[11pt] whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#008FD3] text-[11pt] whitespace-nowrap">
                            {log.provider}
                          </td>
                          <td className="py-2.5 px-3 text-[#172033] font-mono text-[11pt] whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11pt] font-bold ${
                              log.status === 'SUCCESS' ? 'bg-[#D1FAE5] text-[#10B981]' : 'bg-[#FFE4E6] text-[#F43F5E]'
                            }`}>
                              {log.status === 'SUCCESS' ? 'THÀNH CÔNG' : 'LỖI'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#172033] tabular-nums text-[11pt] whitespace-nowrap">
                            {log.latencyMs ? `${log.latencyMs} ms` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-[#172033] text-[11pt]">
                            {log.message}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {/* TAB: SIGNALS & ALERTS MANAGEMENT */}
        {activeTab === 'signals-alerts' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Quản trị Tín hiệu T+ & Cảnh báo</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Giám sát toàn bộ tín hiệu sàng lọc T+1–T+5 và lịch sử cảnh báo dòng tiền bứt phá trên HOSE, HNX, UPCoM</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSignalsAlerts}
                  disabled={isLoadingSignalsAlerts}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSignalsAlerts ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                <span className="text-[11px] text-[#64748B] font-medium block">Tín hiệu T+1–T+5 hiện có</span>
                <span className="text-2xl font-bold text-[#008FD3] font-mono tabular-nums block">
                  {signalsAlertsData?.stats?.totalSignals || 0}
                </span>
                <span className="text-[10px] text-[#10B981] font-semibold">Tỷ lệ R:R &gt;= 1.5</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                <span className="text-[11px] text-[#64748B] font-medium block">Tổng cảnh báo V2</span>
                <span className="text-2xl font-bold text-[#172033] font-mono tabular-nums block">
                  {signalsAlertsData?.stats?.totalAlerts || 0}
                </span>
                <span className="text-[10px] text-[#64748B]">Bứt phá, vol surge, chuỗi tăng</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                <span className="text-[11px] text-[#64748B] font-medium block">Cảnh báo đang hoạt động</span>
                <span className="text-2xl font-bold text-[#059669] font-mono tabular-nums block">
                  {signalsAlertsData?.stats?.activeAlertsCount || 0}
                </span>
                <span className="text-[10px] text-[#059669] font-semibold">Trạng thái NEW &amp; CONFIRMED</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs space-y-1">
                <span className="text-[11px] text-[#64748B] font-medium block">Kiểm soát trùng lặp</span>
                <span className="text-2xl font-bold text-[#10B981] font-mono tabular-nums block">
                  {signalsAlertsData?.stats?.duplicateSignalsCount || 0} trùng
                </span>
                <span className="text-[10px] text-[#10B981] font-semibold">Chống trùng lặp tuyệt đối</span>
              </div>
            </div>

            {/* Filter Bar & Sub-tabs */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                  <button
                    onClick={() => setSignalsSubTab('signals')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      signalsSubTab === 'signals'
                        ? 'bg-white text-[#008FD3] shadow-xs font-bold'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    Tín hiệu T+1–T+5 ({signalsAlertsData?.signals?.length || 0})
                  </button>
                  <button
                    onClick={() => setSignalsSubTab('alerts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      signalsSubTab === 'alerts'
                        ? 'bg-white text-[#008FD3] shadow-xs font-bold'
                        : 'text-[#64748B] hover:text-[#172033]'
                    }`}
                  >
                    Cảnh báo thị trường V2 ({signalsAlertsData?.alerts?.length || 0})
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
                    {['ALL', 'HOSE', 'HNX', 'UPCOM'].map((ex) => (
                      <button
                        key={ex}
                        onClick={() => {
                          setSignalsExchangeFilter(ex);
                          setTimeout(loadSignalsAlerts, 50);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          signalsExchangeFilter === ex
                            ? 'bg-white text-[#008FD3] shadow-2xs font-bold'
                            : 'text-[#64748B] hover:text-[#172033]'
                        }`}
                      >
                        {ex === 'ALL' ? 'Tất cả sàn' : ex}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={signalsSearch}
                      onChange={(e) => setSignalsSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') loadSignalsAlerts(); }}
                      placeholder="Tìm mã hoặc ngành..."
                      className="pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold uppercase text-[#172033]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Table */}
            {signalsSubTab === 'signals' ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="p-3.5 px-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Danh sách Tín hiệu T+1–T+5 đã sàng lọc
                  </h3>
                  <span className="text-[11px] text-[#64748B]">Tổng: {signalsAlertsData?.signals?.length || 0} mã</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-[#64748B] text-[11px] font-semibold border-b border-[#E2E8F0]">
                        <th className="py-2.5 px-3.5">Mã CP</th>
                        <th className="py-2.5 px-3">Sàn &amp; Ngành</th>
                        <th className="py-2.5 px-3">Chiến lược</th>
                        <th className="py-2.5 px-3 text-center">T+ Score</th>
                        <th className="py-2.5 px-3 text-right">Vùng mua</th>
                        <th className="py-2.5 px-3 text-right">Mục tiêu</th>
                        <th className="py-2.5 px-3 text-right">Cắt lỗ</th>
                        <th className="py-2.5 px-3 text-center">R:R</th>
                        <th className="py-2.5 px-3">Nắm giữ</th>
                        <th className="py-2.5 px-3.5 text-center">Rủi ro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {signalsAlertsData?.signals?.map((s: any) => (
                        <tr key={s.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-2.5 px-3.5 font-bold text-[#008FD3] text-[13px]">{s.symbol}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] mr-1.5">
                              {s.exchange}
                            </span>
                            <span className="text-[#64748B] text-[11px]">{s.industry || 'Chung'}</span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#172033]">{s.strategy}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#059669] font-mono">
                              {s.t3Score}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#172033] font-semibold">{s.buyZone}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#10B981] font-bold">{s.targetPrice}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#EF4444] font-medium">{s.stopLoss}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#008FD3]">{s.rewardRiskRatio}</td>
                          <td className="py-2.5 px-3 text-[#64748B] text-[11px]">{s.holdingDays}</td>
                          <td className="py-2.5 px-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.riskLevel === 'Thấp' ? 'bg-[#D1FAE5] text-[#059669]' : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}>
                              {s.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
                <div className="p-3.5 px-4 border-b border-[#E2E8F0] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Lịch sử Cảnh báo Thị trường &amp; Dòng tiền
                  </h3>
                  <span className="text-[11px] text-[#64748B]">Tổng: {signalsAlertsData?.alerts?.length || 0} cảnh báo</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-[#64748B] text-[11px] font-semibold border-b border-[#E2E8F0]">
                        <th className="py-2.5 px-3.5">Thời gian</th>
                        <th className="py-2.5 px-3">Mã CP</th>
                        <th className="py-2.5 px-3">Sự kiện</th>
                        <th className="py-2.5 px-3">Mô tả điều kiện</th>
                        <th className="py-2.5 px-3 text-right">Giá cảnh báo</th>
                        <th className="py-2.5 px-3 text-right">Giá hiện tại</th>
                        <th className="py-2.5 px-3 text-right">KL/TB20</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3.5 text-center">Thao tác Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {signalsAlertsData?.alerts?.map((a: any) => (
                        <tr key={a.id} className="hover:bg-[#F8FAFC] transition">
                          <td className="py-2.5 px-3.5 text-[#64748B] text-[11px] font-mono">{a.detectedAt.slice(0, 19)}</td>
                          <td className="py-2.5 px-3 font-bold text-[#008FD3]">
                            {a.symbol} <span className="text-[10px] text-[#64748B] font-normal">({a.exchange})</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7]">
                              {a.eventType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-[#172033] max-w-xs truncate" title={a.description}>
                            {a.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-[#64748B]">
                            {a.alertPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172033]">
                            {a.currentPrice.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#9333EA]">
                            {a.volumeRatio.toFixed(2).replace('.', ',')}x
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === 'CONFIRMED' ? 'bg-[#D1FAE5] text-[#059669]' :
                              a.status === 'FAILED' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                              a.status === 'CLOSED' ? 'bg-[#F1F5F9] text-[#64748B]' : 'bg-[#FEF3C7] text-[#D97706]'
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-center">
                            {a.status !== 'CLOSED' && (
                              <button
                                onClick={() => handleDismissAlert(a.id, a.symbol)}
                                className="px-2 py-0.5 rounded bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] text-[10px] font-semibold transition"
                                title="Đóng cảnh báo có lưu Audit Log"
                              >
                                Đóng cảnh báo
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SYSTEM CONFIGURATION */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Cấu hình Hệ thống & Dữ liệu</h1>
                <p className="text-xs text-[#64748B] mt-0.5">Giám sát đường truyền dữ liệu SSI, tích hợp Pay2S và tài khoản VietQR</p>
              </div>

              <button
                onClick={loadSystem}
                disabled={isLoadingSystem}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#008FD3] hover:bg-[#E0F2FE] transition flex items-center gap-1.5 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSystem ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SSI FastConnect Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-[#008FD3]" />
                    <h3 className="font-bold text-base text-[#172033]">SSI FastConnect Securities API</h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                    systemData?.ssi?.status === 'CONNECTED' ? 'bg-[#D1FAE5] text-[#10B981]' :
                    systemData?.ssi?.status === 'CONFIGURED' ? 'bg-[#E0F2FE] text-[#008FD3]' :
                    systemData?.ssi?.status === 'CONNECTION_FAILED' ? 'bg-[#FFE4E6] text-[#F43F5E]' :
                    'bg-[#F1F5F9] text-[#64748B]'
                  }`}>
                    {systemData?.ssi?.status === 'CONNECTED' ? 'KẾT NỐI THÀNH CÔNG' :
                     systemData?.ssi?.status === 'CONFIGURED' ? 'ĐÃ CẤU HÌNH' :
                     systemData?.ssi?.status === 'CONNECTION_FAILED' ? 'KẾT NỐI THẤT BẠI' : 'CHƯA CẤU HÌNH'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Consumer ID:</span>
                    <strong className="font-mono text-[#172033]">{systemData?.ssi?.consumerId || 'Chưa thiết lập'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Độ trễ phản hồi:</span>
                    <strong className="font-mono text-[#172033]">{systemData?.ssi?.responseTimeMs ? `${systemData.ssi.responseTimeMs}ms` : 'Chưa đo'}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Cập nhật phiên gần nhất:</span>
                    <strong className="font-mono text-[#172033]">{systemData?.ssi?.lastSyncTime || 'Chưa đồng bộ'}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Chất lượng dữ liệu:</span>
                    <strong className="text-[#10B981]">{systemData?.ssi?.dataQuality || 'Chưa xác thực'}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('api-center')}
                    className="flex-1 py-2.5 rounded-xl bg-[#F5F8FC] hover:bg-[#E0F2FE] border border-[#E2E8F0] text-[#008FD3] font-bold text-xs transition"
                  >
                    Mở Trung tâm API
                  </button>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'TEST_SSI' }),
                      });
                      const json = await res.json();
                      showToast(json.success ? `✅ ${json.message}` : `❌ ${json.message}`);
                      loadSystem();
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#008FD3] hover:bg-[#007bb8] text-white font-bold text-xs transition"
                  >
                    Ping
                  </button>
                </div>
              </div>

              {/* Pay2S Payment Gateway Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#008FD3]" />
                    <h3 className="font-bold text-base text-[#172033]">Cổng thanh toán Pay2S</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#10B981] font-bold text-xs">
                    SẴN SÀNG
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Merchant ID:</span>
                    <strong className="font-mono text-[#172033]">P2S_STOCKAI_LIVE</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Secret Key:</span>
                    <strong className="font-mono text-[#64748B]">••••••••••••••••••••••••</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                    <span className="text-[#64748B]">Webhook IPN Endpoint:</span>
                    <strong className="font-mono text-[#008FD3] text-[11px]">/api/payments/webhook</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Cơ chế Idempotency:</span>
                    <strong className="text-[#10B981]">Bật (Chống ghi nhận trùng)</strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F5F8FC] border border-[#E2E8F0] text-[11px] text-[#64748B]">
                  🛡️ Theo quy định bảo mật, khóa bí mật API Secret không được hiển thị nguyên văn trên giao diện người dùng.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: KHÓA TÀI KHOẢN */}
      {selectedUserForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-3 text-[#F43F5E]">
              <div className="w-10 h-10 rounded-2xl bg-[#FFE4E6] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#172033]">Khóa tài khoản người dùng</h3>
                <p className="text-xs text-[#64748B]">{selectedUserForAction.email}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Lý do khóa tài khoản (bắt buộc):
              </label>
              <textarea
                value={lockModalReason}
                onChange={(e) => setLockModalReason(e.target.value)}
                placeholder="Nhập nguyên nhân vi phạm hoặc lý do nghiệp vụ..."
                className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#172033] h-24 focus:outline-none focus:ring-1 focus:ring-[#F43F5E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForAction(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                onClick={handleLockUser}
                disabled={isLocking || lockModalReason.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-[#F43F5E] text-white text-xs font-bold hover:bg-[#e11d48] disabled:opacity-50"
              >
                {isLocking ? 'Đang khóa...' : 'Xác nhận Khóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỐI SOÁT & DUYỆT ĐƠN HÀNG */}
      {selectedOrderForVerify && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-3 text-[#008FD3]">
              <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-[#008FD3]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#172033]">Đối soát & Kích hoạt gói</h3>
                <p className="text-xs text-[#64748B]">Mã đơn: <strong className="font-mono text-[#172033]">{selectedOrderForVerify.orderCode}</strong></p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Số tiền thực nhận (VNĐ):</label>
                <input
                  type="number"
                  value={verifyAmount}
                  onChange={(e) => setVerifyAmount(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono font-bold text-sm text-[#008FD3]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Mã giao dịch ngân hàng / Pay2S (bắt buộc):</label>
                <input
                  type="text"
                  value={verifyRef}
                  onChange={(e) => setVerifyRef(e.target.value)}
                  placeholder="VD: MB_TX_8923182 hoặc P2S_99210"
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Ghi chú đối soát:</label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Ghi chú xác minh..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#172033]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrderForVerify(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                onClick={handleVerifyOrder}
                disabled={isVerifying || !verifyRef.trim() || verifyAmount <= 0}
                className="px-4 py-2 rounded-xl bg-[#008FD3] text-white text-xs font-bold hover:bg-[#007bb8] disabled:opacity-50"
              >
                {isVerifying ? 'Đang duyệt...' : 'Xác nhận đối soát & Kích hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TỪ CHỐI ĐƠN HÀNG */}
      {selectedOrderForReject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <h3 className="font-bold text-base text-[#172033]">Từ chối đơn hàng {selectedOrderForReject.orderCode}</h3>
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">Lý do từ chối (bắt buộc):</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Số tiền chuyển thiếu, không thấy sao kê ngân hàng..."
                className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#172033] h-24 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrderForReject(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectOrder}
                disabled={isRejecting || rejectReason.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-[#F43F5E] text-white text-xs font-bold hover:bg-[#e11d48] disabled:opacity-50"
              >
                {isRejecting ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ĐIỀU CHỈNH GÓI DỊCH VỤ / GIÁ */}
      {selectedPlanForEdit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <h3 className="font-bold text-base text-[#172033]">Điều chỉnh cấu hình gói {selectedPlanForEdit.name}</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Giá gói (VNĐ):</label>
                <input
                  type="number"
                  value={planPrice}
                  onChange={(e) => setPlanPrice(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono font-bold text-sm text-[#008FD3]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Thời hạn (ngày):</label>
                <input
                  type="number"
                  value={planDuration}
                  onChange={(e) => setPlanDuration(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Mô tả gói:</label>
                <input
                  type="text"
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Lý do điều chỉnh (bắt buộc lưu audit log):</label>
                <textarea
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  placeholder="Nhập lý do thay đổi giá hoặc thông số gói..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#172033] h-20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedPlanForEdit(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={isUpdatingPlan || planReason.trim().length < 5}
                className="px-4 py-2 rounded-xl bg-[#008FD3] text-white text-xs font-bold hover:bg-[#007bb8] disabled:opacity-50"
              >
                {isUpdatingPlan ? 'Đang lưu...' : 'Lưu cấu hình gói'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CẤP / GIA HẠN GÓI THỦ CÔNG CHO USER */}
      {selectedUserForTierAdjust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4">
            <h3 className="font-bold text-base text-[#172033]">Cấp / Gia hạn gói cho {selectedUserForTierAdjust.email}</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#172033] block mb-1">Chọn gói cấp:</label>
                <select
                  value={adjustTier}
                  onChange={(e) => setAdjustTier(e.target.value as SubscriptionTier)}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-bold text-xs text-[#172033]"
                >
                  <option value="FREE">Gói Miễn Phí (Free)</option>
                  <option value="PRO">Gói Chuyên Nghiệp (Pro - 199k)</option>
                  <option value="ENTERPRISE">Gói Nâng Cao (Enterprise - 299k)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Số ngày cộng thêm:</label>
                <input
                  type="number"
                  value={adjustDays}
                  onChange={(e) => setAdjustDays(Number(e.target.value))}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono font-bold text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Lý do cấp quyền (lưu audit log):</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="VD: Tặng gói trải nghiệm, xử lý khiếu nại..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-[#172033]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForTierAdjust(null)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B]"
              >
                Hủy
              </button>
              <button
                onClick={handleAdjustTier}
                disabled={isAdjustingTier}
                className="px-4 py-2 rounded-xl bg-[#008FD3] text-white text-xs font-bold hover:bg-[#007bb8] disabled:opacity-50"
              >
                {isAdjustingTier ? 'Đang cấp...' : 'Xác nhận cấp gói'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CẤU HÌNH KẾT NỐI SSI FASTCONNECT DATA */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#008FD3]/10 text-[#008FD3] flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#172033]">Cấu hình SSI FastConnect Data</h3>
                  <p className="text-xs text-[#64748B]">Kết nối trực tiếp hạ tầng dữ liệu thị trường SSI</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#172033] block mb-1">
                  Consumer ID (Client ID) <span className="text-[#F43F5E]">*</span>:
                </label>
                <input
                  type="text"
                  value={formConsumerId}
                  onChange={(e) => setFormConsumerId(e.target.value)}
                  placeholder="Ví dụ: a1b2c3d4e5f6..."
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172033]">
                    Consumer Secret <span className="text-[#F43F5E]">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-[#008FD3] flex items-center gap-1 hover:underline"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showSecret ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={formConsumerSecret}
                  onChange={(e) => setFormConsumerSecret(e.target.value)}
                  placeholder={apiCenterData?.ssi_config?.hasCredentials ? '•••••••••••• (Để trống nếu không đổi)' : 'Nhập mã bí mật do SSI cung cấp'}
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:outline-none"
                />
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  Mã bí mật được mã hóa và bảo mật tại server, không hiển thị nguyên văn.
                </p>
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">
                  Private Key RSA (Tùy chọn theo phương thức ký của SSI):
                </label>
                <textarea
                  rows={3}
                  value={formPrivateKey}
                  onChange={(e) => setFormPrivateKey(e.target.value)}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-[11px] text-[#172033] focus:border-[#008FD3] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">API Endpoint URL:</label>
                <input
                  type="text"
                  value={formApiUrl}
                  onChange={(e) => setFormApiUrl(e.target.value)}
                  placeholder="https://fc-data.ssi.com.vn/api/v2"
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-[#172033] block mb-1">Streaming Endpoint (SignalR/WebSocket):</label>
                <input
                  type="text"
                  value={formStreamingUrl}
                  onChange={(e) => setFormStreamingUrl(e.target.value)}
                  placeholder="wss://fc-data.ssi.com.vn/v2.0/signalr"
                  className="w-full bg-[#F5F8FC] border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-xs text-[#172033] focus:border-[#008FD3] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#F5F8FC] rounded-xl border border-[#E2E8F0]">
                <input
                  type="checkbox"
                  id="autoSyncCheck"
                  checked={formAutoSync}
                  onChange={(e) => setFormAutoSync(e.target.checked)}
                  className="w-4 h-4 text-[#008FD3] rounded focus:ring-0 cursor-pointer"
                />
                <label htmlFor="autoSyncCheck" className="text-xs text-[#172033] font-medium cursor-pointer">
                  Tự động đồng bộ định kỳ theo phiên giao dịch (9:00 - 15:00)
                </label>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Quy định kiểm tra thực tế:
                </div>
                <p>
                  Hệ thống không hiển thị trạng thái &quot;Đã kết nối&quot; cho đến khi thực hiện thành công bài test thực tế tới máy chủ SSI. Sau khi lưu, vui lòng bấm <strong>Kiểm tra kết nối</strong> để xác thực.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-xs font-semibold text-[#64748B] hover:bg-[#E2E8F0]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveSsiConfig}
                disabled={isSavingConfig}
                className="px-4 py-2 rounded-xl bg-[#008FD3] text-white text-xs font-bold hover:bg-[#007bb8] disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                {isSavingConfig ? 'Đang lưu...' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
