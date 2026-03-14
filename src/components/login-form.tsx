/**
 * File: login-form.tsx
 * Description: Component xử lý đăng nhập người dùng
 * Author: Tuan Tran
 * Created: 2026
 */

// ================= IMPORTS =================

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { CookingPot, Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

/**
 * LoginForm Component
 * - Thu thập thông tin đăng nhập
 * - Gọi API xác thực
 * - Hiển thị thông báo thành công/thất báo
 * - Điều hướng sau khi đăng nhập
 */

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  // ================= STATE =================

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ================= UTILS =================

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // ================= HANDLER =================

  const onSubmit = async (data: FormData) => {
    const { username, password } = data;
    setError(null);
    setIsLoading(true);
    try {
      const payload: any = await authService.signIn(username, password);

      localStorage.setItem('authToken', payload.access_token ?? '');
      localStorage.setItem('refreshToken', payload.refresh_token ?? '');
      if (payload.user) {
        localStorage.setItem('userRole', payload.user.roles?.[0] ?? '');
        localStorage.setItem('user', JSON.stringify(payload.user));
      }

      toast.success('Đăng nhập thành công!', {
        description: `Chào mừng ${payload.user?.username || 'bạn'} quay trở lại.`,
      });

      navigate('/', { replace: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(errorMsg);
      toast.error('Đăng nhập thất bại', {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================= RENDER =================

  return (
    <div className={cn('w-full max-w-md rounded-2xl bg-white px-8 py-8 shadow-xl', className)} {...props}>
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <CookingPot className="h-5 w-5 text-orange-500" />
          </div>
          <span className="text-lg font-semibold text-gray-900">Kitchen Hub</span>
        </div>
        <h1 className="mt-1 text-sm font-medium text-gray-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-gray-500">Hệ thống quản lý bếp trung tâm</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-6">
        <FieldGroup className="gap-5">
          {/* Tài khoản */}
          <Field>
            <FieldLabel htmlFor="username" className="text-sm font-medium text-gray-700">
              Tài khoản
            </FieldLabel>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 -mt-2 text-orange-400">
                <User className="h-4 w-4" />
              </span>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Tài khoản"
                className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                {...register('username', {
                  required: 'Username không được để trống',
                  maxLength: {
                    value: 255,
                    message: 'Username không được vượt quá 255 ký tự',
                  },
                  minLength: {
                    value: 3,
                    message: 'Username phải có ít nhất 3 ký tự',
                  },
                })}
              />
            </div>
            {errors.username && (
              <FieldDescription className="mt-1 text-[11px] text-rose-600">{errors.username.message}</FieldDescription>
            )}
          </Field>

          {/* Mật khẩu */}
          <Field>
            <FieldLabel htmlFor="password" className="text-sm font-medium text-gray-700">
              Mật khẩu
            </FieldLabel>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 -mt-2 text-orange-400">
                <Lock className="h-4 w-4" />
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 -mt-2 text-orange-300 hover:text-orange-400"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mật khẩu"
                className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                {...register('password', {
                  required: 'Mật khẩu không được để trống',
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự',
                  },
                  maxLength: {
                    value: 120,
                    message: 'Mật khẩu không được vượt quá 120 ký tự',
                  },
                })}
              />
            </div>
            {errors.password && (
              <FieldDescription className="mt-1 text-[11px] text-rose-600">{errors.password.message}</FieldDescription>
            )}
            <div className="mt-1 text-right">
              <button type="button" className="text-sm font-medium text-orange-500 hover:text-orange-600">
                Quên mật khẩu?
              </button>
            </div>
          </Field>

          {/* Nút submit */}
          <Field>
            <Button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-white"
              disabled={isLoading}
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </Field>

          {error && (
            <div className="mt-1 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-center text-[11px] text-rose-700">
              {error}
            </div>
          )}
        </FieldGroup>
      </form>
    </div>
  );
}

// ================= TYPES =================

type FormData = {
  username: string;
  password: string;
};
