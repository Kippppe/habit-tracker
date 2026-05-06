interface HankoProps {
  size?: number;
  text?: string;
  tilted?: boolean;
  weathered?: boolean;
}

export function Hanko({
  size = 48,
  text = "k",
  tilted = true,
  weathered = true,
}: HankoProps) {
  const filterId = `hanko-w-${size}`;

  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      aria-hidden
      style={{ transform: tilted ? "rotate(-2deg)" : undefined, flexShrink: 0 }}
    >
      {weathered && (
        <defs>
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="4"
              seed="8"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="1.5"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      )}
      <g filter={weathered ? `url(#${filterId})` : undefined}>
        <rect x="6" y="6" width="68" height="68" rx="3" fill="#8b2820" />
        <rect
          x="10"
          y="10"
          width="60"
          height="60"
          rx="2"
          fill="none"
          stroke="#f4ede1"
          strokeWidth="1.5"
        />
        <text
          x="40"
          y="46"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="34"
          fontWeight="500"
          fill="#f4ede1"
          style={{ fontFamily: "var(--font-fraunces, Fraunces, serif)" }}
        >
          {text}
        </text>
      </g>
    </svg>
  );
}
