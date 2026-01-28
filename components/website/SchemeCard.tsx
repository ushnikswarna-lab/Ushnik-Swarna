import Link from "next/link";
import { GoldButton } from "./GoldButton";
import { cn } from "@/lib/utils";

export interface SchemeCardProps {
  id: string;
  name: string;
  monthlyAmount: number;
  durationMonths: number;
  type: "gold" | "silver";
  bonus?: string;
  className?: string;
}

export function SchemeCard({
  id,
  name,
  monthlyAmount,
  durationMonths,
  type,
  bonus,
  className,
}: SchemeCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <span
        className={cn(
          "mb-2 inline-block w-fit rounded-full px-3 py-0.5 text-xs font-medium uppercase tracking-wide",
          type === "gold"
            ? "bg-amber-50 text-amber-800"
            : "bg-slate-100 text-slate-700"
        )}
      >
        {type}
      </span>
      <h3 className="font-serif text-xl font-semibold text-[#1a1a1a]">
        {name}
      </h3>
      <p className="mt-2 text-2xl font-bold text-[#b8962e]">
        ₹{monthlyAmount.toLocaleString("en-IN")}
        <span className="ml-1 text-sm font-normal text-[#666]">/ month</span>
      </p>
      <p className="mt-1 text-sm text-[#666]">
        {durationMonths} months · Total ₹
        {(monthlyAmount * durationMonths).toLocaleString("en-IN")}
      </p>
      {bonus && (
        <p className="mt-2 text-sm text-[#1a1a1a]">{bonus}</p>
      )}
      <div className="mt-6">
        <GoldButton href={`/schemes?join=${id}`}>Join Scheme</GoldButton>
      </div>
    </article>
  );
}
