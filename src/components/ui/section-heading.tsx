import { NicheMark } from "@/components/brand/niche-mark";
import { cn } from "@/lib/site";

type Tone = "light" | "dark" | "zaytun" | "sabili";

const eyebrowTone: Record<Tone, string> = {
  light: "text-gold-deep",
  dark: "text-gold",
  zaytun: "text-gold-light",
  sabili: "text-sabili-yellow",
};

const leadTone: Record<Tone, string> = {
  light: "text-muted",
  dark: "text-paper/75",
  zaytun: "text-paper/80",
  sabili: "text-paper/75",
};

/** Eyebrow + title + lead: the one way every section and page opens. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  lead,
  as: Tag = "h2",
  size = "lg",
  tone = "light",
  className,
  titleClassName,
}: {
  id?: string;
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  as?: "h1" | "h2";
  size?: "xl" | "lg" | "md";
  tone?: Tone;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className={cn("text-eyebrow mb-3 flex items-center gap-2", eyebrowTone[tone])}>
          <NicheMark />
          {eyebrow}
        </p>
      ) : null}
      <Tag
        id={id}
        className={cn(size === "xl" ? "text-display-xl" : size === "lg" ? "text-display-lg" : "text-display-md", titleClassName)}
      >
        {title}
      </Tag>
      {lead ? <p className={cn("text-body-lg mt-4", leadTone[tone])}>{lead}</p> : null}
    </div>
  );
}
