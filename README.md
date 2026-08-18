# WrenchIQ MVP v0.1

This is a dependency-free prototype of WrenchIQ, an automotive diagnostic workflow assistant.

## Run it

Open `index.html` in a web browser.

For a more app-like local test, run a simple local web server from this folder, e.g.:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Included now

- Vehicle information entry
- VIN field placeholder
- Complaint / DTC / mileage / scan-data inputs
- Rule-based diagnostic workflows for lean faults, EVAP small leaks, and vibration complaints
- Generic diagnostic workflow fallback
- Technician test-result buttons
- Confirmed root-cause / repair logging
- Local repair history saved in the browser
- Mobile-friendly interface

## Important

This prototype intentionally does not make safety-critical repair decisions automatically. It is an early workflow demo. Production WrenchIQ should use verified service information, OEM/public datasets where licensed/allowed, explicit test references, source citations, model guardrails, and technician confirmation.

## Next build steps

1. Real VIN decoding.
2. User accounts and cloud database.
3. AI backend for dynamic diagnostic trees.
4. Photo and scan-tool screenshot upload.
5. Technician feedback loop and confirmed-repair dataset.
6. Shop accounts and shared repair history.
