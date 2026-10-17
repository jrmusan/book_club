import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "outline" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        variant === "secondary" && "border-transparent bg-accent text-accent-foreground",
        variant === "outline" && "border-border bg-muted text-foreground",
        variant === "success" && "border-transparent bg-primary/20 text-primary",
        className
      )}
      {...props}
    />
  );
}
