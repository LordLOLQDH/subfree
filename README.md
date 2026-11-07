# SubFree

**Kostenlos geplante Projekt-Websites und HTTPS-Weiterleitungen.**

SubFree ist ein Community-Projekt für persönliche Websites, Portfolios, Lernprojekte und kleine Entwicklerprojekte.

## Öffentliche Website

- Gewünschte Domain: https://subfree.pntr.dev
- GitHub Pages (aktuelle technische Adresse): https://lordlolqdh.github.io/subfree

Die benutzerdefinierte Domain ist erst aktiv, wenn die Domainregistrierung und DNS-Konfiguration abgeschlossen sind.

## Konzept

- Keine klassischen Benutzerkonten und keine Passwörter.
- Nutzer registrieren ein Projekt mit Projektname, Anzeigename, GitHub-Benutzername, Kontakt-E-Mail und Beschreibung.
- SubFree erzeugt einen persönlichen Verwaltungscode. Dieser Code ist ein Geheimnis und erlaubt den Zugriff auf das jeweilige Projekt.
- Registrierungsdaten und Projektdateien werden in eigenen SubFree-Tabellen im bestehenden Supabase-Projekt gespeichert.
- Projektdateien werden später in einen Ordner `/<projektname>/` im GitHub-Repository veröffentlicht.
- Beispieladresse: `https://subfree.pntr.dev/meinprojekt/`.

## Website Check und Pfad-Anträge

- Öffentlicher Website Check: `check.html`. Er prüft DNS-/IP-Schutz, HTTPS/TLS-Verbindung, HTTP-Status, Weiterleitungen, Sicherheitsheader, CORS, Cookies und weitere sichtbare Merkmale. Zielseiten werden nicht im Browser geöffnet und HTTP-Weiterleitungen nicht verfolgt. Es ist kein vollständiger Malware- oder Phishing-Scan.
- Bestehende Projektinhaber können unter `#domain-antrag` einen Pfad-Antrag mit Zugangscode, HTTPS-Ziel, Verwendungszweck und Nutzungsbedingungen stellen.
- Anträge werden privat in `subfree_domain_applications` gespeichert. GitHub-PRs enthalten keine Namen, E-Mail-Adressen, Zugangscodes oder IP-Hashes.
- GitHub Actions prüft die PR mit festen Regeln und kommentiert das Ergebnis. Es wird keine KI-API verwendet und es entstehen dafür keine KI-API-Kosten. Diese Prüfung ersetzt keine manuelle Prüfung auf Phishing oder Betrug.
- Ein genehmigter Pfad wird erst nach manuellem Merge synchronisiert. Der Merge löst die Aktivierung aus. Frühere Projekteinstellungen bleiben gespeichert und werden im Domain-Modus schreibgeschützt.

## Backend

Supabase-Projekt: `KDS-AI-v1`

- Edge Function: `subfree-api`
- Datenbanktabellen: `subfree_sites`, `subfree_site_files`, `subfree_domain_applications`
- Die Tabellen sind mit Row Level Security geschützt. Direkter Zugriff durch Browserrollen ist gesperrt. Die Edge Function verwendet den serverseitigen Service-Key.
- Es werden keine KDS-AI-Tabellen oder bestehenden Edge Functions für SubFree benötigt.

## GitHub-Veröffentlichung aktivieren

Die Registrierung kann bereits in Supabase gespeichert werden. Für das automatische Erstellen und Aktualisieren von Projektordnern benötigt die Edge Function ein privates GitHub-Token.

In Supabase unter **Project Settings → Edge Functions → Secrets** folgende Secrets hinzufügen:

- `GITHUB_TOKEN`: Fine-grained Personal Access Token mit Zugriff nur auf `LordLOLQDH/subfree`, Repository permissions **Contents: Read and write** and **Pull requests: Read and write**. The latter is required to open domain-request pull requests.
- Optional: `GITHUB_OWNER` = `LordLOLQDH`
- Optional: `GITHUB_REPO` = `subfree`
- Optional: `GITHUB_BRANCH` = `main`

Das Token darf niemals in `index.html`, `script.js` oder anderen öffentlichen Dateien stehen.

Nach dem Hinzufügen muss die Edge Function ggf. erneut deployed werden, damit sie die Secrets übernimmt.

## Wichtige Hinweise

- Der persönliche Zugangscode wird nur einmal angezeigt. Wer ihn besitzt, kann das Projekt verwalten.
- E-Mail-Adressen werden aktuell nicht verifiziert.
- Der öffentliche Dienst benötigt Schutz vor Spam und automatisierten Massenregistrierungen, bevor er breit beworben wird.
- GitHub Pages ist statisches Hosting. Backend-Funktionen, Uploads und die Veröffentlichung benötigen zusätzliche serverseitige Verarbeitung.
- Nutzerinhalte werden in einem sandboxed iframe ausgeliefert. Nur `index.html` wird als HTML-Dokument ausgeführt; weitere HTML-/HTM- und SVG-Dateien sind vorerst gesperrt, damit Nutzer-JavaScript nicht im Sicherheitskontext der SubFree-Verwaltungsseite läuft. CSS- und JS-Dateien können als Ressourcen eingebunden werden.
- Die Domain `subfree.pntr.dev` ist nicht automatisch mit GitHub Pages verbunden.
- Free-Tarife haben Limits; dauerhafte kostenlose Verfügbarkeit kann nicht zugesichert werden.

## Verzeichnisstruktur

Nach aktivierter GitHub-Verbindung entstehen Projektordner direkt im Repository:

```
/<projektname>/
  index.html
  assets/
  ...
```

Die SubFree-Startseite bleibt im Repository-Root.


## Vor öffentlichem Start noch erforderlich

- `GITHUB_TOKEN` als Supabase Edge Function Secret hinterlegen.
- GitHub-Pages-Bereitstellung nach dem ersten echten Test prüfen.
- Die gewünschte Domain `subfree.pntr.dev` ist noch nicht als aktiv verbunden bestätigt.
- `impressum.html` und `datenschutz.html` enthalten Platzhalter. Betreiberanschrift und Kontaktangaben müssen ergänzt und die Datenschutzhinweise geprüft werden.
- E-Mail-Verifizierung, Datei-Upload/ZIP-Import, Projektlöschung und zusätzliche Missbrauchsprüfung sind noch nicht umgesetzt.
