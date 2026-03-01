import { LoginForm } from '@/components/login-form';

function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#f8fafc] px-4 py-10 md:px-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white/95 p-6 shadow-xl backdrop-blur-sm md:p-8">
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
