import { LoginForm } from '@/components/login-form';

function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gray-50 px-4 py-10 md:px-8">
      <LoginForm className="w-full max-w-md" />
    </div>
  );
}

export default LoginPage;
