# FINOVATE ERP X

An international, cloud-ready ERP interface designed for FINOVATE – AHMED EG.

## Included in this foundation

- A responsive executive dashboard for finance and operations.
- An RTL/LTR-ready design using logical CSS properties.
- A file-based client-side localization engine that loads `/locales/<language>.json` dictionaries at runtime.
- Arabic and English dashboard dictionaries, plus a language selector ready for 35 supported language codes and RTL direction handling.

## Run locally

This is a dependency-free static application. Serve the repository with any static server, for example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`. Use the language selector in the top bar to switch languages. Locales without a dictionary yet safely fall back to English, allowing new locale files to be introduced independently of the dashboard template.
