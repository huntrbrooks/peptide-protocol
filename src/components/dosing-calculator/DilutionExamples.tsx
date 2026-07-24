import {
  dilutionExamplesSection,
  vialSizeDilutionExamples,
} from "@/content/dosingCalculator";

const number = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });

export function DilutionExamples() {
  return (
    <section className="border-t border-line pt-10">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Worksheet reference</p>
      <h2 className="mt-2 font-display text-3xl text-ink">{dilutionExamplesSection.title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        {dilutionExamplesSection.intro}
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        {vialSizeDilutionExamples.map((example) => (
          <article key={example.vialMg} className="overflow-hidden border border-line bg-paper/70">
            <div className="border-b border-line bg-mist/35 px-4 py-4">
              <h3 className="font-display text-xl text-ink">{example.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">{example.framing}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2 font-medium">Water</th>
                    <th className="px-3 py-2 font-medium">Concentration</th>
                    <th className="px-3 py-2 font-medium">Example mass</th>
                    <th className="px-3 py-2 font-medium">U-100</th>
                  </tr>
                </thead>
                <tbody>
                  {example.rows.map((row) => (
                    <tr key={row.waterMl} className="border-b border-line/70 last:border-0">
                      <td className="px-3 py-2 text-ink">{row.waterMl} mL</td>
                      <td className="px-3 py-2 text-muted">
                        {number.format(row.concentrationMcgPerMl)} mcg/mL
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {number.format(row.exampleAliquotMcg)} mcg
                      </td>
                      <td className="px-3 py-2 font-medium text-accent">
                        {number.format(row.syringeUnits)} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
