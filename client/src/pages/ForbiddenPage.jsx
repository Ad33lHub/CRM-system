import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button.jsx';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center max-w-md">
        <div className="flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-full mb-6 shadow-2xl">
          <ShieldAlert className="h-12 w-12 text-rose-500" />
        </div>
        <h1 className="text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-rose-400 to-red-500 bg-clip-text text-transparent">
          403
        </h1>
        <h2 className="text-2xl font-bold mt-4 tracking-tight">Access Forbidden</h2>
        <p className="text-slate-400 mt-2 text-sm">
          You don&apos;t have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate(-1)} className="mt-8 bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20 px-8 py-6 rounded-xl text-base font-semibold">
          Go Back
        </Button>
      </div>
    </div>
  );
}
