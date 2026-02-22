import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTagColor(tag: string) {
  const defaultColors = [
    "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400",
    "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:bg-orange-500/15 dark:text-orange-400",
    "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400",
    "bg-lime-500/10 text-lime-600 border-lime-500/20 dark:bg-lime-500/15 dark:text-lime-400",
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400",
    "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400",
    "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400",
    "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-400",
    "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 dark:bg-fuchsia-500/15 dark:text-fuchsia-400",
    "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400"
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % defaultColors.length;
  return defaultColors[idx];
}
