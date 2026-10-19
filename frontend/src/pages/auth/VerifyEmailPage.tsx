import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [loading, setLoading] = useState<boolean>(!!token);
  const [verified, setVerified] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      authService
        .verifyEmail(token)
        .then(() => {
          setVerified(true);
        })
        .catch(() => {
          setVerified(false);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  const handleResend = async () => {
    if (!emailParam) {
      toast.error('Email address not found. Please log in first.');
      return;
    }
    try {
      setResending(true);
      await authService.resendVerification(emailParam);
      toast.success('Verification link resent to ' + emailParam);
    } catch {
      toast.error('Failed to resend verification');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center space-y-6">
      {loading ? (
        <div className="py-8 space-y-3">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-sm text-gray-600">Verifying your college credentials...</p>
        </div>
      ) : verified ? (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Email Verified Successfully!</h2>
          <p className="text-xs text-gray-600">
            Your university account has been confirmed. You now have full access to Campus Connect.
          </p>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Proceed to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-red-100 text-primary rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-xs text-gray-600">
            We sent a verification link to{' '}
            <span className="font-semibold text-gray-800">{emailParam || 'your registered address'}</span>. Please
            click the link in the message to activate your profile.
          </p>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              If you don&apos;t see the email, check your college spam or promotions folder. University filters may take 1-2 minutes.
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <Button variant="secondary" className="w-full" onClick={handleResend} isLoading={resending}>
              Resend Verification Email
            </Button>
            <Link to="/login" className="block text-xs font-semibold text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailPage;
