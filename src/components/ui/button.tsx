import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(125,155,122,0.28)] hover:brightness-105 hover:-translate-y-px active:translate-y-0",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        outline:
          "border border-border bg-card/90 text-foreground shadow-sm hover:bg-accent/80 hover:border-primary/30",
        ghost: "hover:bg-accent/70 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        default: "h-11 min-h-11 px-4 py-2 sm:h-10 sm:min-h-10",
        sm: "h-10 min-h-10 rounded-xl px-3 sm:h-9 sm:min-h-9",
        lg: "h-12 min-h-12 rounded-2xl px-6 text-base sm:px-8",
        icon: "h-11 w-11 min-h-11 min-w-11 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
