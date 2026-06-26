import type { Metadata } from 'next';
import { SignupForm } from './SignupForm';

export const metadata: Metadata = {
  title: 'Sign Up — SudoX',
  description: 'Create a free SudoX account to save your daily puzzle streak, track statistics, and play variants.',
};

export default function SignupPage() {
  return (
    <div className="auth-container">
      <SignupForm />
    </div>
  );
}
