import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Home, ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/20">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 mb-3">
          <span>Error 404</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The requested page or resource could not be found within the AttendGuard verification perimeter.
        </p>
        <div className="flex justify-center">
          <Button asChild variant="emerald" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return to Portal Gateway
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
