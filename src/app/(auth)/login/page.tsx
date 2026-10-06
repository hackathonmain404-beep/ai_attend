import Link from "next/link";
import { ShieldCheck, LogIn, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#070b12] text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 p-6 backdrop-blur-md shadow-2xl">
        <CardHeader className="text-center p-0 mb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <Badge variant="outline" className="mx-auto mb-2 border-emerald-500/30 text-emerald-400">
            Phase 1 Auth Gate
          </Badge>
          <CardTitle className="text-2xl font-bold text-white">AttendGuard Login</CardTitle>
          <CardDescription className="text-slate-400 text-xs mt-1">
            Sign in with institutional credentials to access verified attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <p className="text-xs text-slate-400 text-center bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            Authentication UI is scheduled for Phase 1. Use the portal gateway to explore shells.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="emerald" className="w-full gap-2">
              <Link href="/">
                <LogIn className="h-4 w-4" />
                Return to Portal Gateway
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
