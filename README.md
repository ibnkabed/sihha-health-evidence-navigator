# Sihha — Health Evidence Navigator

Sihha is a privacy-first bilingual Arabic–English health evidence navigator. It turns scattered smartwatch activity, lab trends, and a user-maintained supplement log into an explainable brief for the user's next conversation with a clinician.

- **Live demo (English):** https://sihha-health-evidence.abdullashammary.chatgpt.site/?lang=en
- **Live demo (Arabic):** https://sihha-health-evidence.abdullashammary.chatgpt.site/?lang=ar
- **Source:** https://github.com/ibnkabed/sihha-health-evidence-navigator

The project **does not diagnose, prescribe, or recommend medication or supplement changes**. It separates recorded facts, computed trends, and discussion prompts.

## Why it exists

People with smartwatches often collect thousands of measurements but still struggle to answer simple questions:

- Is my routine improving?
- Which signal changed?
- Is the evidence complete enough to trust the pattern?
- What should I ask my clinician at the next appointment?

Sihha makes that evidence understandable without turning a consumer dashboard into a medical device.

The Activity page also makes progress visible. Seeing steps, sleep consistency, active minutes, and recent change in one place can make exercise feel more rewarding and give users a positive reason to keep moving and paying attention to their health.

## What the demo includes

- A safe, synthetic profile that works instantly.
- A complete `العربية | English` interface switch covering the dashboard, all seven sections, Activity charts, notices, and printable clinician brief, with automatic RTL/LTR direction.
- The same seven-page organization and dense chart-led visual language as the private prototype: past tests, upcoming tests, protocol, supplements, medical profile, labs, and Activity.
- A smartwatch Activity modal with eight charts for steps, sleep, heart rate, distance, workouts, pace, and active minutes.
- A synthetic **cardiology review prompt** that combines a high jogging heart-rate pattern with an LDL trend, prepares questions for a cardiologist, and offers a downloadable de-identified demo PDF.
- A visible first-page preview of that synthetic cardiology PDF inside the Medical Profile, so judges can inspect the evidence structure before opening the full document.
- Local import of an Apple Health `export.zip` file.
- Explainable lab trends with references and clinician-conversation questions.
- A grouped supplement log with review prompts and explicit safety boundaries.
- A specialist evidence builder that can be printed from the dashboard.
- Privacy boundaries stated in the interface and documentation: synthetic demo data, local ZIP processing, and no automatic sharing.

## Apple Health ZIP → Activity page

On iPhone, the user can open **Health → profile picture → Export All Health Data**. Apple creates a compressed `export.zip` file containing `export.xml`.

When the user selects that ZIP in Sihha:

1. The ZIP is opened inside the browser with `fflate`.
2. Only `export.xml` is read.
3. Sihha extracts the latest seven days of supported records:
   - `HKQuantityTypeIdentifierStepCount`
   - `HKCategoryTypeIdentifierSleepAnalysis`
   - `HKQuantityTypeIdentifierRestingHeartRate`
   - `HKQuantityTypeIdentifierAppleExerciseTime`
   - Apple Health `Workout` durations
4. The records are normalized into the Activity page.
5. Nothing is uploaded. There is no account, server database, analytics tracker, or automatic sharing.

The contest repository contains **no real Apple Health export, medical report, workbook, or personally identifying health record**.

## Cardiology cross-signal prompt

### A real benefit from the private prototype

The private version of Sihha helped its creator turn scattered wearable heart-rate patterns from jogging and lipid results into a structured reason to prepare for a cardiology review. It then organized the evidence and questions into a cardiology brief that could be taken to the specialist. That practical benefit — moving from “I have many numbers” to “I know what to discuss next” — is the clearest proof of the product's value.

The public contest app recreates that same journey with synthetic values, so judges can understand the benefit without exposing the creator's private medical report. In the Medical Profile, judges see a real rendered preview of the synthetic PDF and can open the complete one-page brief.

Codex with GPT-5.6 helped propose and design a new judge-facing idea: when a synthetic wearable pattern shows a high heart-rate peak during jogging and a synthetic LDL result remains above its displayed reference, Sihha surfaces a prompt to **consider a cardiology conversation**.

The prompt is deliberately non-diagnostic. Optical wearable heart rate cannot classify rhythm, and a lipid result does not explain the heart-rate response by itself. Sihha therefore prepares questions about an exercise ECG, safe exercise intensity, ambulatory monitoring, and lipid risk context instead of naming a condition or recommending treatment.

The downloadable `sihha-synthetic-cardiology-brief.pdf` contains synthetic values only. The private source report that inspired the product idea is not included in the contest copy or public repository.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production build and tests:

```bash
npm test
```

No API key or credential is required. The synthetic sample is loaded automatically for an instant no-file demo. Judges can use the `العربية | English` control in the header or open the English demo link directly.

For a safe end-to-end ZIP test, use [`public/samples/apple-health-demo.zip`](public/samples/apple-health-demo.zip). It contains a tiny synthetic `export.xml`; it is not a real person's health export.

## How Codex and GPT-5.6 were used

Codex with GPT-5.6 was used during the Build Week submission period to:

- isolate the contest version from a private personal prototype;
- design a reusable, synthetic-data product rather than publish a personal dashboard;
- implement the Apple Health ZIP parser and signal normalization;
- build the explainable activity, lab, supplement, privacy, and report experiences;
- establish non-diagnostic safety language and source-aware evidence prompts;
- create automated privacy, rendering, and architecture checks;
- test the real product flow and document the work for judges.

The app itself does not call an OpenAI API. This is deliberate: private health exports stay local. GPT-5.6 was the engineering and reasoning partner through Codex, and the app creates a structured evidence brief that a user may choose to discuss with a clinician or use in a separate GPT-5.6 conversation.

### Key owner decisions

- Keep the private prototype and every real medical source outside the contest repository; the public product uses synthetic records only.
- Preserve a local-first architecture instead of sending Apple Health data to an API merely to demonstrate model use.
- Recreate the compact seven-section product experience rather than replace it with a generic hackathon dashboard.
- Treat cross-signal patterns as prompts for a clinician conversation, never as a diagnosis, rhythm classification, causal claim, or treatment recommendation.
- Use Codex with GPT-5.6 to accelerate architecture, implementation, safety wording, tests, and browser verification while the owner retained the product, privacy, and clinical-boundary decisions above.

## Pre-existing prototype vs. Build Week work

The private prototype existed before Build Week as a personal HTML/workbook workflow. It is not published.

This repository is the Build Week extension: a new reusable React/Vinext application, synthetic dataset, on-device Apple Health ZIP importer, explanation engine, bilingual interface and brief, privacy architecture, automated tests, judge documentation, and hosted demo. See [`docs/BUILD_WEEK_CHANGELOG.md`](docs/BUILD_WEEK_CHANGELOG.md).

## Safety and privacy

Read [`docs/PRIVACY_AND_SAFETY.md`](docs/PRIVACY_AND_SAFETY.md). The short version:

- synthetic demo records only;
- local browser processing;
- no diagnosis or treatment recommendation;
- no hidden upload;
- user-controlled print and download;
- clinician review remains the decision point.

## Project structure

- `app/page.tsx` — complete interactive experience
- `lib/apple-health-import.ts` — local Apple Health ZIP parser
- `lib/health-engine.ts` — summaries and evidence brief generation
- `lib/i18n.ts` — Arabic–English translations for synthetic health content
- `lib/sample-data.ts` — synthetic judge dataset
- `tests/` — rendering, privacy, and local-processing tests
- `docs/` — judge guide, safety notes, changelog, and demo script

## License

MIT. See [`LICENSE`](LICENSE).
