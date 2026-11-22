# Bongsiel – brand and design direction

## Idea: "Deich draußen, Feuer drinnen"
Outside: the dike, sheep, wind, flat light and a huge sky, almost in Denmark. Inside: the Gaststube with Delft tiles,
blue panelling, candle light and regional cooking. The site moves from one to the other: a daylight hero on the dike,
a sticky scroll story from the canal at sunset to the lit entrance and the evening Gaststube, and a footer that is
the house itself at night with lit windows.

## Kept from the current site (Elementor kit, post 30)
- Sage `#879760` (primary), olive `#3A3C2F` (secondary), ink `#141711`, cream `#F3F3EC`.
- Syncopate (headings, wide, uppercase), Onest (text). Pill buttons (50 px radius).
- Logo: horse head + "Mein Ziel BONGSIEL" (`raw/brand/logo-neu.svg` → `src/assets/logo.svg`, colour via currentColor).

## Added
| Token | Value | Where |
|---|---|---|
| peat | `#1B1D15` | evening sections, footer, drawer |
| ember | `#C9833F` / light `#E9B877` | main CTA, lamp light, hand-written accents on dark |
| linen | `#FAF8F2` | page background (paper) |
| delft | `#2F5080` | dates, tile ornament, 360° tile – from the Delft tiles of the Gaststube |
| brick | `#9A4A35` | day notes in the reservation calendar |
| Fraunces italic | `@fontsource/fraunces` 400 italic | second half of headings ("aus Bongsiel.", "frisch gekocht"), sign-offs |

Signature elements: the **dike line** (one long hand-drawn horizon that draws itself, `bs-dike`), the **Delft tile**
(line ornament with ox-head corners that draws stroke by stroke, `src/assets/tile.svg`), **arch-bottom photo frames**
(from the old site's seating icons), the **night house** silhouette in the footer (client's `Silouette_Bongsiel.png`,
recoloured by `tools/house-silhouette.mjs`, windows glow slowly).

## Motion
Calm, no bounce. Line-mask headings, sequenced reveals (`--i`), photo wipes by a sliding cover (never a clipped
image: Chrome would not lazy-load it), slow Ken Burns on the hero, story steps crossfade on scroll progress,
event seat bars fill, count-ups only for real numbers (120 Personen, 160 m², 12 Personen). Reduced motion: all
static, story shown as stacked blocks.

## Photos
Only real photos of the house (see `docs/PHOTOS.md`), processed by `tools/images.mjs` into `public/img/<name>-<w>.webp`.
No stock or AI images as "the place". Weak spots: chef photo 552×736, many phone shots – a professional shoot
(exterior blue hour, Saal set for an event, plated dishes) would lift the site.
