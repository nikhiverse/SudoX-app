import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Login — SudoX',
  description: 'Log in to your SudoX account to track progress and stats.',
};

export default function LoginPage() {
  return (
    <div className="auth-container">
      <LoginForm />
    </div>
  );
}
