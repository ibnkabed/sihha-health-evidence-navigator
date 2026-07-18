# Judge guide

## Fastest path (about two minutes)

1. Open the [hosted English demo](https://sihha-health-evidence.abdullashammary.chatgpt.site/?lang=en) or run the project locally.
2. Use the `العربية | English` control at any time. The complete interface, all seven sections, Activity charts, notices, and printable brief switch together between RTL Arabic and LTR English.
3. Leave the synthetic sample loaded; no account or API key is required. The contest copy deliberately keeps the same page names, organization, and chart-rich visual language as the private original while replacing its records.
4. Open **Activity** to see eight wearable charts. The same page can be populated locally from an Apple Health ZIP, making progress visible and motivating without claiming medical readiness.
5. Open **Past tests** to inspect synthetic trends and reference ranges, then **Upcoming tests** and **Protocol** to see how the information becomes an organized follow-up plan.
6. Open **Supplements** to see grouped records and review prompts without prescribing.
7. Open **Medical profile**. Scroll within the page to the large rendered PDF preview. It shows the actual first page of a synthetic cardiology brief: jogging heart-rate evidence, LDL trend, an explainable escalation rule, safety limits, and clinician questions. Use **Open full PDF** to inspect the full document.
8. Return home and use the specialist report builder to print selected evidence.
9. Review the persistent synthetic-data label and local-import explanation; no private report is present in this repository.

## Optional real-device path

Use your own Apple Health `export.zip`, or the repository's synthetic `public/samples/apple-health-demo.zip`. The browser reads `export.xml` locally and replaces only the Activity signals. The project does not upload the ZIP or save it to a server.

## What to evaluate

- **Technological implementation:** ZIP extraction, HealthKit record parsing, normalization, cross-signal cardiology prompt, complete bilingual interface and export, automatic RTL/LTR direction, tests.
- **Design:** the mature, compact, chart-led organization of the original private project, reproduced safely rather than replaced by a generic contest dashboard.
- **Potential impact:** the private prototype already helped its creator combine jogging heart-rate patterns and lipid results into a structured cardiology brief for a specialist; the public demo visibly reproduces the structure of that brief with synthetic data.
- **Quality of idea:** evidence quality and source-aware prompts without pretending to be a diagnostic system.
