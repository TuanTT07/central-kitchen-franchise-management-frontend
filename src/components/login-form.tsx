import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';

type FormData = {
  username: string;
  password: string;
};

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [error, setError] = useState<string | null>(null); // Hook để quản lí lỗi
  const [isLoading, setIsLoading] = useState(false); // Hook để quản lí trạng thái đang loading
  const navigate = useNavigate(); // hook để điều hướng
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const onSubmit = async (data: FormData) => {
    const { username, password } = data;
    // Handle form submission logic
    setError(null); // Reset lỗi trước khi submit
    setIsLoading(true); // Bắt đầu trạng thái loading
    try {
      const payload = await authService.signIn(username, password);

      localStorage.setItem('authToken', payload.access_token);
      localStorage.setItem('refreshToken', payload.refresh_token);
      localStorage.setItem('userRole', payload.user.roles[0]); // Lưu role đầu tiên của user
      localStorage.setItem('user', JSON.stringify(payload.user)); // Lưu thông tin người dùng dưới dạng JSON

      navigate('/', { replace: true });
      console.log('Đăng nhập thành công:', payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Đăng nhập Kitchen Hub</CardTitle>
          <CardDescription>Nhập Username và mật khẩu để tiếp tục.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  type="text"
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
                  autoComplete="username"
                />
                {errors.username && (
                  <FieldDescription className="mt-1 text-xs text-red-500">{errors.username.message}</FieldDescription>
                )}
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
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
                {errors.password && (
                  <FieldDescription className="mt-1 text-xs text-red-500">{errors.password.message}</FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={isLoading}>
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Field>
              {/* Hiển thị error nếu có */}
              {error && <div className="error-message">{error}</div>}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
