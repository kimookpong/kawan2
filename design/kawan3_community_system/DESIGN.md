---
name: Kawan3 Community System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#404944'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#dee0e2'
  on-secondary-container: '#606365'
  tertiary: '#502000'
  on-tertiary: '#ffffff'
  tertiary-container: '#733100'
  on-tertiary-container: '#ff985a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#e1e2e4'
  secondary-fixed-dim: '#c5c6c8'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb68e'
  on-tertiary-fixed: '#331200'
  on-tertiary-fixed-variant: '#763300'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-bold:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is engineered to foster a sense of belonging and reliability for the Southern Border Provinces. It balances professional information density with a warm, community-centric atmosphere. The visual language is inspired by high-utility editorial platforms—utilizing a structured grid to organize complex community data, news, and resources without overwhelming the user.

The style is **Modern Corporate with a Cultural Infusion**, characterized by:
- **Information Density:** High utility through compact layouts and clear information hierarchy.
- **Cleanliness:** Ample white space between logical sections to maintain focus.
- **Vibrancy:** Cultural warmth introduced through a "Terracotta" accent, contrasting against a professional "Deep Green" base.
- **Structure:** Visible or implied structural lines that communicate stability and regional authority.

## Colors

The palette is rooted in the identity of the Southern Border Provinces. 

- **Deep Green (Primary):** Represents the lush landscape and cultural heritage. Used for navigation, primary buttons, and key headers.
- **Clean White & Light Gray (Neutrals):** Forms the backbone of the "Information-Dense" UI, ensuring readability and a modern, airy feel.
- **Terracotta (Accent):** A warm, earthy tone used sparingly for Calls to Action (CTAs), notifications, and highlighting active states.
- **Functional Grays:** A range of grays ensures subtle layering and distinct borders between content modules.

## Typography

This design system utilizes **Be Vietnam Pro** (as the closest high-quality substitute for modern Thai-compatible sans-serifs like Sarabun or Kanit) to ensure maximum legibility across dense data sets.

- **Headlines:** Bold and authoritative to anchor content sections.
- **Body:** Optimized for long-form reading and community forum threads.
- **Labels:** Used for metadata (dates, categories, view counts) to provide context without distracting from primary content.
- **Thai Language Support:** Typography must maintain a generous line-height (1.5x minimum) to accommodate Thai vowel and tone marks without clipping.

## Layout & Spacing

The system uses a **12-column Fluid Grid** for desktop and a **single-column vertical stack** for mobile.

- **Grid Philosophy:** Content is organized into modular "cards" or "widgets" that span specific column counts (e.g., Sidebars span 3 columns, Main Content spans 9).
- **Density:** To achieve the "Information-Dense" look, internal padding within cards is kept tight (16px), while the gap between different modules is larger (24px) to clearly demarcate separate topics.
- **Breakpoints:**
  - **Desktop:** 1024px+ (12 columns, 24px gutters).
  - **Tablet:** 768px - 1023px (6 columns, 16px gutters).
  - **Mobile:** <767px (2 columns or stack, 12px margins).

## Elevation & Depth

The design system prioritizes a **Flat-Layered** approach over heavy shadows to maintain a "Clean" and "Professional" aesthetic.

- **Low-Contrast Outlines:** Instead of shadows, use 1px borders in `border_color` (#E5E7EB) to define card boundaries.
- **Tonal Layering:** Use background color shifts (e.g., a Light Gray background for the page and White background for the cards) to create depth.
- **Subtle Interaction Shadows:** A very light, diffused shadow (0px 4px 6px rgba(0,0,0,0.05)) is reserved strictly for hover states on clickable cards or primary action buttons to indicate interactivity.

## Shapes

The shape language is **Soft and Precise**, utilizing small corner radii to look modern while maintaining a structured, professional feel.

- **Base Radius:** 4px (0.25rem) for input fields, buttons, and small tags.
- **Container Radius:** 8px (0.5rem) for cards and main content modules.
- **Full Round:** Used exclusively for notification badges, status indicators, and avatar frames.

## Components

### Buttons
- **Primary:** Solid Deep Green with White text. Sharp 4px corners. 
- **Secondary:** Transparent with a Deep Green border and text.
- **Accent/CTA:** Solid Terracotta for high-priority actions like "Join Community" or "Donate."

### Cards
- White background with a 1px Light Gray border.
- Cards should have a structured header section (often with a small icon and category label).
- Content inside cards should follow a strict vertical hierarchy: Image (optional) > Label > Title > Metadata.

### Input Fields
- Clean, 1px bordered boxes. On focus, the border changes to Deep Green with a 2px soft outer glow in the same color.

### Chips & Badges
- Used for categories (e.g., "News," "Event," "Culture"). 
- Low-saturation backgrounds with high-saturation text of the same hue (e.g., Light Green background with Deep Green text).

### List Items
- Information-dense rows used for forum threads or news archives. 
- Utilize a horizontal layout: Left (Thumbnail/Icon) > Center (Title & Excerpt) > Right (Stats like views/replies).