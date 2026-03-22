import { LoginForm } from '@/components/login-form';

function LoginPage() {
  return (
    <div className="grid min-h-dvh w-full place-items-center bg-gray-50 p-4 sm:p-6">
      <LoginForm className="w-full max-w-md" />
    </div>
  );
}

export default LoginPage;
