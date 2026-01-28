import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "footer" | "header";
}

export function SectionContainer({
  children,
  className,
  as: Tag = "section",
}: SectionContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </Tag>
  );
}
