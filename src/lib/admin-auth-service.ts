import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase } from '@/lib/db';
import { AdminAccount, AdminAuditLog } from '@/types';

const SESSION_SECRET = process.env.SESSION_SECRET || 'stockai-secure-oauth-secret-token-key-2026';
export const ADMIN_COOKIE_NAME = 'stockai_admin_session';
const ADMIN_SESSION_DURATION_MS = 30 * 24 * 3600 * 1000; // 30 ngày

export interface AdminSessionPayload {
  adminId: string;
  username: string;
  email: string;
  role: 'ADMIN';
  mustChangePassword?: boolean;
  createdAt: number;
  expiresAt: number;
}

export class AdminAuthService {
  /**
   * Băm mật khẩu an toàn với bcrypt (Salt rounds = 12)
   */
  static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 12);
  }

  /**
   * So khớp mật khẩu với bcrypt (kèm hỗ trợ tự động nâng cấp nếu còn dùng chuẩn cũ)
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;

    // 1. Định dạng chuẩn Bcrypt ($2a$, $2b$, $2y$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      try {
        return bcrypt.compareSync(password, storedHash);
      } catch {
        return false;
      }
    }

    // 2. Tương thích ngược an toàn với định dạng Scrypt cũ (salt:hash)
    if (storedHash.includes(':')) {
      try {
        const [salt, expectedHash] = storedHash.split(':');
        const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
        const bufA = Buffer.from(expectedHash, 'hex');
        const bufB = Buffer.from(calculatedHash, 'hex');
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Lấy hoặc khởi tạo tài khoản quản trị viên duy nhất trong hệ thống
   * Mật khẩu khởi tạo được băm bằng bcrypt, không bao giờ lưu văn bản rõ.
   * Tên đăng nhập chuẩn: triqn (chấp nhận cả admin và triqnnamabank@gmail.com khi đăng nhập)
   */
  static getOrInitAdminAccount(): AdminAccount {
    const db = getDatabase();

    if (db.admin_account) {
      // Đảm bảo username chuẩn hoá về triqn
      if (db.admin_account.username !== 'triqn') {
        db.admin_account.username = 'triqn';
        saveDatabase(db);
      }
      return db.admin_account;
    }

    // Khởi tạo tài khoản Admin mặc định an toàn bằng bcrypt
    const initialPlainPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin@2026';
    const passwordHash = this.hashPassword(initialPlainPassword);

    const defaultAdmin: AdminAccount = {
      id: 'usr_stockai_lead',
      username: 'triqn',
      email: 'triqnnamabank@gmail.com',
      name: 'Quang Nhựt Trí (Admin)',
      role: 'ADMIN',
      passwordHash,
      mustChangePassword: true, // Yêu cầu đổi mật khẩu sau lần đăng nhập đầu tiên
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
    };

    db.admin_account = defaultAdmin;
    saveDatabase(db);

    return defaultAdmin;
  }

  /**
   * Xác thực thông tin đăng nhập Admin
   */
  static authenticate(
    usernameOrEmail: string,
    password: string,
    ipAddress?: string
  ): {
    success: boolean;
    message: string;
    account?: AdminAccount;
    mustChangePassword?: boolean;
  } {
    const db = getDatabase();
    if (!db.admin_account) {
      db.admin_account = this.getOrInitAdminAccount();
    }
    const admin = db.admin_account;

    const normalizedInput = (usernameOrEmail || '').trim().toLowerCase();
    const isUsernameMatch = 
      normalizedInput === 'triqn' || 
      normalizedInput === 'admin' || 
      admin.username.toLowerCase() === normalizedInput;
    const isEmailMatch = 
      admin.email.toLowerCase() === normalizedInput || 
      normalizedInput === 'triqnnamabank@gmail.com';

    if (!isUsernameMatch && !isEmailMatch) {
      return {
        success: false,
        message: 'Tài khoản hoặc tên đăng nhập Quản trị viên không tồn tại.',
      };
    }

    // Kiểm tra khóa tạm thời do nhập sai quá nhiều lần (Brute-force protection)
    const now = Date.now();
    if (admin.lockedUntil && new Date(admin.lockedUntil).getTime() > now) {
      const waitMinutes = Math.ceil((new Date(admin.lockedUntil).getTime() - now) / 60000);
      return {
        success: false,
        message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`,
      };
    }

    // Kiểm tra mật khẩu
    const isValid = this.verifyPassword(password, admin.passwordHash);

    if (!isValid) {
      const failedAttempts = (admin.failedLoginAttempts || 0) + 1;
      admin.failedLoginAttempts = failedAttempts;

      if (failedAttempts >= 5) {
        admin.lockedUntil = new Date(now + 15 * 60 * 1000).toISOString(); // Khóa 15 phút
      }

      saveDatabase(db);

      return {
        success: false,
        message: failedAttempts >= 5
          ? 'Nhập sai quá 5 lần. Tài khoản đã bị tạm khóa trong 15 phút để bảo vệ.'
          : `Mật khẩu quản trị viên không chính xác. Còn lại ${5 - failedAttempts} lần thử.`,
      };
    }

    // Nếu mật khẩu cũ là scrypt, tự động nâng cấp hash sang bcrypt
    if (admin.passwordHash.includes(':')) {
      admin.passwordHash = this.hashPassword(password);
    }
    if (admin.username !== 'triqn') {
      admin.username = 'triqn';
    }

    // Đăng nhập thành công -> Reset số lần thất bại, ghi nhận thời gian
    admin.failedLoginAttempts = 0;
    admin.lockedUntil = undefined;
    admin.lastLoginAt = new Date().toISOString();

    // Ghi nhận Audit Log (TUYỆT ĐỐI KHÔNG ĐƯA MẬT KHẨU VÀO LOG)
    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_login`,
      action: 'ADMIN_LOGIN',
      targetUserId: admin.id,
      targetUserEmail: admin.email,
      performedBy: { id: admin.id, email: admin.email, role: 'ADMIN' },
      timestamp: new Date().toISOString(),
      details: {
        username: admin.username,
        ipAddress: ipAddress || 'Unknown',
        loginMethod: 'BCRYPT_HASH_VERIFIED',
      },
      ipAddress,
    };

    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.unshift(auditLog);
    if (db.audit_logs.length > 200) db.audit_logs = db.audit_logs.slice(0, 200);

    saveDatabase(db);

    return {
      success: true,
      message: 'Đăng nhập Quản trị viên thành công.',
      account: admin,
      mustChangePassword: admin.mustChangePassword ?? false,
    };
  }

  /**
   * Đổi mật khẩu tài khoản Quản trị viên
   */
  static changePassword(
    currentPassword: string,
    newPassword: string,
    ipAddress?: string
  ): { success: boolean; message: string } {
    const db = getDatabase();
    if (!db.admin_account) {
      db.admin_account = this.getOrInitAdminAccount();
    }
    const admin = db.admin_account;

    // 1. Kiểm tra mật khẩu hiện tại
    if (!this.verifyPassword(currentPassword, admin.passwordHash)) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
    }

    // 2. Kiểm tra độ mạnh của mật khẩu mới
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' };
    }

    if (currentPassword === newPassword) {
      return { success: false, message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' };
    }

    // 3. Băm bằng bcrypt và lưu mật khẩu mới
    admin.passwordHash = this.hashPassword(newPassword);
    admin.mustChangePassword = false; // Đã đổi xong mật khẩu lần đầu
    admin.failedLoginAttempts = 0;

    // 4. Ghi Audit Log
    const auditLog: AdminAuditLog = {
      id: `aud_${Date.now()}_pwd`,
      action: 'ADMIN_CHANGE_PASSWORD',
      targetUserId: admin.id,
      targetUserEmail: admin.email,
      performedBy: { id: admin.id, email: admin.email, role: 'ADMIN' },
      timestamp: new Date().toISOString(),
      details: {
        note: 'Quản trị viên đã cập nhật mật khẩu mới bằng Bcrypt thành công.',
        ipAddress: ipAddress || 'Unknown',
      },
      ipAddress,
    };

    if (!db.audit_logs) db.audit_logs = [];
    db.audit_logs.unshift(auditLog);
    saveDatabase(db);

    return { success: true, message: 'Đổi mật khẩu Quản trị viên thành công!' };
  }

  /**
   * Ký token phiên Admin an toàn (HMAC-SHA256)
   */
  static signAdminSession(payload: AdminSessionPayload): string {
    const rawPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(rawPayload)
      .digest('base64url');
    return `${rawPayload}.${signature}`;
  }

  /**
   * Giải mã và xác thực token phiên Admin
   */
  static verifyAdminSession(token: string): AdminSessionPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [rawPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(rawPayload)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    try {
      const decoded = JSON.parse(
        Buffer.from(rawPayload, 'base64url').toString('utf-8')
      ) as AdminSessionPayload;

      if (decoded.expiresAt && decoded.expiresAt < Date.now()) {
        return null; // Token hết hạn
      }

      if (decoded.role !== 'ADMIN') return null;

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Tạo token phiên đăng nhập cho Admin
   */
  static createAdminToken(account: AdminAccount): string {
    const now = Date.now();
    const payload: AdminSessionPayload = {
      adminId: account.id,
      username: account.username,
      email: account.email,
      role: 'ADMIN',
      mustChangePassword: account.mustChangePassword,
      createdAt: now,
      expiresAt: now + ADMIN_SESSION_DURATION_MS,
    };
    return this.signAdminSession(payload);
  }

  /**
   * Lấy tài khoản Admin đã xác thực từ Request (Kiểm tra cookie phiên)
   */
  static getAuthenticatedAdminFromRequest(req: Request): AdminAccount | null {
    const cookieHeader = req.headers.get('cookie') || '';

    // 1. Kiểm tra cookie riêng: stockai_admin_session
    const adminMatch = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`)
    );
    if (adminMatch && adminMatch[1]) {
      const session = this.verifyAdminSession(adminMatch[1]);
      if (session && session.role === 'ADMIN') {
        return this.getOrInitAdminAccount();
      }
    }

    // 2. Kiểm tra Header token nội bộ (dành cho API test hoặc webhook tin cậy)
    const headerAdminSecret = req.headers.get('x-admin-key');
    const configuredSecret = process.env.ADMIN_API_KEY || 'stockai_internal_admin_key_2026';
    if (headerAdminSecret && headerAdminSecret === configuredSecret) {
      return this.getOrInitAdminAccount();
    }

    return null;
  }
}
