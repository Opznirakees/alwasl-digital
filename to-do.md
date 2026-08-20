# Al-Wasl Digital beheeruitbreiding

Deze checklist beschrijft de opgeleverde blokkades, WhatsApp-berichten,
landgebonden prijzen en beheerbare websitecontent. De implementatie is test-first
gebouwd. Geheimen horen uitsluitend in de runtime secret store.

## 1. Centrale blokkades

- [x] PostgreSQL-model `AccessBlock` met `WHATSAPP`, `WAHO_ID` en `IP_ADDRESS`.
- [x] Centrale normalisatie en validatie voor telefoonnummers, WAHO-ID's,
      IPv4 en IPv6.
- [x] Gemaskeerde waarden in adminlijsten en auditmetadata.
- [x] Verplichte reden, actieve status, einddatum, aanmaker en opheffingsdata.
- [x] Blokkeren werkt ook als nog geen userrecord bestaat.
- [x] WhatsApp- en IP-controle voor login, OTP-verificatie en ingelogde API's.
- [x] WAHO-ID-controle voor accountverificatie en ordercreatie.
- [x] Bestaande sessies worden ingetrokken bij een WhatsApp-blokkade.
- [x] WAHO-ID- en IP-regels blijven onafhankelijk en blokkeren niet automatisch
      het volledige klantaccount.
- [x] Admin- en staffaccounts kunnen niet via een gekoppelde identifier worden
      geblokkeerd.
- [x] Publieke foutmeldingen onthullen niet welke blokkaderegel is geraakt.
- [x] Admin-API voor toevoegen, opheffen, heractiveren en opnieuw notificeren.
- [x] Auditlogs voor aanmaken, opheffen, heractiveren en WhatsApp-herzending.
- [x] Adminscherm met zoeken, typefilter, statusfilter en mobiele kaarten.
- [x] Dialoog voor type, waarde, reden, einddatum en WhatsApp-optie.
- [x] Bestaande user-blokkadeknop gebruikt dezelfde centrale service.

## 2. Directe WAHA WhatsApp

- [x] Rechtstreekse session-healthcontrole.
- [x] Recipient check via `check-exists`.
- [x] Verzending via `POST /api/sendText`.
- [x] Internationale nummernormalisatie voor onder andere Nederland en Irak.
- [x] Timeout en maximaal een begrensde retry voor netwerk-, 429- en 5xx-fouten.
- [x] Geen API-key, volledig nummer of berichtinhoud in applicatielogs.
- [x] `ACCOUNT_BLOCKED`-notificatie met de opgegeven reden.
- [x] Opt-in schakelaar bij blokkeren op WhatsApp-nummer.
- [x] SENT/FAILED-status blijft zichtbaar zonder de blokkade terug te draaien.
- [x] Handmatige herzendactie bij een mislukte blokkademelding.
- [x] `ORDER_CREATED`-ontvangstbevestiging na nieuwe ordercreatie.
- [x] Idempotente dedupe-key voorkomt dubbele orderbevestigingen bij retries.
- [x] Bestaande payment-, success-, failure- en marketingberichten blijven intact.
- [x] WhatsApp-templates zijn in EN/AR/ZH via Website text te beheren.

## 3. Landen, valuta en wisselkoersen

- [x] Wereldcatalogus met meer dan 220 landen, vlaggen, netnummers en valuta.
- [x] Interactieve wereldkaart met toegankelijke zoekbare landenlijst.
- [x] Per land instelbaar: IQD, USD, lokale valuta of een combinatie.
- [x] Per land een instelbare primaire prijsvaluta.
- [x] Handmatige IQD-wisselkoersen via het bestaande valutabeheer.
- [x] USD is als beheerde valuta en initiële handmatige koers opgenomen.
- [x] Minimaal één zichtbare valuta is verplicht.
- [x] Een valuta zonder actieve koers kan niet als primaire valuta worden gekozen.
- [x] Een nog niet geconfigureerd land start veilig met IQD als primaire valuta.
- [x] Live prijsvoorbeeld voor 10.000 IQD in de gekozen valuta.
- [x] Homepage, top-uplijst, wizard en orderbedragen gebruiken het landenbeleid.
- [x] Primaire prijs staat bovenaan; aanvullende prijzen staan compact als
      omrekening eronder.
- [x] Locale decimalen, symbolen, Arabische RTL en Chinese teksten blijven werken.
- [x] De klantvoorkeur voor land blijft lokaal; financiële bronbedragen blijven
      server-side in IQD.

## 4. Website text zonder programmeur

- [x] PostgreSQL-model `ContentOverride` met module, EN/AR/ZH en actief-status.
- [x] Eigen staffrecht `CONTENT_MANAGE`.
- [x] Gegenereerde catalogus van directe vertaalteksten en meertalige
      contentobjecten.
- [x] Meer dan 700 labels, instructies, moduleteksten, stappen en infoteksten
      zijn doorzoekbaar.
- [x] Dynamische teksten gebruiken beheerbare `{{placeholders}}`.
- [x] De API voorkomt dat verplichte placeholders per ongeluk worden verwijderd.
- [x] Publieke content-API levert uitsluitend actieve overrides.
- [x] Zonder override blijft altijd de ingebouwde EN/AR/ZH-tekst zichtbaar.
- [x] Adminscherm met zoeken, modulefilter, paginering, wijzigen, pauzeren en reset.
- [x] Aangepaste teksten en standaardteksten zijn visueel van elkaar te
      onderscheiden.
- [x] Wijzigingen worden na herladen op alle gekoppelde pagina's zichtbaar.
- [x] Publieke content wordt `no-store` geladen zodat een adminwijziging niet door
      een verouderde browsercache wordt verborgen.

## 5. TDD en visuele acceptatie

- [x] Unit tests voor normalisatie, blokkadestatus, masking en proxy-IP's.
- [x] Unit tests voor WAHA-health, recipient check, payload, timeout en retry.
- [x] Unit tests voor valutabeleid, conversie, ontbrekende koers en fallbacks.
- [x] Unit tests voor contentfallbacks en placeholderbehoud.
- [x] Integratietests voor WhatsApp-, WAHO-ID- en IP-blokkades.
- [x] Integratietest voor sessie-intrekking en herstel.
- [x] Integratietest bewijst dat een WAHA-failure de blokkade niet terugdraait.
- [x] Integratietest voor drietalige contentpersistentie.
- [x] E2E-flow voor blokkeren, reden versturen, zoeken en filteren.
- [x] E2E-flow voor Nederland op de kaart en EUR/IQD-prijsweergave.
- [x] E2E-flow voor websitecopy wijzigen.
- [x] Echte API-smoke voor auth, adminmutaties, landen en wisselkoersen.
- [x] Controle op desktop, 390 px, 320 px, Arabische RTL en Chinees.
- [x] Geen horizontale overflow of verborgen primaire acties gevonden.

## 6. Productie-activering

- [ ] Zet `WAHA_BASE_URL`, `WAHA_API_KEY` en `WAHA_SESSION` als versleutelde
      runtime secrets in DigitalOcean. Zet de sleutel nooit in Git of een
      client-side environment variable.
- [ ] Voer `prisma migrate deploy` uit op de productie-PostgreSQL-database.
- [ ] Controleer in admin per actief land de handmatige koers en primaire valuta.
- [ ] Verstuur een gecontroleerde blokkademelding naar een intern testnummer en
      hef de testblokkade daarna op.
- [ ] Plaats een interne testorder en controleer dat precies één
      `ORDER_CREATED`-bericht aankomt.
- [ ] Controleer in admin de auditlog en WhatsApp SENT/FAILED-status na de
      productieproef.

## 7. Verificatiecommando's

- [x] `bun run content:generate`
- [x] `bun run test:unit`
- [x] `bun run test:integration`
- [x] `bun run typecheck`
- [x] `bun run typecheck:e2e`
- [x] `bun run build` opnieuw uitvoeren na de laatste review.
- [x] `bun run test:e2e` opnieuw uitvoeren na de laatste review.
- [x] `bun audit --production` meldt geen bekende kwetsbaarheden.
- [x] `git diff --check`
- [x] Laatste desktop- en mobiele screenshots handmatig beoordelen.
