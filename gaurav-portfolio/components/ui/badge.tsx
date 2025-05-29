import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-white",
        className
      )}
      {...props}
    />
  );
}
