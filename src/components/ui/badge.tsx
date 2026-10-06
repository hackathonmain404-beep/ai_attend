import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-800 text-slate-100 hover:bg-slate-700",
        secondary:
          "border-transparent bg-slate-800/80 text-slate-300",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold",
        outline:
          "text-slate-300 border-slate-700",
        emerald:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 font-semibold",
        amber:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 font-semibold",
        crimson:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
