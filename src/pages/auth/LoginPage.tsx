/**
 * File: LoginPage.tsx
 * Description: Trang đăng nhập. Chỉ bố cục khung (nền, căn giữa); form thực tế nằm trong `LoginForm`.
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { LoginForm } from '@/components/login-form';

// ================= COMPONENT =================

/**
 * LoginPage — route `/login`
 * - `min-h-dvh`: chiều cao tối thiểu = viewport (1 màn hình).
 * - `place-items-center`: căn nội dung giữa theo cả ngang và dọc.
 * - `max-w-md` truyền xuống LoginForm: giới hạn độ rộng thẻ form (dễ đọc trên màn lớn).
 */
function LoginPage() {
  return (
    <div className="grid min-h-dvh w-full place-items-center bg-gray-50 p-4 sm:p-6">
      <LoginForm className="w-full max-w-md" />
    </div>
  );
}

export default LoginPage;
