# Mishkat: Design System (Master)

The source of truth for the store, the dashboard, and everything Mishkat prints or posts. Tokens live in `src/app/globals.css` (`@theme` + `@utility`). The live visual guide is the unlisted page **`/brand`** (not indexed, disallowed in `robots.ts`), built from the real components so it cannot drift.

## 1. Art direction: "the lit niche" (المشكاة المضيئة)
The name comes from the Light Verse (24:35): a niche, a lamp inside it, lit with oil from a blessed olive tree. The identity abstracts those three things instead of illustrating them:

| Idea | Becomes |
|---|---|
| The niche (مشكاة) | Shape language: the pointed-arch frame for product photos (`.niche`), the small niche glyph (`NicheMark`) for eyebrows, bullets and dividers, and the niche lattice pattern on dark bands. |
| The lamp (مصباح) | Lamp gold on warm ink; ivory "lit paper" instead of cold white. |
| The olive tree (زيتونة) | Olive green (`zaytun`) as the calm second voice: learning sections, reassurance panels. |
| The square Kufic logo | A geometric modern Arabic display face (Alexandria) instead of calligraphy. |

Personality: trustworthy, warm, curious; playful through the card fan, colour pops and real photos, never childish or "school website". Islamic without mosques, crescents or stock ornament.

**Brand architecture.** Mishkat is the parent brand (ink, gold, olive). Each game owns its own world: Sabili is royal blue + card yellow and appears only in Sabili sections, introduced by the eyebrow «من ألعاب مشكاة». Future products get their own accent colour inside the same Mishkat frame (ivory pages, Alexandria/Plex, niche shapes).

## 2. Colour
| Role | Token | Hex | Rules |
|---|---|---|---|
| Primary | `ink` | `#17140F` | Text, primary buttons, announcement bar, dark bands, footer. 17:1 on ivory. |
| Primary hover | `ink-soft` | `#2A251D` | Hover on ink. |
| Accent | `gold` | `#D4A44C` | Highlights: active nav marker, cart count, gold CTA, headings on ink. 8:1 on ink. Never small text on light backgrounds. |
| Accent deep | `gold-deep` | `#7C5A14` | Gold text and icons on light backgrounds (6:1 on ivory). |
| Accent light | `gold-light` | `#F1DDA4` | Selection, icon chips, small text on olive. |
| Secondary | `zaytun` | `#2E5446` | Learning bands, reassurance (payment panel), benefit ticks. Gold on olive is 3.7:1 → large text only. |
| Secondary hover | `zaytun-deep` | `#234036` | |
| Secondary tint | `zaytun-tint` | `#E5EDE7` | Soft info panels, tick chips. |
| Background | `paper` | `#FBF8F2` | Every page. |
| Secondary background | `sand` | `#F3ECDF` | Alternating sections, summaries, image wells, skeletons. |
| Surface | `surface` | `#FFFFFF` | Cards, inputs, forms, admin panels. |
| Secondary text | `muted` | `#5F584C` | 6.6:1 on ivory, 6:1 on sand. |
| Border | `line` | `#E5DDCE` | Dividers, card borders. |
| Control border | `line-strong` | `#8F836E` | Inputs, chips, steppers: ≥ 3:1 on white, ivory and sand (WCAG 1.4.11). |
| Success / Warning / Danger | `success` / `warning` / `danger` (+ `-bg`) | `#1D6B44` / `#8A5300` / `#B42318` | Status only, always with an icon and words. |
| WhatsApp | `whatsapp` | `#1F8F4E` | WhatsApp buttons only. |
| Sabili | `sabili` / `sabili-navy` / `sabili-yellow` | `#0025D7` / `#1C2257` / `#FFD200` | Sabili world only. Never Mishkat's colour. |

**Proportion on any page:** ~70% ivory/sand, ~20% ink, ~10% gold + olive. One dark band at a time; never two dark bands of the same colour back to back.

## 3. Type (Google Fonts, OFL, self-hosted by `next/font`)
| Role | Font | Utility |
|---|---|---|
| Hero / display | Alexandria 800 | `text-display-xl` (38→64px, lh 1.25) |
| Page & section titles | Alexandria 700 | `text-display-lg` (30→44px, lh 1.3) |
| Product names, sub-sections, form legends | Alexandria 700 | `text-display-md` (24→30px, lh 1.4) |
| Card / item titles | Alexandria 600 | `text-title` (20px, lh 1.5) |
| Lead paragraphs, long descriptions | IBM Plex Sans Arabic 400 | `text-body-lg` (18px, lh 1.9) |
| Body, menus, buttons, forms | IBM Plex Sans Arabic 400–600 | default (16px, lh 1.75) |
| Eyebrows, footer headings | IBM Plex Sans Arabic 600 | `text-eyebrow` (15px) |
| Prices | Plex 700 + `.tabular` | |
| Accent (the slogan only) | Aref Ruqaa 700 | `font-accent` |

Rules: `h1–h3` default to Alexandria. No letter-spacing on Arabic. Ruqʿah appears once per page at most (footer slogan, brand guide). Alexandria is variable (one file); Ruqʿah is not preloaded.

## 4. Logos (PNG, from the gold-foil originals)
- Mishkat: `mishkat-ink.png` on paper/sand/white, `mishkat-gold.png` on ink/olive/navy. Nothing else.
- Clear space ≥ the height of the niche inside the wordmark. Minimum width 96px (dashboard), 112px mobile header, 128px desktop header.
- Never stretch, rotate, outline, shadow, or recolour. Always `h-auto` with a width class.
- Sabili logo (`sabili-yellow`, `sabili-gold`) only in Sabili contexts; never locked up with the Mishkat wordmark.
- Vector files do not exist yet. The root `mishkat Logo.png` is a very large source export and is not served. When vectors are made, export SVG for both marks and replace the PNGs (same file names) without redrawing.

## 5. Graphic language
- **Niche frame** (`.niche`, `.niche-sm`): product photography only, on a `sand` well. The hero keeps its solid gold offset niche.
- **NicheMark** (`components/brand/niche-mark.tsx`): eyebrow glyph, list bullets, filled version for feature lists. **Divider**: hairline–niche–hairline, inside sections only.
- **Niche lattice** (`.pattern-niche`): 7.5% gold strokes, only on ink / olive bands and the footer. Never behind products.
- **Icons**: lucide-react, stroke 1.5 (2 inside badges), 20/24/28px. `gold-deep` on light, `gold` on dark, inside a `gold-light/60` round chip for feature lists.
- **Radii**: 8 / 12 / 20px + pill. Buttons and inputs 12, cards and panels 20, badges pill.
- **Shadows**: warm-tinted `--shadow-soft` (cards on hover, primary button) and `--shadow-lift` (toasts, floating button).
- **Motion**: the Sabili card fan is the only choreographed moment. Everything else is hover/press feedback (150ms). Reduced motion disables all of it.

## 6. Components
- `SectionHeading` (`components/ui/section-heading.tsx`): eyebrow (with NicheMark) + title + lead. Every section and page opens with it or with the same utilities. Tones: light, dark, zaytun, sabili.
- `Button` / `ButtonLink` / `buttonClass` (`components/ui/button.tsx`): `primary` (ink), `outline`, `gold` (dark bands), `ghost`, `sabili` (Sabili world), `danger`. Sizes sm 40 / md 48 / lg 56px.
- `Badge` (`components/ui/badge.tsx`): one pill for stock, discounts, labels. Tones neutral, gold, zaytun, success, warning, danger, sabili. `StockBadge` and the discount in `Price` use it.
- `Price`: Plex bold tabular, struck compare-at price, optional discount badge.
- Forms: `surface` inputs, `line-strong` border, ink border + gold ring on focus, danger border + icon + text on error, error summary at the top.
- Section rhythm: `.section` (64px mobile, 96px desktop). Container `.container-page` (76rem, 16/32px gutters).
- Admin: same tokens and fonts; panels are `surface` on a `sand` canvas. Order-status colours stay functional (own palette in `status-badge.tsx`).

## 7. Layout
- RTL everywhere (`<html dir="rtl" lang="ar-TN">`), logical properties only (`ms/me/ps/pe/start/end`).
- Breakpoints 640 / 768 / 1024 / 1280. Touch targets ≥ 44px. Visible focus ring (gold-deep, gold on dark via `.on-dark`).

## 8. Deliberately avoided
- Mosques, crescents, stock arabesques, decorative gradients, emoji as icons, AI-generated images.
- Calligraphy for headings or UI. Blue for anything that is not Sabili.
- A fade-in on every section; identical cards for every piece of content.
- Numbering, except genuinely sequential content (the game stages).
- Made-up information: anything not confirmed is left out or left for the admin to fill in.
