"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { RegisterHandler } from '../../src/agents/UserAgent/RegisterHandler';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { verifyEmailOtpCode } from '../../src/service/Email_Service';
import { APP_ROUTES } from '../../src/constants/routes';

interface OTPVerificationProps {
  email: string;
  name: string;
  password: string;
  onBack: () => void;
}

export const OTPVerification = ({ 
  email, 
  name, 
  password, 
  onBack 
}: OTPVerificationProps) => {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow 1 char
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOTP = otp.join('');

    if (enteredOTP.length < 6) {
      toast.error("Please enter the full 6-digit code.");
      return;
    }

    if (!await verifyEmailOtpCode({ email, code: enteredOTP })) {
      toast.error("Invalid verification code. Please try again.");
      return;
    }

    setIsLoading(true);
    try {
      await RegisterHandler.register(email, password, name);
      toast.success("Account created successfully!");
      setTimeout(() => {
        router.push(APP_ROUTES.LOGIN);
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO DETAILS
        </button>
        <h2 className="text-2xl font-black tracking-tight">Verify Your Email</h2>
        <p className="text-sm text-slate-500">
          We sent a 6-digit code to <span className="font-bold text-slate-900">{email}</span>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-between gap-2">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el) as any}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 bg-slate-50 border-2 border-slate-200 rounded-xl text-center text-xl font-black text-slate-900 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          ))}
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full"
            size="lg"
            variant="primary"
            rightIcon={<CheckCircle2 className="w-5 h-5" />}
          >
            Verify & Create Account
          </Button>
          
          <p className="text-center text-xs text-slate-400">
            Didn't receive the code?{" "}
            <button type="button" className="font-bold text-primary hover:underline">
              Resend Code
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
