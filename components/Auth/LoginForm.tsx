"use client";

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { LoginHandler } from '../../src/agents/UserAgent/LoginHandler';
import { formatAuthError, isValidEmail } from '../../src/utils/authentication';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { APP_ROUTES } from '../../src/constants/routes';

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Validation
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await LoginHandler.login(email, password);
      const profile = await LoginHandler.getUserProfile(userCredential.user.uid);
      
      toast.success("Sign-in successful. Redirecting...");
      
      const redirectPath = profile?.role === 'admin' ? APP_ROUTES.ADMIN.DASHBOARD : APP_ROUTES.HOME;
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.replace(redirectPath);
      }, 800);
    } catch (err: any) {
      console.error("Login Error:", err);
      toast.error(formatAuthError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-sm">
      <div className="space-y-4">
        <Input
          label="Email Address"
          placeholder="officer@res-q.org"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-5 h-5" />}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-slate-200 rounded-md transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="current-password"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <button type="button" className="text-xs font-bold text-primary hover:underline">
          Forgot Password?
        </button>
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        size="lg"
      >
        Sign In
      </Button>

    </form>
  );
};

