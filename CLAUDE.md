# CLAUDE.md — Kontekst za buduće Claude sesije

> **Ovaj fajl je namenjen Claude AI asistentu** da brzo razume projekat kad korisnik (Micun, ilija_micunovic@...) pokrene novi chat.
> **Pročitaj ovaj fajl PRVI** kad uđeš u Podbara projekat — ovde su sažeti svi bitni detalji.

---

## Šta je Podbara

**Podbara** ("Od vrata do vrata") je web aplikacija za **terenski rad volontera** civilnog pokreta u Novom Sadu. Volonteri obilaze adrese (kuće i zgrade), beleže status razgovora sa stanarima, i prate napredak.

**Live URL**: https://imicunovic83.github.io/Podbara/
**GitHub repo**: https://github.com/imicunovic83/Podbara (PRIVATE)
**Vlasnik**: Micun (ilija_micunovic@... / GitHub username `imicunovic83`)

### Funkcionalnost ukratko
- Lista adresa po ulicama (sa filterima i pretragom)
- Status obilaska po adresi (`students_win` ✌️, `sns` 💩, `not_visited`, `visited`, `not_found`, `scheduled`)
- Mapa sa pin-ovima i pie-chart ikonicama za zgrade
- "Najbliže od mene" i "Najbliže neobiđeno" preko geolokacije
- Admin panel za upravljanje korisnicima i dodelu ulica
- Excel/CSV import/export
- Offline queue (ako padne internet)
- Multi-role sistem: viewer / editor / admin

---

## Tech stack

**Sve je u jednom `index.html` fajlu** — Vanilla JS, bez build steps, bez frameworks.

| Sloj | Tehnologija |
|------|-------------|
| Frontend | Vanilla JavaScript (ES modules), HTML, CSS (custom — bez Tailwind/Bootstrap) |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Hosting | GitHub Pages (free tier) |
| Mapa | Leaflet 1.9.4 + leaflet.markercluster + OpenStreetMap tiles |
| Excel/CSV | SheetJS (xlsx) |
| Auth | Supabase Auth (email + password, password reset) |
| PWA | manifest.json + sw.js za offline support |
| Stil | Custom CSS sa CSS varijablama (vidi `:root` u `<style>`) |

### Bitne integracije
- **Supabase URL**: `https://wdmipyooncrcdmvlloou.supabase.co`
- **Region**: `eu-west-1` (NE eu-central-1!)
- **Connection**: Session pooler (`aws-0-eu-west-1.pooler.supabase.com:5432`) — Direct Connection ne radi na free tier-u
- **Tabele**: `addresses`, `streets`, `profiles`, `user_street_assignments`, `note_templates`
- **RLS**: Da, postoji Row-Level Security
- **Edge Function**: `create-user` — admin koristi za kreiranje novih korisnika

---

## Struktura repo-a

```
Podbara/
├── index.html         ← CELA APLIKACIJA (HTML + CSS + JS u jednom fajlu)
├── sw.js              ← Service worker za PWA i offline caching
├── manifest.json      ← PWA manifest
├── README.md          ← Javni README
├── CLAUDE.md          ← Ovaj fajl
├── favicon.png
├── LOGO COLOR KRUZNI.png
└── .git/              ← Git metadata
```

`index.html` je **veliki fajl** (~7900 linija). Kad menjaš nešto:
- Koristi `Grep` da nađeš tačan deo umesto da čitaš ceo fajl
- Koristi `Edit` sa preciznim `old_string` / `new_string` umesto `Write` (sigurnije, ne može da ti pukne ostatak fajla)

---

## Tehnički detalji koje moraš da znaš

### Auth flow
- Login sa email + lozinka
- "Forgot password" → email reset link sa `redirectTo` parametrom
- Recovery flow detektuje `type=recovery` u URL-u
- Magic link je **uklonjen** na zahtev korisnika

### Statusi obilazaka (DB enum)
```
students_win  → "✌️ Studenti pobedjuju" (zelena #22c55e)
sns           → "💩 SNS" (crvena #dc2626)
not_visited   → "Nije obiđeno" (žuta #f59e0b) — DEFAULT
visited       → "Obiđeno" (plava #0ea5e9)
not_found     → "Nije zatečen" (siva #6b7280)
scheduled     → "Zakazano" (plava #3b82f6)
```

### Adresne grupe (kompleksna logika)
Tip adrese je `Kuća` ili `Zgrada`. Postoji koncept `getAddressGroupKind()` koji raspoznaje:
- `'unexplored'` — Zgrada bez ijednog unetog stana (placeholder)
- `'building'` — Zgrada sa unetim stanovima
- `'house_multi'` — Kuća sa više jedinica (npr. 2 kuće u dvorištu)
- `'house_single'` — Klasična porodična kuća

`getEffectiveItems()` filtrira "dirty" placeholder redove pri brojanju. Bitno za statistike.

### Latinica enforcement
Svi text input-i automatski konvertuju ćirilicu → latinicu kad korisnik kuca. Vidi `enforceLatin()` i `convertCyrToLat()`.

### Offline queue
Ako padne internet, izmene se čuvaju u localStorage i sinhronizuju kad se vrati konekcija. Vidi `processPendingQueue()`.

---

## Korisnikove preferencije

- **Jezik**: Srpski (latinica) u UI-u i komentarima
- **Komunikacija**: Korisnik je **netehnički** — objašnjavaj korak-po-korak, ne pretpostavljaj poznavanje Git-a, regex-a, itd.
- **Ne koristi**: Plaćene servise, GitHub Actions na privatnom repo-u (košta), složene CLI tool-ove
- **Voli**: Jednoklik rešenja (`.bat` skripte), copy/paste sa minimum miškanja
- **Ne radi sa kodom direktno** — daje pristup folderu, ja pravim izmene

### Tehnička sredina
- **OS**: Windows
- **Editor**: nije specificiran (verovatno Notepad / VS Code)
- **Lokalni Podbara folder**: `C:\Users\ilija\OneDrive\Desktop\Podbara`
- **PowerShell**: ima
- **Git**: instaliran (cloniraje radi)
- **Node.js**: ima (preko `npx serve` radi)
- **Python**: NEMA instaliran
- **PostgreSQL client**: instaliran 17.9 (za backup skriptu)

---

## Kritična upozorenja

### ⚠ Markdown auto-link u chat-u
Ako korisnik kopira string sa hostname-om (npr. connection string ili URL) **iz chat-a**, neki interfejsi auto-formatiraju URL kao Markdown link `[text](http://text)`. To je **ne-vidljivo** za korisnika ali ulazi u njegov clipboard. Uvek proveri `config.txt` i slične fajlove sa `Get-Content` pre nego što sumnjaš na druge probleme.

### ⚠ Supabase Direct Connection ne radi
Free tier zahteva **Session pooler** ili **Transaction pooler** za eksterne konekcije. Direct connection (`db.PROJECTREF.supabase.co`) zahteva IPv6 ili plaćeni IPv4 add-on.

### ⚠ Region je eu-west-1
Pri konfiguraciji bilo koje konekcije, region je **`eu-west-1`** (Ireland), ne `eu-central-1`. Pooler URL: `aws-0-eu-west-1.pooler.supabase.com`.

### ⚠ Username za pooler ima project ref
Format pooler username-a: `postgres.wdmipyooncrcdmvlloou` (sa project ref-om, ne samo `postgres`).

---

## Backup sistem (paralelni projekat)

Za rezervu Supabase baze postoji **odvojen GitHub repo**: `imicunovic83/podbara-backups` (PRIVATE).

**Lokalni helper**: `C:\Users\ilija\OneDrive\Desktop\podbara-backup-script\`
- `backup.ps1` — PowerShell skripta za `pg_dump` → zip → git push
- `config.txt` — sadrži Supabase connection string sa pravom lozinkom (NE u Git-u)
- `logs/backup.log` — audit log

**Task Scheduler**: zadatak `Podbara Daily Backup` pokreće `backup.ps1` svaki dan u 04:00.

GitHub Actions je **isključen** za backup (košta na privatnom repo-u). Sve radi lokalno.

---

## Push workflow

Korisnik ima `push-podbara.bat` na Desktop-u koji automatizuje:
```
git status → git add . → git commit -m "..." → git push
```

Nakon `git push`, GitHub Pages automatski deploy-uje za 1-2 min.

---

## Skorašnje izmene (do 2026-04-28)

Vidi `git log --oneline` za potpunu istoriju. Ključne sesije:

- **2026-04-28**: Supabase performance/security cleanup kroz Supabase MCP. Primenjene 4 migracije:
  - `optimize_rls_policies_initplan` — sve RLS policies prepravljene da koriste `(SELECT auth.uid())` / `(SELECT auth.jwt())` (40 fix-eva za `auth_rls_initplan`). Usput obrisane redundantne policies: `your policy name` (test) na addresses, `Users can read own profile` (subsumirana) na profiles, `streets_select_admin_all` (subsumirana). Admin ALL policies na `roles` i `survey_statuses` razbijene na zasebne INSERT/UPDATE/DELETE.
  - `add_fk_covering_indexes` — 11 novih indeksa za FK kolone bez covering index-a (npr. `idx_addresses_created_by`, `idx_resident_entries_survey_record_id` itd.).
  - `fix_streets_multiple_permissive_select` — odvojene SELECT policies na `streets` da viewer/editor ne overlap-uju.
  - `consolidate_streets_select_into_one` — finalno spojeno u jedan `streets_select` policy (admin/editor/assigned-viewer u jednom OR-u).
  - **Rezultat**: performance advisor pao sa 63 → 18 lints (svi preostali su INFO `unused_index` — najviše to su novi FK indeksi koji još nisu korišćeni, plus kritičan `idx_addresses_geom` PostGIS spatial koji se NE SME brisati).
  - **Security advisor**: ostao isti (PostGIS warning-i koji su deo postgis ekstenzije + `auth_leaked_password_protection` koji traži Pro plan).
- **2026-04-27**: Geolokacija fix — dodat `locationHelpModal` sa platform-specifičnim instrukcijama (iOS Safari, iOS Chrome, Android, desktop varijante). Trigger se automatski na `PERMISSION_DENIED`. Funkcije: `detectBrowserPlatform()`, `getLocationInstructionsHTML()`, `openLocationHelpModal()`. Commit: `4f909b0`.
- **2026-04-27**: Najbliže adrese UX poboljšanje — rezultate "Najbliže od mene" / "Najbliže neobiđeno" više ne prikazujemo u status banner-u gore (jer korisnik mora da skroluje), nego u **modal-u nad mapom** (`nearestResultsModal`). Lista je **klikabilna** — klik na adresu pan-uje mapu i otvara marker modal sa svim stanovima. Funkcije: `openNearestResultsModal()`, `closeNearestResultsModal()`. Modifikovan success callback u `showNearestAddresses`.

---

## Šta da uradiš na početku nove sesije

1. **Pročitaj ovaj fajl** (već radiš to ako si stigao do dna)
2. **Pogledaj `git log --oneline -20`** za skorašnje izmene
3. **Pitaj korisnika šta je cilj** — ne pretpostavljaj
4. **Ako se referenciraš na deo koda u `index.html`**, koristi `Grep` za precizno lociranje umesto čitanja celog fajla

---

## Update ovaj fajl

Kad završiš značajnu sesiju, **dodaj liniju u "Skorašnje izmene"** sa:
- datumom
- kratkim opisom izmena
- commit hash-om

Tako budući Claude vidi šta je rađeno bez gledanja celog `git log`-a.
