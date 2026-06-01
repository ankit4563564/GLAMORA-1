import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "btn-liquid-gold",
        outline:
          "border border-amber-500/40 bg-white/5 text-cream backdrop-blur hover:border-amber-400/70 hover:bg-amber-500/10 hover:scale-[1.02]",
        ghost: "text-cream-muted hover:bg-white/5 hover:text-cream",
        glass:
          "glass-card text-cream hover:border-amber-500/40 hover:shadow-gold-glow",
        ai: "border border-violet-500/40 bg-violet-950/40 text-cream shadow-ai-glow-sm hover:border-cyan-400/50 hover:shadow-ai-glow",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
