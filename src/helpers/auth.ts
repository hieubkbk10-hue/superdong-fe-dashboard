export const TOKEN_STORAGE_KEY = 'superdong_access_token';
export const LEGACY_TOKEN_STORAGE_KEY = 'superdong_token';
export const USER_STORAGE_KEY = 'superdong_user';

/**
 * Lấy Access Token đã lưu trong LocalStorage
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
}

/**
 * Lưu trữ Token và Thông tin người dùng vào LocalStorage
 */
export function setStoredAuth(token: string, user?: any): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_STORAGE_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, typeof user === 'string' ? user : JSON.stringify(user));
  }
}

export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Xóa sạch toàn bộ thông tin đăng nhập và Token trong LocalStorage
 */
export function clearStoredAuth(): void {

  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Kiểm tra xem Token JWT đã hết hạn hay chưa (dựa trên claim exp)
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  if (token.startsWith('demo_token')) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Không phải format JWT chuẩn 3 phần
      return false;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && typeof parsed.exp === 'number') {
      // Nếu exp * 1000 nhỏ hơn thời gian hiện tại (thêm 5 giây buffer) -> đã hết hạn
      return parsed.exp * 1000 <= Date.now() + 5000;
    }
  } catch {
    // Nếu giải mã lỗi, coi như token không hợp lệ
    return true;
  }

  return false;
}

/**
 * Kiểm tra người dùng có đang đăng nhập với Token hợp lệ hay không
 */
export function isAuthenticated(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Tự động chuyển hướng về trang /login và lưu lại returnTo
 */
let isRedirecting = false;
export function redirectToLogin(customReturnTo?: string): void {
  if (typeof window === 'undefined') return;

  clearStoredAuth();

  const currentPath = window.location.pathname + window.location.search;
  if (currentPath.startsWith('/login')) {
    return;
  }

  if (isRedirecting) return;
  isRedirecting = true;

  const targetPath = customReturnTo || currentPath;
  const loginUrl = targetPath && targetPath !== '/' && !targetPath.startsWith('/login')
    ? `/login?returnTo=${encodeURIComponent(targetPath)}`
    : '/login';

  // Điều hướng ngay lập tức
  window.location.replace(loginUrl);
}
