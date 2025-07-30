import { cn } from "@/lib/utils";

export function HariumLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-black animate-breathing",
        className
      )}
    >
      <span className="text-lg font-black text-white">H</span>
    </div>
  );
}
