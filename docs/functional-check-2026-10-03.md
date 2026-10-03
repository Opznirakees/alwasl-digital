# Functionele controle - 3 oktober 2026

## Conclusie

Alle uitgevoerde functionele tests slagen. Dit is geen verklaring dat iedere
mogelijke fout is uitgesloten of dat externe betalingen en WhatsApp-bezorging
volledig zijn geaccepteerd. Onderstaande beperkingen blijven van toepassing.

## Resultaten

| Controle | Resultaat |
| --- | --- |
| Unit-tests | 195 geslaagd, 0 mislukt |
| Database-integratietests | 13 geslaagd, 0 mislukt |
| Playwright desktop en mobiel | 45 geslaagd, 0 mislukt, 9 bewust overgeslagen duplicaten |
| TypeScript applicatie en E2E | Geslaagd |
| Productiebuild Next.js 15.5.27 | Geslaagd |
| Installatie met frozen Bun-lockfile | Geslaagd |
| Live browsercontrole | 13 routes op 390 en 1440 pixels; geen pageerrors of horizontale overflow |
| Live beschermde API's | Orders, wallet, admin en beschermde productdetails weigeren anonieme toegang |
| Live publieke API's | Health, categorieen, productenoverzicht, landen en banners beantwoorden met HTTP 200 |

De 9 overgeslagen Playwright-tests draaien al in het desktopproject met expliciet
ingestelde mobiele viewports. Ze zijn niet overgeslagen wegens defecten.

## Gedekte flows

- Echte lokale OTP/session-API's, rollen, toegang tot admin en gevoelige acties.
- Publieke Asiacell-prijzen en WAHO-prijzen achter login.
- Terugkeer na login met behoud van geselecteerd pakket.
- Bestelwizard, accountschermen, cashkeuze en vertraagde QiCard-statuscontrole.
- Cashbestelling via echte API/database, adminbevestiging, idempotente herhaling,
  handmatige codelevering en opnieuw opvragen van de opgeslagen bestelstatus.
- Wallet-afboeking, geen dubbele afboeking bij herhaling en handmatige stortingen.
- QiCard success, cancel, refund, webhookhandtekeningen, afwijkende claims en deduplicatie.
- Adminmutaties, blokkades, inhoud, tarieven, banners, rapportage en XLSX-export.
- Engels, Arabisch RTL, Chinees en mobiele menubediening op 320/390 pixels.
- Visuele inspectie van checkout, Asiacell, homepage, blokkades en valutabeheer.

Database- en API-tests gebruikten een aparte lokale database
`alwasl_e2e_20261003`. UI-tests in `easy-use.spec.ts` gebruiken gemockte API's;
`app.spec.ts` en de integratietests gebruiken echte lokale databasebewerkingen.
QiCard-antwoorden en fulfillmentproviders zijn in die tests gesimuleerd.
Er zijn geen echte betalingen, refunds of WhatsApp-berichten uitgevoerd.

## Wijzigingen

- Unit-testselectie beperkt tot `./tests`; het oude filter selecteerde onbedoeld
  ook een bestand onder `integration-tests`.
- WAHA vereist nu een expliciete sessie en valt niet stil terug op `default`.
  Een eerst falende regressietest bewijst deze correctie.
- Extra E2E-dekking voor de mobiele sluitknop en de volledige cash/codeorderketen.
- Gelijktijdige retries van een mislukte WhatsApp-notificatie claimen het bericht
  nu atomair. De regressietest verstuurde voor de fix vier keer en na de fix eenmaal.
- Security-audits en functionele CI-tests draaien als onafhankelijke jobs.
  Auditfouten blijven de workflow afkeuren, maar blokkeren geen E2E-uitvoering meer.
- Next.js en ESLint-config bijgewerkt naar 15.5.27; gerichte patches voor sharp,
  brace-expansion, fast-uri, mysql2 en js-yaml. Beide lockfiles bijgewerkt.

## Live WAHA-configuratie

De app gebruikte nog `default`. Deze instelling is gewijzigd naar
`session_01m3v3nq6bd1x319zknkk132g3` op verzoek van de gebruiker.
Deployment `db185e8b-4659-40d7-a653-d1530a8084b7` is ACTIVE.
Vanuit de actieve appcontainer is bevestigd:

- De opgegeven sessie staat daadwerkelijk in de runtimeconfiguratie.
- Bestaande sleutel autoriseert de sessie: HTTP 200, WORKING, CONNECTED.
- Ontvangernummercontrole slaagt; dit bewijst niet dat een bericht is bezorgd.

## Nog open en releasegrenzen

1. De eerste codewijzigingen en beveiligingsupdates zijn op verzoek gepusht naar
   main als `df453e1`. De aanvullende retry-fix en CI-splitsing worden apart
   gepubliceerd. Deploymentstatus moet worden gecontroleerd op de broncommit;
   een push alleen bewijst niet dat de nieuwe code live draait.
2. Geen daadwerkelijke WhatsApp-verzending of OTP-ontvangst op een telefoon getest.
3. Geen echte QiCard-transactie, externe refund of provider-geinitieerde callback
   uitgevoerd. Hiervoor blijft een gecontroleerde merchantacceptatietest nodig.
4. Een native WAHO API is nog niet beschikbaar; succesvolle automatische externe
   WAHO-opwaardering kan daarom niet worden bevestigd.
5. `bun audit --audit-level=high` meldt nog een high advisory voor `braces`, via
   onder meer Tailwind, Prisma-config en ESLint. De actuele uitgave 3.0.3 heeft
   volgens de audit geen patch. Niet onderdrukt en geen grote frameworkmigratie
   uitgevoerd om deze controle kunstmatig groen te maken.
6. `npm audit --omit=dev` meldt na de updates 11 meldingen: 0 critical, 5 high,
   5 moderate, 1 low. De high meldingen omvatten ook afhankelijkheden van braces;
   de npm- en Bun-resoluties zijn niet identiek. De afzonderlijke CI-securityjob
   blijft daardoor rood; meldingen zijn niet onderdrukt.
7. pg geeft een deprecation-waarschuwing over gelijktijdige queries binnen een
   client; de huidige integratietests slagen, maar een pg-majorupgrade vereist controle.
8. Browserdekking is Chromium desktop en Pixel 5-emulatie, geen fysieke iPhone,
   Safari/Firefox, belastingtest of volledige penetratietest.

Next.js-advisory die de gerichte beveiligingsupdate motiveert:
https://github.com/advisories/GHSA-2xp9-vwfh-vxw4

Braces-advisory opnieuw gecontroleerd: er is nog geen gepatchte uitgave vermeld.
https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

## Herhalen

Gebruik uitsluitend een aparte testdatabase; voer de muterende suite niet uit
tegen de live URL of productiedatabase.

```sh
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/alwasl_e2e_20261003
bun run db:migrate
bun run db:seed
bun run test:unit
bun run test:integration
bun run typecheck
bun run typecheck:e2e
bun run build
PORT=3100 PLAYWRIGHT_USE_SYSTEM_CHROME=true bun run test:e2e --workers=1
```

Een worker beperkt het RAM-gebruik. Lokale servers en browser zijn na de controle gestopt.
