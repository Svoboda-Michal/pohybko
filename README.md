# Pohybko 🚴‍♂️🌱

Gamifikovaná platforma pre podporu aktívnej mobility v školách s merateľným prínosom pre životné prostredie.

## 🎯 O projekte

Pohybko motivuje študentov používať aktívnu dopravu (chôdza, bicykel, verejná doprava) namiesto auta pomocou bodového systému a sledovania úspory CO₂.

## ✨ Hlavné funkcie

- **6-ciferné kódy staníc** - Študenti môžu zadať kód manuálne alebo skenovať QR kód externým skenerom
- **GPS geolokačná verifikácia** 📍 - Stanice môžu vyžadovať fyzickú prítomnosť študenta (napr. do 5-50m)
- **ABC kvízy** 🎯 - Interaktívne kvízové otázky pri skenovaní (správna odpoveď = 5 bodov)
- **CO₂ kalkulačka** - Automatický výpočet úspory emisií pre každý typ dopravy
- **Leaderboard** - Rebríček študentov podľa bodov a úspory CO₂
- **Admin panel** - Správa staníc, kvízov a zobrazenie štatistík

# Pohybko — aktívna mobilita pre školy

Táto aplikácia je nasadená a dostupná na serveri, takže koncoví používatelia ju môžu používať priamo cez prehliadač alebo mobilné zariadenie bez potreby klonovať repozitár.

Nezabudnite upraviť nižšie uvedenú položku "Nasadenie" tak, aby obsahovala reálnu URL vašej inštancie aplikácie.

## Kde ju nájdete

- Nasadená verzia: pohybko.kontiro.com

Poznámka: ak chcete aplikáciu vyvíjať lokálne, touto možnosťou sa zaoberá sekcia "Pre vývojárov" nižšie — ale pre bežných používateľov nie je klonovanie potrebné.

## O aplikácii

Pohybko je gamifikovaná platforma, ktorá motivuje žiakov a študentov k aktívnej mobilite (pešo, bicyklom, MHD) namiesto individuálnej automobilovej dopravy. Sleduje body, úsporu CO₂ a zobrazuje rebríček účastníkov. Systém využíva 6-ciferné kódy alebo QR kódy staníc a voliteľnú geolokačnú verifikáciu.

### Hlavné funkcie

- 6-ciferné kódy staníc a QR kódy pre jednoduché označenie návštevy
- Voliteľná GPS geolokačná kontrola (nastaviteľné radiusy)
- Krátke ABC kvízy pri návšteve stanice (motivujúci bodový systém)
- Výpočet odhadnutej úspory CO₂ podľa typu dopravy
- Rebríček (leaderboard) a štatistiky pre triedy/žiakov
- Admin rozhranie na správu staníc, kvízov a nastavení
- Autentifikácia a perzistencia cez Supabase

## Ako používať (pre účastníkov)

1. Otvorte nasadenú aplikáciu (odkaz vyššie).
2. Prihláste sa / zaregistrujte podľa inštrukcií v aplikácii.
3. Na mieste so značkou nájdete QR kód alebo 6-ciferný kód.
4. Naskenujte QR kód svojím mobilom (alebo zadajte kód) a potvrďte návštevu.
5. Ak je zapnutá geolokácia, povoľte prístup k polohe—aplikácia overí vašu blízkosť.
6. Odpovedzte na krátky kvíz (ak je priradený) a získajte body.

Tipy:
- Pre správne meranie povolené GPS a moderný mobilný prehliadač sú odporúčané.
- Ak QR skener nefunguje, zadajte kód manuálne cez vstup v aplikácii.

## Pre administratorov (krátko)

- V admin paneli vytvorte stanicu a pridajte kvízové otázky, ak chcete.
- Každá stanica dostane 6-ciferný kód a môžete vygenerovať QR kód na tlač.
- Voliteľne nastavte GPS súradnice a radius kontroly.

Viac detailov o správe staníc nájdete v admin rozhraní po prihlásení.

## Ochrana údajov

Údaje o používateľoch a aktivite sa ukladajú v Supabase (databáza). Nezdieľame osobné údaje verejne. Ak máte špecifické požiadavky na anonymizáciu alebo export dát, kontaktujte správcu projektu.

## Pre vývojárov (voliteľné)

Repozitár obsahuje zdrojový kód aplikácie — ak chcete lokalne spustiť a vyvíjať, tu je rýchly návod. Toto nie je povinné pre bežných používateľov.

1. Skopírujte repozitár (iba pre vývoj):

```bash
git clone https://github.com/Svoboda-Michal/pohybko
cd pohybko
npm install
npm run dev
```

2. Nastavte premenné prostredia pre Supabase podľa `env.example`.

3. Pre lokálny vývoj odporúčame moderný Node.js (LTS) a nainštalovaný npm alebo bun podľa projektu.

## Časté problémy a riešenia

- "Aplikácia nevidí moju polohu": skontrolujte, či prehliadač povolil prístup k polohe a či je zariadenie online.
- "QR kód nefunguje": skúste manuálne zadať 6-ciferný kód zetikety.
- "Nesprávne body/štatistiky": skontrolujte, či ste prihlásený a či admin neskonfiguroval stanice ako neaktívne.

Ak problém pretrváva, pošlite screenshot a popis problému správcovi projektu.

## Kontakt / podpora

- Projektový tím: hello@kontiro.com
- Repo (pre vývojárov): https://github.com/Svoboda-Michal/pohybko

---
