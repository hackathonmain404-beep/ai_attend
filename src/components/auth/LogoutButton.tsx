"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { signOut } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";

interface LogoutButtonProps extends ButtonProps {
  showText?: boolean;
}

export function LogoutButton({
  className,
  variant = "ghost",
  size = "sm",
  showText = true,
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.info("Signed out successfully", {
        description: "Your session has been terminated safely.",
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Sign out encounter an error, redirecting to login.");
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={cn("gap-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10", className)}
      {...props}
    >
      {isLoggingOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {showText && <span>Sign Out</span>}
    </Button>
  );
}
