import { Hanko } from "./hanko";

export function LogoHorizontal({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Hanko size={size} />
      <span
        className="font-serif font-normal text-foreground leading-none"
        style={{ fontSize: Math.round(size * 0.75), letterSpacing: "-0.05em" }}
      >
        kipwork
      </span>
    </div>
  );
}

export function LogoStacked({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <LogoHorizontal size={size} />
      <p className="text-xs text-muted-foreground font-sans text-center max-w-xs leading-relaxed">
        Hospitality web, by someone who&apos;s worked the front desk.
      </p>
    </div>
  );
}
