# Judge guide

## Fastest path (about two minutes)

1. Open the hosted demo or run the project locally.
2. Leave the synthetic sample loaded; no account or API key is required.
3. Open **النشاط** to see how an Apple Health export becomes a useful seven-day view with a Today score, recent-change comparison, and evidence-quality score that make progress motivating and understandable.
4. Open **المختبر** and select LDL to see a trend, reference, evidence source, and clinician question.
5. Open **القلب** to see the cross-signal cardiology review prompt, Codex contribution, and synthetic downloadable PDF.
6. Open **المكملات** to see grouping and review prompts without prescribing.
7. Open **تقرير المختص**, switch to English, and download the evidence brief.
8. Open **الخصوصية** to review the local-processing boundary.

## Optional real-device path

Use your own Apple Health `export.zip`, or the repository's synthetic `public/samples/apple-health-demo.zip`. The browser reads `export.xml` locally and replaces only the Activity signals. The project does not upload the ZIP or save it to a server.

## What to evaluate

- **Technological implementation:** ZIP extraction, HealthKit record parsing, normalization, cross-signal cardiology prompt, bilingual export, tests.
- **Design:** one coherent Arabic-first product flow with an instant safe demo.
- **Potential impact:** the private prototype already helped its creator combine jogging heart-rate patterns and lipid results into a structured cardiology brief for a specialist; the public demo reproduces that benefit with synthetic data.
- **Quality of idea:** evidence quality and source-aware prompts without pretending to be a diagnostic system.
