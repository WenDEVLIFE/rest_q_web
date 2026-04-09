"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoginForm } from "../../components/Auth/LoginForm";
import { RegisterForm } from "../../components/Auth/RegisterForm";
import { useAuth } from "../../src/context/AuthContext";
import { APP_ROUTES } from "../../src/constants/routes";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    const redirectPath = profile?.role === "admin" ? APP_ROUTES.ADMIN.DASHBOARD : APP_ROUTES.HOME;
    router.replace(redirectPath);
  }, [loading, user, profile, router]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden items-center justify-center p-4">
      {/* Centered Auth Card */}
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Branding Header */}
        <div className="flex flex-col items-center gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-primary/20 bg-white">
            <Image
              src="/logo.png"
              alt="Res-Q Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-black tracking-tighter">Res-Q</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Emergency Response System
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              {isRegistering ? "Create an Account" : "Access Console"}
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
              {isRegistering
                ? "Join the emergency response network to register and track incidents."
                : "Enter your credentials to access the mission-critical dispatch center."}
            </p>
          </div>

          {isRegistering ? (
            <RegisterForm />
          ) : (
            <LoginForm />
          )}

          <div className="text-center pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-all underline underline-offset-4"
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Res-Q Emergency Systems © 2026
          </p>
        </div>
      </div>
    </div>
  );
}




