# Redaktionsleitfaden – mein-ziel-bongsiel.de

Für das Team im Dat swarte Peerd. Zwei Bereiche, zwei Zwecke:

| Bereich | Adresse | Wofür |
| --- | --- | --- |
| **Inhalte** (EmDash) | `…/_emdash/admin` | Veranstaltungen, Speisekarten, Neuigkeiten, Schließtage, Zimmer, Texte, Öffnungszeiten |
| **Service** | `…/admin/` | Tagesbetrieb: Reservierungen, Anmeldungen, Anfragen, Deichpost |

Anmeldung mit Passkey (Fingerabdruck, Gesichtserkennung oder Gerätecode). Neue Mitarbeitende lädt Alture per Einladungslink ein. Änderungen sind sofort sichtbar, die Seite muss nicht neu gebaut werden.

## 1. Veranstaltung anlegen oder ändern
EmDash → **Veranstaltungen** → **Neu**.

1. **Titel** und **Beginn** (Datum und Uhrzeit) eintragen, **Ende** ist optional.
2. **Kurztext** erscheint in der Liste und auf der Startseite. **Beschreibung** ist der ausführliche Text auf der Detailseite. **Preis** zum Beispiel `€ 29,50 pro Person / Kinder bis 12 Jahre € 14,50`: Der Schrägstrich trennt die Preise in einzelne Felder.
3. **Bild oder Plakat** hochladen.
4. **Plätze für Anmeldung**: Zahl eintragen, wenn Gäste sich anmelden sollen (zum Beispiel Brunch). Leer lassen, wenn nicht. Die Seite zählt die freien Plätze live und schließt die Anmeldung zum Beginn.
5. **Reservierungen an dem Tag**:
   - *Normal*: alles wie gewohnt.
   - *Eingeschränkte Karte* oder *Kein à la carte*: Hinweis im Kalender und auf der Detailseite.
   - *Geschlossene Gesellschaft*: der Tag ist für Online-Reservierungen gesperrt.
6. **Art (Symbol auf der Karte)**: *Automatisch* wählt das Symbol anhand des Titels (zum Beispiel „Brunch“ → Tasse). Anders wählen, wenn es nicht passt.
7. **Wiederholung** für regelmäßige Termine (wöchentlich, alle 2 Wochen, monatlich am gleichen Wochentag) zusammen mit **Wiederholen bis**.
8. **Auf der Startseite zeigen** an oder aus. **Nicht öffentlich** sperrt nur den Kalender, ohne die Veranstaltung anzuzeigen.
9. **Veröffentlichen** bestätigen (Bestätigungsfenster beachten).

Vergangene Veranstaltungen verschwinden automatisch aus den Listen. Anmeldedaten werden 30 Tage nach der Veranstaltung gelöscht.

**Sonderzeiten für Tische** an einem Veranstaltungstag (zum Beispiel nur 17–20 Uhr): unter *Schließtage & Sonderzeiten* einen Eintrag mit *Art = Sonderzeiten* anlegen (siehe 3).

## 2. Speisekarten und Neuigkeiten
- **Speisekarten**: *Titel*, *Gültig* (zum Beispiel `27.11. – 04.01.`), Gerichte eintragen. Bei *Aktuelle Speisekarte* wird die Karte auf `/speisen/` gezeigt. Der Abschnittsname steht nur beim ersten Gericht eines Abschnitts. Jede Karte hat eine Druckansicht.
- **Neuigkeiten**: Überschrift, Text, optional Bild und Button. **Auf der Startseite zeigen** steuert die Anzeige. Abgelaufene Meldungen (zum Beispiel ein vergangener Brunch) bitte ausschalten oder löschen.

## 3. Schließtage und Sonderzeiten
EmDash → **Schließtage & Sonderzeiten** → Neu.

- **Bezeichnung** (zum Beispiel *Betriebsferien*), **Von**, **Bis** (leer = nur ein Tag).
- **Art = Geschlossen**: Online-Reservierung ist an diesen Tagen nicht möglich, die Kopfzeile zeigt „Heute geschlossen“.
- **Art = Sonderzeiten**: nur andere Tischzeiten, zum Beispiel `17:00-20:00`.
- **Hinweis für Gäste** erscheint im Reservierungsformular.

## 4. Öffnungszeiten, Kontakt und Reservierungsregeln
EmDash → **Öffnungszeiten & Kontakt** (ein einziger Eintrag, bitte nicht löschen).

- **Öffnungszeiten**: eine Zeile pro Tag und Schicht.
- **Online max. Personen pro Reservierung** (Standard 10), **Sofort bestätigt bis Personen** (Standard 6, größere Gruppen werden zur Anfrage), **Tischdauer in Minuten** (Standard 105), **Max. Gäste / Reservierungen gleichzeitig**.
- **Storno- / No-Show-Hinweis** und **Hinweis Anmeldung (Bezahlung)** erscheinen in den Formularen.
- Telefon, E-Mail, Adresse, Instagram- und Facebook-Link.

## 5. Zimmer und Seitentexte
- **Zimmer & Ferienwohnungen**: Name, Kurztext, Bild, Personen, Preis, **Ausstattung** (eine Zeile pro Punkt). Mit **Externer Buchungslink** (zum Beispiel Booking.com) führt der Button dorthin, ohne Link entsteht eine Anfrage.
- **Seitentexte**: Überschrift, Einleitung und Inhalt der Seiten Gaststätte, Eventlocation, Übernachten usw.

## 6. Service-Bereich im Tagesbetrieb (`/admin/`)
- **Heute**: alle Reservierungen des Tages mit Wochenleiste zum Springen, Zahlen oben (Reservierungen, Gäste). Das Datum oben wechselt den Tag.
- **Status in einem Tipp**: *Bestätigen*, *Da* (Gast ist angekommen), *Storno*, *No-Show*. Die Liste aktualisiert sich jede Minute, neue Online-Reservierungen erscheinen von selbst.
- **Tischnummer** ins Feld schreiben und das Feld verlassen: wird gespeichert.
- **Allergiehinweise** sind farbig hervorgehoben.
- **+ Telefonische Reservierung** für Anrufe, damit alles an einer Stelle steht. **Drucken** gibt die Tagesliste aus.
- **Anmeldungen**: Anmeldungen zu Veranstaltungen, auch telefonisch ergänzbar, **CSV** für Excel.
- **Anfragen**: Anfragen für Feiern und Zimmer.
- **Deichpost**: Newsletter-Anmeldungen als **CSV** (der Versand läuft weiter im bisherigen Tool).
- Löschen und Stornieren verlangt einen zweiten Tipp (kein Pop-up).

## 7. Gut zu wissen
- Gäste erhalten eine Bestätigungsmail, das Restaurant eine Benachrichtigung. Bei Mailproblemen bleibt die Buchung trotzdem gespeichert.
- Gästedaten werden 30 Tage nach dem Besuch beziehungsweise der Veranstaltung gelöscht, Anfragen nach 180 Tagen.
- Doppelte Buchungen (gleicher Tag, gleiche Uhrzeit, gleiche E-Mail oder Telefonnummer) lehnt die Seite freundlich ab.
- Kein Zugriff mehr (Passkey verloren)? Alture meldet sich mit einem neuen Einladungslink.