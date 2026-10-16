# Mishkat: Design System (Master)

The source of truth for all store and dashboard pages. It applies the brand charter in `charte-graphique/` (`charte-graphique.html` / `Mishkat-Charte-Graphique.pdf`) to the website. When the two disagree, the charter wins. The tokens are implemented in `src/app/globals.css` (`@theme`).

## Identity
- **Mishkat (the brand):** black and one gold, as in the logo, on ivory paper. On the site: an ivory base for reading and buying, with Mishkat's brand sections in black and gold.
- **Logo:** the official charter files (`charte-graphique/assets/logo-black.png`, `logo-gold.png`, `symbol-gold.png`), exported by `npm run assets` under hashed names. Black on light backgrounds, gold on dark ones, never gold on ivory. At least 120px wide on screen, and never stretched, rotated or given effects.
- **Sabili (the product):** royal blue and card yellow, only inside the Sabili world (the Sabili section on the homepage, its product page, and the "how to play" section). Product colours never touch the Mishkat logo.
- **Signature element:** the *niche* from the logo. It's used in three ways, each in its place:
  - the frame around product images (`.niche` / `.niche-sm`);
  - the niche pattern on dark backgrounds (`.niche-pattern`, never behind long text);
  - the niche divider (`NicheDivider`), used once on the homepage.
- **Card images:** the digital print files (`src/lib/card-images.ts`) with corners rounded like the printed cards.
- **The one motion moment:** the fan of the five Sabili cards (`CardFan`). Everything else stays still apart from hover and press feedback.

## Colors (charter)
| Token | Hex | Charter name | Use |
|---|---|---|---|
| ink | `#0B0B0B` | Mishkat black | Text, primary buttons, brand sections, footer |
| ink-soft | `#1E1C19` | Charcoal | Secondary surfaces on black |
| ivory | `#F6F0E3` | Ivory | Page background |
| paper | `#FFFDF8` | — | Cards, form fields, text on black |
| mist | `#EDE5D3` | — | Quiet bands (perks), summaries |
| line | `#DDD2BB` | — | Borders on ivory |
| muted | `#5C564C` | — | Secondary text on ivory (≥ 6:1) |
| stone | `#8C857A` | Warm grey | Secondary text on black only |
| gold | `#D4A440` | Mishkat gold | Accents and headings on black, never text on ivory |
| gold-light | `#F2D27A` | Light gold | Sheen, small details on black |
| gold-deep | `#8A6416` | Deep gold | Gold text and icons on ivory (4.7:1) |
| sabili / sabili-navy / sabili-yellow | `#0025D7` / `#1C2257` / `#FFD200` | — | Sabili's world only |
| success / danger / warning | `#17663F` / `#B42318` / `#8A5300` | — | Status messages, always with an icon and text |

**Proportions:** gold stays scarce (about 15%) so it stays precious.

## Type (charter: two typefaces only)
- **Headings:** Reem Kufi, a geometric Kufic in tune with the square letters of the logo. Main heading at 600 with line height 1.3; section headings at 500 with 1.4. Headings only, never long text.
- **Text:** IBM Plex Sans Arabic, 16px at 400 with line height 1.75. Labels and details at 600.
- Prices and numbers use tabular figures (`.tabular`).

## Layout
- RTL everywhere (`<html dir="rtl" lang="ar-TN">`), with logical properties only (`ms/me/ps/pe/start/end`).
- Container: `max-width: 76rem`, gutter 16px on mobile and 32px from 768px.
- **Homepage section rhythm:**

  | Section | Background |
  |---|---|
  | hero | ivory |
  | Sabili | navy |
  | Mishkat's approach | black + niche pattern |
  | perks | mist |
  | reviews | black |
  | FAQ | ivory |
  | footer | black |

- Touch targets ≥ 44px, and a visible focus ring (gold-deep on ivory, gold on black).
- Icons: thin line at 1.5, gold on dark or black on light, no emoji.

## Deliberately avoided
- Gradients for decoration, glows and shadows on the logo, a fade-in animation on every section, identical cards for every piece of content.
- Numbering, except for genuinely sequential content (the game stages).
- Made-up information: anything not confirmed is left out or left empty for the admin to fill in.
