type SyringeVisualProps = {
  units: number;
  capacityMl: number;
};

export function SyringeVisual({ units, capacityMl }: SyringeVisualProps) {
  const maxUnits = capacityMl * 100;
  const clampedUnits = Math.min(Math.max(units, 0), maxUnits);
  const barrelStart = 54;
  const barrelWidth = 300;
  const fillWidth = (clampedUnits / maxUnits) * barrelWidth;
  const ticks = Array.from({ length: Math.round(maxUnits / 5) + 1 }, (_, index) => index * 5);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4 text-xs text-muted">
        <span>U-100 syringe visual</span>
        <span aria-live="polite">
          Mark: {Number.isFinite(units) ? units.toFixed(1) : "—"} units
        </span>
      </div>
      <svg
        viewBox="0 0 420 96"
        role="img"
        aria-label={`${clampedUnits.toFixed(1)} units shown on a ${maxUnits}-unit U-100 syringe`}
        className="h-auto w-full overflow-visible"
      >
        <rect x="54" y="24" width="300" height="48" rx="3" fill="var(--paper)" stroke="var(--ink)" />
        <rect
          x={barrelStart}
          y="25"
          width={fillWidth}
          height="46"
          fill="var(--teal-soft)"
          opacity="0.62"
        />
        {ticks.map((tick) => {
          const x = barrelStart + (tick / maxUnits) * barrelWidth;
          const major = tick % 10 === 0;
          return (
            <g key={tick}>
              <line
                x1={x}
                y1="24"
                x2={x}
                y2={major ? 41 : 34}
                stroke="var(--ink)"
                strokeWidth={major ? 1.5 : 1}
              />
              {major ? (
                <text
                  x={x}
                  y="19"
                  textAnchor="middle"
                  fontSize="8"
                  fill="var(--muted)"
                  fontFamily="var(--font-body)"
                >
                  {tick}
                </text>
              ) : null}
            </g>
          );
        })}
        <line
          x1={barrelStart + fillWidth}
          y1="20"
          x2={barrelStart + fillWidth}
          y2="76"
          stroke="var(--accent)"
          strokeWidth="3"
        />
        <path d="M354 38H390V58H354" fill="var(--sand)" stroke="var(--ink)" />
        <path d="M390 48H416" stroke="var(--ink)" strokeWidth="2" />
        <path d="M54 34H35V62H54" fill="var(--sand)" stroke="var(--ink)" />
        <path d="M35 48H8" stroke="var(--ink)" strokeWidth="5" />
        <text
          x="204"
          y="88"
          textAnchor="middle"
          fontSize="9"
          fill="var(--muted)"
          fontFamily="var(--font-body)"
        >
          {capacityMl.toFixed(1)} mL capacity · 100 units = 1 mL
        </text>
      </svg>
    </div>
  );
}
