# SubFree

**Kostenlose Pfad-Weiterleitungen für persönliche Projekte und Entwickler.**

SubFree ist ein unabhängiges Community-Projekt. Nutzer können einen Wunschnamen registrieren, der als Pfad unter der Hauptdomain erreichbar ist, zum Beispiel:

`https://subfree.is-a.dev/wunschname`

## So funktioniert es

1. Das HTML-Formular öffnet ein vorausgefülltes GitHub-Issue mit dem Titel `DOMAIN_REG: wunschname`.
2. Nach dem Erstellen löst das Issue die GitHub Action `.github/workflows/register-redirect.yml` aus.
3. Die Action validiert den Namen und die HTTPS-Zieladresse und ergänzt `redirects.json`.
4. Vercel erstellt nach dem GitHub-Commit automatisch ein neues Deployment.
5. Die Vercel-Middleware liest die eingebundene JSON-Datenbank und leitet registrierte Pfade weiter.

## Dateien

- `index.html`, `styles.css`, `script.js`: Website und Registrierungsformular
- `redirects.json`: Redirect-Datenbank
- `middleware.js`: Vercel Routing Middleware
- `vercel.json`: Middleware-Einstiegspunkt und Matcher
- `package.json`: Abhängigkeit `@vercel/functions`
- `.github/workflows/register-redirect.yml`: automatische Issue-Verarbeitung
- `.github/workflows/pages.yml`: bestehende GitHub-Pages-Bereitstellung

## Lokal testen

Die statische Website kann direkt über `index.html` geöffnet werden. Die Middleware benötigt eine Vercel-Bereitstellung.

## Wichtige Hinweise

- Die Weiterleitung ist eine Pfad-Weiterleitung, keine DNS-Subdomain.
- Die Root-URL `/` wird von der Middleware nicht umgeleitet.
- Unbekannte Pfade werden normal an die Website weitergereicht.
- Nur HTTPS-Zieladressen werden akzeptiert.
- Die automatische Registrierung darf nicht für Phishing, Malware, Spam, Betrug oder rechtswidrige Inhalte missbraucht werden.
- Vercel Hobby hat Nutzungsbeschränkungen, insbesondere für kommerzielle Nutzung. Vor einem öffentlichen Betrieb sind die aktuellen Bedingungen zu prüfen.
- Die eigene Domain `subfree.is-a.dev` ist noch nicht mit Vercel verbunden. Bis zur DNS-Einrichtung funktioniert die Middleware nur auf der Vercel-Adresse.

## Lizenz

Noch keine Lizenz festgelegt. Bis zur Ergänzung einer Lizenz gelten die üblichen urheberrechtlichen Regeln.
