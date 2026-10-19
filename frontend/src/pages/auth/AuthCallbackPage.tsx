import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../../components/ui/Spinner';

export const AuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setError('Google sign-in did not return a session. Please try again.');
        return;
      }
      localStorage.setItem('token', token);
      await refreshUser();
      navigate('/', { replace: true });
    };
    run();
  }, [navigate, refreshUser, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center space-y-3">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            className="text-sm font-semibold text-primary hover:underline"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Spinner size="lg" color="primary" className="mx-auto" />
        <p className="text-sm text-gray-600 font-medium">Finishing Google sign-in…</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
