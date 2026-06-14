import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button.jsx';
import { HelpCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-[20%] left-[30%] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />

      <div className="z-10 flex flex-col items-center text-center max-w-md">
        <div className="flex items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-full mb-6 shadow-2xl">
          <HelpCircle className="h-12 w-12 text-blue-500" />
        </div>
        <h1 className="text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-2xl font-bold mt-4 tracking-tight">Page Not Found</h2>
        <p className="text-slate-400 mt-2 text-sm">
          Sorry, we couldn&apos;t find the page you are looking for. It might have been moved or deleted.
        </p>
        <Button onClick={() => navigate('/dashboard')} className="mt-8 shadow-lg shadow-blue-500/20 px-8 py-6 rounded-xl text-base font-semibold">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
