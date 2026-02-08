import { Fingerprint, Orbit, Radar } from "lucide-react";

export function LogoMark() {
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-lg shadow-[hsl(var(--primary))]/20">
      <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-sky-400/35 via-cyan-300/20 to-blue-500/35" />
      <Orbit className="relative z-10 h-4 w-4 text-sky-600 dark:text-sky-300" />
      <Radar className="absolute z-10 h-8 w-8 text-sky-500/55 dark:text-sky-200/55" strokeWidth={1.5} />
      <Fingerprint className="absolute z-10 h-3.5 w-3.5 translate-x-2 translate-y-2 text-blue-700/70 dark:text-blue-200/70" />
    </div>
  );
}