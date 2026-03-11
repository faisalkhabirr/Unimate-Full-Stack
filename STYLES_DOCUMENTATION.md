# 🎨 Unimate - Styles Architecture Documentation

## Overview

This document provides a comprehensive guide to understanding the styling architecture of Unimate. The project uses a modular CSS approach with component-specific and page-specific stylesheets, ensuring maintainability and scalability.

---

## 📁 Style Files Organization

The project follows a clear separation of concerns with styles organized in the `src/styles/` directory:

```
src/styles/
├── Auth.css              # Login & Register pages
├── Chat.css              # Real-time messaging interface
├── CreateListing.css     # Product listing creation
├── Footer.css            # Footer component
├── FullPageLoader.css    # Loading states
├── Landing.css           # Homepage/landing page
├── Marketplace.css       # Product marketplace & listings grid
├── Messages.css          # Messages inbox
├── Modal.css             # Reusable modal dialogs
├── MyDeals.css          # User deals management
├── MyListings.css       # User listings management
├── Navbar.css           # Navigation bar
├── ProductModal.css     # Product detail modals
├── ProductPage.css      # Individual product pages
├── Profile.css          # User profile pages
├── SavedItems.css       # Saved/bookmarked items
├── Security.css         # Security settings
├── Settings.css         # User settings
└── UserProfile.css      # Public user profiles
```

**Total:** 19 CSS files, each serving a specific component or page.

---

## 🎯 Global Styles

### Base Styles (`src/index.css`)

The foundation of the design system, defining global CSS custom properties and base element styles.

#### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Typography */
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-heading: 'Outfit', 'Inter', system-ui, sans-serif;

  /* Colors */
  --text-main: #111827;
  --text-muted: #4b5563;
  --text-light: #9ca3af;
}
```

#### Key Features:
- **Reset:** Full box-sizing, margin, and padding reset
- **Typography:** Modern font stack with proper font-smoothing
- **Accessibility:** Proper line-height (1.6) and letter-spacing
- **Consistency:** Unified font-family inheritance for form elements

---

### App Container (`src/App.css`)

Minimal global app wrapper styles:

```css
#root { min-height: 100vh; }
.App { min-height: 100vh; }
html { overflow-y: scroll; }
```

---

## 🎨 Design System & Theme

### Color Palette

The project uses a consistent color palette across all components:

| Color Variable | Value | Usage |
|---------------|-------|-------|
| `--pro-accent` / `--mp-accent` | `#e7b22f` | Primary brand color (gold/yellow) |
| `--pro-accent-2` | `#5aa5a0` | Secondary brand color (teal) - used for hovers |
| `--pro-text` / `--mp-text` | `#111111` | Primary text color |
| `--pro-muted` / `--mp-muted` | `#6b7280` | Secondary/muted text |
| `--pro-border` | `rgba(17, 17, 17, 0.08)` | Light borders |
| `--pro-border-strong` | `rgba(17, 17, 17, 0.14)` | Stronger borders |
| `--pro-bg` | `#ffffff` | Background color |

**Note:** Different pages use slightly different variable naming conventions (`pro-*` for Profile, `mp-*` for Marketplace) but maintain consistent color values.

### Typography Scale

```css
/* Headings */
h1-h6: font-family: var(--font-heading); /* Outfit */
       font-weight: 700
       line-height: 1.25
       letter-spacing: -0.03em

/* Body */
body: font-family: var(--font-body); /* Inter */
      line-height: 1.6
      letter-spacing: -0.01em
```

### Spacing System

The project uses a flexible spacing system:
- **rem-based spacing:** 0.25rem increments for precise control
- **Gap utility:** CSS Grid and Flexbox gaps ranging from 0.6rem to 4rem
- **Padding:** Component padding typically ranges from 0.5rem to 2rem

---

## 🧩 Component Styles

### Navbar (`Navbar.css`)

**Key Features:**
- Sticky positioning with smooth scroll behavior
- Dynamic padding transition on scroll
- Responsive hamburger menu for mobile
- Icon buttons with hover states

**Color Scheme:**
- Primary action: `#e7b22f` (gold)
- Hover state: `#5aa5a0` (teal)
- Border: `#eaeaea`

**Responsive Breakpoints:**
- Desktop: Full horizontal menu
- Tablet/Mobile (≤900px): Hamburger menu
- Mobile (≤420px): Compact sizing

**Notable Patterns:**
```css
/* Smooth scroll transition */
.navbar.navbar-scrolled {
  padding: 4px 20px 4px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

/* Hover border indicator */
.nav-link:hover {
  border-bottom: 2px solid #5aa5a0;
}
```

---

### Landing Page (`Landing.css`)

**Structure:** Multiple sections with distinct visual styles

#### 1. Hero Section
- Grid-based layout (1.1fr 0.9fr)
- Large typography (3rem heading)
- Animated CTA button with arrow transition
- GIF/image media with rounded corners and shadow

#### 2. How It Works (E-commerce Stage)
- **Unique Pattern:** Flex cards with dynamic width on hover
- **Hover Effect:** Non-hovered cards shrink (flex: 0.85), hovered card grows (flex: 1.6)
- **Text Overlay:** Absolute positioned white box over images
- Height: 90vh for dramatic effect

```css
/* Magic hover rebalancing */
.ecom-stage__cards:hover .ecom-card:not(:hover) {
  flex: 0.85;
  filter: saturate(0.85) contrast(0.95);
}

.ecom-card:hover {
  flex: 1.6;
  transform: translateY(-4px);
}
```

#### 3. Notice Bar
- Infinite scroll marquee animation
- Background transition on hover
- `animation: marquee 35s linear infinite`

#### 4. Trust Section
- Glassmorphism effect with `backdrop-filter: blur(10px)`
- Gradient glow on hover using `::before` pseudo-element
- Cards lift on hover with shadow transition

**Responsive Design:**
- 900px: Grid → single column, text-center
- 820px: Cards stack vertically
- 640px: Reduced padding and font sizes

---

### Marketplace (`Marketplace.css`)

**Architecture:** Sidebar + Grid layout

#### Layout Structure:
```
┌─────────────────────────────────────┐
│ Search Bar + Hero Section           │
├──────────┬──────────────────────────┤
│ Filters  │  Product Grid            │
│ Sidebar  │  (3 columns)             │
│ (260px)  │                          │
└──────────┴──────────────────────────┘
```

#### Key Components:

1. **Product Grid**
   - 3 columns on desktop, responsive down to 1 column
   - Image height: 360px (contain fit)
   - Clean white background for product images
   - Action buttons below each card

2. **Filters Sidebar**
   - Checkbox rows with counts
   - Price range inputs
   - Product type options

3. **Product Cards**
   - Transparent background (minimal design)
   - Title with 2-line clamp
   - Type, title, price hierarchy
   - Action buttons (contact, save)

**Responsive Breakpoints:**
- 1100px: 3 → 2 columns
- 900px: Sidebar moves below, 2 columns
- 560px: 1 column

**Special Feature:** No-filters mode increases grid to 4 columns on wide screens

---

### Chat (`Chat.css`)

**Design Pattern:** Messenger-style interface

#### Structure:
```
┌─────────────────────────────┐
│ Header (listing info)       │
├─────────────────────────────┤
│                             │
│ Messages Area               │
│ (scrollable)                │
│                             │
├─────────────────────────────┤
│ Input Area (attach + send)  │
└─────────────────────────────┘
```

#### Message Bubbles:
- **Sender (other):** Gold background (`#e7b22f`)
- **Receiver (own):** White background
- **Media messages:** Transparent bubble with rounded image
- Avatar on left/right based on sender
- Timestamp below each message

**Key Features:**
- Deal status banner for sold items
- "Mark as Sold" button with gold styling
- File attachment support
- Real-time message rendering
- Responsive height: `calc(100vh - 270px)`

---

### Profile (`Profile.css`)

**Comprehensive user profile interface**

#### Hero Section:
- Avatar (80px, circular) with hover overlay for upload
- Bio editing inline
- Stats grid (4 columns → 2 → 1 responsive)
- Action pills and metadata display

#### Stats Cards:
```css
.pro-stat:hover {
  transform: translateY(-1px);
  border-color: rgba(90, 165, 160, 0.35);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}
```

#### Action Cards:
- Grid layout with icon, title, subtitle, chevron
- Hover lifts and changes border color
- Gold accent on hover

**Color Variables (Profile-specific):**
```css
:root {
  --pro-accent: #e7b22f;
  --pro-accent-2: #5aa5a0;
  --pro-text: #111111;
  --pro-muted: #6b7280;
}
```

---

### Auth Pages (`Auth.css`)

**Clean authentication interface**

- Centered card layout
- Gradient background: `linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)`
- Form groups with focus states
- Blue accent color (`#3498db`) for inputs
- Error message styling with light red background

**Form Input Focus:**
```css
.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
```

---

### Modal (`Modal.css`)

**Reusable modal component**

**Features:**
- Backdrop blur effect
- Slide-in animation from bottom
- Color-coded headers (danger, info, success)
- Footer with cancel/confirm actions

**Animation:**
```css
@keyframes modal-enter {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Header Variants:**
- `danger`: Red (`#ef4444`)
- `info`/`success`: Gold (`#e7b22f`)

---

## 📐 Responsive Design Strategy

### Breakpoint System

The project uses consistent breakpoints across components:

| Breakpoint | Width | Target Devices | Common Changes |
|-----------|-------|----------------|----------------|
| Desktop | >900px | Laptops, desktops | Full layouts, multi-column grids |
| Tablet | ≤900px | Tablets | Simplified grids, collapsible menus |
| Mobile | ≤560px | Phones | Single column, stacked layouts |
| Small Mobile | ≤420px | Small phones | Compact text, reduced padding |

### Common Responsive Patterns

1. **Grid Collapsing:**
   ```css
   /* Desktop */
   grid-template-columns: 1.1fr 0.9fr;
   
   /* Mobile */
   grid-template-columns: 1fr;
   ```

2. **Hamburger Menu:**
   - Desktop: Horizontal navigation
   - Mobile: Collapsible drawer menu

3. **Font Scaling:**
   - Desktop: `3rem` headings
   - Mobile: `2rem` headings

4. **Spacing Reduction:**
   - Desktop: `2rem` padding
   - Mobile: `1rem` padding

---

## 🎭 Animation & Transitions

### Common Transitions

```css
/* Button hover lift */
transform: translateY(-1px);
transition: transform 180ms ease;

/* Box shadow on hover */
box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);

/* Border color changes */
border-color: var(--pro-accent);
transition: border-color 180ms ease;
```

### Notable Animations

1. **Marquee Scroll (Landing page):**
   ```css
   animation: marquee 35s linear infinite;
   ```

2. **Modal Enter:**
   ```css
   animation: modal-enter 0.3s ease;
   ```

3. **Card Hover Effects:**
   - Transform: translateY(-4px to -6px)
   - Box shadow intensity increase
   - Border color highlights

---

## 🔧 CSS Architecture Patterns

### 1. BEM-like Naming Convention

The project uses a modified BEM (Block Element Modifier) convention:

```css
/* Block */
.mp-card { }

/* Element */
.mp-card__media { }
.mp-card__title { }

/* Modifier */
.mp-btn--primary { }
.mp-btn--danger { }
```

**Common Prefixes:**
- `mp-*` → Marketplace components
- `pro-*` → Profile components
- `chat-*` → Chat components
- `nav-*` → Navigation components
- `auth-*` → Authentication components

### 2. CSS Custom Properties (Variables)

Variables are defined at `:root` level for each major section:

```css
:root {
  --mp-text: #111111;
  --mp-accent: #e7b22f;
  /* ... */
}
```

**Benefits:**
- Easy theme customization
- Consistent color usage
- Single source of truth

### 3. Utility-First Approach

Some components use utility classes:

```css
.btn-full { width: 100%; }
.text-center { text-align: center; }
```

### 4. Glassmorphism Effect

Used in Trust section cards:

```css
@supports (backdrop-filter: blur(10px)) {
  .trust-card {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.82);
  }
}
```

### 5. Pseudo-element Effects

Glow effects using `::before`:

```css
.trust-card::before {
  content: "";
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, rgba(231, 178, 47, 0.35), ...);
  opacity: 0;
  transition: opacity 220ms ease;
}

.trust-card:hover::before {
  opacity: 1;
}
```

---

## 📝 Best Practices & Guidelines

### For Adding New Styles

1. **Create a dedicated CSS file** for each new page/component in `src/styles/`
2. **Define component-specific variables** at the top using `:root` or component class
3. **Import in the component file:**
   ```javascript
   import '../styles/ComponentName.css';
   ```

4. **Follow the naming convention:**
   - Use descriptive prefixes (`mp-`, `pro-`, `chat-`, etc.)
   - Use BEM-like structure for complex components
   - Keep class names lowercase with hyphens

5. **Maintain consistency:**
   - Use existing color variables when possible
   - Follow the spacing system (rem-based)
   - Use the same border radius values (6px, 10px, 12px, 14px, 18px)
   - Apply consistent box shadows

### Responsive Design Rules

1. **Mobile-first approach** (optional but recommended for new components)
2. **Use CSS Grid and Flexbox** for layouts
3. **Test at all breakpoints:** 420px, 560px, 900px, 1100px
4. **Avoid fixed widths** except for specific UI elements
5. **Use `gap` instead of margins** for spacing in grids/flex containers

### Performance Tips

1. **Avoid expensive operations:**
   - Limit `backdrop-filter` usage (not supported in all browsers)
   - Use `transform` for animations (GPU accelerated)
   - Avoid animating `width`, `height`, or `top/left` directly

2. **Optimize transitions:**
   - Keep durations under 300ms for UI interactions
   - Use `ease` or `ease-out` for most transitions

3. **Minimize CSS specificity:**
   - Avoid deep nesting
   - Use classes over IDs
   - Keep specificity low for easier overrides

---

## 🔍 Common Patterns Reference

### Button Styles

```css
/* Primary Button */
.btn-primary {
  background: #e7b22f;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
}

/* Outline Button */
.btn-outline {
  background: transparent;
  border: 1px solid #3f3f3f;
  padding: 10px 14px;
  border-radius: 6px;
}

/* Icon Button */
.btn-icon {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
}

.btn-icon:hover {
  background-color: #f5f5f5;
}
```

### Card Styles

```css
/* Standard Card */
.card {
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}

/* Hover Effect */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.12);
}
```

### Form Inputs

```css
input, textarea, select {
  border: 1px solid #dfe6e9;
  border-radius: 6px;
  padding: 0.875rem;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}
```

---

## 🎨 Color Usage Guidelines

### When to Use Each Color

| Color | Use Case | Examples |
|-------|----------|----------|
| `#e7b22f` (Gold) | Primary actions, CTAs, highlights | "Sell Now", "Post Listing", Active states |
| `#5aa5a0` (Teal) | Hover states, secondary actions | Link hovers, button hover transforms |
| `#111111` (Black) | Primary text, headings | All body text, card titles |
| `#6b7280` (Gray) | Secondary text, metadata | Timestamps, captions, helper text |
| `#ffffff` (White) | Backgrounds, cards | Page backgrounds, card backgrounds |

### Accessibility Considerations

- **Text contrast:** Ensure 4.5:1 contrast ratio for body text
- **Color combinations:** 
  - ✅ Black text on white background
  - ✅ White text on gold (#e7b22f)
  - ✅ Black text on teal (#5aa5a0)
- **Focus states:** Always visible, minimum 2px outline

---

## 🚀 Future Improvements & Scalability

### Potential Enhancements

1. **CSS-in-JS Migration:** Consider styled-components or Emotion for component-scoped styles
2. **Design System Package:** Extract design tokens into a shared package
3. **Dark Mode Support:** Add CSS variables for dark theme
4. **Animation Library:** Consider Framer Motion for complex animations
5. **CSS Modules:** For better scoping and avoiding naming conflicts
6. **Tailwind CSS:** Consider migrating to utility-first framework for consistency

### Maintaining Consistency

As the project grows:

1. **Document new patterns** in this file
2. **Refactor duplicate styles** into shared classes
3. **Update design tokens** when colors/spacing changes
4. **Create a component library** for reusable UI elements
5. **Regular CSS audits** to remove unused styles

---

## 📚 Related Documentation

- [STYLES_QUICK_REFERENCE.md](./docs/STYLES_QUICK_REFERENCE.md) - Quick reference for common patterns
- [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Overall project structure
- [README.md](./README.md) - Project setup and overview

---

## 🎓 Learning Resources

### Recommended Reading

1. **CSS Grid:** [CSS-Tricks Complete Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)
2. **Flexbox:** [CSS-Tricks Complete Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
3. **BEM Methodology:** [BEM Official](https://en.bem.info/methodology/)
4. **CSS Custom Properties:** [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

### Quick Start for New Developers

1. **Review `index.css`** for global styles and design tokens
2. **Study `Navbar.css`** to understand component patterns
3. **Examine `Landing.css`** for animation and layout techniques
4. **Reference `Marketplace.css`** for grid layouts
5. **Use `Modal.css`** as template for overlay components

---

**Last Updated:** 2026-01-29  
**Maintained By:** Purple Tech Team  
**Version:** 1.0.0

---

## ✅ Quick Checklist for Style Changes

Before making style changes, ensure:

- [ ] New CSS file created in `src/styles/` (if needed)
- [ ] CSS imported in component/page file
- [ ] Design tokens used where applicable
- [ ] Responsive breakpoints tested (420px, 560px, 900px, 1100px)
- [ ] Browser compatibility checked (Chrome, Firefox, Safari)
- [ ] Accessibility verified (contrast, focus states)
- [ ] Hover/active states defined for interactive elements
- [ ] Transitions/animations are smooth and performant
- [ ] Documentation updated if adding new patterns
