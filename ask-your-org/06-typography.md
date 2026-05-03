# WGU Typography

## Approved typefaces

WGU has three licensed typefaces, each with a specific role.

| Typeface | Role | Where it appears |
| --- | --- | --- |
| **Futura PT** | Primary type | All body text, headlines, UI, marketing |
| **Rocky** | Numerals | Isolated infographic numerals only |
| **Program Nar OT Black** | Campaign display | Education for the People campaign headlines only |

## Futura PT

A geometric, slightly humanist sans-serif with mid-century-modern feel. WGU uses these weights:

- **Light (300)** for captions and italic micro-copy.
- **Book (400)** for body copy. Default weight.
- **Medium (500)** for h2, h4, quotes.
- **Heavy (800)** for h1, h3, eyebrows.

## Fallback

Arial is the approved system fallback. Use Arial in PowerPoint, email signatures, and any environment where Futura PT cannot be licensed. Do not use Helvetica, Calibri, or other substitutes.

## Web font substitutions in this design system

Futura PT, Rocky, and Program Nar OT are all licensed and not free. The WGU Design System ships free Google Fonts as web previews. **Production assets must use the licensed originals.**

| Production font | Web substitute |
| --- | --- |
| Futura PT | **Jost** (Google Fonts) |
| Rocky | **Newsreader** (Google Fonts) |
| Program Nar OT Black | **Oswald** (Google Fonts) |

When delivering production work, drop licensed `.woff2` files into your project's `/fonts/` directory and update the `@font-face` declarations.

## Type scale (web)

Matches the brand guide web scale.

| Style | Family | Weight | Size | Line height |
| --- | --- | --- | --- | --- |
| h1 | Futura PT | Heavy 800 | 55px | 48px |
| h2 | Futura PT | Medium 500 | 55px | 48px |
| h3 | Futura PT | Heavy 800 | 26px | 22px |
| h4 | Futura PT | Medium 500 | 26px | 22px |
| Body | Futura PT | Book 400 | 18px | 26px |
| Quote | Futura PT | Medium 500 italic | 18px | 28px |
| Small | Futura PT | Book 400 | 16px | 22px |
| Caption | Futura PT | Light 300 italic | 16px | 20px |
| Eyebrow | Futura PT | Heavy 800, uppercase, tracking 0.12em | 13px | 16px |

## Letter spacing

- h1: -0.01em (slightly tight)
- h2: -0.005em
- h3, h4, body, small: 0
- Eyebrow: +0.12em (open tracking, uppercase)
- Campaign headline: -0.01em (tight, condensed feel)

## Numerals in infographics

Isolated numbers in stats and infographics use the Rocky serif. Web substitute is Newsreader.

```css
.numeral {
  font-family: 'Newsreader', 'Rocky', Georgia, serif;
  font-weight: 600;
  font-variant-numeric: lining-nums;
}
```

Use this only for isolated, hero numerals (a single big "75+" or "100%"). Do not set body copy or running text in Rocky.

## Campaign headlines

The Education for the People campaign uses Program Nar OT Black, a compressed narrow display sans. Web substitute is Oswald.

```css
.campaign-headline {
  font-family: 'Oswald', 'Program Nar OT', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  line-height: 0.95;
}
```

Use only for campaign assets. Do not use Oswald or Program Nar elsewhere.

## What not to do

- Do not mix Futura PT with another sans (no Helvetica, Inter, Lato).
- Do not stretch, condense, or skew letterforms.
- Do not set entire paragraphs in ALL CAPS.
- Do not use system fonts in production web work without flagging the substitution.
- Do not set body copy in Rocky or Oswald.
