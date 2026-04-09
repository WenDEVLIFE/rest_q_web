"use client";

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { LoginHandler } from '../../src/agents/UserAgent/LoginHandler';
import { formatAuthError, isValidEmail } from '../../src/utils/authentication';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await LoginHandler.login(email, password);
      toast.success("Sign-in successful. Redirecting...");
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1000);
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
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-5 h-5" />}
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

      <p className="text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <button type="button" className="font-bold text-primary hover:underline">
          Sign Up
        </button>
      </p>
    </form>
  );
};

