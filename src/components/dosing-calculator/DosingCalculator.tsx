"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  blendCustomNote,
  blendPresets,
  dosingCalculatorDisclaimer,
  dosingCalculatorGlossary,
  dosingCalculatorModes,
} from "@/content/dosingCalculator";
import {
  calculateBlend,
  calculateReverseBac,
  calculateSinglePeptide,
  parseStrength,
  type BlendComponent,
  type ValidationIssue,
} from "@/lib/dosingCalculator";
import { DilutionExamples } from "./DilutionExamples";
import { SyringeVisual } from "./SyringeVisual";

export type DosingCalculatorProductOption = {
  slug: string;
  name: string;
  strength: string;
};

type DosingCalculatorProps = {
  variant?: "full" | "compact";
  products?: DosingCalculatorProductOption[];
  initialProductSlug?: string;
  initialStrength?: string;
  fullCalculatorHref?: string;
};

type Mode = "calculate" | "find-bac" | "blend";
type MassUnit = "mcg" | "mg";

const vialPresets = [10, 20, 50, 60];
const waterPresets = [1, 2, 3];
const targetPresetsMcg = [50, 100, 250, 500];
const syringePresets = [0.3, 0.5, 1];
const numberFormat = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 3 });

function parseProductStrength(strength?: string): number {
  return strength ? (parseStrength(strength) ?? 10) : 10;
}

function displayNumber(value: number): string {
  return Number.isFinite(value) ? numberFormat.format(value) : "—";
}

function ChipRow({
  values,
  value,
  onChange,
  format = String,
  suffix,
}: {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  suffix: string;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onChange(preset)}
          className={`rounded-full border px-3 py-1.5 text-xs ${
            value === preset
              ? "border-accent bg-accent text-paper"
              : "border-line bg-paper text-muted hover:border-accent hover:text-accent"
          }`}
        >
          {format(preset)} {suffix}
        </button>
      ))}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  suffix,
  onChange,
  step = "any",
}: {
  id: string;
  label: string;
  value: number;
  suffix: string;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="relative mt-2 block">
        <input
          id={id}
          type="number"
          min="0"
          step={step}
          value={value || ""}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full rounded-sm border border-line bg-paper px-3 py-3 pr-16 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted">
          {suffix}
        </span>
      </span>
    </label>
  );
}

function Acknowledgement({
  acknowledged,
  setAcknowledged,
}: {
  acknowledged: boolean;
  setAcknowledged: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border border-line bg-paper/80 px-4 py-4">
      <input
        type="checkbox"
        checked={acknowledged}
        onChange={(event) => setAcknowledged(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-accent"
      />
      <span>
        <span className="block text-sm leading-relaxed text-ink">
          {dosingCalculatorDisclaimer.acknowledgementLabel}
        </span>
        <span className="mt-1 block text-xs text-muted">
          {dosingCalculatorDisclaimer.acknowledgementHint}
        </span>
      </span>
    </label>
  );
}

export function DosingCalculator({
  variant = "full",
  products = [],
  initialProductSlug,
  initialStrength,
  fullCalculatorHref = "/dosing-calculator",
}: DosingCalculatorProps) {
  const isCompact = variant === "compact";
  const initialProduct = products.find((product) => product.slug === initialProductSlug);
  const [acknowledged, setAcknowledged] = useState(false);
  const [mode, setMode] = useState<Mode>("calculate");
  const [selectedProduct, setSelectedProduct] = useState(initialProduct?.slug ?? "");
  const [vialMg, setVialMg] = useState(
    parseProductStrength(initialProduct?.strength ?? initialStrength),
  );
  const [waterMl, setWaterMl] = useState(2);
  const [targetValue, setTargetValue] = useState(250);
  const [targetUnit, setTargetUnit] = useState<MassUnit>("mcg");
  const [targetUnits, setTargetUnits] = useState(5);
  const [syringeCapacityMl, setSyringeCapacityMl] = useState(0.5);
  const [components, setComponents] = useState<BlendComponent[]>(
    blendPresets[0].components.map((component) => ({ ...component })),
  );
  const [anchorIndex, setAnchorIndex] = useState(0);

  const doseMcg = targetUnit === "mg" ? targetValue * 1_000 : targetValue;

  const calculation = useMemo(() => {
    if (!acknowledged) return { result: null, error: null };
    const result =
      mode === "find-bac"
        ? calculateReverseBac({
            vialMg,
            doseMcg,
            targetUnits,
            syringeCapacityMl,
          })
        : mode === "blend"
          ? calculateBlend({
              components,
              waterMl,
              anchorComponentId: components[anchorIndex]?.id ?? "",
              anchorDoseMcg: doseMcg,
              syringeCapacityMl,
            })
          : calculateSinglePeptide({
              vialMg,
              waterMl,
              doseMcg,
              syringeCapacityMl,
            });
    const error = result.issues.find((issue) => issue.severity === "error");
    return { result, error: error?.message ?? null };
  }, [
    acknowledged,
    anchorIndex,
    components,
    doseMcg,
    mode,
    syringeCapacityMl,
    targetUnits,
    vialMg,
    waterMl,
  ]);

  const result = calculation.result;
  const syringeUnits =
    mode === "find-bac" ? targetUnits : result?.syringeUnits ?? 0;
  const warnings: ValidationIssue[] =
    result?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const anchorMassMg = components[anchorIndex]?.massMg ?? Number.NaN;
  const aliquotsPerVial =
    (mode === "blend" ? anchorMassMg * 1_000 : vialMg * 1_000) / doseMcg;

  function chooseProduct(slug: string) {
    setSelectedProduct(slug);
    const product = products.find((option) => option.slug === slug);
    if (product) setVialMg(parseProductStrength(product.strength));
  }

  function chooseBlend(presetId: string) {
    const preset = blendPresets.find((item) => item.id === presetId);
    if (!preset) return;
    setComponents(preset.components.map((component) => ({ ...component })));
    setAnchorIndex(0);
  }

  function updateComponent(index: number, patch: Partial<BlendComponent>) {
    setComponents((current) =>
      current.map((component, componentIndex) =>
        componentIndex === index ? { ...component, ...patch } : component,
      ),
    );
  }

  function addComponent() {
    if (components.length >= 3) return;
    setComponents((current) => [
      ...current,
      { id: `custom-${current.length + 1}`, label: `Component ${current.length + 1}`, massMg: 10 },
    ]);
  }

  const disclaimer = (
    <aside
      className={`${isCompact ? "" : "sticky top-3 z-10"} border border-accent/25 bg-sand/95 px-4 py-3 text-sm leading-relaxed text-ink shadow-[0_8px_30px_rgba(35,28,32,0.05)] backdrop-blur`}
    >
      <strong className="font-medium">Research use only. </strong>
      {dosingCalculatorDisclaimer.sticky}{" "}
      <Link
        href={dosingCalculatorDisclaimer.disclaimerHref}
        className="text-accent underline underline-offset-2"
      >
        {dosingCalculatorDisclaimer.disclaimerLinkLabel}
      </Link>
      .
    </aside>
  );

  return (
    <div className={isCompact ? "space-y-5" : "space-y-10"}>
      {disclaimer}
      <Acknowledgement
        acknowledged={acknowledged}
        setAcknowledged={setAcknowledged}
      />

      <div className={`grid gap-6 ${isCompact ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
        <section className="border border-line bg-paper/75 p-4 sm:p-6">
          {!isCompact ? (
            <div
              className="grid grid-cols-3 border border-line"
              role="tablist"
              aria-label="Calculator mode"
            >
              {dosingCalculatorModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={mode === item.id}
                  onClick={() => setMode(item.id)}
                  className={`px-2 py-3 text-xs font-medium sm:text-sm ${
                    mode === item.id
                      ? "bg-ink text-paper"
                      : "border-l border-line bg-paper text-muted first:border-l-0 hover:text-accent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Calculate</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Vial dilution lab-math</h3>
            </div>
          )}

          {!isCompact ? (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {dosingCalculatorModes.find((item) => item.id === mode)?.help}
            </p>
          ) : null}

          <fieldset
            disabled={!acknowledged}
            className="mt-6 space-y-6 disabled:pointer-events-none disabled:opacity-45"
          >
            {!isCompact && products.length > 0 && mode !== "blend" ? (
              <label className="block text-sm font-medium text-ink">
                Catalogue product <span className="font-normal text-muted">(optional)</span>
                <select
                  value={selectedProduct}
                  onChange={(event) => chooseProduct(event.target.value)}
                  className="mt-2 w-full rounded-sm border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-accent"
                >
                  <option value="">Choose a product</option>
                  {products.map((product) => (
                    <option key={product.slug} value={product.slug}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {mode === "blend" && !isCompact ? (
              <>
                <div>
                  <span className="text-sm font-medium text-ink">Blend starting point</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {blendPresets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => chooseBlend(preset.id)}
                        className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-accent"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {components.map((component, index) => (
                    <div
                      key={component.id}
                      className="grid gap-3 border border-line bg-mist/25 p-3 sm:grid-cols-[1fr_8rem]"
                    >
                      <label className="text-xs text-muted">
                        Component name
                        <input
                          value={component.label}
                          onChange={(event) =>
                            updateComponent(index, { label: event.target.value })
                          }
                          className="mt-1 w-full border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                        />
                      </label>
                      <NumberField
                        id={`blend-mass-${index}`}
                        label="Vial mass"
                        value={component.massMg}
                        suffix="mg"
                        onChange={(massMg) => updateComponent(index, { massMg })}
                      />
                    </div>
                  ))}
                  {components.length < 3 ? (
                    <button
                      type="button"
                      onClick={addComponent}
                      className="text-xs text-accent underline underline-offset-4"
                    >
                      Add third component
                    </button>
                  ) : null}
                  <p className="text-xs leading-relaxed text-muted">{blendCustomNote.body}</p>
                </div>
                <label className="block text-sm font-medium text-ink">
                  Anchor component
                  <select
                    value={anchorIndex}
                    onChange={(event) => setAnchorIndex(Number(event.target.value))}
                    className="mt-2 w-full border border-line bg-paper px-3 py-3 text-sm outline-none focus:border-accent"
                  >
                    {components.map((component, index) => (
                      <option key={component.id} value={index}>
                        {component.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <div>
                <NumberField
                  id={`${variant}-vial-mass`}
                  label="Vial mass"
                  value={vialMg}
                  suffix="mg"
                  onChange={setVialMg}
                />
                <ChipRow
                  values={vialPresets}
                  value={vialMg}
                  onChange={setVialMg}
                  suffix="mg"
                />
              </div>
            )}

            {mode !== "find-bac" ? (
              <div>
                <NumberField
                  id={`${variant}-water-volume`}
                  label="Solvent volume"
                  value={waterMl}
                  suffix="mL"
                  onChange={setWaterMl}
                />
                <ChipRow
                  values={waterPresets}
                  value={waterMl}
                  onChange={setWaterMl}
                  suffix="mL"
                />
              </div>
            ) : null}

            <div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <NumberField
                    id={`${variant}-target-mass`}
                    label={mode === "blend" ? "Anchor target mass" : "Target mass"}
                    value={targetValue}
                    suffix={targetUnit}
                    onChange={setTargetValue}
                  />
                </div>
                <div className="flex border border-line" aria-label="Target mass unit">
                  {(["mcg", "mg"] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => {
                        if (unit === targetUnit) return;
                        setTargetValue(unit === "mg" ? targetValue / 1_000 : targetValue * 1_000);
                        setTargetUnit(unit);
                      }}
                      className={`px-3 py-3 text-xs ${
                        targetUnit === unit ? "bg-ink text-paper" : "bg-paper text-muted"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
              <ChipRow
                values={targetPresetsMcg.map((value) =>
                  targetUnit === "mg" ? value / 1_000 : value,
                )}
                value={targetValue}
                onChange={setTargetValue}
                format={(value) => displayNumber(value)}
                suffix={targetUnit}
              />
            </div>

            {mode === "find-bac" ? (
              <NumberField
                id={`${variant}-target-units`}
                label="Desired syringe mark"
                value={targetUnits}
                suffix="units"
                onChange={setTargetUnits}
              />
            ) : null}

            <div>
              <NumberField
                id={`${variant}-syringe-capacity`}
                label="U-100 syringe capacity"
                value={syringeCapacityMl}
                suffix="mL"
                onChange={setSyringeCapacityMl}
              />
              <ChipRow
                values={syringePresets}
                value={syringeCapacityMl}
                onChange={setSyringeCapacityMl}
                format={(value) => value.toFixed(1)}
                suffix="mL"
              />
            </div>
          </fieldset>
        </section>

        <section
          className={`${isCompact ? "" : "lg:sticky lg:top-28 lg:self-start"} border border-line bg-ink p-5 text-paper sm:p-6`}
          aria-live="polite"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-paper/55">
            {acknowledged ? "Live result" : "Acknowledgement required"}
          </p>
          {!acknowledged ? (
            <p className="mt-5 text-sm leading-relaxed text-paper/70">
              Confirm the research-use acknowledgement to unlock controls and calculate.
            </p>
          ) : calculation.error ? (
            <p className="mt-5 text-sm text-teal-soft">{calculation.error}</p>
          ) : result ? (
            <>
              <p className="mt-4 font-display text-5xl tracking-tight text-paper">
                {displayNumber(syringeUnits)}
                <span className="ml-2 font-sans text-base text-paper/60">units</span>
              </p>
              <p className="mt-1 text-xs text-paper/55">Primary U-100 syringe mark</p>

              <dl className="mt-6 grid grid-cols-2 gap-px bg-paper/15">
                {mode === "find-bac" && "waterMl" in result ? (
                  <div className="bg-ink p-3">
                    <dt className="text-xs text-paper/55">BAC / water</dt>
                    <dd className="mt-1 text-sm text-paper">
                      {displayNumber(result.waterMl)} mL
                    </dd>
                  </div>
                ) : null}
                <div className="bg-ink p-3">
                  <dt className="text-xs text-paper/55">Draw volume</dt>
                  <dd className="mt-1 text-sm text-paper">
                    {displayNumber(result.drawMl)} mL
                  </dd>
                </div>
                {"concentrationMcgPerMl" in result ? (
                  <div className="bg-ink p-3">
                    <dt className="text-xs text-paper/55">Concentration</dt>
                    <dd className="mt-1 text-sm text-paper">
                      {displayNumber(result.concentrationMcgPerMl)} mcg/mL
                    </dd>
                  </div>
                ) : null}
                <div className="bg-ink p-3">
                  <dt className="text-xs text-paper/55">Aliquots / vial</dt>
                  <dd className="mt-1 text-sm text-paper">
                    {displayNumber(aliquotsPerVial)}
                  </dd>
                </div>
              </dl>

              {"components" in result ? (
                <div className="mt-5 border-t border-paper/15 pt-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-paper/55">
                    Delivered in the same draw
                  </p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {result.components.map((component) => (
                      <li key={component.id} className="flex justify-between gap-4">
                        <span className="text-paper/70">{component.label}</span>
                        <span>{displayNumber(component.deliveredMcg)} mcg</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 rounded-sm bg-paper p-3 text-ink">
                <SyringeVisual units={syringeUnits} capacityMl={syringeCapacityMl} />
              </div>

              {warnings.length > 0 ? (
                <ul className="mt-4 space-y-2 border-l-2 border-teal-soft pl-3 text-xs leading-relaxed text-paper/75">
                  {warnings.map((warning) => (
                    <li key={warning.code}>{warning.message}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}

          {isCompact ? (
            <Link
              href={fullCalculatorHref}
              className="mt-6 inline-block text-sm text-teal-soft underline underline-offset-4"
            >
              Open full calculator
            </Link>
          ) : null}
        </section>
      </div>

      {!isCompact ? (
        <>
          <DilutionExamples />
          <section className="border-t border-line pt-10">
            <h2 className="font-display text-3xl text-ink">Lab-math glossary</h2>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {dosingCalculatorGlossary.map((entry) => (
                <div key={entry.term} className="border border-line bg-paper/65 p-4">
                  <dt className="text-sm font-medium text-ink">{entry.term}</dt>
                  <dd className="mt-2 text-xs leading-relaxed text-muted">{entry.definition}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted">
              Review the{" "}
              <Link
                href={dosingCalculatorDisclaimer.labHandlingHref}
                className="text-accent underline underline-offset-4"
              >
                {dosingCalculatorDisclaimer.labHandlingLinkLabel}
              </Link>{" "}
              and{" "}
              <Link
                href={dosingCalculatorDisclaimer.disclaimerHref}
                className="text-accent underline underline-offset-4"
              >
                {dosingCalculatorDisclaimer.disclaimerLinkLabel}
              </Link>
              .
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
