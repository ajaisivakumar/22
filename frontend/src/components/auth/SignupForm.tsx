import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';
import { signupSchema, SignupFormData } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { GoogleButton } from './GoogleButton';

export const SignupForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, googleLogin, user, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const passwordVal = watch('password', '');
  const hasMinLen = passwordVal.length >= 6;

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/', { replace: true });
    } catch {
      // handled
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await googleLogin();
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Create an account</h2>
        <p className="text-xs text-gray-500">Join with Google or any email you actually use</p>
      </div>

      <GoogleButton onClick={handleGoogleSignIn} isLoading={googleLoading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-medium">Or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Your name"
          autoComplete="name"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@gmail.com"
          autoComplete="email"
          leftIcon={<Mail className="w-4 h-4" />}
          helperText="Any valid email works — Gmail, college, or personal."
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />

          {passwordVal.length > 0 && (
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-gray-600">
                {hasMinLen ? (
                  <Check className="w-3.5 h-3.5 text-brand-green" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className={hasMinLen ? 'text-brand-green' : ''}>At least 6 characters</span>
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          autoComplete="new-password"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex items-start gap-2 pt-1">
          <input
            id="agreeTerms"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            {...register('agreeTerms')}
          />
          <label htmlFor="agreeTerms" className="text-xs text-gray-600 leading-normal">
            I agree to the{' '}
            <span className="text-primary font-medium">Terms of Service</span> and{' '}
            <span className="text-primary font-medium">Community Guidelines</span>.
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-red-600 font-medium">{errors.agreeTerms.message}</p>
        )}

        <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <div className="text-center text-xs text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
