import { LoginForm } from "../../components/Auth/LoginForm";
import { Activity } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900 overflow-hidden">
      {/* Left Side: Hero Image (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Real Hero Image */}
        <Image
          src="/login-hero.png"
          alt="Emergency Response Scene"
          fill
          priority
          className="object-cover brightness-[0.85]"
        />

        {/* Logo Overlay */}
        <div className="relative z-10 flex items-center gap-3 p-12 w-full">
          <div className="p-2.5 bg-primary/90 backdrop-blur-md rounded-xl text-white shadow-xl">
            <Activity className="w-8 h-8" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
            Res-Q
          </span>
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-12 left-12 z-10 text-xs font-bold text-white/80 uppercase tracking-widest drop-shadow-sm">
          Res-Q Emergency Systems © 2026
        </div>

        {/* Subtle Gradient Overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          <span className="text-xl font-bold tracking-tight">Res-Q</span>
        </div>

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome to Res-Q</h2>
            <p className="text-slate-500 font-medium">Please sign in to register the incident.</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}


