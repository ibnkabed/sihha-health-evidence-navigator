# Privacy and safety model

## Data boundary

- The built-in demo is synthetic.
- Apple Health ZIP processing happens in browser memory.
- The application has no sign-in, database, telemetry, or upload endpoint.
- Importing a file does not copy it into the repository or hosting environment.
- Printing and downloading happen only after a user action.

## Medical boundary

Sihha is an organization and communication tool, not a medical device. It does not:

- diagnose a condition;
- calculate disease risk;
- prescribe medication or supplements;
- recommend starting, stopping, or changing treatment;
- replace a clinician or emergency service.

References and status labels belong to the synthetic sample. A real user's laboratory reference ranges and clinical context may differ.

## Explainability boundary

Every insight should expose its source and distinguish among:

1. recorded fact;
2. arithmetic summary or trend;
3. non-causal observation;
4. question for a clinician.

Temporal association is never presented as proof that a supplement or habit caused a health change.
