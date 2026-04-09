"use client";

import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { RegisterHandler } from '../../src/agents/UserAgent/RegisterHandler';
import { isValidEmail } from '../../src/utils/authentication';
import { toast } from 'sonner';
import { OTPVerification } from './OTPVerification';
import { sendEmailOtpCode } from '../../src/service/Email_Service';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export const RegisterForm = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error("Invalid email address.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailOtpCode({
        email: formData.email,
        fullName: formData.name
      });
      toast.success("Verification code sent to your email!");
      setShowOTP(true);
    } catch (err: any) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTP) {
    return (
      <OTPVerification
        email={formData.email}
        name={formData.name}
        password={formData.password}
        onBack={() => setShowOTP(false)}
      />
    );
  }

  return (
    <form onSubmit={handleRequestOTP} className="space-y-6 w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          placeholder="Officer James Doe"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          leftIcon={<User className="w-5 h-5" />}
          required
        />
        <Input
          label="Email Address"
          name="email"
          placeholder="officer@res-q.org"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          leftIcon={<Mail className="w-5 h-5" />}
          required
        />
        <Input
          label="Password"
          name="password"
          placeholder="••••••••"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          leftIcon={<Lock className="w-5 h-5" />}
          required
        />
      </div>

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full"
        size="lg"
        rightIcon={<ArrowRight className="w-5 h-5" />}
      >
        Send Verification Code
      </Button>

    </form>
  );
};
