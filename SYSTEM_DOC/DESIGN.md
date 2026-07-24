# Pulse Design System

A comprehensive reference for the Pulse design language, components, and patterns used throughout the application.

---

## Design Philosophy

### Vision

Pulse follows a **clean, modern, and functional** design philosophy. The interface prioritizes clarity and usability over visual complexity, using a restrained color palette with the indigo primary as the single accent color. Every element earns its space — there is no decorative clutter.

### UI/UX Principles

1. **Clarity over density** — Generous whitespace and clear hierarchy make information scannable
2. **Consistent interaction patterns** — Buttons, inputs, and controls behave identically across every page
3. **Progressive disclosure** — Show what's needed, reveal details on demand (hover actions, context menus)
4. **Feedback at every step** — Hover states, focus rings, loading skeletons, and error messages ensure the user always knows what's happening
5. **Dark-first theming** — Dark mode is the primary experience; light mode is a clean alternative

### User-First Approach

- **Zero learning curve** — Standard patterns (sidebar navigation, card grids, modals) mean users familiar with any SaaS tool can navigate immediately
- **Reduced cognitive load** — Dashboard surfaces key metrics; secondary actions are tucked behind menus
- **Keyboard accessible** — All interactive elements are focusable and operable via keyboard
- **Responsive by default** — Every screen works on mobile through desktop without layout breakage

### Accessibility

- Focus-visible rings on all interactive elements (`ring-2 ring-ring ring-offset-2`)
- `aria-label` on icon-only buttons (theme toggle, menu)
- Semantic HTML (`<nav>`, `<main>`, `<header>`, `<aside>`)
- Color is never the sole indicator of state (icons and text labels always accompany color)
- Custom checkboxes use `aria-checked` and hidden native inputs for screen reader compatibility
- Modals trap focus and close on Escape
- Reduced motion support via CSS `transition-duration` kept under 300ms for most elements

### Responsive Strategy

Mobile-first with breakpoint-driven layout shifts. The sidebar collapses to an overlay on mobile; the header compresses; grid columns reduce. No horizontal scroll at any viewport.

---

## Design Language

### Visual Identity

Pulse uses a **minimalist, card-based** UI. The visual identity is defined by:

- Soft, rounded containers (`rounded-xl` / `rounded-2xl`)
- Subtle borders (`border-border` at `#e4e4e7` light / `#27272a` dark)
- Restrained use of color — indigo primary, with semantic colors only for status
- Clean typography with the Geist font family

### Theme System

Dual-theme with CSS custom properties. Theme is toggled via a `dark` class on the root element.

| Property | Light | Dark |
|---|---|---|
| `--background` | `#fafafa` | `#09090b` |
| `--foreground` | `#09090b` | `#fafafa` |
| `--card` | `#ffffff` | `#18181b` |
| `--card-foreground` | `#09090b` | `#fafafa` |
| `--primary` | `#6366f1` | `#818cf8` |
| `--primary-foreground` | `#ffffff` | `#09090b` |
| `--secondary` | `#f4f4f5` | `#27272a` |
| `--secondary-foreground` | `#18181b` | `#fafafa` |
| `--muted` | `#f4f4f5` | `#27272a` |
| `--muted-foreground` | `#71717a` | `#a1a1aa` |
| `--accent` | `#f4f4f5` | `#27272a` |
| `--accent-foreground` | `#18181b` | `#fafafa` |
| `--destructive` | `#ef4444` | `#f87171` |
| `--destructive-foreground` | `#ffffff` | `#09090b` |
| `--border` | `#e4e4e7` | `#27272a` |
| `--input` | `#e4e4e7` | `#27272a` |
| `--ring` | `#6366f1` | `#818cf8` |

### Glassmorphism

The `.glass` utility class applies a frosted-glass effect:

```
background: rgba(255, 255, 255, 0.7)    /* light */
           rgba(24, 24, 27, 0.7)        /* dark */
backdrop-filter: blur(20px)
border: 1px solid rgba(255, 255, 255, 0.3)  /* light */
        1px solid rgba(39, 39, 42, 0.5)     /* dark */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08)  /* light */
            0 8px 32px rgba(0, 0, 0, 0.3)   /* dark */
```

Used on: header (`bg-card/80 backdrop-blur-xl`), modal overlays (`bg-black/60 backdrop-blur-sm`)

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-md` | `0.375rem` (6px) | Small elements (checkboxes, badges) |
| `rounded-lg` | `0.5rem` (8px) | Buttons, inputs, nav items |
| `rounded-xl` | `0.75rem` (12px) | Cards, dropdowns, context menus, modals |
| `rounded-2xl` | `1rem` (16px) | Modal containers, large cards |
| `rounded-full` | `9999px` | Avatars, status dots, notification badges |

### Shadows

| Level | Usage |
|---|---|
| `shadow-sm` | Buttons (default state), avatar badges |
| `shadow-md` | Buttons (hover state) |
| `shadow-lg` | Cards (hover with `hover:-translate-y-0.5`), dropdowns |
| `shadow-xl` | Dropdown menus, context menus, notification panels |
| `shadow-2xl` | Modals |

### Elevation System

```
Level 0:  Cards at rest — border only, no shadow
Level 1:  Cards on hover — shadow-lg + translateY(-2px)
Level 2:  Dropdowns, sidebars — shadow-xl
Level 3:  Modals — shadow-2xl + backdrop blur overlay
Level 4:  Context menus — shadow-xl, z-[10000]
```

### Blur Effects

| Class | Value | Usage |
|---|---|---|
| `backdrop-blur-sm` | `blur(4px)` | Modal overlays, mobile sidebar overlay |
| `backdrop-blur-xl` | `blur(24px)` | Sticky header |
| `backdrop-filter: blur(20px)` | Explicit | `.glass` utility |

---

## Color System

### Primary

The primary palette is **Indigo**, used for CTAs, active states, links, and focus rings.

| Context | Light | Dark |
|---|---|---|
| Solid | `#6366f1` | `#818cf8` |
| Hover | `primary/90` | `primary/90` |
| Background tint | `primary/10` | `primary/10` |
| Focus ring | `ring-primary` | `ring-primary` |

### Semantic Colors

| Color | Light | Dark | Usage |
|---|---|---|---|
| **Success** | `emerald-500` | `emerald-400` | Online dots, "Done" status, success badges |
| **Warning** | `amber-500` | `amber-400` | "In Review" status, pinned messages, Super Admin badge |
| **Error/Destructive** | `#ef4444` | `#f87171` | Delete buttons, error states, "Urgent" priority |
| **Info** | `blue-500` | `blue-400` | "In Progress" status, links |
| **Neutral** | `zinc-100`/`zinc-700` | `zinc-800`/`zinc-300` | "To Do" status, "Low" priority |

### Badge Color Map

| Badge Variant | Background | Text |
|---|---|---|
| `default` | `bg-primary/10` | `text-primary` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` |
| `outline` | transparent | `border border-input` |
| `success` | `bg-emerald-100` / `dark:bg-emerald-900/30` | `text-emerald-700` / `dark:text-emerald-400` |
| `warning` | `bg-amber-100` / `dark:bg-amber-900/30` | `text-amber-700` / `dark:text-amber-400` |
| `destructive` | `bg-red-100` / `dark:bg-red-900/30` | `text-red-700` / `dark:text-red-400` |

### Status Colors (Tasks)

| Status | Background | Text |
|---|---|---|
| `todo` | `bg-zinc-100` / `dark:bg-zinc-800` | `text-zinc-700` / `dark:text-zinc-300` |
| `in_progress` | `bg-blue-100` / `dark:bg-blue-900/30` | `text-blue-700` / `dark:text-blue-400` |
| `in_review` | `bg-amber-100` / `dark:bg-amber-900/30` | `text-amber-700` / `dark:text-amber-400` |
| `done` | `bg-emerald-100` / `dark:bg-emerald-900/30` | `text-emerald-700` / `dark:text-emerald-400` |

### Priority Colors

| Priority | Background | Text |
|---|---|---|
| `low` | `bg-zinc-100` / `dark:bg-zinc-800` | `text-zinc-600` / `dark:text-zinc-400` |
| `medium` | `bg-blue-100` / `dark:bg-blue-900/30` | `text-blue-600` / `dark:text-blue-400` |
| `high` | `bg-orange-100` / `dark:bg-orange-900/30` | `text-orange-600` / `dark:text-orange-400` |
| `urgent` | `bg-red-100` / `dark:bg-red-900/30` | `text-red-600` / `dark:text-red-400` |

### Gradient System

| Gradient | Value | Usage |
|---|---|---|
| `.gradient-text` | `linear-gradient(135deg, #6366f1, #a855f7, #ec4899)` | Landing page headings |
| `.gradient-border` | Same gradient as `::before` pseudo-element with mask | Decorative card borders |
| Sidebar promo | `from-primary/10 to-purple-500/10` | "Upgrade to Pro" sidebar card |

---

## Typography

### Font Families

| Token | Font | Fallback |
|---|---|---|
| `--font-sans` / `--font-geist-sans` | Geist Sans | system-ui, -apple-system, sans-serif |
| `--font-mono` / `--font-geist-mono` | Geist Mono | monospace |

### Font Scale

| Class | Size | Line Height | Weight | Usage |
|---|---|---|---|---|
| `text-[9px]` | 9px | — | — | Avatar initials (xs) |
| `text-[10px]` | 10px | — | `font-medium` | Timestamps, role badges, small labels |
| `text-[11px]` | 11px | — | — | Subtle metadata |
| `text-xs` | `0.75rem` (12px) | `1rem` | `font-medium` | Descriptions, badges, helper text |
| `text-sm` | `0.875rem` (14px) | `1.25rem` | — | Body text, inputs, form labels |
| `text-sm` + `font-medium` | 14px | — | 500 | Button text, nav items, card titles |
| `text-base` | `1rem` (16px) | `1.5rem` | — | Large buttons (lg) |
| `text-lg` | `1.125rem` (18px) | `1.75rem` | `font-semibold` | Greeting text, modal titles |
| `text-lg` + `font-bold` | 18px | — | 700 | Sidebar brand name |

### Heading Hierarchy

| Element | Class | Usage |
|---|---|---|
| `h1` | `text-lg font-semibold` | Page titles (greeting area) |
| `h2` | `text-lg font-semibold` | Modal titles, card headers |
| `h3` | `text-lg font-semibold leading-none` | `CardTitle` component |
| Section headers | `text-xs font-medium text-muted-foreground uppercase tracking-wider` | Notification group labels |

### Font Rendering

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Spacing System

### Base Scale (4px grid)

| Token | Value | Common Usage |
|---|---|---|
| `p-1` / `gap-1` | 4px | Tight internal spacing |
| `p-1.5` / `gap-1.5` | 6px | Compact element spacing |
| `p-2` / `gap-2` | 8px | Standard element spacing |
| `p-2.5` / `gap-2.5` | 10px | Chat message icon gaps |
| `p-3` / `gap-3` | 12px | Sidebar nav padding, card inner spacing |
| `p-4` / `gap-4` | 16px | Standard padding, card gaps |
| `p-5` | 20px | Detail modal padding |
| `p-6` | 24px | Card header/content padding |
| `p-8` | 32px | Empty states, large spacing |

### Section Spacing

| Context | Pattern |
|---|---|
| Page content | `p-4 lg:p-6` |
| Card grid gap | `gap-4` or `gap-6` |
| Form field spacing | `space-y-4` or `space-y-5` |
| Modal body | `p-6` |
| Sidebar nav | `p-3` with `space-y-1` between items |

### Grid System

Tailwind utility grid. No custom grid system.

| Context | Classes |
|---|---|
| Dashboard stat cards | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` |
| Admin data grids | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` |
| Settings sections | `grid grid-cols-1 lg:grid-cols-3 gap-6` |
| Calendar day grid | `grid grid-cols-7 gap-0.5` |

### Container Widths

| Context | Max Width |
|---|---|
| Modal | `max-w-lg` (32rem / 512px) |
| Chat input | Full width of content area |
| DateTime picker dropdown | `w-[320px]` |
| Notification dropdown | `w-80` (320px) |
| Profile dropdown | `w-56` (224px) |
| Context menu | `w-56` (224px) |

---

## Component Design

### Buttons

**Variants:**

| Variant | Background | Text | Hover |
|---|---|---|---|
| `default` | `bg-primary` | `text-primary-foreground` | `hover:bg-primary/90 shadow-md` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | `hover:bg-secondary/80` |
| `ghost` | transparent | — | `hover:bg-accent hover:text-accent-foreground` |
| `destructive` | `bg-destructive` | `text-destructive-foreground` | `hover:bg-destructive/90` |
| `outline` | transparent | — | `border border-input hover:bg-accent` |

**Sizes:**

| Size | Height | Padding | Radius |
|---|---|---|---|
| `sm` | 32px (`h-8`) | `px-3` | `rounded-md` (6px) |
| `default` | 40px (`h-10`) | `px-4 py-2` | `rounded-lg` (8px) |
| `lg` | 44px (`h-11`) | `px-8` | `rounded-lg` (8px) |
| `icon` | 40px (`h-10 w-10`) | — | `rounded-lg` (8px) |

**Interaction:** `active:scale-[0.98]` on press, `transition-all duration-200`, focus ring `ring-2 ring-ring ring-offset-2`

### Inputs

- Height: `h-10` (40px)
- Border: `border border-input`
- Radius: `rounded-lg`
- Focus: `ring-2 ring-ring ring-offset-2`
- Error state: `border-destructive focus-visible:ring-destructive`
- Error message: `mt-1.5 text-xs text-destructive`
- Placeholder: `text-muted-foreground`
- Disabled: `opacity-50 cursor-not-allowed`
- Transition: `transition-colors`

### Selects

Same base styling as inputs. Native `<select>` with custom chevron via inline SVG `backgroundImage`. `appearance-none` with `bg-no-repeat bg-right`.

### Checkboxes

- Size: `h-[18px] w-[18px]`
- Radius: `rounded-md` (6px)
- Unchecked: `border-muted-foreground/30 bg-transparent`, hover `border-primary/50`
- Checked: `border-primary bg-primary` with white check icon
- Focus: `ring-2 ring-ring ring-offset-2`
- Animation: `scale-95` on toggle, stroke-dashoffset animation on check icon
- Label: `text-sm font-medium` with `gap-2.5` spacing

### Toggle Switches (Switches/Toggles)

Three sizes:

| Size | Track | Thumb |
|---|---|---|
| `sm` | `w-8 h-[18px]` | `h-3.5 w-3.5` |
| `md` | `w-10 h-5` | `h-4 w-4` |
| `lg` | `w-12 h-6` | `h-5 w-5` |

- Track: `rounded-full`, checked `bg-primary`, unchecked `bg-muted`
- Thumb: `rounded-full bg-white shadow-sm`, slides with `translate-x`
- Transition: `duration-200 ease-out`

### Textareas

- Min height: `min-h-[80px]`
- Same border/ring/error treatment as inputs
- `resize-none` by default
- Transition: `transition-colors`

### Cards

- Base: `rounded-xl border bg-card text-card-foreground`
- Header: `p-6` with `space-y-1.5`
- Content: `p-6 pt-0`
- Hover variant: `transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`
- Glass variant: applies `.glass` class (blur + translucent bg)

### Modals

- Overlay: `fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm`
- Container: `relative z-10 w-full max-w-lg mx-4 rounded-2xl border bg-card shadow-2xl`
- Animation: `animate-in fade-in zoom-in-95 duration-200`
- Header: `border-b px-6 py-4` with title + close button
- Body: `p-6`
- Close button: `h-8 w-8 rounded-lg hover:bg-muted`
- Body scroll locked when open (`overflow: hidden`)

### Dropdowns

- Container: `rounded-xl border bg-card shadow-xl overflow-hidden`
- Items: `px-4 py-2.5 text-sm hover:bg-muted transition-colors`
- Destructive items: `text-destructive hover:bg-destructive/5`
- Sections separated by `border-b`
- Group headers: `text-[10px] font-medium text-muted-foreground uppercase tracking-wider`

### Context Menus

- Portal-rendered (`createPortal`)
- Container: `fixed z-[10000] w-56 rounded-xl border bg-card shadow-xl py-1.5`
- Animation: `animate-in fade-in zoom-in-95 duration-100`
- Items: `px-3 py-2 text-sm` with icon + label, `gap-2.5`
- Danger items: `text-destructive hover:bg-destructive/10`
- Disabled items: `text-muted-foreground/50 cursor-not-allowed`
- Separators: `my-1 border-t`
- Viewport-aware positioning (adjusts to stay on-screen)

### Notifications (Dropdown Panel)

- Width: `w-80`
- Max height: `max-h-80 overflow-y-auto`
- Unread items: `bg-primary/5` (notifications) or `bg-amber-500/5` (announcements)
- Unread dot: `h-1.5 w-1.5 rounded-full bg-amber-500`
- Header: `font-semibold text-sm` with action links
- Items: `border-b px-4 py-3 last:border-0`

### Toasts (Sonner)

External library (`sonner`). Default toast styling from the library.

### Badges

- Container: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`
- All 6 variants listed in the Color System section above
- Transition: `transition-colors`

### Empty States

- Container: `flex flex-col items-center justify-center py-16 text-center`
- Icon container: `h-16 w-16 rounded-2xl bg-muted text-muted-foreground mb-4`
- Title: `text-lg font-semibold`
- Description: `mt-2 max-w-sm text-sm text-muted-foreground`
- Action: `mt-6`

### Skeletons

- Base: `animate-pulse rounded-lg bg-muted`
- Used for card loading, table rows, stat cards

### Progress Indicators

- **Progress Ring** (dashboard): SVG-based animated ring for completion rate
- **Stat Cards**: Numeric values with subtle background tints
- **Sidebar promo**: Gradient background card (`from-primary/10 to-purple-500/10`)

---

## Avatar System

### Sizes

| Size | Dimensions | Font Size | Badge Size | Online Dot |
|---|---|---|---|---|
| `xs` | `h-6 w-6` (24px) | `text-[9px]` | `h-2.5 w-2.5` | `h-2 w-2` |
| `sm` | `h-7 w-7` (28px) | `text-[10px]` | `h-3 w-3` | `h-2.5 w-2.5` |
| `md` | `h-9 w-9` (36px) | `text-xs` | `h-3.5 w-3.5` | `h-2.5 w-2.5` |
| `lg` | `h-11 w-11` (44px) | `text-sm` | `h-4 w-4` | `h-3 w-3` |
| `xl` | `h-14 w-14` (56px) | `text-base` | `h-5 w-5` | `h-3.5 w-3.5` |

### Default Avatars (No Image)

Deterministic color assignment based on name hash. Pool of 10 colors:

```
indigo-500, violet-500, purple-500, pink-500, rose-500,
blue-500, cyan-500, teal-500, emerald-500, amber-500
```

Color is selected by hashing the user's name character codes.

### Crown Avatars (Super Admin / Admin)

Custom inline SVG avatars with gradient backgrounds and metallic crown illustrations:

- **Super Admin**: Dark background (`#1c1917` → `#292524`), gold crown (`#fbbf24` → `#d97706`)
- **Admin**: Dark background (`#18181b` → `#27272a`), silver crown (`#e4e4e7` → `#a1a1aa`)

These render when no uploaded image is present and the user has the corresponding role.

### Role Badges

Positioned at `-top-0.5 -right-0.5` relative to the avatar. Badged placed inside a `bg-background` circular container with `shadow-sm`.

| Role | Icon | Color |
|---|---|---|
| Super Admin | `Crown` | `text-yellow-400` |
| Admin | `Crown` | `text-zinc-300` |
| Team Lead | `Crown` | `text-blue-400` |
| Other roles | No badge | — |

Badge is suppressed when the crown avatar SVG is displayed.

### Online Status

Green dot positioned at `-bottom-0.5 -right-0.5`:
```
rounded-full bg-emerald-500 ring-2 ring-background
```

### Avatar Group

- Overlapping layout with `-space-x-2`
- Each avatar has `ring-2 ring-background` for separation
- Overflow shown as `+N` in a `bg-muted` circle with matching dimensions

### Image Behavior

- Cache-busting: `src?v=${encodeURIComponent(src)}`
- Error fallback: shows initials or crown avatar on `img` error
- Object fit: `object-cover` for square crop
- Reset on src change via `useRef` tracking

---

## Chat UI

### Message Bubbles

Chat messages are **not** bubble-styled. They use a **flat, Slack-like layout**:

- Full-width rows with `px-4 py-0.5 hover:bg-muted/30`
- Avatar (left) + content (right) layout
- Grouped messages (same author, consecutive) omit the avatar and show a compact timestamp instead
- Super Admin messages get a subtle amber-tinted container:
  ```
  rounded-lg border border-amber-500/20 bg-amber-500/[0.03]
  dark:bg-amber-500/[0.06]
  ```

### Admin/Super Admin Highlights

- Super Admin messages display a badge: `bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20` with a `Shield` icon
- Admin and Super Admin users without images get the crown SVG avatar instead of initials

### Timestamp Style

- Format: relative time (`just now`, `5m ago`, `2h ago`, `3d ago`, then full date)
- Size: `text-[11px] text-muted-foreground`
- Grouped messages show timestamp in a `w-9` column: `text-[10px] text-muted-foreground font-medium leading-none pt-1`

### Edited Tag

```html
<span class="text-[10px] text-muted-foreground/60 italic">(edited)</span>
```

### Emoji Picker

Custom component. Positioned relative to the emoji button in the chat input. Toggled via button click.

### Media Previews (Attachment Renderer)

**Images:**
- `max-w-xs`, `max-h-[300px] object-cover`
- Hover overlay: `bg-black/0 group-hover:bg-black/20` with `Eye` icon
- Loading state: `bg-muted animate-pulse min-h-[120px]`
- Metadata row: `text-[10px] text-muted-foreground` — filename, size, dimensions

**Videos:**
- `max-w-sm`, native `<video>` element
- Hover overlay: `bg-black/30` with white play button (`h-12 w-12 rounded-full bg-white/90`)
- Duration badge: `absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded`

**Audio:**
- `max-w-xs`, `rounded-lg bg-muted` container
- Play button: `h-10 w-10 rounded-full bg-primary/10`
- Native `<audio controls>` element

**Documents:**
- `max-w-xs`, `rounded-lg border bg-card hover:bg-muted/50`
- Icon color by extension (PDF red, DOC blue, XLS green, PPT orange, ZIP yellow)
- File info: `text-xs font-medium` filename + `text-[10px] text-muted-foreground` size/type

### Context Menu

Portal-rendered, viewport-aware positioning. See Component Design section above.

### Reply UI

Displayed inline above the message content:
```html
<button class="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
  <Avatar size="sm" />
  <span>Replying to <strong>{name}</strong>: {truncated content}</span>
</button>
```

Reply input bar at the bottom shows the replied-to message with avatar, name, and content preview.

### Typing Indicator

- Container: `flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground`
- Bouncing dots: three `h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce` with staggered `animation-delay` (0ms, 150ms, 300ms)
- Text: `{name} is typing...` or `{name} and N others are typing...`

### Read Receipts

- **Read**: `CheckCheck` icon (double check) in `text-primary` with count, e.g. `✓✓ 3`
- **Delivered**: `Check` icon (single check) in `text-muted-foreground`
- Size: `h-3 w-3`, `text-[10px]`
- Shown only on own messages

### Chat Input

- Textarea: `rounded-xl border bg-background px-4 py-2.5 text-sm`, min `40px`, max `120px`
- Auto-resize on content change
- Enter to send (Shift+Enter for newline)
- Drag-and-drop overlay: `bg-primary/5 border-2 border-dashed border-primary rounded-xl`
- Send button: `h-10 w-10 rounded-xl bg-primary text-primary-foreground`
- Emoji button: `h-10 w-10 rounded-lg hover:bg-muted`
- Attachment button: `h-10 w-10 rounded-lg hover:bg-muted`

---

## Dashboard Layout

### Sidebar

- Width expanded: `w-64` (256px)
- Width collapsed: `w-[68px]`
- Fixed position: `fixed left-0 top-0 h-full z-50`
- Border: `border-r bg-card`
- Transition: `transition-all duration-300`
- Mobile: overlay with `bg-black/50 backdrop-blur-sm`, slides in from left
- Brand: `h-8 w-8 rounded-lg bg-primary/10` icon container + bold text
- Nav items: `rounded-lg px-3 py-2.5 text-sm font-medium`
- Active state: `bg-primary/10 text-primary`
- Inactive state: `text-muted-foreground hover:bg-muted hover:text-foreground`
- Badge (unread): `h-5 min-w-5 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground`
- Bottom promo card: gradient background, `rounded-lg p-4`

### Header

- Height: `h-16` (64px)
- Sticky: `sticky top-0 z-30`
- Background: `bg-card/80 backdrop-blur-xl`
- Border: `border-b`
- Padding: `px-4 lg:px-6`
- Theme toggle: `h-9 w-9 rounded-lg hover:bg-muted`
- Notification bell: `h-9 w-9 rounded-lg hover:bg-muted relative` with `h-4 w-4 rounded-full bg-destructive` unread badge
- Profile trigger: avatar + chevron, `rounded-lg px-2 py-1.5 hover:bg-muted`

### Content Area

- Container: `main flex-1 p-4 lg:p-6`
- Wrapped in `min-h-screen flex flex-col`
- Sidebar-aware margin: `lg:ml-64` or `lg:ml-[68px]`

### Cards

Dashboard stat cards: `rounded-xl border bg-card p-6` in a responsive grid. Hover: `transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`.

### Tables

- Container: `rounded-xl border overflow-hidden`
- Header: `bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Rows: `border-b last:border-0 hover:bg-muted/30 transition-colors`
- Cells: `px-4 py-3 text-sm`

### Analytics Widgets

- Recharts-based charts with custom colors
- Card-wrapped with headers
- Responsive: stack on mobile, grid on desktop

### Mobile Layout

- Sidebar becomes a slide-out overlay
- Header shows hamburger menu (`Menu` icon, `lg:hidden`)
- Content goes full-width
- Grids reduce to 1-2 columns
- Tables may scroll horizontally

---

## Admin Panel

### Layout

Uses the same `DashboardShell` as the user dashboard. Admin-specific navigation items appear based on permissions.

### Navigation

Admin sidebar items follow the same pattern as the user sidebar. Admin pages are nested under `/admin/`.

### Forms

All admin forms use the standard component library:
- `Input`, `Select`, `Textarea`, `Checkbox`, `Toggle`
- Wrapped in `space-y-4` or `space-y-5`
- Form sections use `Card` with `CardHeader` + `CardContent`
- Submit buttons: `Button variant="default"`
- Cancel buttons: `Button variant="outline"`

### Data Tables

Admin data tables for users, projects, tasks, etc.:
- Search bar with `Input`
- Filter dropdowns with `Select`
- Pagination controls
- Row actions via dropdown menus
- Bulk selection with checkboxes

### Audit Logs

Each audit entry displays:
- Admin name with avatar
- Action description
- Resource type and ID
- Before/after state in expandable sections
- Timestamp (relative)
- IP address and device info

### Announcements

- Form: title, message, type (info/warning/critical), target audience, expiry date
- `DateTimePicker` for expiry
- Target selectors: everyone, specific teams, roles, or users
- Active/inactive toggle
- Read tracking display

---

## Animation Guidelines

### Hover States

| Element | Transition |
|---|---|
| Buttons | `transition-all duration-200` + `active:scale-[0.98]` |
| Cards (hover variant) | `transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5` |
| Nav items | `transition-all duration-200` background color |
| Dropdown items | `transition-colors` background |
| Icon buttons | `transition-colors` color + background |

### Active States

- Button press: `active:scale-[0.98]` (subtle shrink)
- Checkbox toggle: `scale-95` animation on state change

### Focus States

- All interactive elements: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Inputs: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Checkboxes: `focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2`

### Loading States

- Skeletons: `animate-pulse rounded-lg bg-muted`
- Spinner: `animate-spin` on `Loader2` icon (Lucide)
- Shimmer effect: custom `.shimmer` class with `background-size: 200% 100%` animation

### Page Transitions

- Modal open: `animate-in fade-in zoom-in-95 duration-200`
- Dropdown open: `animate-in fade-in slide-in-from-top-2 duration-150`
- Context menu: `animate-in fade-in zoom-in-95 duration-100`
- Sidebar toggle: `transition-all duration-300` width change

### Custom Animations

| Animation | Duration | Easing | Usage |
|---|---|---|---|
| `float` | 6s infinite | `ease-in-out` | Landing page decorative elements |
| `glow` | 2s infinite alternate | `ease-in-out` | Decorative glow effect |
| `shimmer` | 1.5s infinite | — | Loading shimmer |
| `check-in` | 0.3s | `ease-out` | Checkbox check animation (stroke-dashoffset) |

### Duration Standards

| Duration | Usage |
|---|---|
| `100ms` | Context menu appearance |
| `150ms` | Dropdown slide-in |
| `200ms` | Button transitions, input focus, modal zoom |
| `300ms` | Sidebar width toggle, card hover lift, checkbox animation |

---

## Icons

### Icon Library

**Lucide React** — all icons imported from `lucide-react`.

### Icon Sizes

| Size | Class | Usage |
|---|---|---|
| Tiny | `h-2.5 w-2.5` | Role badge crown |
| Small | `h-3 w-3` | Read receipts, pin indicators, metadata |
| Medium | `h-3.5 w-3.5` | Chat action buttons, inline icons |
| Standard | `h-4 w-4` | Input icons, dropdown items, form icons |
| Medium-Large | `h-4.5 w-4.5` | Header icons (theme toggle, bell, menu) |
| Large | `h-5 w-5` | Sidebar nav icons, chat input buttons |
| XL | `h-6 h-6` | Video play button |
| XXL | `h-8 w-8` | Empty state icon container |

### Icon Spacing

- Inline with text: `gap-2` or `gap-2.5` in flex containers
- In buttons: `gap-2` between icon and label
- Standalone icon buttons: `h-9 w-9` or `h-10 w-10` centered
- Chat action buttons: `h-7 w-7` with `rounded-md`

### Icon Button Rules

- All icon-only buttons must have `aria-label` or `title`
- Minimum touch target: `h-9 w-9` (36px)
- Hover: `hover:bg-muted` or `hover:bg-accent`
- Color: `text-muted-foreground hover:text-foreground`
- Destructive actions: `hover:text-destructive`

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| **Mobile** | `< 640px` (`sm`) | Single column, sidebar as overlay, header compressed, hide greeting text |
| **Tablet** | `640px – 1024px` (`sm`–`lg`) | 2-column grids, sidebar collapsed by default, show greeting |
| **Laptop** | `1024px – 1280px` (`lg`–`xl`) | Full sidebar, 3-column grids, full header |
| **Desktop** | `1280px – 1536px` (`xl`–`2xl`) | Full sidebar, 4-column grids |
| **Large Desktop** | `> 1536px` (`2xl+`) | Same as desktop, content may be wider |

Key responsive patterns:
- `lg:hidden` / `hidden lg:flex` — sidebar toggle visibility
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — dashboard stat cards
- `p-4 lg:p-6` — content padding
- `px-4 lg:px-6` — header padding

---

## Accessibility

### Keyboard Navigation

- All interactive elements are focusable
- Tab order follows visual layout
- Modals trap focus (implied by fixed positioning and click-outside handling)
- Escape key closes modals, context menus, and dropdowns
- Enter key submits forms and sends chat messages
- Shift+Enter creates newlines in textareas

### Focus Rings

Every interactive element has visible focus:
```css
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```
- `ring-offset-2` ensures the ring is visible on both light and dark backgrounds
- `focus-visible` (not `focus`) prevents ring on mouse click

### Color Contrast

- Primary text on background: `#09090b` on `#fafafa` (18.4:1 light), `#fafafa` on `#09090b` (18.4:1 dark)
- Muted text: `#71717a` on `#fafafa` (4.6:1 light), `#a1a1aa` on `#09090b` (6.3:1 dark)
- All badge/status colors meet WCAG AA contrast requirements
- Error text `text-destructive` passes AA against both backgrounds

### Screen Reader Support

- `aria-label` on icon-only buttons
- `aria-checked` on custom checkboxes
- Semantic HTML landmarks: `<nav>`, `<main>`, `<header>`, `<aside>`
- Avatar `alt` text set to user's name
- Notification badge counts available in DOM
- `title` attributes on avatars showing name + role

### ARIA Usage

- `sr-only` class for hidden native inputs (checkboxes, toggles)
- Modal close buttons have descriptive `title`
- All form inputs have associated labels (via `label` element or `aria-label`)

---

## Design Tokens

All design tokens are defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`.

### Semantic Tokens

```css
/* Background hierarchy */
--background          /* Page background */
--card                /* Card/surface background */
--card-foreground     /* Text on cards */

/* Interactive */
--primary             /* Primary action color */
--primary-foreground  /* Text on primary */
--secondary           /* Secondary surfaces */
--secondary-foreground
--accent              /* Accent/hover surfaces */
--accent-foreground

/* Feedback */
--destructive         /* Error/delete actions */
--destructive-foreground

/* Borders & inputs */
--border              /* Default border color */
--input               /* Input border color */
--ring                /* Focus ring color */

/* Text hierarchy */
--foreground          /* Primary text */
--muted-foreground    /* Secondary/muted text */

/* Glass */
--glass-bg            /* Glassmorphism background */
--glass-border        /* Glassmorphism border */
--glass-shadow        /* Glassmorphism shadow */

/* Radius */
--radius              /* Global border radius (0.75rem) */

/* Fonts */
--font-sans           /* Primary font family */
--font-mono           /* Monospace font family */
```

### Component-Level Tokens

```css
/* Scrollbar */
::-webkit-scrollbar         { width: 6px; height: 6px; }
::-webkit-scrollbar-track   { background: transparent; }
::-webkit-scrollbar-thumb   { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }
```

---

## Future Design Guidelines

Every new component added to Pulse must follow these rules to maintain consistency:

### Component Checklist

1. **Use `cn()` utility** — All conditional classes must go through `cn()` (clsx + tailwind-merge)
2. **Support both themes** — Use CSS custom properties, never hardcoded colors (except semantic badge/status colors which have explicit dark variants)
3. **Use design tokens** — Reference `--primary`, `--muted-foreground`, etc. via Tailwind's `text-primary`, `bg-muted` utilities
4. **Include focus states** — Every interactive element needs `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
5. **Include disabled states** — `disabled:pointer-events-none disabled:opacity-50`
6. **Include hover states** — Background color shift or shadow change
7. **Include transitions** — Minimum `transition-colors` for simple changes, `transition-all duration-200` for complex
8. **Use `forwardRef`** — All form components must forward refs
9. **Set `displayName`** — Required for all forwarded-ref components
10. **Export as named export** — `export { ComponentName }`

### Naming Conventions

- Files: `kebab-case.tsx` (e.g., `date-time-picker.tsx`)
- Components: `PascalCase` (e.g., `DateTimePicker`)
- Props interface: `ComponentNameProps`
- CSS classes: Tailwind utilities only, no custom CSS except in `globals.css`

### Spacing Rules

- Component padding: follow the nearest container context (card `p-6`, modal `p-6`, sidebar `p-3`)
- Element gaps: `gap-2` for related items, `gap-3` for separated items, `gap-4` for sections
- Section spacing: `space-y-4` or `space-y-5`

### Typography Rules

- Never use `font-size` below `text-xs` (12px) except for avatar initials and timestamps
- Muted text: always `text-muted-foreground`
- Emphasis: use `font-semibold` or `font-bold`, never `text-lg` for emphasis alone
- Labels: `text-sm font-medium`
- Descriptions: `text-sm text-muted-foreground` or `text-xs text-muted-foreground`

### Layout Rules

- Cards: always `rounded-xl border bg-card`
- Modals: always `rounded-2xl border bg-card shadow-2xl` with overlay
- Dropdowns: always `rounded-xl border bg-card shadow-xl`
- No full-width buttons in forms (use `flex-1` in button groups)
- Responsive: always consider mobile first

### Animation Rules

- Default duration: `200ms` for micro-interactions
- Complex transitions: `300ms` max
- Loading: use `animate-pulse` for skeletons, `animate-spin` for spinners
- Enter animations: use `animate-in fade-in` with appropriate transform
- Never animate layout properties (width, height) — use `transform` and `opacity` instead
