# Legacy POS Screen - Visual Design System Specification
## Complete UI/UX DNA for Architecture Migration

**Version**: 1.0  
**Date**: December 17, 2025  
**Purpose**: Preserve exact look & feel during migration  
**Scope**: Visual design only (NO business logic)

---

## **TABLE OF CONTENTS**

1. [Global Theming & Colors](#1-global-theming--colors)
2. [Glassmorphism Formula](#2-glassmorphism-formula)
3. [Layout & Grid System](#3-layout--grid-system)
4. [Z-Index Strategy](#4-z-index-strategy)
5. [Component DNA Library](#5-component-dna-library)
6. [Animation Specifications](#6-animation-specifications)
7. [Typography System](#7-typography-system)
8. [Shadow System](#8-shadow-system)
9. [Interactive States](#9-interactive-states)
10. [Quick Copy-Paste Classes](#10-quick-copy-paste-classes)

---

## **1. GLOBAL THEMING & COLORS**

### **Base Background Gradient**

```css
/* Main Screen Background (IMMUTABLE) */
background: gradient-to-b from-[#023047] to-[#001219]

/* Tailwind Class */
className="bg-gradient-to-b from-[#023047] to-[#001219]"
```

**Description**: Deep ocean blue gradient flowing from top (#023047) to near-black bottom (#001219). Applied to root POS screen container.

### **Color Palette Reference**

#### **Primary Brand Colors**
```css
/* Cyan - Primary Action Color */
--cyan-primary: #22d3ee     /* Cyan 400 */
--cyan-dark: #0891b2        /* Cyan 600 */
--cyan-darker: #006399      /* Custom dark blue */

/* Gradients */
Primary Button: linear-gradient(to bottom, #22d3ee, #006399)
Active State: linear-gradient(to bottom, #22d3ee, #0891b2)
```

#### **Surface Colors (Dark Theme)**
```css
/* Backgrounds */
--surface-1: #1a1c1e         /* Modals, Cards */
--surface-2: #2a2d32         /* Payment Modal */
--surface-variant: rgba(255, 255, 255, 0.05)  /* Subtle backgrounds */

/* Borders */
--border-primary: rgba(255, 255, 255, 0.1)    /* Standard borders */
--border-active: rgba(34, 211, 238, 0.5)      /* Cyan with 50% opacity */
```

#### **Text Colors**
```css
/* Primary Text */
--text-primary: #e2e2e6      /* High contrast white */
--text-secondary: #c2c7ce    /* Medium gray */
--text-disabled: #6b7280     /* Low contrast gray */
```

#### **Semantic Status Colors**
```css
/* Success - Green */
--success: #10b981           /* Green 500 */
--success-dark: #059669      /* Green 600 */
Gradient: from-[#10b981] to-[#059669]

/* Error - Red */
--error: #ef4444             /* Red 500 */
--error-dark: #dc2626        /* Red 600 */
Gradient: from-[#ef4444] to-[#dc2626]

/* Warning - Orange */
--warning: #f59e0b           /* Orange 500 */
--warning-dark: #d97706      /* Orange 600 */
Gradient: from-[#f59e0b] to-[#d97706]

/* Info - Blue */
--info: #3b82f6              /* Blue 500 */
--info-dark: #2563eb         /* Blue 600 */
Gradient: from-[#3b82f6] to-[#2563eb]
```

#### **Payment Method Gradients**
```css
Cash:     linear-gradient(135deg, #10b981 0%, #059669 100%)
Mada:     linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)
Visa:     linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)
STC Pay:  linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)
Tabby:    linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
Tamara:   linear-gradient(135deg, #ec4899 0%, #db2777 100%)
```

---

## **2. GLASSMORPHISM FORMULA**

### **The "Glass Card" Recipe**

```css
/* Standard Glass Card (Most Common) */
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
backdrop-filter: blur(10px)  /* Use 'backdrop-blur-sm' in Tailwind */

/* Tailwind Classes */
className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] backdrop-blur-sm"
```

### **Glass Variations**

#### **Subtle Glass** (Product Cards, List Items)
```css
background: rgba(255, 255, 255, 0.05)
border: rgba(255, 255, 255, 0.1)
backdrop-blur: none  /* No blur for performance */

/* Tailwind */
className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]"
```

#### **Elevated Glass** (Modals, Panels)
```css
background: rgba(255, 255, 255, 0.1)   /* Slightly more opaque */
border: rgba(255, 255, 255, 0.15)
backdrop-blur: 16px

/* Tailwind */
className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] backdrop-blur-md"
```

#### **Strong Glass** (Input Fields on Focus)
```css
border: rgba(34, 211, 238, 0.5)  /* Cyan border */
box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.1)

/* Tailwind */
className="border-[rgba(34,211,238,0.5)] ring-2 ring-cyan-400/10"
```

### **Backdrop Classes**

```css
/* Modal Backdrops */
Discount Modal: bg-black/60 backdrop-blur-md
Payment Modal: bg-black/70 backdrop-blur-sm
Table Selector: bg-black/70 backdrop-blur-md

/* Tailwind Quick Reference */
Light blur: backdrop-blur-sm
Medium blur: backdrop-blur-md
Heavy blur: backdrop-blur-lg
```

---

## **3. LAYOUT & GRID SYSTEM**

### **Screen Layout Structure**

```
┌─────────────────────────────────────────────────┐
│ Fixed Background Gradient (Full Viewport)      │
│ ┌─────────────────────────────┬──────────────┐ │
│ │                             │  Navigation  │ │
│ │  Main Content Area          │  Sidebar     │ │
│ │  (Dynamic margin-left)      │  (Fixed)     │ │
│ │                             │  80px width  │ │
│ │                             │  z-50        │ │
│ ├─────────────────────────────┤              │ │
│ │ Action Bar (Sticky)         │              │ │
│ │ z-60                        │              │ │
│ └─────────────────────────────┴──────────────┘ │
│   Cart Panel (Slides from left, z-50)          │
└─────────────────────────────────────────────────┘
```

### **Container Dimensions**

```css
/* Main Screen Container */
min-height: 100vh
padding-right: 80px  /* pr-20 - Offset for sidebar */

/* Main Navigation Sidebar (Fixed Right) */
position: fixed
right: 0
top: 0
bottom: 0
width: 80px
z-index: 50

/* Cart Panel (Fixed Left) */
position: fixed
left: 0
top: 0
bottom: 0
width: 380px
z-index: 50

/* POS Action Bar (Fixed Bottom) */
position: fixed
bottom: 0
left: 0
right: 80px  /* Exclude sidebar */
height: auto (60-80px based on content)
z-index: 60
```

### **Content Grid Layouts**

#### **Product Grid**
```css
/* Responsive Grid */
display: grid
gap: 16px (gap-4)

Breakpoints:
  Base (mobile):    grid-cols-2
  Medium (≥768px):  grid-cols-3
  Large (≥1024px):  grid-cols-4
  XL (≥1280px):     grid-cols-5

/* Tailwind */
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
```

#### **Category Pills**
```css
/* Horizontal Scroll Container */
display: flex
gap: 8px (gap-2)
overflow-x: auto
padding-bottom: 8px (pb-2)
scrollbar-width: thin

/* Tailwind */
className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent"
```

#### **Payment Methods Grid**
```css
display: grid
grid-cols: 2
gap: 12px (gap-3)

/* Tailwind */
className="grid grid-cols-2 gap-3"
```

#### **Stats Cards (3-Column)**
```css
display: grid
grid-cols: 3
gap: 16px (gap-4)

/* Tailwind */
className="grid grid-cols-3 gap-4"
```

### **Spacing System**

```css
/* Screen Padding */
Top:    24px (pt-6)
Bottom: 96px (pb-24) - For action bar clearance
Sides:  16px (px-4)

/* Section Gaps */
Between sections: 24px (space-y-6)
Between cards:    16px (gap-4)
Between items:    8px (gap-2)

/* Card Internal Padding */
Small cards:  12px (p-3)
Medium cards: 16px (p-4)
Large cards:  20px (p-5)
Modals:       24px (p-6)
```

---

## **4. Z-INDEX STRATEGY**

### **Layer Hierarchy** (Bottom to Top)

```css
/* Base Content Layer */
z-auto (default)          - Product grid, content area

/* Floating UI Elements */
z-10                      - Dropdown menus (Order type selector)

/* Sticky Navigation & Panels */
z-50                      - Main Navigation Sidebar
z-50                      - Cart Panel
z-50                      - Feedback Bar (top center)

/* Sticky Action Controls */
z-60                      - POS Action Bar (bottom)

/* Modal Layer */
z-50                      - All modal backdrops
z-50                      - All modal content (same layer, managed by AnimatePresence)
```

### **Implementation Rules**

1. **Modals**: All modals use `z-50` on both backdrop and content div
2. **Action Bar**: `z-60` ensures it's always above cart panel
3. **Navigation**: `z-50` keeps it accessible but below action bar
4. **Dropdowns**: `z-10` for simple dropdowns (Order Type)

### **Fixed Position Elements**

```css
/* Always Fixed (Never Scroll) */
- Main Navigation:  fixed right-0 top-0 bottom-0 z-50
- Cart Panel:       fixed left-0 top-0 bottom-0 z-50
- Action Bar:       fixed bottom-0 left-0 right-80 z-60
- Feedback Bar:     fixed top-6 left-1/2 -translate-x-1/2 z-50

/* Scrollable */
- Product Grid:     relative (scrolls normally)
- Categories:       relative (scrolls normally)
- Search Bar:       relative (scrolls normally)
```

---

## **5. COMPONENT DNA LIBRARY**

### **5.1 Product Card**

```css
/* Container */
background: rgba(255, 255, 255, 0.05)
backdrop-filter: blur(sm)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 12px
padding: 16px
text-align: right (RTL)

/* Hover State */
border-color: rgba(34, 211, 238, 0.5)  /* Cyan with 50% */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
transform: scale(1.03)

/* Active (Tap) State */
transform: scale(0.97)

/* Disabled State */
opacity: 0.5
cursor: not-allowed
pointer-events: none (optional)

/* Tailwind Full Class String */
className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-right transition-all hover:border-cyan-400/50 hover:shadow-lg cursor-pointer"
```

**Internal Structure:**

```tsx
<motion.button
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.03 }}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-right transition-all hover:border-cyan-400/50 hover:shadow-lg"
>
  {/* Product Image */}
  <div className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-[rgba(255,255,255,0.03)]">
    <img className="w-full h-full object-cover" />
  </div>

  {/* Arabic Name */}
  <h3 className="text-base font-['Almarai'] font-bold text-[#e2e2e6] mb-1 line-clamp-2" dir="auto">
    {product.name}
  </h3>

  {/* English Name */}
  <p className="text-sm text-[#c2c7ce] mb-2 line-clamp-1">
    {product.nameEn}
  </p>

  {/* Price & Stock Row */}
  <div className="flex items-center justify-between">
    <span className="text-lg font-['Arial'] font-bold text-cyan-400">
      {price.toFixed(2)} ر.س
    </span>
    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
      {stock} متوفر
    </span>
  </div>
</motion.button>
```

**Stock Badge Colors:**
```css
High Stock (>10):  bg-green-500/20 text-green-400
Low Stock (1-10):  bg-yellow-500/20 text-yellow-400
Out of Stock (0):  bg-red-500/20 text-red-400
```

---

### **5.2 Cart Panel**

```css
/* Container */
position: fixed
left: 0
top: 0
bottom: 0
width: 380px
background: var(--surface) or #1a1c1e
border-right: 1px solid rgba(255, 255, 255, 0.1)
box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15)
z-index: 50

/* Animation (Framer Motion) */
initial: { x: '-100%' }
animate: { x: 0 }
exit: { x: '-100%' }
transition: { type: 'spring', damping: 30, stiffness: 300 }

/* Tailwind */
className="fixed left-0 top-0 bottom-0 w-[380px] bg-[var(--surface)] border-l border-[var(--outline-variant)] shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-50 flex flex-col"
```

**Header Section:**
```css
padding: 20px horizontal, 12px vertical
border-bottom: 1px solid rgba(255, 255, 255, 0.1)
background: rgba(255, 255, 255, 0.05)  /* surface-variant */

/* Tailwind */
className="flex items-center justify-between px-5 py-3 border-b border-[var(--outline-variant)] bg-[var(--surface-variant)]"
```

**Cart Item Card:**
```css
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 8px
padding: 10px
hover:border-color: var(--primary)

/* Animation */
initial: { opacity: 0, x: -20 }
animate: { opacity: 1, x: 0 }
exit: { opacity: 0, x: -20, height: 0, marginBottom: 0 }
transition: { delay: index * 0.02 }

/* Tailwind */
className="bg-[var(--surface-variant)] rounded-lg border border-[var(--outline-variant)] p-2.5 hover:border-[var(--primary)] transition-colors"
```

**Summary Footer:**
```css
position: absolute
bottom: 0
left: 0
right: 0
padding: 16px horizontal, 12px vertical
border-top: 1px solid rgba(255, 255, 255, 0.1)
background: var(--surface)

/* Tailwind */
className="absolute bottom-0 left-0 right-0 border-t border-[var(--outline-variant)] bg-[var(--surface)] px-4 py-3"
```

---

### **5.3 Main Navigation Sidebar**

```css
/* Container */
position: fixed
right: 0
top: 0
bottom: 0
width: 80px
background: linear-gradient(to bottom, #023047, #001219)
border-left: 1px solid rgba(255, 255, 255, 0.1)
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
z-index: 50

/* Tailwind */
className="fixed right-0 top-0 bottom-0 w-20 bg-gradient-to-b from-[#023047] to-[#001219] border-l border-[rgba(255,255,255,0.1)] shadow-2xl z-50 flex flex-col"
```

**Logo Section:**
```css
height: 80px
border-bottom: 1px solid rgba(255, 255, 255, 0.1)
display: flex
align-items: center
justify-content: center

/* Tailwind */
className="h-20 flex items-center justify-center border-b border-[rgba(255,255,255,0.1)]"
```

**Navigation Button (Inactive):**
```css
width: 64px  /* full width minus padding */
height: 64px
border-radius: 16px
background: rgba(255, 255, 255, 0.05)
color: #c2c7ce

hover:background: rgba(255, 255, 255, 0.1)
hover:transform: scale(1.05)
active:transform: scale(0.95)

/* Tailwind */
className="w-full h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#c2c7ce]"
```

**Navigation Button (Active):**
```css
background: linear-gradient(to bottom, #22d3ee, #006399)  /* Cyan gradient */
color: #00373a  /* Dark text on cyan */
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

/* Active Indicator (Right Edge Bar) */
position: absolute
right: 0
top: 50%
transform: translateY(-50%)
width: 4px
height: 32px
background: #22d3ee
border-radius: 9999px 0 0 9999px

/* Tailwind */
className="bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] shadow-lg"

/* Indicator */
className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-l-full"
```

**Icon & Text:**
```css
/* Icon */
width: 24px
height: 24px

/* Text */
font-size: 9px
font-family: 'Almarai'
font-weight: bold
text-align: center
line-height: tight (1.25)

/* Tailwind */
<span className="text-[9px] font-['Almarai'] font-bold text-center leading-tight">
```

**Badge (Notification):**
```css
position: absolute
top: 4px
left: 4px
width: 20px
height: 20px
border-radius: 9999px
background: #fb2c36  /* Bright red */
color: white
font-size: 10px
font-family: Arial
font-weight: bold
border: 2px solid #023047

/* Tailwind */
className="absolute top-1 left-1 bg-[#fb2c36] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-['Arial'] font-bold border-2 border-[#023047]"
```

---

### **5.4 POS Action Bar**

```css
/* Container */
position: fixed
bottom: 0
left: 0
right: 80px  /* Exclude sidebar */
background: rgba(26, 28, 30, 0.98)
backdrop-filter: blur(xl)
border-top: 1px solid rgba(255, 255, 255, 0.1)
box-shadow: 0 -25px 50px -12px rgba(0, 0, 0, 0.25)
z-index: 60

/* Tailwind */
className="fixed bottom-0 left-0 right-20 bg-[rgba(26,28,30,0.98)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.1)] shadow-2xl z-60"
```

**Inner Container:**
```css
padding: 12px vertical, 16px horizontal
display: flex
align-items: center
justify-content: space-between
gap: 8px

/* Tailwind */
className="container mx-auto px-4 py-3"
className="flex items-center justify-between gap-2"
```

**Action Button (Default):**
```css
height: 56px
padding: 12px horizontal
border-radius: 12px
display: flex
flex-direction: column
align-items: center
justify-content: center
gap: 4px
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
color: #e2e2e6

hover:border-color: rgba(34, 211, 238, 0.5)
whileHover: scale(1.05)
whileTap: scale(0.95)

/* Tailwind */
className="h-14 px-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] hover:border-cyan-400/50"
```

**Action Button (Primary - Cart):**
```css
background: linear-gradient(to bottom, #22d3ee, #006399)
color: #00373a
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)

/* Tailwind */
className="bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-lg"
```

**Action Button (Warning - Hold):**
```css
background: linear-gradient(to bottom, #f59e0b, #d97706)
color: white
box-shadow: large

/* Tailwind */
className="bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white hover:opacity-90 shadow-lg"
```

**Checkout Button (LARGE):**
```css
height: 56px
padding: 32px horizontal
border-radius: 12px
font-size: 16px
font-family: 'Almarai'
font-weight: bold
display: flex
align-items: center
gap: 12px
background: linear-gradient(to bottom, #22d3ee, #006399)
color: #00373a
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)

whileHover: scale(1.05)
whileTap: scale(0.95)

/* Disabled */
background: rgba(255, 255, 255, 0.05)
color: #c2c7ce
opacity: 0.5
cursor: not-allowed

/* Tailwind */
className="h-14 px-8 rounded-xl font-['Almarai'] font-bold text-base flex items-center gap-3 transition-all bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
```

**Badge (Cart Count):**
```css
position: absolute
top: -4px
right: -4px
min-width: 20px
height: 20px
padding: 0 4px
border-radius: 9999px
background: #fb2c36
color: white
font-size: 10px
font-family: Arial
font-weight: bold
border: 2px solid #023047

/* Tailwind */
className="absolute -top-1 -right-1 bg-[#fb2c36] text-white rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-['Arial'] font-bold border-2 border-[#023047]"
```

**Vertical Divider:**
```css
height: 32px
width: 1px
background: rgba(255, 255, 255, 0.1)

/* Tailwind */
className="h-8 w-px bg-[rgba(255,255,255,0.1)]"
```

---

### **5.5 Modal Components**

#### **Modal Backdrop (Universal)**
```css
position: fixed
inset: 0
z-index: 50
background: rgba(0, 0, 0, 0.7)  /* 70% black */
backdrop-filter: blur(md) or blur(sm)
display: flex
align-items: center
justify-content: center
padding: 16px or 24px

/* Animation */
initial: { opacity: 0 }
animate: { opacity: 1 }
exit: { opacity: 0 }

/* Tailwind - Payment Modal */
className="fixed inset-0 z-50 flex items-center justify-center p-6 pb-28 bg-black/70 backdrop-blur-sm"

/* Tailwind - Discount/Table Selector */
className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
```

#### **Modal Container (Payment Modal)**
```css
position: relative
width: 100%
max-width: 672px  /* max-w-xl */
max-height: 100%
background: #2a2d32
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 16px
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
overflow: hidden
display: flex
flex-direction: column

/* Animation */
initial: { opacity: 0, scale: 0.95 }
animate: { opacity: 1, scale: 1 }
exit: { opacity: 0, scale: 0.95 }

/* Tailwind */
className="relative w-full max-w-xl max-h-full bg-[#2a2d32] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
```

#### **Modal Container (Discount/Table Selector)**
```css
background: linear-gradient(to bottom, #1a1c1e, #1d2222, #2a2f35)
border-radius: 24px  /* rounded-3xl */
box-shadow: 2xl
max-width: 896px (for Table) or 672px (for Discount)
width: 100%
max-height: 90vh
overflow: hidden

/* Animation */
initial: { scale: 0.9, opacity: 0, y: 20 }
animate: { scale: 1, opacity: 1, y: 0 }
exit: { scale: 0.9, opacity: 0, y: 20 }

/* Tailwind */
className="bg-gradient-to-b from-[#1a1c1e] via-[#1d2222] to-[#2a2f35] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
```

#### **Modal Header (Standard)**
```css
display: flex
align-items: center
justify-content: space-between
padding: 24px horizontal, 16px vertical
border-bottom: 1px solid rgba(255, 255, 255, 0.1)
flex-shrink: 0

/* Tailwind */
className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.1)] flex-shrink-0"
```

**Title:**
```css
font-size: 18px or 24px
font-family: 'Almarai'
font-weight: bold
color: #e2e2e6

/* Tailwind (Small) */
className="text-lg font-['Almarai'] font-bold text-[#e2e2e6]"

/* Tailwind (Large) */
className="text-2xl font-['Almarai'] font-bold text-[#e2e2e6] mb-1"
```

**Close Button:**
```css
width: 36px
height: 36px
border-radius: 8px
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
hover:background: rgba(255, 255, 255, 0.1)

/* Tailwind */
className="w-9 h-9 rounded-lg bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center transition-all disabled:opacity-50"
```

#### **Modal Scrollable Content**
```css
overflow-y: auto
overflow-x: hidden
flex: 1
padding: 20px

/* Tailwind */
className="overflow-y-auto overflow-x-hidden flex-1 p-5"
```

---

### **5.6 Category Pills**

```css
/* Pill Button (Inactive) */
padding: 24px horizontal, 10px vertical
border-radius: 12px
font-size: 14px
font-family: 'Almarai'
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
color: #c2c7ce
white-space: nowrap

hover:border-color: rgba(34, 211, 238, 0.5)

/* Tailwind */
className="px-6 py-2.5 rounded-xl text-sm font-['Almarai'] transition-all whitespace-nowrap bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:border-cyan-400/50"
```

**Pill Button (Active):**
```css
background: #22d3ee  /* Solid cyan */
color: #00373a
box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 2px 6px 2px rgba(0, 0, 0, 0.15)

/* Tailwind */
className="bg-cyan-400 text-[#00373a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
```

**Keyboard Shortcut Label:**
```css
margin-left: 8px
font-size: 12px
opacity: 0.7

/* Tailwind */
<span className="ml-2 text-xs opacity-70">[{index + 1}]</span>
```

---

### **5.7 Search Input**

```css
/* Container */
position: relative
flex: 1

/* Input */
width: 100%
height: 48px
padding: 16px, 48px right (for icon)
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 12px
font-size: 16px
font-family: 'Almarai'
color: #e2e2e6
placeholder-color: #c2c7ce

focus:outline: none
focus:border-color: rgba(34, 211, 238, 0.5)

/* Icon (Absolute) */
position: absolute
left: 16px
top: 14px
width: 20px
height: 20px
color: #c2c7ce

/* Tailwind */
<div className="flex-1 relative">
  <input
    className="w-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-base text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] focus:outline-none focus:border-cyan-400/50 transition-all"
    dir="rtl"
  />
  <Search className="absolute left-4 top-3.5 w-5 h-5 text-[#c2c7ce]" />
</div>
```

---

### **5.8 Order Type Dropdown**

```css
/* Button */
height: 48px
padding: 32px horizontal
border-radius: 12px
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
color: #e2e2e6
font-size: 16px
font-family: 'Almarai'
display: flex
align-items: center
gap: 12px
min-width: 180px
justify-content: space-between

hover:border-color: rgba(34, 211, 238, 0.5)

/* Tailwind */
className="h-12 px-8 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] text-base font-['Almarai'] hover:border-cyan-400/50 transition-colors flex items-center gap-3 min-w-[180px] justify-between"
```

**Dropdown Menu:**
```css
position: absolute
left: 0
top: calc(100% + 8px)
width: 224px
background: #1a1c1e
border: 1px solid rgba(255, 255, 255, 0.1)
border-radius: 12px
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
opacity: 0
visibility: hidden
z-index: 10

group-hover:opacity: 1
group-hover:visibility: visible

/* Tailwind */
className="absolute left-0 top-full mt-2 w-56 bg-[#1a1c1e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10"
```

**Dropdown Option:**
```css
width: 100%
padding: 20px horizontal, 16px vertical
text-align: right
hover:background: rgba(255, 255, 255, 0.05)
first:border-radius: 12px 12px 0 0
last:border-radius: 0 0 12px 12px

/* Tailwind */
className="w-full px-5 py-4 text-right hover:bg-[rgba(255,255,255,0.05)] transition-colors first:rounded-t-xl last:rounded-b-xl"
```

---

### **5.9 Payment Method Card**

```css
/* Container */
position: relative
height: 112px  /* h-28 */
border-radius: 12px
overflow: hidden
border: 1px solid rgba(255, 255, 255, 0.1)
hover:border-color: rgba(34, 211, 238, 0.5)

whileHover: scale(1.02)
whileTap: scale(0.98)

/* Gradient Background (Behind) */
position: absolute
inset: 0
opacity: 0.2
group-hover:opacity: 0.3
background: method.gradient (linear-gradient)

/* Content Layer (Above) */
position: relative
height: 100%
display: flex
flex-direction: column
align-items: center
justify-content: center
gap: 8px
padding: 16px

/* Tailwind */
className="relative h-28 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)] hover:border-cyan-400/50 transition-all group"

{/* Gradient Overlay */}
<div 
  className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
  style={{ background: method.gradient }}
/>

{/* Content */}
<div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
  {/* Icon (text-white) */}
  {/* Text (text-[#e2e2e6]) */}
</div>
```

**Selected Payment Method (Large Card):**
```css
position: relative
height: 128px  /* h-32 */
border-radius: 16px
overflow: hidden
border: 2px solid #22d3ee  /* Thicker cyan border */

/* Same gradient overlay at 20% opacity */
/* Content with larger text */

/* Tailwind */
className="relative h-32 rounded-2xl overflow-hidden border-2 border-cyan-400"
```

---

### **5.10 Total Display Cards**

#### **Payment Modal Total Card**
```css
background: linear-gradient(to bottom right, rgba(34, 211, 238, 0.2), rgba(59, 130, 246, 0.2))
border: 1px solid rgba(34, 211, 238, 0.3)
border-radius: 16px
padding: 24px
text-align: center

/* Tailwind */
className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 rounded-2xl p-6"
```

**Total Amount Text:**
```css
font-size: 48px  /* text-5xl */
font-family: 'Inter'
font-weight: bold
color: white

/* Tailwind */
className="text-5xl font-['Inter'] font-bold text-white mb-3"
```

**Currency Symbol (inline):**
```css
font-size: 24px  /* text-2xl */
/* Inside the same span */
<span className="text-2xl">ر.س</span>
```

#### **Discount Modal Subtotal Card**
```css
background: linear-gradient(to right, rgba(34, 211, 238, 0.1), rgba(0, 99, 153, 0.1))
border: 1px solid rgba(34, 211, 238, 0.3)
border-radius: 16px
padding: 16px
text-align: center

/* Tailwind */
className="bg-gradient-to-r from-[rgba(34,211,238,0.1)] to-[rgba(0,99,153,0.1)] border border-cyan-400/30 rounded-2xl p-4 text-center"
```

---

### **5.11 Feedback Bar**

```css
/* Container */
position: fixed
top: 24px
left: 50%
transform: translateX(-50%)
z-index: 50
padding: 12px horizontal, 24px vertical
border-radius: 12px
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
backdrop-filter: blur(sm)

/* Colors (based on type) */
Success: background: rgba(16, 185, 129, 0.9), color: white
Error:   background: rgba(239, 68, 68, 0.9), color: white
Info:    background: rgba(59, 130, 246, 0.9), color: white

/* Animation */
initial: { opacity: 0, y: -20 }
animate: { opacity: 1, y: 0 }
exit: { opacity: 0, y: -20 }

/* Tailwind */
className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm bg-green-500/90 text-white"
```

**Text:**
```css
font-size: 14px
font-family: 'Almarai'
font-weight: bold
direction: auto

/* Tailwind */
className="text-sm font-['Almarai'] font-bold"
```

---

### **5.12 Custom Input Fields**

#### **Cash Amount Input (Large)**
```css
width: 100%
height: 80px  /* h-20 */
padding: 24px horizontal
border-radius: 16px
background: rgba(255, 255, 255, 0.05)
border: 2px solid rgba(255, 255, 255, 0.1)
color: #e2e2e6
placeholder-color: #6b7280
font-size: 30px  /* text-3xl */
font-family: 'Inter'
font-weight: bold
text-align: center
direction: ltr

focus:border-color: #22d3ee
focus:outline: none

/* Tailwind */
className="w-full h-20 px-6 rounded-2xl bg-[rgba(255,255,255,0.05)] border-2 border-[rgba(255,255,255,0.1)] text-[#e2e2e6] placeholder-[#6b7280] focus:border-cyan-400 focus:outline-none font-['Inter'] font-bold text-3xl text-center disabled:opacity-50"
```

**Icons (Absolute positioned):**
```css
/* Calculator Icon (Left) */
position: absolute
left: 24px
top: 50%
transform: translateY(-50%)
width: 24px
height: 24px
color: #6b7280

/* Currency Label (Right) */
position: absolute
right: 24px
top: 50%
transform: translateY(-50%)
font-size: 18px
font-family: 'Almarai'
color: #6b7280

/* Tailwind */
<div className="absolute left-6 top-1/2 -translate-y-1/2">
  <Calculator className="w-6 h-6 text-[#6b7280]" />
</div>
<div className="absolute right-6 top-1/2 -translate-y-1/2">
  <span className="text-lg font-['Almarai'] text-[#6b7280]">ر.س</span>
</div>
```

#### **Quick Cash Buttons**
```css
height: 56px  /* h-14 */
border-radius: 12px
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
hover:background: rgba(255, 255, 255, 0.1)
hover:border-color: rgba(34, 211, 238, 0.5)

/* Tailwind */
className="h-14 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.1)] hover:border-cyan-400/50 transition-all disabled:opacity-50"
```

**Number Text:**
```css
font-family: 'Inter'
font-weight: bold
color: #e2e2e6

/* Tailwind */
<span className="font-['Inter'] font-bold text-[#e2e2e6]">
```

---

## **6. ANIMATION SPECIFICATIONS**

### **6.1 Product Grid Stagger**

```tsx
/* Individual Product Card */
<motion.button
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.03 }}
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
>
```

**Values:**
- Initial: `opacity: 0, y: 20` (invisible, 20px down)
- Animate: `opacity: 1, y: 0` (visible, normal position)
- Delay: `index * 0.03` seconds (30ms per item)
- Hover: `scale: 1.03` (3% larger)
- Tap: `scale: 0.97` (3% smaller)

---

### **6.2 Cart Panel Slide**

```tsx
/* Cart Panel Container */
<motion.div
  initial={{ x: '-100%' }}
  animate={{ x: 0 }}
  exit={{ x: '-100%' }}
  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
>
```

**Values:**
- Initial: `x: '-100%'` (fully off-screen to the left)
- Animate: `x: 0` (slides into view)
- Exit: `x: '-100%'` (slides off-screen)
- Transition: Spring physics
  - `damping: 30` (resistance)
  - `stiffness: 300` (spring strength)

---

### **6.3 Cart Item Entry/Exit**

```tsx
/* Individual Cart Item */
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
  transition={{ delay: index * 0.02 }}
>
```

**Values:**
- Initial: `opacity: 0, x: -20` (invisible, 20px left)
- Animate: `opacity: 1, x: 0` (visible, normal position)
- Exit: 
  - `opacity: 0` (fade out)
  - `x: -20` (slide left)
  - `height: 0` (collapse height)
  - `marginBottom: 0` (collapse margin)
- Delay: `index * 0.02` seconds (20ms per item)

**AnimatePresence:**
```tsx
<AnimatePresence mode="popLayout">
  {items.map((item, index) => (
    {/* motion.div with exit animation */}
  ))}
</AnimatePresence>
```

---

### **6.4 Modal Animations**

#### **Backdrop Fade**
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 bg-black/70 backdrop-blur-sm"
/>
```

#### **Modal Scale + Fade (Payment Modal)**
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  className="modal-container"
/>
```

**Values:**
- Initial: `opacity: 0, scale: 0.95` (invisible, 5% smaller)
- Animate: `opacity: 1, scale: 1` (visible, normal size)
- Exit: `opacity: 0, scale: 0.95` (fade + shrink)

#### **Modal Scale + Slide (Discount/Table Modal)**
```tsx
<motion.div
  initial={{ scale: 0.9, opacity: 0, y: 20 }}
  animate={{ scale: 1, opacity: 1, y: 0 }}
  exit={{ scale: 0.9, opacity: 0, y: 20 }}
  className="modal-container"
/>
```

**Values:**
- Initial: `scale: 0.9, opacity: 0, y: 20` (90% size, invisible, 20px down)
- Animate: `scale: 1, opacity: 1, y: 0` (full size, visible, normal position)
- Exit: Reverse

---

### **6.5 Step Transitions (Payment Modal)**

```tsx
<AnimatePresence mode="wait">
  {!selectedMethod ? (
    <motion.div
      key="select-method"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Step 1 Content */}
    </motion.div>
  ) : (
    <motion.div
      key="process-payment"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Step 2 Content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Values:**
- Step 1 → Step 2:
  - Step 1 exits right (`x: 20`)
  - Step 2 enters from right (`initial x: 20`)
- Step 2 → Step 1:
  - Step 2 exits left (`x: -20`)
  - Step 1 enters from left (`initial x: -20`)

**Mode:** `wait` (wait for exit before entering)

---

### **6.6 Change Display Animation (Payment)**

```tsx
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="change-display"
>
```

**Values:**
- Initial: `opacity: 0, y: -10` (invisible, 10px up)
- Animate: `opacity: 1, y: 0` (visible, normal position)

---

### **6.7 Button Hover/Tap (Universal)**

```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

**Variations:**
- Small elements: `1.02 / 0.98`
- Medium elements: `1.03 / 0.97`
- Large elements: `1.05 / 0.95`

---

### **6.8 Processing Spinner (Payment Button)**

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
>
  <CreditCard className="w-6 h-6" />
</motion.div>
```

**Values:**
- Rotate: `0 → 360` degrees
- Duration: 1 second
- Repeat: Infinite
- Easing: Linear (no acceleration)

---

### **6.9 Feedback Bar Animation**

```tsx
<motion.div
  initial={{ opacity: 0, y: -20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  className="feedback-bar"
/>
```

**Values:**
- Initial: `opacity: 0, y: -20` (invisible, 20px up)
- Animate: `opacity: 1, y: 0` (visible, normal position)
- Exit: Same as initial
- Auto-hide: 3000ms (3 seconds)

---

### **6.10 Content Margin Shift (Cart Open)**

```tsx
<motion.div 
  className="main-content"
  animate={{ 
    marginLeft: isCartOpen ? '400px' : '0px'
  }}
>
```

**Values:**
- Cart Closed: `margin-left: 0px`
- Cart Open: `margin-left: 400px`
- Duration: CSS transition (300ms by default)
- Easing: Default ease-in-out

---

### **6.11 Navigation Active Indicator**

```tsx
{isActive && (
  <motion.div
    layoutId="activeTab"
    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-l-full"
  />
)}
```

**Values:**
- `layoutId: "activeTab"` - Shared layout animation
- Automatically animates position between active items
- No manual transition needed (Framer handles it)

---

## **7. TYPOGRAPHY SYSTEM**

### **Font Families**

```css
/* Arabic Text (Default) */
font-family: 'Almarai', sans-serif
weights: 400 (normal), 700 (bold)

/* Numbers & Prices */
font-family: 'Arial', sans-serif
weights: 400 (normal), 700 (bold)

/* English Fallback */
font-family: 'Inter', sans-serif
weights: 400-800

/* Tailwind */
font-['Almarai']
font-['Arial']
font-['Inter']
```

### **Type Scale**

```css
/* Screen Titles */
text-4xl       36px    Modal main titles (rare)
text-3xl       30px    Modal titles (rare)
text-2xl       24px    Modal headers, section titles
text-xl        20px    Large prices, card titles
text-lg        18px    Medium headings, cart header
text-base      16px    Standard text, button text, input text
text-sm        14px    Small text, helper text, category pills
text-xs        12px    Labels, metadata, badge text
text-[10px]    10px    Tiny text, action bar labels, timestamps
text-[9px]     9px     Navigation sidebar labels
text-[8px]     8px     Minimal text (user name under avatar)

/* Prices (Special sizes) */
text-5xl       48px    Large total display
text-3xl       30px    Selected payment amount
```

### **Font Weights**

```css
font-normal    400     Body text, descriptions
font-bold      700     Headings, buttons, prices, emphasis
```

### **Line Heights**

```css
leading-tight     1.25    Headings, compact text
leading-normal    1.5     Body text (default)
leading-relaxed   1.625   Readable paragraphs (info text)
```

### **Text Alignment & Direction**

```css
/* RTL Context */
text-right       Default for Arabic text
dir="rtl"        Applied to containers

/* LTR Context */
text-left        For numbers, English text
dir="ltr"        Applied to input fields for numbers

/* Auto Detection */
dir="auto"       Lets browser detect based on content
```

### **Usage Map**

| Element | Class | Font | Weight |
|---------|-------|------|--------|
| Modal Title | `text-2xl font-bold font-['Almarai']` | Almarai | Bold |
| Section Header | `text-lg font-bold font-['Almarai']` | Almarai | Bold |
| Product Name | `text-base font-bold font-['Almarai']` | Almarai | Bold |
| Product Price | `text-lg font-bold font-['Arial']` | Arial | Bold |
| Large Total | `text-5xl font-bold font-['Inter']` | Inter | Bold |
| Button Text | `text-base font-bold font-['Almarai']` | Almarai | Bold |
| Action Bar Label | `text-[10px] font-bold font-['Almarai']` | Almarai | Bold |
| Helper Text | `text-sm font-['Almarai']` | Almarai | Normal |
| Timestamp | `text-xs text-[#c2c7ce] font-['Almarai']` | Almarai | Normal |
| Badge Count | `text-[10px] font-bold font-['Arial']` | Arial | Bold |

---

## **8. SHADOW SYSTEM**

### **Tailwind Shadow Scale**

```css
shadow-sm      0 1px 2px rgba(0, 0, 0, 0.05)
shadow         0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
shadow-md      0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
shadow-lg      0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
shadow-xl      0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
shadow-2xl     0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### **Custom Shadows (POS-Specific)**

```css
/* Primary Button Elevation */
shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]

/* Cart Panel Shadow */
shadow-[4px_0_24px_rgba(0,0,0,0.15)]

/* Category Pill (Active) */
shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]
```

### **Usage Map**

| Element | Shadow | Purpose |
|---------|--------|---------|
| Product Card (hover) | `shadow-lg` | Medium elevation |
| Primary Button | Custom double shadow | Strong emphasis |
| Modal Container | `shadow-2xl` | Maximum elevation |
| Cart Panel | Custom `4px 0 24px` | Side panel depth |
| Dropdown Menu | `shadow-2xl` | Floating menu |
| Navigation | `shadow-2xl` | Always-visible panel |
| Category Pill (active) | Custom double | Active state highlight |
| Feedback Bar | `shadow-lg` | Notification depth |

---

## **9. INTERACTIVE STATES**

### **9.1 Button States**

#### **Default (Rest)**
```css
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1)
color: #e2e2e6
opacity: 1
```

#### **Hover**
```css
border-color: rgba(34, 211, 238, 0.5)
/* OR */
background: rgba(255, 255, 255, 0.1)
transform: scale(1.05) /* via Framer Motion */
```

#### **Focus**
```css
outline: none
border-color: rgba(34, 211, 238, 0.5)
/* Optional ring */
box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.1)
```

#### **Active (Tap/Click)**
```css
transform: scale(0.95) /* via Framer Motion */
```

#### **Disabled**
```css
opacity: 0.5
cursor: not-allowed
pointer-events: none (optional)
/* Maintain base styles, just add opacity */
```

---

### **9.2 Input States**

#### **Default**
```css
background: rgba(255, 255, 255, 0.05)
border: 1px solid rgba(255, 255, 255, 0.1) /* or 2px for large inputs */
color: #e2e2e6
placeholder-color: #c2c7ce or #6b7280
```

#### **Focus**
```css
outline: none
border-color: #22d3ee /* Solid cyan */
/* OR */
border-color: rgba(34, 211, 238, 0.5) /* Semi-transparent cyan */
```

#### **Disabled**
```css
opacity: 0.5
cursor: not-allowed
/* Keep other styles */
```

---

### **9.3 Card States**

#### **Product Card - Default**
```css
border: 1px solid rgba(255, 255, 255, 0.1)
transform: scale(1)
```

#### **Product Card - Hover**
```css
border-color: rgba(34, 211, 238, 0.5)
box-shadow: shadow-lg
transform: scale(1.03)
```

#### **Product Card - Tap**
```css
transform: scale(0.97)
```

#### **Product Card - Disabled**
```css
opacity: 0.5
cursor: not-allowed
hover: none
```

---

### **9.4 Navigation Button States**

#### **Inactive**
```css
background: rgba(255, 255, 255, 0.05)
color: #c2c7ce
```

#### **Inactive Hover**
```css
background: rgba(255, 255, 255, 0.1)
transform: scale(1.05)
```

#### **Active**
```css
background: linear-gradient(to bottom, #22d3ee, #006399)
color: #00373a
box-shadow: shadow-lg
/* Plus active indicator bar */
```

---

### **9.5 Payment Method Card States**

#### **Default**
```css
border: 1px solid rgba(255, 255, 255, 0.1)
/* Gradient overlay at 20% opacity */
```

#### **Hover**
```css
border-color: rgba(34, 211, 238, 0.5)
/* Gradient overlay at 30% opacity */
transform: scale(1.02)
```

#### **Tap**
```css
transform: scale(0.98)
```

#### **Selected (Large card view)**
```css
border: 2px solid #22d3ee /* Solid cyan, thicker */
/* Gradient overlay at 20% opacity */
```

---

### **9.6 Transition Durations**

```css
/* Default (most elements) */
transition: all 0.3s ease-in-out

/* Fast (small interactions) */
transition: all 0.15s ease-out

/* Specific properties */
transition: border-color 0.3s, background 0.3s, opacity 0.3s

/* Tailwind */
transition-all       /* All properties, 150ms */
transition-colors    /* Colors only, 150ms */
```

---

## **10. QUICK COPY-PASTE CLASSES**

### **Glass Card (Standard)**
```tsx
className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] backdrop-blur-sm rounded-xl p-4"
```

### **Glass Card (Hover)**
```tsx
className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 hover:border-cyan-400/50 transition-all"
```

### **Primary Button**
```tsx
className="h-14 px-8 rounded-xl font-['Almarai'] font-bold text-base bg-gradient-to-b from-[#22d3ee] to-[#006399] text-[#00373a] hover:opacity-90 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
```

### **Default Button**
```tsx
className="h-12 px-6 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] font-['Almarai'] hover:border-cyan-400/50 transition-all"
```

### **Modal Backdrop**
```tsx
className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
```

### **Modal Container (Payment)**
```tsx
className="relative w-full max-w-xl max-h-full bg-[#2a2d32] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
```

### **Modal Container (Discount/Table)**
```tsx
className="bg-gradient-to-b from-[#1a1c1e] via-[#1d2222] to-[#2a2f35] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
```

### **Search Input**
```tsx
className="w-full h-12 px-4 pr-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl text-base text-[#e2e2e6] placeholder:text-[#c2c7ce] font-['Almarai'] focus:outline-none focus:border-cyan-400/50 transition-all"
```

### **Category Pill (Inactive)**
```tsx
className="px-6 py-2.5 rounded-xl text-sm font-['Almarai'] transition-all whitespace-nowrap bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#c2c7ce] hover:border-cyan-400/50"
```

### **Category Pill (Active)**
```tsx
className="bg-cyan-400 text-[#00373a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)]"
```

### **Price Text**
```tsx
className="text-lg font-['Arial'] font-bold text-cyan-400"
```

### **Large Total Text**
```tsx
className="text-5xl font-['Inter'] font-bold text-white"
```

### **Section Title**
```tsx
className="text-2xl font-['Almarai'] font-bold text-[#e2e2e6] mb-1"
```

### **Helper Text**
```tsx
className="text-sm text-[#c2c7ce] font-['Almarai']"
```

### **Vertical Divider**
```tsx
className="h-8 w-px bg-[rgba(255,255,255,0.1)]"
```

### **Horizontal Divider**
```tsx
className="border-t border-[rgba(255,255,255,0.1)] my-4"
```

### **Product Grid**
```tsx
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
```

### **2-Column Grid (Payments)**
```tsx
className="grid grid-cols-2 gap-3"
```

### **3-Column Grid (Stats)**
```tsx
className="grid grid-cols-3 gap-4"
```

### **Feedback Bar**
```tsx
className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm bg-green-500/90 text-white"
```

---

## **IMPLEMENTATION CHECKLIST**

### **When Rebuilding POS in New Architecture:**

- [ ] Copy exact background gradient: `from-[#023047] to-[#001219]`
- [ ] Use glassmorphism formula: `bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]`
- [ ] Implement z-index strategy: Sidebar & Cart (z-50), Action Bar (z-60), Modals (z-50)
- [ ] Apply product card stagger animation: `delay: index * 0.03`
- [ ] Use spring physics for cart: `damping: 30, stiffness: 300`
- [ ] Set up navigation gradients per module (16 unique gradients)
- [ ] Implement active indicator with `layoutId="activeTab"`
- [ ] Use exact shadow classes for elevation consistency
- [ ] Apply Arabic font (Almarai) for text, Arial for numbers
- [ ] Copy payment method gradients (6 unique colors)
- [ ] Use exact spacing: screen `pb-24`, sections `space-y-6`, cards `gap-4`
- [ ] Implement hover states: `scale(1.03)` on cards, `border-cyan-400/50` on buttons
- [ ] Apply disabled state: `opacity-50 cursor-not-allowed`
- [ ] Use feedback bar auto-hide: 3000ms timeout
- [ ] Copy category pill active shadow (custom double shadow)

---

## **MAINTENANCE NOTES**

1. **Do NOT change opacity values** - They're calibrated for the dark gradient background
2. **Do NOT change spring physics values** - They create the signature smooth slide feel
3. **Do NOT change stagger delay** - 30ms is optimal for perceived performance
4. **Do NOT change gradient colors** - They're brand identity
5. **Always use Almarai for Arabic, Arial for numbers** - Font switching is intentional
6. **Maintain z-index hierarchy** - Action bar MUST be above cart panel

---

## **RELATED FILES**

- `/features/pos/screens/pos-refined.screen.tsx` - Main screen
- `/features/pos/components/cart-panel.tsx` - Cart panel
- `/features/pos/components/pos-action-bar.tsx` - Action bar
- `/features/pos/components/payment-modal-redesigned.tsx` - Payment flow
- `/features/pos/components/discount-modal.tsx` - Discount selection
- `/features/pos/components/table-selector-modal-new.tsx` - Table selection
- `/components/main-navigation.tsx` - Sidebar navigation
- `/styles/globals.css` - Base styles and CSS variables

---

**END OF LEGACY POS SPECIFICATION**

This document is the SINGLE SOURCE OF TRUTH for visual design during migration.  
Preserve this specification to maintain the exact look and feel users expect.