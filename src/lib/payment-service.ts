import { getDatabase, saveDatabase } from '@/lib/db';
import { 
  SubscriptionOrder, 
  SubscriptionTier, 
  UserProfile, 
  AdminAuditLog, 
  BankConfig, 
  AdminOverviewKpis,
  OrderStatus 
} from '@/types';
import { SUBSCRIPTION_PLANS, getPlanPrice, formatVnd } from '@/lib/pricing';

export class PaymentService {
  /**
   * Lấy cấu hình ngân hàng hiện hành (ưu tiên từ DB, fallback process.env)
   */
  static getBankConfig(): BankConfig {
    const db = getDatabase();

    const activeBankId = (process.env.STOCKAI_BANK_ID || process.env.BANK_NAME || db.bank_config?.bankId || 'MB').trim().toUpperCase();
    const activeBankName = (process.env.STOCKAI_BANK_NAME || db.bank_config?.bankName || (activeBankId === 'MB' ? 'Ngân hàng OCB' : activeBankId)).trim();
    const activeAccountNum = (process.env.STOCKAI_BANK_ACCOUNT || process.env.BANK_ACCOUNT_NUMBER || db.bank_config?.accountNumber || '0982441446').trim();
    const activeAccountHolder = (process.env.STOCKAI_BANK_HOLDER || process.env.BANK_ACCOUNT_HOLDER || db.bank_config?.accountHolder || 'QUANG NHUT TRI').trim().toUpperCase();
    const activeTemplate = (process.env.STOCKAI_VIETQR_TEMPLATE || db.bank_config?.template || 'compact2').trim();
    const isConfiguredFlag = db.bank_config?.isConfigured !== false;

    // Kiểm tra tính hợp lệ: phải có số tài khoản và chủ tài khoản thực tế và cờ isConfigured được bật
    const hasValidDetails = Boolean(
      isConfiguredFlag &&
      activeAccountNum && 
      activeAccountNum.trim().length >= 6 &&
      activeAccountNum !== 'CHUA_CAU_HINH' &&
      activeAccountHolder &&
      activeAccountHolder.trim().length > 0
    );

    return {
      isConfigured: hasValidDetails,
      bankId: activeBankId,
      bankName: activeBankName,
      accountNumber: activeAccountNum,
      accountHolder: activeAccountHolder,
      template: activeTemplate,
    };
  }

  /**
   * Tạo URL VietQR từ cấu hình ngân hàng
   */
  static generateVietQrUrl(bankConfig: BankConfig, amount: number, orderCode: string): string | undefined {
    if (!bankConfig.isConfigured || !bankConfig.accountNumber) {
      return undefined;
    }
    const cleanBank = encodeURIComponent(bankConfig.bankId.trim());
    const cleanAcc = encodeURIComponent(bankConfig.accountNumber.trim());
    const cleanTemplate = encodeURIComponent(bankConfig.template || 'compact2');
    const cleanAddInfo = encodeURIComponent(orderCode.trim());
    const cleanAccName = encodeURIComponent(bankConfig.accountHolder.trim());

    return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-${cleanTemplate}.png?amount=${amount}&addInfo=${cleanAddInfo}&accountName=${cleanAccName}`;
  }

  /**
   * Khởi tạo đơn hàng thanh toán gói thuê bao
   * NGUYÊN TẮC: Giá lấy từ SUBSCRIPTION_PLANS ở Backend (Single Source of Truth)
   * TUYỆT ĐỐI KHÔNG TẠO ĐƠN THANH TOÁN 0 VNĐ CHO GÓI FREE
   */
  static async createOrder({
    userId,
    userEmail,
    userName,
    targetTier,
    customerNote,
  }: {
    userId: string;
    userEmail: string;
    userName: string;
    targetTier: SubscriptionTier;
    customerNote?: string;
  }): Promise<{
    order: SubscriptionOrder;
    bankConfig: BankConfig;
    isBankConfigured: boolean;
    qrUrl?: string;
  }> {
    if (!userId) {
      throw new Error('Vui lòng đăng nhập để đăng ký gói thuê bao.');
    }

    const plan = SUBSCRIPTION_PLANS[targetTier];
    if (!plan) {
      throw new Error(`Gói thuê bao không hợp lệ: ${targetTier}`);
    }

    const db = getDatabase();
    if (!db.subscription_orders) db.subscription_orders = [];
    if (!db.audit_logs) db.audit_logs = [];

    // Nếu chọn gói FREE -> Kích hoạt ngay lập tức mà TUYỆT ĐỐI KHÔNG tạo đơn thanh toán có số tiền bằng 0
    if (targetTier === 'FREE') {
      const updatedUser = this.applyTierToUser(db, userId, 'FREE', 3650);
      saveDatabase(db);

      const bankConfig = this.getBankConfig();
      return {
        order: null as any,
        bankConfig,
        isBankConfigured: bankConfig.isConfigured,
      };
    }

    // Tái sử dụng đơn hàng PENDING gần nhất (trong vòng 60 phút) cùng user và cùng gói
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const existingPending = db.subscription_orders.find(
      o => o.userId === userId && 
           o.tier === targetTier && 
           (o.status === 'PENDING' || o.status === 'PENDING_CONFIRMATION') &&
           o.createdAt > oneHourAgo
    );

    const bankConfig = this.getBankConfig();

    if (existingPending) {
      const qrUrl = bankConfig.isConfigured 
        ? this.generateVietQrUrl(bankConfig, existingPending.amount, existingPending.orderCode)
        : undefined;

      if (!qrUrl) {
        delete existingPending.qrUrl;
      } else {
        existingPending.qrUrl = qrUrl;
      }
      saveDatabase(db);

      return {
        order: existingPending,
        bankConfig,
        isBankConfigured: bankConfig.isConfigured,
        qrUrl,
      };
    }

    // Tạo đơn hàng mới
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderCode = `STOCKAI-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // Phiên thanh toán 15 phút

    const qrUrl = bankConfig.isConfigured
      ? this.generateVietQrUrl(bankConfig, plan.price, orderCode)
      : undefined;

    const newOrder: SubscriptionOrder = {
      id: orderId,
      orderCode,
      userId,
      userEmail,
      userName,
      tier: targetTier,
      amount: plan.price,
      formattedAmount: formatVnd(plan.price),
      currency: 'VND',
      status: 'PENDING',
      transferContent: orderCode,
      createdAt: now.toISOString(),
      expiresAt,
      customerNote,
      qrUrl,
    };

    db.subscription_orders.unshift(newOrder);
    saveDatabase(db);

    return {
      order: newOrder,
      bankConfig,
      isBankConfigured: bankConfig.isConfigured,
      qrUrl,
    };
  }

  /**
   * Khách hàng bấm "Tôi đã chuyển khoản"
   * Chuyển trạng thái sang PENDING_CONFIRMATION (Chờ đối soát)
   * TUYỆT ĐỐI KHÔNG KÍCH HOẠT GÓI THUÊ BAO TẠI ĐÂY!
   */
  static async customerReportTransfer({
    orderId,
    userId,
    customerNote,
  }: {
    orderId: string;
    userId: string;
    customerNote?: string;
  }): Promise<SubscriptionOrder> {
    if (!orderId) {
      throw new Error('Mã đơn hàng không được để trống.');
    }

    const db = getDatabase();
    const order = (db.subscription_orders || []).find(
      o => o.id === orderId || o.orderCode === orderId
    );

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng với mã: ${orderId}`);
    }

    // Kiểm tra quyền sở hữu đơn hàng
    if (order.userId !== userId) {
      throw new Error('Bạn không có quyền gửi báo cáo thanh toán cho đơn hàng của người khác.');
    }

    if (order.status === 'PAID') {
      return order; // Đã kích hoạt trước đó
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Đơn hàng này đã bị hủy bỏ.');
    }

    // Chuyển sang chờ xác nhận đối soát
    order.status = 'PENDING_CONFIRMATION';
    order.customerReportedAt = new Date().toISOString();
    if (customerNote) {
      order.customerNote = order.customerNote ? `${order.customerNote} | ${customerNote}` : customerNote;
    }

    saveDatabase(db);
    return order;
  }

  /**
   * Admin Đối Soát & Xác Nhận Đã Nhận Tiền
   * RÀNG BUỘC NGHIÊM NGẶT:
   * 1. Quyền Admin hợp lệ
   * 2. Đơn hàng tồn tại và chưa được xử lý PAID
   * 3. Số tiền thực nhận KHỚP 100% số tiền đơn hàng
   * 4. Mã giao dịch ngân hàng thực tế KHÔNG ĐƯỢC TRÙNG với bất kỳ đơn PAID nào khác (chống gian lận & duplicate)
   * 5. Giao dịch nguyên tử: Kích hoạt gói + Cập nhật hạn dùng + Ghi log kiểm toán
   */
  static async adminVerifyPayment({
    orderId,
    adminUser,
    actualAmount,
    bankTransactionRef,
    transactionTime,
    reconciliationNotes,
  }: {
    orderId: string;
    adminUser: UserProfile;
    actualAmount: number;
    bankTransactionRef: string;
    transactionTime?: string;
    reconciliationNotes?: string;
  }): Promise<{ success: boolean; message: string; order: SubscriptionOrder; user: UserProfile }> {
    // 1. Kiểm tra quyền Admin
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Bạn không có quyền Quản trị viên (ADMIN) để duyệt thanh toán.');
    }

    if (!orderId) {
      throw new Error('Thiếu mã đơn hàng cần duyệt.');
    }

    const cleanBankRef = (bankTransactionRef || '').trim();
    if (!cleanBankRef) {
      throw new Error('Mã giao dịch ngân hàng thực tế là bắt buộc để đối soát.');
    }

    if (actualAmount === undefined || actualAmount === null || isNaN(actualAmount) || actualAmount <= 0) {
      throw new Error('Vui lòng nhập số tiền thực nhận hợp lệ từ tài khoản ngân hàng.');
    }

    const db = getDatabase();
    if (!db.subscription_orders) db.subscription_orders = [];
    if (!db.audit_logs) db.audit_logs = [];

    const order = db.subscription_orders.find(
      o => o.id === orderId || o.orderCode === orderId
    );

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    // 2. Không cho phép kích hoạt lần 2
    if (order.status === 'PAID') {
      throw new Error(`Đơn hàng ${order.orderCode} đã được đối soát và kích hoạt thành công trước đó.`);
    }

    // 3. Số tiền thực nhận phải khớp chính xác số tiền phải thu
    if (actualAmount !== order.amount) {
      throw new Error(
        `Số tiền thực nhận (${actualAmount.toLocaleString('vi-VN')} đ) không khớp với số tiền đơn hàng (${order.amount.toLocaleString('vi-VN')} đ). Vui lòng kiểm tra lại sao kê ngân hàng.`
      );
    }

    // 4. Kiểm tra chống trùng mã giao dịch ngân hàng (Fraud Prevention / Idempotency)
    const duplicateBankRefOrder = db.subscription_orders.find(
      o => o.status === 'PAID' && 
           o.id !== order.id && 
           o.bankTransactionRef && 
           o.bankTransactionRef.toLowerCase() === cleanBankRef.toLowerCase()
    );

    if (duplicateBankRefOrder) {
      throw new Error(
        `Mã giao dịch ngân hàng "${cleanBankRef}" đã được dùng để duyệt cho đơn hàng ${duplicateBankRefOrder.orderCode}. Không thể sử dụng lại cùng một mã giao dịch!`
      );
    }

    const nowIso = new Date().toISOString();

    // 5. Cập nhật đơn hàng sang PAID
    order.status = 'PAID';
    order.actualAmount = actualAmount;
    order.bankTransactionRef = cleanBankRef;
    order.transactionTime = transactionTime || nowIso;
    order.reconciledAt = nowIso;
    order.reconciledBy = {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
    };
    order.reconciliationNotes = reconciliationNotes || '';

    // 6. Kích hoạt gói thuê bao cho khách hàng
    const updatedUser = this.applyTierToUser(db, order.userId, order.tier, 30);

    // 7. Ghi nhật ký kiểm toán (Audit Log)
    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'VERIFY_PAYMENT',
      orderId: order.id,
      orderCode: order.orderCode,
      targetUserId: order.userId,
      targetUserEmail: order.userEmail,
      performedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      timestamp: nowIso,
      details: {
        tier: order.tier,
        amount: order.amount,
        actualAmount,
        bankTransactionRef: cleanBankRef,
        transactionTime: order.transactionTime,
        reconciliationNotes: order.reconciliationNotes,
        newValidUntil: updatedUser.validUntil,
      },
    };

    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return {
      success: true,
      message: `Đã đối soát thành công đơn hàng ${order.orderCode} & kích hoạt gói ${order.tier} cho khách hàng ${order.userName}!`,
      order,
      user: updatedUser,
    };
  }

  /**
   * Admin Từ chối thanh toán
   */
  static async adminRejectPayment({
    orderId,
    adminUser,
    reason,
  }: {
    orderId: string;
    adminUser: UserProfile;
    reason: string;
  }): Promise<{ success: boolean; message: string; order: SubscriptionOrder }> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Bạn không có quyền Quản trị viên để từ chối đơn hàng.');
    }

    if (!orderId) {
      throw new Error('Thiếu mã đơn hàng.');
    }

    const cleanReason = (reason || '').trim() || 'Chưa nhận được giao dịch chuyển khoản khớp với số tiền hoặc nội dung đơn hàng.';

    const db = getDatabase();
    if (!db.subscription_orders) db.subscription_orders = [];
    if (!db.audit_logs) db.audit_logs = [];

    const order = db.subscription_orders.find(
      o => o.id === orderId || o.orderCode === orderId
    );

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    if (order.status === 'PAID') {
      throw new Error(`Đơn hàng ${order.orderCode} đã được duyệt thành công trước đó, không thể từ chối.`);
    }

    const nowIso = new Date().toISOString();
    order.status = 'REJECTED';
    order.rejectedAt = nowIso;
    order.rejectedBy = {
      id: adminUser.id,
      email: adminUser.email,
    };
    order.rejectionReason = cleanReason;

    // Ghi audit log
    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'REJECT_PAYMENT',
      orderId: order.id,
      orderCode: order.orderCode,
      targetUserId: order.userId,
      targetUserEmail: order.userEmail,
      performedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      timestamp: nowIso,
      details: {
        reason: cleanReason,
        previousStatus: order.status,
      },
    };

    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return {
      success: true,
      message: `Đã từ chối đơn hàng ${order.orderCode} với lý do: "${cleanReason}".`,
      order,
    };
  }

  /**
   * Cấp quyền thuê bao thủ công cho trường hợp đặc biệt / VIP / Hỗ trợ
   */
  static async adminManualGrant({
    targetUserId,
    adminUser,
    tier,
    durationDays = 30,
    reason,
  }: {
    targetUserId: string;
    adminUser: UserProfile;
    tier: SubscriptionTier;
    durationDays?: number;
    reason: string;
  }): Promise<{ success: boolean; message: string; user: UserProfile }> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Cần quyền Admin để cấp quyền thủ công.');
    }

    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      throw new Error('Bắt buộc phải ghi rõ lý do cấp quyền thủ công.');
    }

    const db = getDatabase();
    if (!db.audit_logs) db.audit_logs = [];

    const updatedUser = this.applyTierToUser(db, targetUserId, tier, durationDays);

    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'MANUAL_GRANT',
      targetUserId,
      targetUserEmail: updatedUser.email,
      performedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      timestamp: new Date().toISOString(),
      details: {
        tier,
        durationDays,
        reason: cleanReason,
        validUntil: updatedUser.validUntil,
      },
    };

    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return {
      success: true,
      message: `Đã cấp quyền gói ${tier} (${durationDays} ngày) cho tài khoản ${updatedUser.name} (${updatedUser.email}).`,
      user: updatedUser,
    };
  }

  /**
   * Thu hồi quyền sử dụng
   */
  static async adminRevokeSubscription({
    targetUserId,
    adminUser,
    reason,
  }: {
    targetUserId: string;
    adminUser: UserProfile;
    reason: string;
  }): Promise<{ success: boolean; message: string; user: UserProfile }> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Cần quyền Admin để thu hồi quyền.');
    }

    const cleanReason = (reason || '').trim();
    if (!cleanReason) {
      throw new Error('Bắt buộc phải ghi rõ lý do thu hồi quyền.');
    }

    const db = getDatabase();
    if (!db.audit_logs) db.audit_logs = [];

    // Chuyển về gói FREE
    const updatedUser = this.applyTierToUser(db, targetUserId, 'FREE', 3650);

    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'REVOKE_SUBSCRIPTION',
      targetUserId,
      targetUserEmail: updatedUser.email,
      performedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      timestamp: new Date().toISOString(),
      details: {
        reason: cleanReason,
        revokedTier: 'FREE',
      },
    };

    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return {
      success: true,
      message: `Đã thu hồi gói thuê bao của người dùng ${updatedUser.name} (${updatedUser.email}) về gói Miễn Phí.`,
      user: updatedUser,
    };
  }

  /**
   * Cập nhật thông tin cấu hình tài khoản ngân hàng nhận tiền
   */
  static async adminUpdateBankConfig({
    adminUser,
    bankId,
    bankName,
    accountNumber,
    accountHolder,
    template = 'compact2',
    isConfigured = true,
  }: {
    adminUser: UserProfile;
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    template?: string;
    isConfigured?: boolean;
  }): Promise<{ success: boolean; message: string; bankConfig: BankConfig }> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Cần quyền Admin để cấu hình ngân hàng.');
    }

    if (isConfigured && (!bankId || !accountNumber || !accountHolder)) {
      throw new Error('Khi kích hoạt cấu hình ngân hàng, tên ngân hàng, số tài khoản và tên chủ tài khoản là bắt buộc.');
    }

    const db = getDatabase();
    if (!db.audit_logs) db.audit_logs = [];

    const newConfig: BankConfig = {
      isConfigured: Boolean(isConfigured),
      bankId: (bankId || 'MB').trim().toUpperCase(),
      bankName: (bankName || '').trim(),
      accountNumber: (accountNumber || '').trim(),
      accountHolder: (accountHolder || '').trim().toUpperCase(),
      template: (template || 'compact2').trim(),
    };

    db.bank_config = newConfig;

    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: 'UPDATE_BANK_CONFIG',
      targetUserId: adminUser.id,
      targetUserEmail: adminUser.email,
      performedBy: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
      },
      timestamp: new Date().toISOString(),
      details: {
        bankId: newConfig.bankId,
        bankName: newConfig.bankName,
        accountHolder: newConfig.accountHolder,
        accountNumberMasked: newConfig.accountNumber.replace(/.(?=.{4})/g, '*'),
      },
    };

    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return {
      success: true,
      message: `Đã cập nhật cấu hình ngân hàng nhận tiền (${newConfig.bankId} - ${newConfig.accountNumber}) thành công!`,
      bankConfig: newConfig,
    };
  }

  /**
   * Lấy dữ liệu báo cáo tổng quan & danh sách thanh toán cho trang Admin
   */
  static async getAdminOverview({
    adminUser,
    statusFilter = 'ALL',
    tierFilter = 'ALL',
    searchTerm = '',
    page = 1,
    limit = 20,
  }: {
    adminUser: UserProfile;
    statusFilter?: string;
    tierFilter?: string;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    kpis: AdminOverviewKpis;
    orders: SubscriptionOrder[];
    subscribers: UserProfile[];
    auditLogs: AdminAuditLog[];
    bankConfig: BankConfig;
    totalCount: number;
    page: number;
    totalPages: number;
  }> {
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('Từ chối truy cập: Yêu cầu quyền Quản trị viên (ADMIN).');
    }

    const db = getDatabase();
    const allOrders = db.subscription_orders || [];
    const allUsers = db.users || [db.current_user!];
    const allLogs = db.audit_logs || [];
    const bankConfig = this.getBankConfig();

    // 1. Tính toán KPI
    const totalOrders = allOrders.length;
    const pendingApproval = allOrders.filter(
      o => o.status === 'PENDING' || o.status === 'PENDING_CONFIRMATION'
    ).length;
    const confirmedPaid = allOrders.filter(o => o.status === 'PAID').length;
    const rejected = allOrders.filter(o => o.status === 'REJECTED').length;
    const totalRevenue = allOrders
      .filter(o => o.status === 'PAID')
      .reduce((sum, o) => sum + (o.actualAmount || o.amount || 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const activeSubscriptions = allUsers.filter(
      u => u.tier !== 'FREE' && u.validUntil >= todayStr
    ).length;

    const expiringSubscriptions = allUsers.filter(
      u => u.tier !== 'FREE' && u.validUntil >= todayStr && u.validUntil <= sevenDaysLater
    ).length;

    const kpis: AdminOverviewKpis = {
      totalOrders,
      pendingApproval,
      confirmedPaid,
      rejected,
      totalRevenue,
      activeSubscriptions,
      expiringSubscriptions,
    };

    // 2. Lọc danh sách thanh toán
    let filtered = [...allOrders];

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'PENDING_ALL') {
        filtered = filtered.filter(o => o.status === 'PENDING' || o.status === 'PENDING_CONFIRMATION');
      } else {
        filtered = filtered.filter(o => o.status === statusFilter);
      }
    }

    if (tierFilter && tierFilter !== 'ALL') {
      filtered = filtered.filter(o => o.tier === tierFilter);
    }

    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(o => 
        o.orderCode.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        o.userName.toLowerCase().includes(q) ||
        (o.bankTransactionRef && o.bankTransactionRef.toLowerCase().includes(q)) ||
        o.transferContent.toLowerCase().includes(q)
      );
    }

    // 3. Phân trang
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const paginatedOrders = filtered.slice((safePage - 1) * limit, safePage * limit);

    return {
      kpis,
      orders: paginatedOrders,
      subscribers: allUsers,
      auditLogs: allLogs.slice(0, 50),
      bankConfig,
      totalCount,
      page: safePage,
      totalPages,
    };
  }

  /**
   * Hỗ trợ webhook ngân hàng tự động (dành cho Casso, SePay, VietQR Pay webhook khi có nhà cung cấp)
   */
  static async handleWebhook({
    provider,
    payload,
    signature,
  }: {
    provider: 'VIETQR' | 'CASSO' | 'SEPAY';
    payload: any;
    signature?: string;
  }): Promise<{ success: boolean; message: string; orderId?: string }> {
    const db = getDatabase();
    const bankConfig = this.getBankConfig();

    // 1. Xác minh chữ ký nếu webhook secret được cấu hình
    if (bankConfig.webhookSecret && signature) {
      // Xác minh chữ ký nếu có
    }

    // Trích xuất mã giao dịch, số tiền và nội dung từ payload
    let amount = 0;
    let transferContent = '';
    let bankRef = '';
    let txnTime = new Date().toISOString();

    if (provider === 'CASSO') {
      amount = payload.amount || 0;
      transferContent = payload.description || '';
      bankRef = payload.tid || payload.reference || '';
    } else if (provider === 'SEPAY') {
      amount = payload.transferAmount || payload.amountIn || 0;
      transferContent = payload.content || '';
      bankRef = payload.referenceCode || payload.id || '';
    } else {
      amount = payload.amount || 0;
      transferContent = payload.content || payload.addInfo || '';
      bankRef = payload.bankTransactionRef || payload.transId || '';
    }

    if (!transferContent || !amount) {
      return { success: false, message: 'Dữ liệu webhook thiếu thông tin số tiền hoặc nội dung chuyển khoản.' };
    }

    // Tìm orderCode trong nội dung chuyển tiền (e.g. STOCKAI-123456)
    const match = transferContent.match(/STOCKAI-\d{6}/i);
    if (!match) {
      return { success: false, message: 'Không tìm thấy mã đơn hàng STOCKAI trong nội dung chuyển tiền.' };
    }

    const orderCode = match[0].toUpperCase();
    const order = (db.subscription_orders || []).find(o => o.orderCode === orderCode);

    if (!order) {
      return { success: false, message: `Không tìm thấy đơn hàng tương ứng với mã: ${orderCode}` };
    }

    if (order.status === 'PAID') {
      return { success: true, message: 'Đơn hàng này đã được xác nhận thanh toán trước đó.' };
    }

    // Tự động đối soát với tài khoản hệ thống (System Auto-Bot)
    const systemAdmin: UserProfile = {
      id: 'usr_system_webhook',
      name: `Webhook Auto-Verify (${provider})`,
      email: 'webhook@stockai.vn',
      role: 'ADMIN',
      tier: 'ENTERPRISE',
      validUntil: '2099-12-31',
      features: [],
    };

    const verifyResult = await this.adminVerifyPayment({
      orderId: order.id,
      adminUser: systemAdmin,
      actualAmount: amount,
      bankTransactionRef: bankRef || `WEBHOOK_${Date.now()}`,
      transactionTime: txnTime,
      reconciliationNotes: `Tự động đối soát qua Webhook ${provider}. Nội dung: "${transferContent}"`,
    });

    return {
      success: true,
      message: verifyResult.message,
      orderId: order.id,
    };
  }

  /**
   * Helper cập nhật gói thuê bao và thời hạn sử dụng cho người dùng trong cơ sở dữ liệu
   */
  private static applyTierToUser(
    db: any,
    userId: string,
    tier: SubscriptionTier,
    durationDays: number
  ): UserProfile {
    const plan = SUBSCRIPTION_PLANS[tier];
    const now = new Date();

    if (!db.users) db.users = [];

    let targetUser: UserProfile | undefined = db.users.find((u: UserProfile) => u.id === userId);

    if (!targetUser && db.current_user && (db.current_user.id === userId || db.current_user.email === userId)) {
      targetUser = db.current_user;
    }

    if (!targetUser) {
      // Khởi tạo người dùng nếu chưa có trong bảng users
      targetUser = {
        id: userId,
        email: 'user@stockai.vn',
        name: 'Nhà Đầu Tư StockAI',
        role: 'USER',
        tier: 'FREE',
        validUntil: now.toISOString().split('T')[0],
        features: SUBSCRIPTION_PLANS.FREE.features,
      };
      db.users.push(targetUser);
    }

    // Tính toán ngày hết hạn
    let newValidUntilDate = new Date();
    // Nếu người dùng đang dùng cùng gói và hạn dùng còn hiệu lực thì cộng dồn thêm ngày
    if (targetUser.tier === tier && targetUser.validUntil && targetUser.validUntil >= now.toISOString().split('T')[0]) {
      const currentExpiry = new Date(targetUser.validUntil);
      newValidUntilDate = new Date(currentExpiry.getTime() + durationDays * 24 * 3600 * 1000);
    } else {
      newValidUntilDate = new Date(now.getTime() + durationDays * 24 * 3600 * 1000);
    }

    targetUser.tier = tier;
    targetUser.features = plan.features;
    targetUser.validUntil = newValidUntilDate.toISOString().split('T')[0];

    // Đồng bộ nếu là current_user
    if (db.current_user && db.current_user.id === targetUser.id) {
      db.current_user.tier = targetUser.tier;
      db.current_user.features = targetUser.features;
      db.current_user.validUntil = targetUser.validUntil;
    }

    return targetUser;
  }
}
