import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  try {
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours, 10);
    const m = minutes ? `:${minutes}` : ":00";
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedH = h % 12 || 12;
    return `${formattedH}${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

export function formatMedInstruction(instruction?: string | null, lang: string = "en"): string {
  if (!instruction) return "";

  if (lang === "bn") {
    let bn = instruction
      .replace(/0/g, "০")
      .replace(/1/g, "১")
      .replace(/2/g, "২")
      .replace(/3/g, "৩")
      .replace(/4/g, "৪")
      .replace(/5/g, "৫")
      .replace(/6/g, "৬")
      .replace(/7/g, "৭")
      .replace(/8/g, "৮")
      .replace(/9/g, "৯");

    bn = bn
      .replace(/\bdays?\b/gi, "দিন")
      .replace(/\bweeks?\b/gi, "সপ্তাহ")
      .replace(/\bmonths?\b/gi, "মাস")
      .replace(/\byears?\b/gi, "বছর")
      .replace(/\btimes?\s+daily\b/gi, "বার")
      .replace(/\btime\(s\)\s+daily\b/gi, "বার")
      .replace(/\bMorning\b/gi, "সকাল")
      .replace(/\bAfternoon\b/gi, "দুপুর")
      .replace(/\bNoon\b/gi, "দুপুর")
      .replace(/\bNight\b/gi, "রাত")
      .replace(/Take 30 mins before meals/gi, "খাওয়ার আধা ঘণ্টা আগে")
      .replace(/Before meals/gi, "খাবার আগে")
      .replace(/After meals/gi, "খাওয়ার পর")
      .replace(/With meals/gi, "ভরা পেটে")
      .replace(/On an empty stomach/gi, "খালি পেটে");

    return bn.trim();
  }

  // Convert to English
  let en = instruction
    .replace(/০/g, "0")
    .replace(/১/g, "1")
    .replace(/২/g, "2")
    .replace(/৩/g, "3")
    .replace(/৪/g, "4")
    .replace(/৫/g, "5")
    .replace(/৬/g, "6")
    .replace(/৭/g, "7")
    .replace(/৮/g, "8")
    .replace(/৯/g, "9");

  en = en
    .replace(/দিন/g, "days")
    .replace(/সপ্তাহ/g, "weeks")
    .replace(/মাস/g, "months")
    .replace(/বছর/g, "years")
    .replace(/বার/g, "times daily")
    .replace(/সকালে/g, "Morning")
    .replace(/সকাল/g, "Morning")
    .replace(/দুপুরে/g, "Noon")
    .replace(/দুপুর/g, "Noon")
    .replace(/রাতে/g, "Night")
    .replace(/রাত/g, "Night")
    .replace(/খাওয়ার আধা ঘণ্টা আগে খাবেন/g, "Take 30 mins before meals")
    .replace(/খাওয়ার আধা ঘণ্টা আগে/g, "Take 30 mins before meals")
    .replace(/খাওয়ার আধা ঘন্টা আগে/g, "Take 30 mins before meals")
    .replace(/খাওয়ার আগে/g, "Before meals")
    .replace(/খাবার আগে/g, "Before meals")
    .replace(/খাওয়ার পর/g, "After meals")
    .replace(/খাবার পর/g, "After meals")
    .replace(/ভরা পেটে/g, "With meals")
    .replace(/খালি পেটে/g, "On an empty stomach")
    .replace(/নিয়মিত/g, "Regularly")
    .replace(/প্রয়োজনে/g, "As needed")
    .replace(/চলবে/g, "Continue");

  en = en.replace(/\b1\s+times\s+daily\b/gi, "1 time daily");

  return en.replace(/\s+/g, " ").trim();
}
