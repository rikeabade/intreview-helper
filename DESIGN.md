---
name: Intreview
description: A calm, private interview-prep workspace with a single indigo accent.
colors:
  primary: "oklch(0.511 0.262 276.966)"
  primary-dark: "oklch(0.585 0.233 277.117)"
  primary-foreground: "oklch(0.985 0 0)"
  background: "oklch(1 0 0)"
  background-dark: "oklch(0.145 0 0)"
  foreground: "oklch(0.145 0 0)"
  foreground-dark: "oklch(0.985 0 0)"
  card: "oklch(1 0 0)"
  card-dark: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-dark: "oklch(0.269 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  muted-foreground-dark: "oklch(0.708 0 0)"
  accent: "oklch(0.94 0.03 276.966)"
  accent-dark: "oklch(0.3 0.08 277.117)"
  border: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  full: "9999px"
spacing:
  card: "1rem"
  gutter: "1.5rem"
  section: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "0 10px"
  badge:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
---

# Design System: Intreview

## Overview

**Creative North Star: "The Friendly Study Room"**

Intreview is a warm place to get ready for something stressful, with a coach in the room. Surfaces are soft, indigo marks the thing that matters, and a visible aurora of violet, sky, pink and amber light in the background keeps every page alive. A small animated interviewer introduces the product, company tiles and badges bring color, and finishing a phase or an interview is celebrated with confetti. Motion acknowledges, orients and delights, and always has a reduced-motion path. Light and dark themes are both first-class, and every screen is designed to read in PT-BR and English.

Density is moderate: generous gutters and section spacing around content, compact controls inside it. The interview screen is the center of the product, so chat bubbles and the answer box get the clearest hierarchy; research, job search and role detail are working surfaces that favor scanning and editing in place.

**Key Characteristics:**
- Indigo leads on a near-neutral gray system; violet, pink, amber, emerald and sky appear as friendly supporting colors in tiles, chips, badges and the aurora.
- A mascot: the gradient indigo-to-violet interviewer avatar, floating and pulsing when the interviewer is "thinking".
- Soft cards with a hairline ring and a barely-there shadow; depth comes from tone and ring, not heavy shadow.
- Calm, precise controls: moderate radius, thin borders, fast and quiet feedback.
- A fixed ambient aurora (four blurred glows drifting slowly, a faded dot grid, a few twinkling sparkles) behind all pages.
- Cards that follow the cursor with a soft spotlight, and primary buttons with an indigo glow.
- Motion is short, ease-out, and respects reduced-motion.

## Colors

A neutral gray system led by saturated indigo, with a small set of warm and cool supporting hues that add friendliness without competing with the primary action.

### Primary
- **Study-Lamp Indigo** (oklch(0.511 0.262 276.966) light, oklch(0.585 0.233 277.117) dark): primary buttons, the active progress bar, focus ring tint (at 50-60% alpha), the interviewer avatar and the candidate's chat bubble, icon tiles at 10% alpha.

### Neutral
- **Paper White / Night Ink** (oklch(1 0 0) / oklch(0.145 0 0)): page background and body text, swapped between themes.
- **Card Surface** (oklch(1 0 0) light, oklch(0.205 0 0) dark): cards and popovers.
- **Quiet Gray** (oklch(0.97 0 0) light, oklch(0.269 0 0) dark): muted panels, the interviewer chat bubble, badges.
- **Secondary Text** (oklch(0.556 0 0) light, oklch(0.708 0 0) dark): descriptions, hints, metadata.
- **Hairline** (oklch(0.922 0 0) light, white at 10% dark): borders and dividers.
- **Indigo Wash** (oklch(0.94 0.03 276.966) light, oklch(0.3 0.08 277.117) dark): selected-state fill (checked options, selected saved search).
- **Alert Red** (oklch(0.577 0.245 27.325) light, oklch(0.704 0.191 22.216) dark): errors only.

### Named Rules
**The Friendly Palette Rule.** Indigo owns every primary action and the candidate's voice. Violet, pink, amber, emerald and sky (Tailwind 500 at 15-20% alpha with a darker text tone) are for company tiles, feature chips, work-mode badges, the aurora and celebrations only, never for buttons or links.
**The Tinted-Wash Rule.** Selection and emphasis use the primary at low alpha or the Indigo Wash fill, never a new color.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui fallback), applied through the `--font-geist-sans` variable declared on `<html>`
**Body Font:** Geist
**Label/Mono Font:** Geist Mono, used only for code (paths, file names, the Monaco editor)

**Character:** A single clean geometric sans used in a restrained range of sizes; hierarchy comes from weight and size, not from a second family.

### Hierarchy
- **Display** (600, 2.25-3.75rem responsive, 1.1, tracking -0.025em): the home hero headline, with its key phrase set on a tinted indigo marker.
- **Page title** (600, 1.875rem, 1.2, tracking -0.025em): job search, new role, role detail, finished report.
- **Headline** (600, 1.5rem, 1.25, tracking -0.025em): page titles on forms and role detail.
- **Title** (500, 1rem, 1.375): card titles.
- **Body** (400, 0.875rem, 1.5): all running text and controls; keep prose blocks to 65-75ch.
- **Label** (500, 0.75rem): badges, hints, timestamps.

### Named Rules
**The One Family Rule.** Do not add a second sans or serif; use weight and size.
**The Balanced Heading Rule.** Headings use `text-wrap: balance`.

## Layout

Pages sit in a centered container with 1.5rem side gutters: `max-w-6xl` for home, job search, header and the interview screen; `max-w-5xl` for role detail; `max-w-2xl` for the new-role form and `max-w-3xl` for the finished report (reading width). Vertical page padding is about 3rem to 3.5rem. Lists of roles use a 1/2/3-column responsive grid with 1rem gaps; job search uses an 18rem sidebar of saved searches next to a flexible results column on large screens and stacks on small ones. Cards use 1rem internal spacing. The header is sticky with a blurred translucent background.

Breakpoints follow Tailwind defaults (sm 640, md 768, lg 1024). Mobile stacks everything in a single column and keeps controls at least comfortably tappable.

## Elevation & Depth

Hybrid, leaning flat. Cards sit on a 1px ring (`foreground` at 10%) with a nearly invisible shadow; the page itself has depth from the fixed ambient background. Shadows grow only in response to hover on interactive cards.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.03)`, stronger black at 20% in dark): all cards.
- **Hover lift** (`box-shadow: 0 10px 15px -3px` primary at 5%, with a 2px upward translate): role cards on the home grid.
- **Hover soft** (`shadow-md`): job listing cards.

### Named Rules
**The Flat-Until-Touched Rule.** Elevation appears as a response to hover, never as decoration at rest.

## Shapes

Moderate, consistent rounding derived from a 0.625rem base radius: controls and inputs 0.625rem, cards 0.875rem, badges fully rounded, chat bubbles 1rem with one squarer corner on the speaker's side (top-left for the interviewer, top-right for the candidate). Borders are 1px hairlines. Icons come from Lucide in one stroke weight; icon tiles are 10% primary squares with rounded corners.

## Components

### Buttons
- **Shape:** 0.625rem radius, 32px default height (28px small, 36px large).
- **Primary:** Study-Lamp Indigo fill with near-white text; hover darkens to 80% opacity.
- **Outline / Ghost:** hairline border or no border, fill appears on hover.
- **Hover / Focus / Press:** 150ms ease-out on color, border, shadow and transform; focus-visible shows a 3px ring at 50% alpha; press scales to 0.97. Disabled drops to 50% opacity.

### Cards / Containers
- **Corner Style:** 0.875rem
- **Background:** card surface; muted fill for passive panels
- **Shadow Strategy:** see Elevation; hairline ring always present
- **Internal Padding:** 1rem

### Inputs / Fields
- **Style:** 32px tall, 0.625rem radius, 1px input border, transparent fill (a faint fill in dark).
- **Focus:** border shifts to the ring color and a 3px ring at 50% appears.
- **Error / Disabled:** destructive border and ring; disabled at 50% opacity.

### Badges and Chips
- Pill badge, 20px tall, secondary (muted fill) for categories like "Consultoria" and Work Mode; outline for source labels. Selectable options (work modes, interview phases) are bordered 0.375rem-radius rows that gain the primary border and Indigo Wash fill when checked.

### Navigation
- Sticky header with logo tile (indigo square, sparkles icon), a ghost "Find jobs" link, a PT/EN toggle and a theme toggle. No sidebar navigation; saved job searches use an in-page list.

### Page Hero and Section Header
- Every page opens with the same hero: a tinted pill (icon plus short label), a large title with its key phrase on an indigo marker, a muted subtitle, and the floating interviewer avatar or a company tile on the left. Content sections inside cards begin with a colored icon tile (violet, sky, pink, amber, emerald or indigo) next to the title and description.

### Coach Panel
- The new-role page pairs the form with a sticky coach card: the pulsing interviewer avatar, a speech bubble whose tip changes with the focused section, and a progress checklist whose circles turn emerald with a check as required fields are completed.

### Interview Chat (signature)
- Interviewer messages: an indigo avatar circle with a sparkle, a muted bubble, left aligned, up to 85% width. Candidate messages: an indigo bubble, right aligned. Inline feedback sits under the exchange in small italic secondary text. A three-dot pulse shows the interviewer thinking. The answer box (or Monaco editor in the live-coding phase) is sticky at the bottom of the column.

## Do's and Don'ts

### Do:
- **Do** use primary indigo for the single most important action or state on a screen, and celebrate completions (phase done, interview finished) with confetti.
- **Do** switch states with short ease-out transitions (150-360ms) and a fade-only path for reduced motion.
- **Do** keep copy in the candidate's language and run every new string through both PT-BR and EN.
- **Do** keep working surfaces (role detail, job search) editable in place with Edit / Save / Cancel.
- **Do** show honest states: "Unidentified" work mode, no sources found, search failed.

### Don't:
- **Don't** use the supporting hues on buttons or links, or add colored side borders on cards and alerts.
- **Don't** use `transition: all`, bounce or elastic easing, or entrance animations that make users wait on every page.
- **Don't** put gradient text, heavy offset shadows, or decorative glass on content surfaces.
- **Don't** nest cards inside cards; use a divider or muted panel instead.
- **Don't** add a second typeface.
