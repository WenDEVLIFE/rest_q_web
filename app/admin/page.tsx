import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminDashboardClient } from './AdminDashboardClient';

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <AdminDashboardClient />
    </Suspense>
  );
}
