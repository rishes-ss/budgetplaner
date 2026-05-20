# Budgetplaner - Testbarer Prototyp

## Ziel der App
Der Budgetplaner hilft Studierenden und jungen Erwachsenen dabei, Einnahmen, Ausgaben und einfache Budgets zu verwalten. Die App soll schnell zeigen, wie viel Geld verfuegbar ist und welche Kategorien das Budget belasten.

## Zielgruppe
Studierende und junge Erwachsene mit begrenztem monatlichem Budget.

## Testbare Workflows
- Dashboard verstehen
- Ausgabe erfassen
- Budget pruefen
- Budget erstellen
- Analyse interpretieren

## Aktueller Stand
Es handelt sich um einen testbaren Prototyp fuer eine Usability-Evaluation. Die App nutzt Demo-Daten und speichert neue Transaktionen und Budgets lokal im Browser per LocalStorage. Eine echte Datenbank wie Supabase kann spaeter ergaenzt werden.

## Technologie
- HTML/CSS/JavaScript
- Lokale Demo-Daten und LocalStorage
- Netlify Deployment

Hinweis: Im aktuellen Repository ist noch kein SvelteKit-Projekt vorhanden. Die Struktur ist bewusst einfach gehalten, damit der Prototyp stabil testbar bleibt. Eine spaetere Migration zu SvelteKit ist moeglich.


## Lokal starten
Die App kann direkt ueber `index.html` geoeffnet werden. Fuer einen lokalen Server kann z.B. verwendet werden:

```bash
npm run dev
```

Der Build fuer Netlify wird mit folgendem Befehl erstellt:

```bash
npm run build
```

## Evaluation
| Testperson | Aufgabe | Beobachtung | Problem | Verbesserungsvorschlag |
|---|---|---|---|---|
| | Dashboard verstehen | | | |
| | Ausgabe erfassen | | | |
| | Budget pruefen | | | |
| | Budget erstellen | | | |
| | Analyse interpretieren | | | |

## KI-Einsatz
- ChatGPT wurde zur Strukturierung der Anforderungen und zur Erstellung des Codex-Prompts verwendet.
- Codex in VS Code wurde zur Unterstuetzung bei der Implementierung verwendet.
- Die Verantwortung fuer die finale Abgabe liegt beim Studenten.
