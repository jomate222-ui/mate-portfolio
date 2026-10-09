# Mate Nikić — Portfolio

Statički HTML/CSS/JS portfolio, spreman za Cloudflare Pages.

## Lokalno pokretanje

U direktoriju projekta pokreni `python -m http.server 8000` i otvori http://localhost:8000.

## Cloudflare Pages

1. Kreiraj novi GitHub repository `mate-portfolio`.
2. Prenesi **sadržaj** ove mape u root repozitorija.
3. Cloudflare → Workers & Pages → Create → Pages → Connect to Git.
4. Odaberi repository. Build command ostavi prazno, output directory `.` (root).
5. Deploy. Dobit ćeš besplatnu `*.pages.dev` adresu.

## Prije javne objave

- Zamijeni `EMAIL_ADRESA_OVDJE` u `index.html`.
- Dodaj fotografije i provjerene linkove za NK Gavran Lanište i Zauvijek si tu.
- Pregledaj i odobri tekstove studija slučaja.
- Slike `assets/case-1.png` do `case-7.png` su prikazi iz dostavljenog PDF-a.
- Web koristi Google Fonts (DM Sans i Space Grotesk); bez interneta pada na lokalni sans-serif.


## V2 – filtriranje i predložak
Na početnoj stranici filteri rade prema uslugama i tekstualnoj pretrazi. Cijene nisu uključene jer u izvornom PDF-u nisu navedene; mogu se naknadno dodati samo uz potvrđene podatke. Svaka studija slučaja sada slijedi pet jednakih sekcija: kontekst, cilj, doprinos, rješenje, rezultati. Nedostajući rezultati su jasno označeni.
