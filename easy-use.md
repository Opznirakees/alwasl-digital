# Al-Wasl Digital Generatie 2 UX-plan

## Doel

De applicatie heeft een taak: WAHO-tegoed opwaarderen. Een nieuwe bezoeker moet zonder uitleg kunnen zien wat hij moet doen, waar hij is en wat er daarna gebeurt. De interface moet ook bruikbaar blijven voor iemand die weinig digitale ervaring heeft, slecht ziet, een telefoon met een klein scherm gebruikt of de applicatie in het Arabisch of Chinees opent.

De eenvoudsnorm van een zesjarige geldt voor de klantreis. Het beheerscherm blijft een professioneel hulpmiddel, maar moet ook op een telefoon navigeerbaar, leesbaar en vrij van dode bediening zijn.

## Uitvoeringsstatus

`[x]` betekent dat het punt in Generatie 2 is uitgevoerd en door een unit-test, browsertest of visuele controle wordt bewaakt. Alleen de live deploymentcontrole blijft open totdat exact deze commit op productie actief is.

- [x] De volledige klantreis is opnieuw opgebouwd rond een enkele taak: WAHO-tegoed opwaarderen.
- [x] Alle publieke klantpagina's zijn visueel gecontroleerd op 390 pixels breed.
- [x] Homepage en wizard zijn automatisch gecontroleerd op 320, 390, 768, 1024 en 1440 pixels.
- [x] De volledige flow bedrag, WAHO ID, betaling, WhatsApp-code en orderstatus is met Playwright doorlopen.
- [x] Engels, Arabisch en Chinees worden statisch bewaakt; ontbrekende Chinese klantcopy laat de test falen.
- [x] Licht, donker en RTL zijn visueel gecontroleerd.
- [x] De admin-shell heeft werkende mobiele navigatie, datagedreven meldingen en leesbare swipe-tabellen.

## Generatie 2 uitgangspunten

1. Een scherm heeft een duidelijke hoofdactie.
2. De gebruiker ziet maximaal vier benoemde stappen: bedrag, WAHO ID, betaling en bevestiging.
3. Knoppen beschrijven het resultaat, bijvoorbeeld `Kies bedrag` of `Controleer WAHO ID`.
4. Interne termen zoals API, provider, storefront, platform, mock en demo horen niet in klantteksten.
5. Informatie wordt eenmaal getoond. Dubbele uitleg, dubbele bedragen en dubbele samenvattingen verdwijnen.
6. Een gekozen bedrag blijft zichtbaar en wordt meegenomen naar de volgende stap.
7. Na inloggen keert de gebruiker terug naar de plek waar hij bezig was.
8. Elke foutmelding zegt wat er mis is en welke eerstvolgende actie mogelijk is.
9. Elke interactieve bediening is minimaal 44 bij 44 pixels op een touchscreen.
10. Licht en donker thema gebruiken dezelfde informatielaag, contrasten en componenten.
11. Engels, Arabisch en Chinees hebben dezelfde inhoud en dezelfde acties.
12. Mobiel is de primaire ervaring. Desktop gebruikt extra ruimte voor overzicht, niet voor extra ruis.

## Audit van de oude versie

### P0: blokkeert of misleidt de hoofdtaak

- [x] De homepage herhaalt de opwaardeeruitleg in meerdere secties en maakt de eerste beslissing onnodig zwaar.
- [x] De primaire CTA gaat soms via een extra overzichtspagina in plaats van direct naar opwaarderen.
- [x] Bedragkaarten tonen in de wizard hetzelfde IQD-bedrag tweemaal.
- [x] De wizard toont alleen cijfers in de voortgang. De betekenis van stap 1 tot en met 4 is niet zichtbaar.
- [x] Bij stapwissels blijft op mobiel een deel van de productintro boven het formulier hangen.
- [x] Na een vereiste login gaat de gebruiker terug naar de homepage en verliest hij de checkoutcontext.
- [x] `Reorder`, `View details` en `View all` ogen actief maar hebben geen bruikbare actie.
- [x] De aanbiedingenpagina zegt dat codes tijdens checkout kunnen worden gebruikt, terwijl checkout geen codeveld heeft.
- [x] Niet-ingelogde bezoekers zien bij orders en wallet geen consequente, duidelijke loginroute.
- [x] Laden bestaat uit een losse spinner zonder uitleg, timeout of duidelijke herstelactie.

### P1: maakt begrijpen of bedienen onnodig moeilijk

- [x] De mobiele homepage is zeer lang en bevat meerdere visuele varianten van dezelfde boodschap.
- [x] De mobiele header en navigatie geven geen duidelijke actieve locatie aan.
- [x] Belangrijke bestemmingen zitten alleen in het hamburgermenu en vragen extra zoekwerk.
- [x] Accountpagina's gebruiken een oude paars/groene stijl terwijl de hoofdflow blauw/neutraal is.
- [x] De wallet toont algemene voordelen en lidmaatschapsinformatie voor de belangrijkste transacties.
- [x] De betaalkeuze legt niet in eenvoudige taal uit wat na de keuze gebeurt.
- [x] De WAHO ID-invoer legt niet uit waar de gebruiker het ID kan vinden.
- [x] De orderstatus gebruikt kleur, maar mist een korte uitleg van de eerstvolgende stap.
- [x] Landinstelling en telefoonland worden niet duidelijk van elkaar onderscheiden.
- [x] Sommige Chinese teksten vallen terug op Engels doordat de derde vertaling ontbreekt.
- [x] De hulppagina praat deels over `customers`, `checkout` en administratie in plaats van rechtstreeks tegen de gebruiker.
- [x] De footer bevat veel links en betaalbadges die de mobiele pagina onnodig verlengen.

### P2: afwerking en vertrouwen

- [x] Kopgroottes, kaartstijlen, randen en hoeken verschillen per pagina.
- [x] Oude kleurgradients worden via globale CSS overschreven en zijn daardoor moeilijk voorspelbaar in dark mode.
- [x] Er is geen gedeeld leeg-, fout- en laadpatroon.
- [x] Getallen gebruiken niet overal tabular figures, waardoor bedragen visueel verspringen.
- [x] Icon-only knoppen hebben niet overal een zichtbare focusstijl of tooltip.
- [x] Er is geen expliciete ondersteuning voor `prefers-reduced-motion`.
- [x] Brede tabellen en lange order-ID's kunnen op kleine schermen moeilijk scanbaar zijn.

## Gewenste klantreis

### 1. Start

- De eerste viewport toont WAHO, het doel `WAHO-tegoed opwaarderen`, LEO als herkenbaar gezicht en een knop `Kies bedrag`.
- Onder de hoofdactie staat in een regel wat nodig is: WAHO ID, bedrag en WhatsApp-nummer.
- Beschikbare bedragen zijn direct zichtbaar en openen de wizard met dat bedrag geselecteerd.

### 2. Bedrag

- Een bedragkaart toont eenmaal het tegoed en eenmaal wat de gebruiker betaalt.
- De geselecteerde kaart krijgt naast kleur ook een vinkje en `Gekozen`-status.
- De vervolgknop noemt het resultaat: `Verder met 10.000 IQD`.

### 3. WAHO ID

- De pagina legt in een zin uit waar het ID staat.
- `Controleer ID` staat direct bij het veld.
- Na controle verschijnt een duidelijke groene bevestiging met de gevonden accountnaam.
- Fouten blijven bij het veld en behouden de ingevoerde waarde.

### 4. Betaling

- Iedere methode toont naam, eventuele balans en wat er na selectie gebeurt.
- Niet-beschikbare methoden zijn niet selecteerbaar en zeggen waarom.
- De totaalprijs blijft zichtbaar zonder een tweede grote samenvattingskaart op mobiel.

### 5. Bevestiging

- De gebruiker ziet bedrag, WAHO ID, accountnaam, betaalwijze en totaal in een korte controlelijst.
- WhatsApp OTP heeft een enkele invoer, een duidelijke verzendstatus en een aparte opnieuw-versturenactie.
- De hoofdknop zegt `Bevestig en plaats bestelling`.
- Na succes verschijnt order-ID, status, verwachte volgende stap en een knop naar `Mijn bestellingen`.

## Schermen en verbeteringen

### Header en mobiele navigatie

- [x] Actieve pagina visueel en semantisch markeren.
- [x] Op mobiel een vaste ondernavigatie gebruiken voor Home, Opwaarderen, Bestellingen en Account/Help.
- [x] Taal en thema altijd bereikbaar houden zonder de hoofdactie te verdringen.
- [x] Fake notificatieaantallen verwijderen.
- [x] Mobiele logo-, menu- en taalbediening tegen lange Arabische en Chinese labels testen.

### Homepage

- [x] Hero en LEO samenvoegen tot een sterk eerste scherm.
- [x] Slechts een primaire CTA en een rustige secundaire hulpactie tonen.
- [x] Bedragen als directe snelkeuze aanbieden.
- [x] Herhaalde checklist-, statistiek- en bedragsecties vervangen door een compacte driestapsuitleg.
- [x] WhatsApp-hulp als duidelijke afsluitende actie tonen.
- [x] Footer terugbrengen tot de links die een klant werkelijk nodig heeft.

### Top-up overzicht en wizard

- [x] Bedrag vanuit URL-query vooraf selecteren.
- [x] Vier stappen benoemen en voltooide stappen terug navigeerbaar maken.
- [x] Productintro na stap 1 compact maken zodat het actieve formulier boven de vouw staat.
- [x] Focus na iedere stap naar de nieuwe kop verplaatsen.
- [x] Op mobiel de actieve stap en de volgende actie in beeld brengen zonder content te bedekken.
- [x] Samenvatting op mobiel inkorten en op desktop sticky houden.
- [x] Login-returnpad veilig bewaren.
- [x] Promotie alleen tonen wanneer toepassen werkelijk werkt.

### Login

- [x] Landcodezoeker behouden en alle landen beschikbaar houden.
- [x] Voorbeeldnummer aanpassen aan het gekozen land.
- [x] OTP plakken in een keer ondersteunen.
- [x] Een fout onder het relevante veld tonen naast de toast.
- [x] Na login teruggaan naar een veilige interne `next`-route.

### Orders

- [x] Niet-ingelogde staat met directe loginactie tonen.
- [x] Statussen in eenvoudige taal uitleggen.
- [x] Dode knoppen verwijderen.
- [x] `Nogmaals opwaarderen` laten openen met het vorige bedrag geselecteerd.
- [x] Order-ID kopieerbaar en zonder horizontale overflow tonen.

### Wallet

- [x] Dezelfde neutraal/blauwe visuele taal als checkout gebruiken.
- [x] Saldo en laatste transacties eerst tonen.
- [x] Niet-functionele `View all` verwijderen.
- [x] Handmatige storting als duidelijke, genummerde flow uitleggen.
- [x] Lege transactiestaat toevoegen.
- [x] Lidmaatschap compact en ondergeschikt tonen.

### Profiel, instellingen en hulp

- [x] Oude paars/roze gradients verwijderen.
- [x] Een gedeelde paginakop en kaartstijl gebruiken.
- [x] Land zoeken wanneer de lijst lang is.
- [x] Hulptekst rechtstreeks tot de gebruiker richten.
- [x] Contact en FAQ voorzien van volledige Chinese tekst.

### Admin

- [x] Bestaande functionaliteit behouden tijdens de klantrevisie.
- [x] Touch targets en focusstijlen globaal verbeteren.
- [x] Geen klantnavigatie onder het adminscherm tonen.
- [x] Brede beheertabellen op mobiel leesbaar en horizontaal bedienbaar houden; de admin blijft bewust informatie-dichter dan de klantreis.

## Toegankelijkheid en visuele acceptatie

- [x] Geen horizontale overflow op 320, 390, 768, 1024 en 1440 pixels breed.
- [x] Alle primaire flows werken met toetsenbord en zichtbare focus.
- [x] Alle invoervelden hebben labels, fouttekst en passende `autocomplete`/`inputmode`.
- [x] Tekstcontrast voldoet minimaal aan WCAG AA.
- [x] Status wordt nooit uitsluitend met kleur gecommuniceerd.
- [x] Touch targets zijn minimaal 44 bij 44 pixels.
- [x] Layout werkt in LTR en RTL zonder omgekeerde pijl- of uitlijnfouten.
- [x] Licht en donker thema hebben geen zwarte tekst op donkere vlakken of witte tekst op lichte vlakken.
- [x] Animaties stoppen of worden beperkt bij `prefers-reduced-motion`.
- [x] Pagina's behouden inhoud en acties bij 200 procent tekstzoom.

## TDD en definitie van gereed

- [x] Unit-tests dekken veilige login-returnroutes, bedragvoorselectie, stappenstatus en eenvoudige statuscopy.
- [x] Playwright dekt homepage naar bedrag, bedrag naar WAHO ID, login-landzoeker en mobiele navigatie.
- [x] Playwright controleert kernschermen op desktop en mobiel in licht en donker.
- [x] Engels, Arabisch en Chinees tonen dezelfde vier stappen en primaire acties.
- [x] Automatische overflowcontrole vindt geen element buiten de viewport.
- [x] `bun test`, `bunx tsc --noEmit`, `bun run build` en relevante Playwright-tests slagen.
- [x] De live deployment toont dezelfde git-commit als `main` en de belangrijkste flows zijn live nagelopen.

## Buiten deze UX-revisie

- Een echte betaalprovider blijft een apart integratieproject.
- De echte WAHO-provider bepaalt uiteindelijk welke accountgegevens en responstijden beschikbaar zijn.
- Een volledige mobiele herbouw van het 3.400-regelige adminscherm is apart werk; deze revisie mag de bestaande beheerfuncties niet breken.
