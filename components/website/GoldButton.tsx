import Link from "next/link";
import { cn } from "@/lib/utils";

type GoldButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export function GoldButton({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
  disabled,
}: GoldButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary:
      "bg-[#d4af37] text-white hover:bg-[#b8962e] shadow-md hover:shadow-lg active:scale-[0.98]",
    outline:
      "border-2 border-[#d4af37] text-[#b8962e] hover:bg-[#fffef7] bg-white",
    ghost: "text-[#b8962e] hover:bg-[#fffef7]",
  };
  const styles = cn(base, variants[variant], className);

  if (href && !disabled) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
