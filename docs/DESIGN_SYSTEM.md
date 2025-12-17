# 🎨 Design System - Complete Guide

## 📍 Access the Design System

**URL:** `/design-system` (after login)

A comprehensive showcase of all UI components, design tokens, colors, typography, spacing, icons, and charts used throughout the application.

---

## ✨ What's Included

### **1. Colors** 🎨

#### **Primary Colors**
- **Cyan 400** - `#06b6d4` - Primary accent color
- **Cyan 500** - `#0891b2` - Primary hover state
- **Cyan 600** - `#0e7490` - Primary active state

#### **Secondary Colors**
- **Purple 400** - `#a855f7` - Secondary accent
- **Purple 500** - `#9333ea` - Secondary hover
- **Blue 500** - `#3b82f6` - Alternative accent

#### **Status Colors**
- **Success** - `#22c55e` (Green)
- **Warning** - `#f59e0b` (Amber)
- **Error** - `#ef4444` (Red)
- **Info** - `#3b82f6` (Blue)

#### **Neutral Colors**
- **Background Dark** - `#001219` - Main background
- **Background Mid** - `#023047` - Gradient background
- **Surface Dark** - `#1a1c1e` - Card backgrounds
- **Surface Light** - `#2a2f35` - Lighter surfaces
- **Text Primary** - `#e2e2e6` - Main text color
- **Text Secondary** - `#c2c7ce` - Secondary text

---

### **2. Typography** 📝

#### **Font Families**
1. **Almarai** - Arabic text
   ```css
   font-family: 'Almarai'
   ```

2. **Arial** - Numbers & prices
   ```css
   font-family: 'Arial'
   ```

3. **Inter** - English text (default)
   ```css
   font-family: sans-serif
   ```

#### **Font Sizes**
- `text-xs` - 12px - Small labels
- `text-sm` - 14px - Body text (small)
- `text-base` - 16px - Default body text
- `text-lg` - 18px - Large body text
- `text-xl` - 20px - Headings (small)
- `text-2xl` - 24px - Headings (medium)
- `text-3xl` - 30px - Headings (large)

#### **Font Weights**
- `font-normal` - 400 - Regular text
- `font-medium` - 500 - Medium emphasis
- `font-semibold` - 600 - Semi-bold
- `font-bold` - 700 - Bold headings

---

### **3. Spacing** 📏

#### **Spacing Scale**
- **xs** - 4px - `p-1`
- **sm** - 8px - `p-2`
- **md** - 16px - `p-4`
- **lg** - 24px - `p-6`
- **xl** - 32px - `p-8`
- **2xl** - 48px - `p-12`

#### **Border Radius**
- `rounded` - 4px - Small corners
- `rounded-lg` - 8px - Medium corners
- `rounded-xl` - 12px - Large corners
- `rounded-full` - 9999px - Circular

---

### **4. Components** 🧩

#### **Buttons**

**Primary Button:**
```tsx
<button className="px-6 py-3 rounded-xl bg-cyan-400 text-[#00373a] font-bold hover:bg-cyan-500 transition-colors">
  Primary Button
</button>
```

**Secondary Button:**
```tsx
<button className="px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors">
  Secondary Button
</button>
```

**Outline Button:**
```tsx
<button className="px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] font-bold hover:border-cyan-400/50 transition-colors">
  Outline Button
</button>
```

**Ghost Button:**
```tsx
<button className="px-6 py-3 rounded-xl text-cyan-400 font-bold hover:bg-[rgba(6,182,212,0.1)] transition-colors">
  Ghost Button
</button>
```

**Button Sizes:**
- Small: `px-4 py-2 text-sm rounded-lg`
- Medium: `px-6 py-3 rounded-xl` (default)
- Large: `px-8 py-4 text-lg rounded-xl`

**Icon Buttons:**
```tsx
<button className="p-3 rounded-xl bg-cyan-400 text-[#00373a]">
  <Plus className="w-5 h-5" />
</button>
```

**Button with Icon:**
```tsx
<button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 text-[#00373a] font-bold">
  <Download className="w-5 h-5" />
  <span>Download</span>
</button>
```

---

#### **Input Fields**

**Default Input:**
```tsx
<input
  type="text"
  placeholder="Enter text"
  className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] placeholder:text-[#c2c7ce] focus:border-cyan-400 focus:outline-none transition-colors"
/>
```

**Textarea:**
```tsx
<textarea
  placeholder="Enter description"
  rows={4}
  className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[#e2e2e6] placeholder:text-[#c2c7ce] focus:border-cyan-400 focus:outline-none transition-colors resize-none"
/>
```

---

#### **Badges**

```tsx
{/* Primary */}
<span className="px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-400 text-sm font-bold">
  Primary
</span>

{/* Success */}
<span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
  Success
</span>

{/* Warning */}
<span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
  Warning
</span>

{/* Danger */}
<span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold">
  Danger
</span>
```

---

#### **Cards**

**Basic Card:**
```tsx
<div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
  <h3 className="font-bold text-[#e2e2e6] mb-2">Card Title</h3>
  <p className="text-[#c2c7ce]">Card content goes here</p>
</div>
```

**Gradient Card:**
```tsx
<div className="bg-gradient-to-br from-[#1a1c1e] to-[#2a2f35] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
  <h3 className="font-bold text-[#e2e2e6] mb-2">Gradient Card</h3>
  <p className="text-[#c2c7ce]">With gradient background</p>
</div>
```

**Stat Card:**
```tsx
<div className="bg-gradient-to-br from-[#1a1c1e] to-[#2a2f35] border border-[rgba(255,255,255,0.1)] rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <div className="w-12 h-12 rounded-xl bg-cyan-400/20 flex items-center justify-center">
      <DollarSign className="w-6 h-6 text-cyan-400" />
    </div>
  </div>
  <h3 className="text-sm text-[#c2c7ce] mb-2">Total Revenue</h3>
  <p className="text-3xl font-bold text-cyan-400">$45,850</p>
</div>
```

---

### **5. Icons** ✨

Using **lucide-react** icon library.

**Icon Sizes:**
- 16px - `w-4 h-4`
- 20px - `w-5 h-5` (default)
- 24px - `w-6 h-6`
- 32px - `w-8 h-8`
- 48px - `w-12 h-12`

**Common Icons:**
```tsx
import {
  Home, Users, FileText, BarChart3, Calendar,
  Mail, Phone, MapPin, Clock, DollarSign,
  ShoppingCart, Package, Truck, Settings,
  Bell, Heart, Star, Check, X, AlertCircle,
  Info, ChevronRight, Plus, Minus, Eye,
  Download, Upload, Search
} from 'lucide-react';
```

**Usage:**
```tsx
<Home className="w-5 h-5 text-cyan-400" />
```

**Icon in Container:**
```tsx
<div className="w-10 h-10 rounded-lg bg-cyan-400/20 flex items-center justify-center">
  <Package className="w-5 h-5 text-cyan-400" />
</div>
```

---

### **6. Charts** 📊

Using **recharts** library.

#### **Line Chart**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#2a2f35" />
    <XAxis dataKey="name" stroke="#c2c7ce" />
    <YAxis stroke="#c2c7ce" />
    <Tooltip contentStyle={{
      backgroundColor: '#1a1c1e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px'
    }} />
    <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

#### **Bar Chart**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#2a2f35" />
    <XAxis dataKey="name" stroke="#c2c7ce" />
    <YAxis stroke="#c2c7ce" />
    <Tooltip contentStyle={{
      backgroundColor: '#1a1c1e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px'
    }} />
    <Bar dataKey="value" fill="#a855f7" />
  </BarChart>
</ResponsiveContainer>
```

#### **Pie Chart**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie
      data={data}
      cx="50%"
      cy="50%"
      labelLine={false}
      label
      outerRadius={100}
      dataKey="value"
    >
      {data.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={entry.color} />
      ))}
    </Pie>
    <Tooltip contentStyle={{
      backgroundColor: '#1a1c1e',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px'
    }} />
  </PieChart>
</ResponsiveContainer>
```

---

## 🎯 Best Practices

### **1. Color Usage**
- Use **Cyan** for primary actions and highlights
- Use **Purple** for secondary actions
- Use **Green** for success states
- Use **Amber** for warnings
- Use **Red** for errors and destructive actions
- Use **Blue** for informational elements

### **2. Typography**
- Use **Almarai** for all Arabic text
- Use **Arial** for numbers, prices, and Arabic numerals
- Use **Inter/sans-serif** for English text
- Never mix font families in the same text block

### **3. Spacing**
- Maintain consistent spacing using Tailwind classes
- Use `gap-` for flex/grid spacing
- Use `p-` for padding
- Use `m-` for margins

### **4. Responsive Design**
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Mobile-first approach
- Test on different screen sizes

### **5. Accessibility**
- Ensure sufficient color contrast
- Use semantic HTML
- Provide focus states
- Use aria labels where needed

---

## 📦 Component Library

All components are built with:
- ✅ Tailwind CSS v4.0
- ✅ Lucide React Icons
- ✅ Recharts for data visualization
- ✅ Motion (Framer Motion) for animations
- ✅ ShadCN UI components
- ✅ RTL support (Arabic)
- ✅ Dark mode optimized

---

## 🚀 Quick Start

1. **Login** to the application
2. Navigate to `/design-system`
3. Browse through sections:
   - Colors
   - Typography
   - Spacing
   - Components
   - Icons
   - Charts
4. Copy code snippets for your components
5. Maintain consistency across the app

---

## 📝 Notes

- All colors are defined with opacity for layering
- Background gradients use `from-[#023047] to-[#001219]`
- Borders use `border-[rgba(255,255,255,0.1)]`
- Hover states use lighter opacity or color shifts
- Transitions are 200-300ms for smooth UX

---

**Status:** ✅ Complete & Production Ready

Access anytime at `/design-system` to reference components and design tokens!
