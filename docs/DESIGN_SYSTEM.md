# NerdPOS Design System v2.0
## Cyber-Glass Aesthetic for Immersive AR RTL/LTR Applications

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Glassmorphism](#glassmorphism)
6. [Component Library](#component-library)
7. [Animation & Motion](#animation--motion)
8. [Iconography](#iconography)
9. [RTL/LTR Support](#rtlltr-support)
10. [i18n Guidelines](#i18n-guidelines)
11. [Accessibility](#accessibility)
12. [Implementation](#implementation)

---

## Core Philosophy

### "Cyber-Glass" Aesthetic

NerdPOS is designed for **low-light environments** (cafes, lounges, night-shift retail) prioritizing **Optical Hierarchy** over decoration.

#### Three Pillars:

**1. Depth (Glassmorphism)**
- Use blur + transparency to separate layers
- Visual hierarchy: Background → Content → Sticky Controls → Modals → Critical Overlays

**2. Energy (Neon Cyan)**
- Electric Cyan (`#22D3EE`) strictly for Actions & Active States
- Creates visual "hot spots" that guide user attention
- Never use for decorative purposes

**3. Speed (Micro-interactions)**
- 200-300ms transitions with `cubic-bezier` easing
- Feels "native" and responsive
- No janky animations or unnecessary delays

---

## Color System

### Surface Palette (Dark Mode Native)

| Token | Hex | RGB | Usage | CSS Variable |
|:------|:----|:----|:------|:-------------|
| `bg-background` | `#0F1419` | `15, 20, 25` | Main app background (deepest void) | `--bg-background` |
| `bg-surface` | `#1A2332` | `26, 35, 50` | Cards, sidebar base (elevated) | `--bg-surface` |
| `bg-surface-dark` | `#023047` | `2, 48, 71` | Contrast text on primary buttons | `--bg-surface-dark` |
| `bg-surface-light` | `#2C3E50` | `44, 62, 80` | Hover states on surfaces | `--bg-surface-light` |

### Action Palette (Neon)

| Token | Hex | RGB | Usage | CSS Variable |
|:------|:----|:----|:------|:-------------|
| `text-primary` | `#22D3EE` | `34, 211, 238` | Primary text, icons, active borders | `--text-primary` |
| `bg-primary` | `#22D3EE` | `34, 211, 238` | Primary buttons, toggles, glow effects | `--bg-primary` |
| `bg-primary-dark` | `#06B6D4` | `6, 182, 212` | Hover states, gradients | `--bg-primary-dark` |
| `bg-primary-light` | `#67E8F9` | `103, 232, 249` | Active highlights | `--bg-primary-light` |

### Functional Palette

| Token | Hex | RGB | Usage | CSS Variable |
|:------|:----|:----|:------|:-------------|
| `success` | `#10B981` | `16, 185, 129` | Completed orders, cash payments, in stock | `--success` |
| `success-dark` | `#059669` | `5, 150, 105` | Success hover states | `--success-dark` |
| `error` | `#EF4444` | `239, 68, 68` | Delete, out of stock, critical alerts | `--error` |
| `error-dark` | `#DC2626` | `220, 38, 38` | Error hover states | `--error-dark` |
| `warning` | `#F59E0B` | `245, 158, 11` | Low stock, reserved tables, pending | `--warning` |
| `warning-dark` | `#D97706` | `217, 119, 6` | Warning hover states | `--warning-dark` |
| `info` | `#3B82F6` | `59, 130, 246` | Informational messages | `--info` |

### Text Palette

| Token | Hex | Opacity | Usage | CSS Variable |
|:------|:----|:--------|:------|:-------------|
| `text-primary` | `#FFFFFF` | `100%` | Primary text, headings | `--text-primary` |
| `text-secondary` | `#E2E8F0` | `90%` | Secondary text, descriptions | `--text-secondary` |
| `text-muted` | `#94A3B8` | `70%` | Tertiary text, placeholders, inactive icons | `--text-muted` |
| `text-disabled` | `#64748B` | `50%` | Disabled text, unavailable options | `--text-disabled` |

### Opacity Scale

```css
/* Glass Backgrounds */
--glass-subtle: rgba(255, 255, 255, 0.03);
--glass-light: rgba(255, 255, 255, 0.05);
--glass-medium: rgba(255, 255, 255, 0.08);
--glass-strong: rgba(255, 255, 255, 0.12);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.05);
--border-light: rgba(255, 255, 255, 0.10);
--border-medium: rgba(255, 255, 255, 0.15);
--border-accent: rgba(34, 211, 238, 0.30);
--border-accent-strong: rgba(34, 211, 238, 0.50);

/* Overlays */
--overlay-light: rgba(15, 20, 25, 0.50);
--overlay-medium: rgba(15, 20, 25, 0.75);
--overlay-strong: rgba(15, 20, 25, 0.90);
```

### Color Usage Rules

✅ **DO:**
- Use cyan (#22D3EE) for interactive elements only
- Maintain 4.5:1 contrast ratio for text
- Use muted colors for secondary information
- Apply functional colors consistently (green = success, red = error)

❌ **DON'T:**
- Use cyan for decorative purposes
- Mix bright colors without purpose
- Use low contrast text on backgrounds
- Override functional color meanings

---

## Typography

### Font Families

```css
/* Arabic Text */
--font-arabic: 'Almarai', -apple-system, BlinkMacSystemFont, sans-serif;

/* English Text & Numbers */
--font-latin: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace (Code, IDs, Numbers) */
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

**Why Almarai?**
- Geometric and modern aesthetic
- Excellent legibility at small sizes (10-14px)
- Matches the "tech" vibe of the interface
- Wide weight range (300-800)

**Why Inter?**
- Tabular figures for consistent number alignment
- Excellent screen rendering
- Modern, clean appearance
- Matches Almarai's geometric structure

### Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|:------|:-----|:-------|:------------|:---------------|:------|
| `display-1` | `48px` | `700` | `1.1` | `-0.02em` | Login screens, totals |
| `display-2` | `36px` | `700` | `1.2` | `-0.01em` | Dashboard headers |
| `h1` | `24px` | `700` | `1.3` | `0` | Modal titles |
| `h2` | `18px` | `700` | `1.4` | `0` | Card titles, section headers |
| `h3` | `16px` | `600` | `1.4` | `0` | Subsection headers |
| `body-large` | `16px` | `400` | `1.5` | `0` | Large body text |
| `body` | `14px` | `400` | `1.5` | `0` | Standard body text |
| `body-small` | `12px` | `400` | `1.5` | `0` | Small body text |
| `label` | `12px` | `500` | `1.4` | `0.01em` | Form labels, badges |
| `micro` | `10px` | `500` | `1.4` | `0.02em` | Metadata, timestamps |

### Arabic Typography Adjustments

Arabic text requires special consideration:

```css
[dir="rtl"] {
  /* Slightly larger for better readability */
  --scale-adjustment: 1.05;
  
  /* Tighter line height for Arabic */
  --line-height-adjustment: 0.95;
  
  /* Remove letter spacing (doesn't apply to Arabic) */
  letter-spacing: 0;
}

/* Example */
.body-text[dir="rtl"] {
  font-size: calc(14px * 1.05); /* 14.7px */
  line-height: calc(1.5 * 0.95); /* 1.425 */
}
```

### Typography Classes

```css
/* Display */
.text-display-1 {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-family: var(--font-arabic);
}

/* Headings */
.text-h1 {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  font-family: var(--font-arabic);
}

/* Body */
.text-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  font-family: var(--font-arabic);
}

/* Numbers (always LTR) */
.text-number {
  font-family: var(--font-latin);
  font-feature-settings: 'tnum' 1; /* Tabular figures */
  direction: ltr;
  unicode-bidi: embed;
}
```

---

## Spacing & Layout

### Spacing Scale (8px Base)

| Token | Value | Usage |
|:------|:------|:------|
| `space-0` | `0` | Reset |
| `space-1` | `4px` | Tiny gaps (icon-text) |
| `space-2` | `8px` | Small gaps |
| `space-3` | `12px` | Medium gaps |
| `space-4` | `16px` | Default gaps |
| `space-5` | `20px` | Large gaps |
| `space-6` | `24px` | Section gaps |
| `space-8` | `32px` | Large sections |
| `space-10` | `40px` | Major sections |
| `space-12` | `48px` | Page sections |
| `space-16` | `64px` | Hero spacing |
| `space-20` | `80px` | Maximum spacing |

### Layout Grid

```css
/* Container */
.container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

/* Responsive Grid */
.grid {
  display: grid;
  gap: var(--space-4);
}

/* Product Grid */
.grid-products {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

/* Dashboard Grid */
.grid-dashboard {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-6);
}

@media (max-width: 768px) {
  .grid-dashboard {
    grid-template-columns: 1fr;
  }
}
```

### Border Radius

| Token | Value | Usage |
|:------|:------|:------|
| `radius-sm` | `6px` | Badges, small buttons |
| `radius-md` | `8px` | Buttons, inputs |
| `radius-lg` | `12px` | Cards, panels |
| `radius-xl` | `16px` | Modals, major containers |
| `radius-2xl` | `24px` | Hero elements |
| `radius-full` | `9999px` | Pills, avatars |

---

## Glassmorphism

### Glass Styles

#### 1. Glass (Standard)

**Usage:** Headers, cards, elevated content

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**When to use:**
- Product cards
- Navigation headers
- Dropdown menus
- Tooltips

#### 2. Glass Panel (Dark)

**Usage:** Sidebar, persistent panels

```css
.glass-panel {
  background: rgba(15, 20, 25, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.1); /* or border-left for RTL */
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.2);
}

[dir="rtl"] .glass-panel {
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.2);
}
```

**When to use:**
- Sidebar navigation
- Cart panel
- Settings drawer

#### 3. Glass Modal

**Usage:** Modals, dialogs, critical overlays

```css
.glass-modal {
  background: rgba(26, 35, 50, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}
```

**When to use:**
- Payment modals
- Product customization
- Confirmation dialogs
- Form overlays

#### 4. Glass Subtle (Minimal)

**Usage:** Hover states, secondary cards

```css
.glass-subtle {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### Glassmorphism Best Practices

✅ **DO:**
- Always include `-webkit-backdrop-filter` for Safari
- Test on actual backgrounds (not solid colors)
- Use stronger blur (20-24px) for modals
- Add subtle borders for definition

❌ **DON'T:**
- Use glass on glass (causes readability issues)
- Apply to text directly
- Overuse blur (performance impact)
- Forget fallbacks for unsupported browsers

### Browser Support Fallback

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Fallback for browsers without backdrop-filter */
@supports not (backdrop-filter: blur(16px)) {
  .glass {
    background: rgba(26, 35, 50, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
}
```

---

## Component Library

### Buttons

#### Primary Button

**Usage:** Main actions (Login, Payment, Add to Cart)

```css
.btn-primary {
  padding: 12px 24px;
  border-radius: 8px;
  background: linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%);
  color: #023047;
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgba(34, 211, 238, 0.6);
  transform: translateY(-2px) scale(1.02);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
```

**HTML:**
```html
<button class="btn-primary">
  <span class="btn-text">إضافة للسلة</span>
  <span class="btn-text" lang="en">Add to Cart</span>
</button>
```

#### Secondary Button

**Usage:** Categories, Cancel, Secondary options

```css
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  color: #FFFFFF;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(34, 211, 238, 0.5);
  color: #22D3EE;
}
```

#### Ghost Button

**Usage:** Utility icons, Clear forms, Tertiary actions

```css
.btn-ghost {
  padding: 12px 24px;
  background: transparent;
  color: #94A3B8;
  font-weight: 500;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  color: #FFFFFF;
  background: rgba(255, 255, 255, 0.05);
}
```

#### Icon Button

```css
.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #22D3EE;
  border-color: rgba(34, 211, 238, 0.3);
}

.btn-icon.active {
  background: #22D3EE;
  color: #023047;
  border-color: #22D3EE;
}
```

### Cards

#### Product Card

```css
.card-product {
  position: relative;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.card-product:hover {
  border-color: rgba(34, 211, 238, 0.3);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.card-product-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.card-product:hover .card-product-image {
  transform: scale(1.1);
}

.card-product-content {
  padding: 16px;
}

.card-product-title {
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 4px;
}

.card-product-description {
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 12px;
}

.card-product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-product-price {
  font-size: 18px;
  font-weight: 700;
  color: #22D3EE;
  font-family: var(--font-latin);
  direction: ltr;
}

.card-product-stock {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

/* Stock States */
.card-product.out-of-stock {
  opacity: 0.7;
  filter: grayscale(1);
  cursor: not-allowed;
}

.card-product.low-stock .card-product-stock {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
  animation: pulse-warning 2s ease-in-out infinite;
}

.card-product.in-stock .card-product-stock {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

#### Info Card (Dashboard Widget)

```css
.card-info {
  padding: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #94A3B8;
}

.card-info-value {
  font-size: 32px;
  font-weight: 700;
  color: #FFFFFF;
  font-family: var(--font-latin);
  direction: ltr;
}

.card-info-change {
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-info-change.positive {
  color: #10B981;
}

.card-info-change.negative {
  color: #EF4444;
}
```

### Form Elements

#### Input Field

```css
.input-field {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  font-size: 14px;
  font-family: var(--font-arabic);
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: #94A3B8;
}

.input-field:focus {
  outline: none;
  border-color: #22D3EE;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
}

.input-field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* RTL Support */
[dir="rtl"] .input-field {
  text-align: right;
}
```

#### Select Dropdown

```css
.select-field {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px; /* Space for arrow */
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  font-size: 14px;
  font-family: var(--font-arabic);
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
}

[dir="rtl"] .select-field {
  padding-right: 16px;
  padding-left: 40px;
  background-position: left 16px center;
}

.select-field:focus {
  outline: none;
  border-color: #22D3EE;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
}
```

#### Checkbox

```css
.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-input {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.checkbox-input:checked {
  background: #22D3EE;
  border-color: #22D3EE;
}

.checkbox-input:checked::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid #023047;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-label {
  font-size: 14px;
  color: #FFFFFF;
  user-select: none;
}
```

#### Radio Button

```css
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.radio-input {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.radio-input:checked {
  border-color: #22D3EE;
  border-width: 2px;
}

.radio-input:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22D3EE;
}

.radio-label {
  font-size: 14px;
  color: #FFFFFF;
  user-select: none;
}
```

### Modals

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 20, 25, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal {
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 16px;
  background: rgba(26, 35, 50, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(34, 211, 238, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #FFFFFF;
}

.modal-content {
  padding: 24px;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

[dir="rtl"] .modal-footer {
  justify-content: flex-start;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Navigation

#### Top Navigation Bar

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  height: 72px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

#### Sidebar

```css
.sidebar {
  position: fixed;
  top: 72px;
  bottom: 0;
  left: 0;
  width: 280px;
  background: rgba(15, 20, 25, 0.75);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  overflow-y: auto;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

[dir="rtl"] .sidebar {
  left: auto;
  right: 0;
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #94A3B8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #FFFFFF;
}

.sidebar-item.active {
  background: rgba(34, 211, 238, 0.1);
  color: #22D3EE;
  border: 1px solid rgba(34, 211, 238, 0.3);
}

.sidebar-icon {
  width: 20px;
  height: 20px;
}
```

#### Bottom Navigation (Mobile)

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  z-index: 40;
  background: #161b22; /* Solid for contrast */
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 16px;
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: 8px;
  color: #94A3B8;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.bottom-nav-item:hover {
  color: #FFFFFF;
}

.bottom-nav-item.active {
  color: #22D3EE;
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
}

.bottom-nav-badge {
  position: absolute;
  top: 4px;
  right: 8px;
  width: 18px;
  height: 18px;
  background: #EF4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #FFFFFF;
}

[dir="rtl"] .bottom-nav-badge {
  right: auto;
  left: 8px;
}
```

### Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-primary {
  background: rgba(34, 211, 238, 0.1);
  color: #22D3EE;
}

.badge-success {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
}

.badge-error {
  background: rgba(239, 68, 68, 0.1);
  color: #EF4444;
}

.badge-warning {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
}

.badge-neutral {
  background: rgba(255, 255, 255, 0.05);
  color: #94A3B8;
}
```

### Toast Notifications

```css
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

[dir="rtl"] .toast-container {
  right: auto;
  left: 24px;
}

.toast {
  min-width: 320px;
  padding: 16px;
  border-radius: 8px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  color: #FFFFFF;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 12px;
  color: #94A3B8;
}

.toast-close {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: #94A3B8;
  cursor: pointer;
  transition: color 0.2s ease;
}

.toast-close:hover {
  color: #FFFFFF;
}

.toast.success {
  border-color: rgba(16, 185, 129, 0.3);
}

.toast.error {
  border-color: rgba(239, 68, 68, 0.3);
}

.toast.warning {
  border-color: rgba(245, 158, 11, 0.3);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

[dir="rtl"] @keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Animation & Motion

### Timing Functions

```css
/* Standard Easing */
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);

/* Decelerate (Elements entering) */
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);

/* Accelerate (Elements exiting) */
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);

/* Bounce (Pop-in effects) */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Smooth (Modals, drawers) */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
```

### Duration Scale

| Token | Value | Usage |
|:------|:------|:------|
| `duration-instant` | `100ms` | Hover states, simple transitions |
| `duration-fast` | `200ms` | Button clicks, toggles |
| `duration-normal` | `300ms` | Standard transitions |
| `duration-slow` | `500ms` | Complex transitions, image zooms |
| `duration-slower` | `700ms` | Page transitions |

### Animation Keyframes

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Down */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Glow */
@keyframes glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.6);
  }
}

/* Spin */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Shimmer (Loading) */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}
```

### Usage Examples

```css
/* Modal entering */
.modal {
  animation: slideUp 0.3s var(--ease-smooth);
}

/* Success icon pop */
.success-icon {
  animation: scaleIn 0.3s var(--ease-bounce);
}

/* Loading spinner */
.spinner {
  animation: spin 1s linear infinite;
}

/* Low stock badge */
.low-stock-badge {
  animation: pulse 2s ease-in-out infinite;
}

/* Primary button glow */
.btn-primary:hover {
  animation: glow 1.5s ease-in-out infinite;
}

/* Skeleton loader */
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s linear infinite;
}
```

### Motion Guidelines

✅ **DO:**
- Use consistent durations (200ms for simple, 300ms for standard)
- Apply easing functions for natural feel
- Reduce motion for accessibility (`prefers-reduced-motion`)
- Keep animations performant (use `transform` and `opacity`)

❌ **DON'T:**
- Animate width/height (use scale instead)
- Use linear timing (feels robotic)
- Overuse animations (distracting)
- Ignore user motion preferences

```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Iconography

### Icon System

**Library:** Lucide Icons (recommended)
**Alternative:** Heroicons, Phosphor Icons

### Icon Sizes

| Token | Value | Usage |
|:------|:------|:------|
| `icon-xs` | `12px` | Inline text icons |
| `icon-sm` | `16px` | Buttons, badges |
| `icon-md` | `20px` | Navigation, inputs |
| `icon-lg` | `24px` | Headers, feature icons |
| `icon-xl` | `32px` | Empty states |
| `icon-2xl` | `48px` | Hero icons |

### Icon Colors

```css
.icon-primary {
  color: #22D3EE;
}

.icon-secondary {
  color: #94A3B8;
}

.icon-success {
  color: #10B981;
}

.icon-error {
  color: #EF4444;
}

.icon-warning {
  color: #F59E0B;
}
```

### Icon Usage

```html
<!-- With text -->
<button class="btn-primary">
  <svg class="icon-sm" />
  <span>Add to Cart</span>
</button>

<!-- Icon button -->
<button class="btn-icon">
  <svg class="icon-md" />
</button>

<!-- With RTL support -->
<div class="icon-wrapper" dir="auto">
  <svg class="icon-md icon-flip-rtl" />
</div>
```

### RTL Icon Flipping

Some icons need to flip in RTL:

```css
[dir="rtl"] .icon-flip-rtl {
  transform: scaleX(-1);
}
```

**Icons that should flip:**
- Arrows (→, ←)
- Chevrons (›, ‹)
- Back/Forward navigation
- Undo/Redo

**Icons that should NOT flip:**
- Play/Pause
- Volume
- Checkmarks
- Close (×)

---

## RTL/LTR Support

### Setting Direction

```html
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<!-- OR -->
<html dir="ltr" lang="en">
```

### CSS Direction Handling

```css
/* Automatic direction */
.container {
  padding-inline-start: 24px;
  padding-inline-end: 24px;
}

/* Explicit LTR/RTL */
[dir="ltr"] .element {
  text-align: left;
}

[dir="rtl"] .element {
  text-align: right;
}
```

### Logical Properties (Preferred)

Use logical properties instead of physical:

| Physical | Logical | RTL-Safe |
|:---------|:--------|:---------|
| `margin-left` | `margin-inline-start` | ✅ |
| `margin-right` | `margin-inline-end` | ✅ |
| `padding-left` | `padding-inline-start` | ✅ |
| `padding-right` | `padding-inline-end` | ✅ |
| `border-left` | `border-inline-start` | ✅ |
| `border-right` | `border-inline-end` | ✅ |
| `left: 0` | `inset-inline-start: 0` | ✅ |
| `right: 0` | `inset-inline-end: 0` | ✅ |

### Examples

```css
/* ❌ Physical (not RTL-safe) */
.card {
  margin-left: 16px;
  text-align: left;
  border-left: 2px solid #22D3EE;
}

/* ✅ Logical (RTL-safe) */
.card {
  margin-inline-start: 16px;
  text-align: start;
  border-inline-start: 2px solid #22D3EE;
}
```

### Number Formatting

Numbers should always be LTR:

```css
.price {
  font-family: var(--font-latin);
  direction: ltr;
  unicode-bidi: embed;
}
```

```html
<span class="price">15.00 ر.س</span>
<!-- Always renders as: 15.00 ر.س (not flipped) -->
```

### Grid & Flexbox

```css
/* Flex automatically reverses in RTL */
.flex-container {
  display: flex;
  gap: 16px;
}

/* Grid with named areas (RTL-safe) */
.grid-layout {
  display: grid;
  grid-template-areas:
    "sidebar main"
    "sidebar footer";
}

[dir="rtl"] .grid-layout {
  grid-template-areas:
    "main sidebar"
    "footer sidebar";
}
```

---

## i18n Guidelines

### Translation Keys Structure

```javascript
{
  "common": {
    "buttons": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    },
    "messages": {
      "success": "Operation completed successfully",
      "error": "An error occurred"
    }
  },
  "pos": {
    "cart": {
      "title": "Shopping Cart",
      "empty": "Your cart is empty",
      "total": "Total"
    },
    "products": {
      "inStock": "In Stock",
      "outOfStock": "Out of Stock",
      "lowStock": "Low Stock"
    }
  }
}
```

### Arabic Translation (ar.json)

```javascript
{
  "common": {
    "buttons": {
      "save": "حفظ",
      "cancel": "إلغاء",
      "delete": "حذف"
    },
    "messages": {
      "success": "تمت العملية بنجاح",
      "error": "حدث خطأ"
    }
  },
  "pos": {
    "cart": {
      "title": "سلة المشتريات",
      "empty": "سلتك فارغة",
      "total": "الإجمالي"
    },
    "products": {
      "inStock": "متوفر",
      "outOfStock": "نفذ",
      "lowStock": "كمية محدودة"
    }
  }
}
```

### Text Direction Handling

```javascript
// React example
const { t, i18n } = useTranslation();
const isRTL = i18n.language === 'ar';

useEffect(() => {
  document.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = i18n.language;
}, [isRTL, i18n.language]);
```

### Date & Time Formatting

```javascript
// Use Intl API for locale-aware formatting
const formatter = new Intl.DateTimeFormat(locale, {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

// English: December 16, 2025
// Arabic: ١٦ ديسمبر ٢٠٢٥
```

### Number Formatting

```javascript
const priceFormatter = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'SAR'
});

// English: SAR 15.00
// Arabic: ١٥٫٠٠ ر.س
```

### Pluralization

```javascript
{
  "items": {
    "zero": "No items",
    "one": "1 item",
    "other": "{{count}} items"
  }
}

// Arabic
{
  "items": {
    "zero": "لا توجد عناصر",
    "one": "عنصر واحد",
    "two": "عنصران",
    "few": "{{count}} عناصر",
    "many": "{{count}} عنصرًا",
    "other": "{{count}} عنصر"
  }
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast

| Element | Ratio | Passes |
|:--------|:------|:-------|
| White text on `#0F1419` | 17.24:1 | ✅ AAA |
| Cyan `#22D3EE` on `#023047` | 5.12:1 | ✅ AA |
| Muted `#94A3B8` on `#0F1419` | 6.89:1 | ✅ AA |

#### Focus States

All interactive elements must have visible focus:

```css
*:focus-visible {
  outline: 2px solid #22D3EE;
  outline-offset: 2px;
}

/* Custom focus for buttons */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.5);
}
```

#### Keyboard Navigation

```css
/* Skip to content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #22D3EE;
  color: #023047;
  padding: 8px 16px;
  border-radius: 4px;
  z-index: 100;
}

.skip-link:focus {
  top: 8px;
}
```

#### ARIA Labels

```html
<!-- Button with icon only -->
<button aria-label="Close modal">
  <svg class="icon-md" />
</button>

<!-- Loading state -->
<button aria-busy="true" aria-label="Loading...">
  <span class="spinner" aria-hidden="true"></span>
</button>

<!-- Product card -->
<article role="article" aria-labelledby="product-title-1">
  <h3 id="product-title-1">Coffee</h3>
  <span aria-label="Price">15.00 SAR</span>
  <span aria-label="Stock status: In stock">In Stock</span>
</article>
```

#### Screen Reader Support

```html
<!-- Price -->
<span class="visually-hidden">Price:</span>
<span class="price" aria-label="15 Saudi Riyals">15.00 ر.س</span>

<!-- Status -->
<span role="status" aria-live="polite" aria-atomic="true">
  Item added to cart
</span>
```

#### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Implementation

### CSS Setup

```css
/* Reset */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Root Variables */
:root {
  /* Colors */
  --bg-background: #0F1419;
  --bg-surface: #1A2332;
  --bg-surface-dark: #023047;
  --text-primary: #22D3EE;
  --text-muted: #94A3B8;
  
  /* Fonts */
  --font-arabic: 'Almarai', sans-serif;
  --font-latin: 'Inter', sans-serif;
  
  /* Spacing */
  --space-4: 16px;
  --space-6: 24px;
  
  /* Border Radius */
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Timing */
  --duration-normal: 300ms;
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Body */
body {
  font-family: var(--font-arabic);
  background: var(--bg-background);
  color: white;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Visually Hidden */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Tailwind Config

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F1419',
        surface: {
          DEFAULT: '#1A2332',
          dark: '#023047',
        },
        primary: {
          DEFAULT: '#22D3EE',
          dark: '#06B6D4',
        },
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        muted: '#94A3B8',
      },
      fontFamily: {
        arabic: ['Almarai', 'sans-serif'],
        latin: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '16px',
        md: '20px',
        lg: '24px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow': 'glow 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: 0, transform: 'translateY(40px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: 0, transform: 'scale(0.8)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(34, 211, 238, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
```

### React Component Example

```jsx
import { useState } from 'react';

const ProductCard = ({ product, isRTL }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <article
      className="card-product"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      <div className="card-product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="card-product-image"
          loading="lazy"
        />
      </div>
      
      <div className="card-product-content">
        <h3 id={`product-title-${product.id}`} className="card-product-title">
          {product.name}
        </h3>
        
        <p className="card-product-description">
          {product.description}
        </p>
        
        <div className="card-product-footer">
          <span className="card-product-price" dir="ltr">
            {product.price} {isRTL ? 'ر.س' : 'SAR'}
          </span>
          
          <span
            className={`card-product-stock badge-${product.stockStatus}`}
            role="status"
          >
            {product.stockLabel}
          </span>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
```

---

## Z-Index Scale

| Layer | Z-Index | Usage |
|:------|:--------|:------|
| Background | `0` | Animated blobs, gradient meshes |
| Content | `10` | Product grid, dashboard widgets |
| Panels | `20` | Sidebar, collapsible elements |
| Controls | `30` | Header, sticky bottom nav |
| Overlay | `50` | Modals, dialogs |
| Critical | `60` | Lock screen, toasts |

---

## Performance Guidelines

### Optimization Rules

1. **Use CSS transforms** for animations (GPU-accelerated)
2. **Lazy load images** below the fold
3. **Debounce search inputs** (300ms)
4. **Virtualize long lists** (>100 items)
5. **Minimize backdrop-filter usage** (performance cost)

### Bundle Size

- **Fonts**: Subset Arabic characters (reduces by 40%)
- **Icons**: Tree-shake unused icons
- **CSS**: Purge unused Tailwind classes

---

## Testing Checklist

### Visual Testing

- [ ] Test in dark environment (primary use case)
- [ ] Verify glassmorphism on varied backgrounds
- [ ] Check color contrast (WCAG AA minimum)
- [ ] Validate hover states on all interactive elements

### RTL/LTR Testing

- [ ] Verify layout in RTL mode
- [ ] Check icon flipping behavior
- [ ] Validate number formatting (always LTR)
- [ ] Test navigation flow

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility
- [ ] Focus indicators visible
- [ ] ARIA labels present

### Performance Testing

- [ ] Lighthouse score >90
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No layout shifts (CLS = 0)

### Browser Testing

- [ ] Chrome/Edge (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Mobile (Android 10+)

---

## AR/VR Considerations

### Depth Layers for AR

The glassmorphism system is designed to work in AR environments:

```css
/* AR Layer Spacing */
.ar-background {
  transform: translateZ(-100px);
}

.ar-content {
  transform: translateZ(0);
}

.ar-controls {
  transform: translateZ(50px);
}

.ar-overlay {
  transform: translateZ(100px);
}
```

### Spatial Audio Cues

Map visual hierarchy to audio feedback:

- **Primary actions**: High-pitched click (800Hz)
- **Secondary actions**: Mid-range click (400Hz)
- **Errors**: Low warning tone (200Hz)
- **Success**: Ascending chime (400Hz → 800Hz)

### Hand Gesture Mapping

| Gesture | Action | Visual Feedback |
|:--------|:-------|:----------------|
| Tap | Select | Scale 0.95 → 1.0 + glow |
| Swipe left/right | Navigate | Slide animation |
| Pinch | Zoom | Scale transform |
| Rotate | 3D product view | Rotate transform |

### AR Safe Zones

```css
/* Keep critical UI within safe zones */
.ar-safe-zone {
  padding: env(safe-area-inset-top) 
           env(safe-area-inset-right)
           env(safe-area-inset-bottom)
           env(safe-area-inset-left);
}

/* Avoid corners in AR (hard to reach) */
.ar-action-button {
  position: fixed;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
}
```

### AR Text Legibility

- **Minimum font size**: 16px (physical size in AR space)
- **Maximum text length**: 40 characters per line
- **Background**: Always use glass with 85%+ opacity for readability

---

## Advanced Patterns

### Loading States

#### Skeleton Loader

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

```html
<div class="card-product">
  <div class="skeleton" style="aspect-ratio: 1;"></div>
  <div class="card-product-content">
    <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 8px;"></div>
    <div class="skeleton" style="height: 14px; width: 100%;"></div>
  </div>
</div>
```

#### Spinner

```css
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #22D3EE;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Empty States

```html
<div class="empty-state">
  <svg class="icon-2xl icon-muted" aria-hidden="true">
    <!-- Empty cart icon -->
  </svg>
  <h3 class="text-h2">سلتك فارغة</h3>
  <p class="text-body text-muted">ابدأ بإضافة المنتجات</p>
  <button class="btn-primary">تصفح المنتجات</button>
</div>
```

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px 24px;
  text-align: center;
}
```

### Error States

```html
<div class="error-state">
  <svg class="icon-xl" style="color: var(--error);">
    <!-- Error icon -->
  </svg>
  <h3 class="text-h2">حدث خطأ</h3>
  <p class="text-body text-muted">لم نتمكن من تحميل المنتجات</p>
  <button class="btn-secondary">إعادة المحاولة</button>
</div>
```

### Search States

#### Active Search

```css
.search-input:focus {
  border-color: #22D3EE;
  box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.1);
}

.search-input:focus + .search-icon {
  color: #22D3EE;
}
```

#### Search Results

```html
<div class="search-results glass-modal">
  <div class="search-results-header">
    <span class="text-muted">5 نتائج</span>
  </div>
  <ul class="search-results-list">
    <li class="search-result-item">
      <img src="..." alt="" class="search-result-image" />
      <div class="search-result-content">
        <h4>قهوة اليوم</h4>
        <span class="text-muted">10.00 ر.س</span>
      </div>
    </li>
  </ul>
</div>
```

### Confirmation Dialogs

```html
<div class="modal-overlay">
  <div class="modal confirmation-modal">
    <div class="modal-header">
      <div class="confirmation-icon">
        <svg class="icon-xl" style="color: var(--warning);">
          <!-- Warning icon -->
        </svg>
      </div>
    </div>
    <div class="modal-content">
      <h2 class="text-h1 text-center">تأكيد الحذف</h2>
      <p class="text-body text-muted text-center">
        هل أنت متأكد من حذف هذا العنصر؟
      </p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary">إلغاء</button>
      <button class="btn-primary" style="background: var(--error);">
        حذف
      </button>
    </div>
  </div>
</div>
```

### Progress Indicators

#### Linear Progress

```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22D3EE, #06B6D4);
  transition: width 0.3s ease;
}
```

```html
<div class="progress-bar">
  <div class="progress-bar-fill" style="width: 60%;"></div>
</div>
```

#### Circular Progress

```css
.progress-circle {
  width: 120px;
  height: 120px;
  position: relative;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-circle-background {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.progress-circle-fill {
  fill: none;
  stroke: url(#gradient);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}
```

### Tooltips

```css
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: white;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 60;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(26, 35, 50, 0.95);
}

.tooltip-wrapper:hover .tooltip {
  opacity: 1;
}

/* RTL Support */
[dir="rtl"] .tooltip {
  left: auto;
  right: 50%;
  transform: translateX(50%);
}
```

### Dropdown Menus

```css
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 200px;
  padding: 8px;
  background: rgba(26, 35, 50, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
  z-index: 50;
}

.dropdown.active .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #FFFFFF;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-divider {
  height: 1px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.1);
}

/* RTL Support */
[dir="rtl"] .dropdown-menu {
  left: auto;
  right: 0;
}
```

### Accordion

```css
.accordion-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  cursor: pointer;
  user-select: none;
}

.accordion-title {
  font-size: 16px;
  font-weight: 600;
  color: #FFFFFF;
}

.accordion-icon {
  width: 20px;
  height: 20px;
  color: #94A3B8;
  transition: transform 0.3s ease, color 0.2s ease;
}

.accordion-item.active .accordion-icon {
  transform: rotate(180deg);
  color: #22D3EE;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.accordion-item.active .accordion-content {
  max-height: 500px;
}

.accordion-body {
  padding: 0 0 16px 0;
  color: #94A3B8;
  font-size: 14px;
  line-height: 1.6;
}
```

### Tabs

```css
.tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tabs-list {
  display: flex;
  gap: 8px;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #94A3B8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.tab:hover {
  color: #FFFFFF;
}

.tab.active {
  color: #22D3EE;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #22D3EE;
}

.tab-panel {
  padding: 24px 0;
  animation: fadeIn 0.3s ease;
}
```

### Pagination

```css
.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.pagination-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94A3B8;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(.active):not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #FFFFFF;
}

.pagination-button.active {
  background: #22D3EE;
  border-color: #22D3EE;
  color: #023047;
  font-weight: 600;
}

.pagination-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-ellipsis {
  padding: 0 8px;
  color: #94A3B8;
}
```

---

## Data Visualization

### Chart Colors

```css
--chart-primary: #22D3EE;
--chart-secondary: #06B6D4;
--chart-success: #10B981;
--chart-warning: #F59E0B;
--chart-error: #EF4444;
--chart-info: #3B82F6;
--chart-purple: #8B5CF6;
--chart-pink: #EC4899;
```

### Chart Styles

```css
.chart-container {
  padding: 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.chart-title {
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 16px;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 16px;
}

.chart-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94A3B8;
}

.chart-legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
```

---

## Utility Classes

### Display

```css
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }
```

### Flexbox

```css
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-6 { gap: 24px; }
```

### Text

```css
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-start { text-align: start; }
.text-end { text-align: end; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Colors

```css
.text-white { color: #FFFFFF; }
.text-muted { color: #94A3B8; }
.text-primary { color: #22D3EE; }
.text-success { color: #10B981; }
.text-error { color: #EF4444; }
.text-warning { color: #F59E0B; }

.bg-background { background-color: #0F1419; }
.bg-surface { background-color: #1A2332; }
.bg-primary { background-color: #22D3EE; }
.bg-success { background-color: #10B981; }
.bg-error { background-color: #EF4444; }
.bg-warning { background-color: #F59E0B; }
```

---

## Print Styles

### Receipt Printing

```css
@media print {
  /* Hide UI elements */
  .navbar,
  .sidebar,
  .bottom-nav,
  .btn:not(.print-visible) {
    display: none !important;
  }
  
  /* Reset colors for printing */
  body {
    background: white !important;
    color: black !important;
  }
  
  .glass,
  .glass-panel,
  .glass-modal {
    background: white !important;
    backdrop-filter: none !important;
    border: 1px solid black !important;
  }
  
  /* Print-specific styles */
  .receipt {
    width: 80mm; /* Thermal printer width */
    font-size: 12px;
    padding: 10mm;
  }
  
  .receipt-header {
    text-align: center;
    margin-bottom: 5mm;
    border-bottom: 1px dashed black;
    padding-bottom: 5mm;
  }
  
  .receipt-item {
    display: flex;
    justify-content: space-between;
    margin: 2mm 0;
  }
  
  .receipt-total {
    font-weight: bold;
    font-size: 14px;
    border-top: 1px solid black;
    padding-top: 3mm;
    margin-top: 5mm;
  }
}
```

---

## Version History

### v2.0 (Current)
- Full RTL/LTR support with logical properties
- Comprehensive i18n guidelines
- AR/VR spatial design considerations
- Expanded component library
- Accessibility improvements (WCAG 2.1 AA)

### v1.5
- Initial glassmorphism system
- Cyber-Glass aesthetic established
- Basic component library
- Dark mode color palette

### v1.0
- Initial release
- Basic color system
- Typography scale

---

## Contributing

### Design System Updates

1. **Propose changes** via design review
2. **Document rationale** for modifications
3. **Update this file** with new patterns
4. **Create examples** in Storybook/Figma
5. **Test accessibility** before merging

### Naming Conventions

- Use **kebab-case** for CSS classes (`.btn-primary`)
- Use **camelCase** for JavaScript variables (`isPrimary`)
- Prefix components with scope (`.card-product`, `.modal-payment`)
- Use semantic names over visual descriptions

---

## Resources

### Design Tools

- **Figma**: [NerdPOS Design Kit](#)
- **Storybook**: [Component Library](#)
- **Color Contrast Checker**: [WebAIM](#)

### Fonts

- **Almarai**: [Google Fonts](https://fonts.google.com/specimen/Almarai)
- **Inter**: [Google Fonts](https://fonts.google.com/specimen/Inter)

### Icons

- **Lucide**: [lucide.dev](https://lucide.dev)
- **Heroicons**: [heroicons.com](https://heroicons.com)

### Learning Resources

- **RTL Styling**: [RTL Styling 101](https://rtlstyling.com)
- **Glassmorphism**: [CSS Glass Tutorial](https://css.glass)
- **ARIA**: [MDN ARIA Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

---

## Support

For questions or suggestions:
- **Email**: design@nerdpos.com
- **Slack**: #design-system
- **GitHub**: [Issues](https://github.com/nerdpos/design-system/issues)

---

**Last Updated**: December 16, 2025  
**Maintained by**: NerdPOS Design Team  
**License**: Proprietary