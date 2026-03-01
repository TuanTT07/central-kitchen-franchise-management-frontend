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
      const response = await authService.signIn(username, password);

      localStorage.setItem('authToken', response.token);
      localStorage.setItem('userRole', response.role.roleName);
      localStorage.setItem('user', JSON.stringify(response.user));

      navigate('/', { replace: true });
      console.log('Đăng nhập thành công:', response);
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
          <CardDescription>Nhập email và mật khẩu để tiếp tục.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  {...register('username', {
                    required: 'Email không được để trống',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                  autoComplete="email"
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
                <FieldDescription className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  <span className="font-medium">Tài khoản thử theo từng vai trò:</span>
                  <br />
                  ADMIN: <span className="font-medium">admin@example.com / admin123</span>
                  <br />
                  FRANCHISE: <span className="font-medium">franchise@example.com / franchise123</span>
                  <br />
                  MANAGER: <span className="font-medium">manager@example.com / manager123</span>
                  <br />
                  SUPPLIER: <span className="font-medium">supplier@example.com / supplier123</span>
                  <br />
                  CENTRAL_KITCHEN: <span className="font-medium">central@example.com / central123</span>
                </FieldDescription>
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
