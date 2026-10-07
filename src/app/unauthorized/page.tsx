import { Suspense } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/LogoutButton";

function UnauthorizedContent() {
  return (
    <Card className="w-full max-w-md border-amber-500/30 bg-slate-900/80 backdrop-blur-xl p-8 text-center shadow-2xl">
      <CardHeader className="p-0 mb-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="flex justify-center mb-2">
          <Badge variant="amber" className="text-xs">
            403 Role Forbidden
          </Badge>
        </div>
        <CardTitle className="text-2xl font-black text-white">Access Restricted</CardTitle>
        <CardDescription className="text-slate-400 text-xs mt-2 leading-relaxed">
          Your current account role does not have authorization to view this institutional perimeter.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 text-xs text-slate-300 space-y-1 text-left">
          <p className="font-semibold text-white">Why am I seeing this?</p>
          <p className="text-slate-400">
            Student accounts cannot access faculty lecture controls, and faculty accounts cannot submit student attendance scans.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          <Button asChild variant="emerald" className="w-full gap-2 font-bold">
            <Link href="/">
              <Home className="h-4 w-4" />
              Return to Portal Gateway
            </Link>
          </Button>

          <LogoutButton
            variant="outline"
            className="w-full border-slate-700 text-slate-300 hover:text-white"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-[#070b12] via-[#091120] to-[#070b12] text-slate-100">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading security perimeter...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </main>
  );
}
