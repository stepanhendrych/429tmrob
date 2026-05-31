# Hackathon Project README

## Projektový kontext
Tento repozitář slouží jako základ pro studentský hackathonový projekt na České AI Olympiádě 2026, Moravskoslezský kraj, okresní kolo. Cílem je vytvořit funkční, hmatatelné řešení pro reálného uživatele nebo byznys zákazníka, nikoli pouze teoretický prototyp.

## Role a přístup
Projekt je veden jako elitní full-stack AI hackathonová aplikace s důrazem na:
- rychlý vývoj a pragmatickou architekturu
- modulární a přehledný kód
- reálné demo připravené pro porotu
- co nejmenší zbytečné overengineering

## Technologický stack

### Backend
- Python
- FastAPI
- pandas pro čištění a zpracování dat
- uv pro správu balíčků a prostředí

### AI/ML vrstva
- PyTorch / ResNet18
- scikit-learn / XGBoost pro predikci tabulkových dat
- oficiální LLM SDK pro lidskou interpretaci výsledků

### Frontend
- React
- Tailwind CSS
- shadcn UI
- lucide-react
- recharts pro vizualizaci grafů
- react-leaflet pro mapy

### Kvalita kódu a nástroje
- Dotenvx pro bezpečné šifrování konfigurace a proměnných prostředí
- ruff pro linting Python kódu
- Biome pro linting JavaScript/TypeScript

## Porotní kontext

### nvias, z.s.
Porota hledá startupový mindset, edukativní přesah a reálný produkt. Základní požadavky:
- fungující demo
- jasně definovaný uživatel / zákazník
- co nejmenší abstrakce a co nejvíce praktické hodnoty

### Tietoevry
Hostitel hodnotí zejména B2B řešení s potenciálem pro:
- Smart City
- Průmysl 4.0
- Green IT a ESG
- zdravotnictví

Řešení musí být škálovatelné a profesionální, ne pouze "hračka pro spotřebitele".

## Pravidla vývoje
- Piš kód co nejvíce modulárně a pragmaticky.
- Drž se rychlého hackathonového rytmu.
- Přizpůsobuj architekturu tomu, co je reálně potřeba daný den.
- Neupínej se dogmaticky na předchozí zadání; ber je jako kontext, ne jako pevný plán.

## Doporučený postup
1. Definuj uživatelský problém a cílovou hodnotu.
2. Vyber nejdůležitější MVP funkce.
3. Nastav backend FastAPI a datovou pipeline.
4. Připrav frontendovou ukázku s vizualizací a mapami.
5. Validuj řešení podle porotního kontextu.
6. Testuj offline i online demonstrace.

## Poznámka k dokumentaci
Veškerá dokumentace, projektové plány a návrhy je vhodné psát jasně, strukturovaně a v Markdownu. Pokud vkládáš příklady kódu, použij bloky kódu s oddělovačem ~~~ v rámci dokumentů, abys zachoval syntaktickou integritu při dodržení interních pravidel.
