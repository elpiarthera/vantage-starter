# MyShortReel Design System

Complete design system documentation for consistent UI/UX implementation across MyShortReel.

**Last Updated**: November 2025

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Animations & Transitions](#animations--transitions)
6. [Breakpoints](#breakpoints)
7. [Usage Guidelines](#usage-guidelines)
8. [Clerk Authentication Styling](#clerk-authentication-styling)
9. [Quick Reference](#quick-reference)

---

## Color System

### Design Tokens

All colors use CSS custom properties defined in `app/globals.css` and referenced via Tailwind utilities.

#### Base Colors

\`\`\`css
--background: 207 35% 10%      /* #101a23 - Main background */
--foreground: 0 0% 100%        /* #ffffff - Primary text */
--card: 210 30% 12%            /* #182634 - Card background */
--card-foreground: 0 0% 100%   /* #ffffff - Card text */
\`\`\`

#### Semantic Colors

\`\`\`css
--primary: 207 100% 50%        /* #0d7ff2 - Blue brand color */
--primary-foreground: 0 0% 100%

--secondary: 210 25% 20%       /* #223649 - Dark blue-gray */
--secondary-foreground: 0 0% 100%

--muted: 210 25% 30%           /* #314d68 - Lighter blue-gray */
--muted-foreground: 0 0% 82%   /* #d1d5db - Muted text */

--accent: 210 25% 20%          /* #223649 - Accent blue-gray */
--accent-foreground: 0 0% 100%

--destructive: 0 84% 60%       /* Red for errors/delete */
--destructive-foreground: 0 0% 100%
\`\`\`

#### UI Elements

\`\`\`css
--border: 210 25% 20%          /* #223649 - Border color */
--input: 210 25% 20%           /* Input background */
--ring: 207 100% 50%           /* Focus ring color */
\`\`\`

### Tailwind Color Usage

\`\`\`tsx
// Background colors
<div className="bg-background">       /* Main app background */
<div className="bg-card">             /* Card backgrounds */
<div className="bg-secondary">        /* Secondary elements */
<div className="bg-muted">            /* Muted backgrounds */

// Text colors
<p className="text-foreground">       /* Primary text */
<p className="text-muted-foreground"> /* Secondary text */
<p className="text-card-foreground">  /* Text on cards */

// Button colors
<Button variant="default">            /* Primary blue */
<Button variant="secondary">          /* Dark blue-gray */
<Button variant="destructive">        /* Red */
<Button variant="ghost">              /* Transparent hover */
<Button variant="outline">            /* Bordered */
\`\`\`

### Color Usage Guidelines

1. **DO** use semantic tokens (`bg-card`, `text-foreground`) over direct colors
2. **DO** override text colors when changing backgrounds for proper contrast
3. **DON'T** use `bg-white`, `bg-black`, `text-white` directly
4. **DON'T** mix too many color variations in one section

---

## Typography

### Font Families

\`\`\`css
Primary: "Space Grotesk"   /* Headings and UI */
Fallback: "Noto Sans"      /* System fallback */
System: sans-serif         /* Ultimate fallback */
\`\`\`

Loaded from Google Fonts in `app/globals.css`:
\`\`\`css
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Noto+Sans:wght@400;500;700;900&display=swap");
\`\`\`

### Tailwind Font Classes

\`\`\`tsx
<h1 className="font-sans">  /* Space Grotesk (default) */
<code className="font-mono"> /* Monospace fonts */
\`\`\`

### Font Scales

#### Headings

\`\`\`tsx
<h1 className="text-4xl font-bold">              /* 36px - Page titles */
<h2 className="text-3xl font-semibold">          /* 30px - Section titles */
<h3 className="text-2xl font-semibold">          /* 24px - Card titles */
<h4 className="text-xl font-medium">             /* 20px - Subsection */
\`\`\`

#### Body Text

\`\`\`tsx
<p className="text-base">                        /* 16px - Standard body */
<p className="text-sm text-muted-foreground">    /* 14px - Secondary text */
<p className="text-xs text-muted-foreground">    /* 12px - Captions */
\`\`\`

### Font Weights

\`\`\`tsx
<span className="font-normal">   /* 400 - Regular text */
<span className="font-medium">   /* 500 - Emphasized text */
<span className="font-semibold"> /* 600 - Headings */
<span className="font-bold">     /* 700 - Strong emphasis */
\`\`\`

### Line Height

\`\`\`tsx
<p className="leading-normal">   /* 1.5 - Standard */
<p className="leading-relaxed">  /* 1.625 - Body text (recommended) */
<p className="leading-6">        /* 1.5rem - Fixed height */
<h1 className="leading-tight">   /* 1.25 - Headings */
\`\`\`

### Typography Best Practices

1. **DO** use `leading-relaxed` or `leading-6` for body text (improves readability)
2. **DO** use `text-balance` or `text-pretty` for headings to prevent orphans
3. **DON'T** use decorative fonts for body text or small text (<14px)
4. **DON'T** exceed 2 font families per project

---

## Spacing & Layout

### Radius System

\`\`\`css
--radius: 0.75rem  /* 12px - Base border radius */
\`\`\`

\`\`\`tsx
<div className="rounded-lg">   /* var(--radius) = 12px */
<div className="rounded-md">   /* calc(var(--radius) - 2px) = 10px */
<div className="rounded-sm">   /* calc(var(--radius) - 4px) = 8px */
<div className="rounded-full">  /* Fully rounded (pills, avatars) */
\`\`\`

### Spacing Scale

Tailwind spacing (1 unit = 0.25rem = 4px):

\`\`\`tsx
<div className="p-2">   /* 8px padding */
<div className="p-4">   /* 16px padding */
<div className="p-6">   /* 24px padding */
<div className="p-8">   /* 32px padding */
<div className="p-10">  /* 40px padding */

<div className="gap-2"> /* 8px gap between flex/grid items */
<div className="gap-4"> /* 16px gap (most common) */
<div className="gap-6"> /* 24px gap */
\`\`\`

### Layout Patterns

#### Container

\`\`\`tsx
<div className="container mx-auto px-4 md:px-6">
  {/* Centered, max-width container with responsive padding */}
</div>
\`\`\`

#### Flexbox (Primary Layout Method)

\`\`\`tsx
/* Horizontal alignment */
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="flex flex-col gap-2">

/* Responsive stacking */
<div className="flex flex-col md:flex-row gap-4">
\`\`\`

#### Grid (Complex 2D Layouts)

\`\`\`tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
<div className="grid gap-6">  /* Single column with gap */
\`\`\`

### Layout Best Practices

1. **DO** use `gap-*` for spacing between flex/grid items
2. **DO** use flexbox for most layouts (faster, simpler)
3. **DON'T** mix `margin` and `gap` on the same element
4. **DON'T** use `space-*` utilities (deprecated pattern)

---

## Components

### Button Variants

From `components/ui/button.tsx`:

\`\`\`tsx
<Button variant="default">    /* Blue primary button */
<Button variant="secondary">  /* Dark blue-gray button */
<Button variant="destructive">/* Red button (delete, cancel) */
<Button variant="outline">    /* Bordered transparent button */
<Button variant="ghost">      /* No background, hover accent */
<Button variant="link">       /* Text link style */
\`\`\`

### Button Sizes

\`\`\`tsx
<Button size="default">  /* h-10 px-4 - Standard */
<Button size="sm">       /* h-9 px-3 - Compact */
<Button size="lg">       /* h-11 px-8 - Large CTA */
<Button size="icon">     /* h-10 w-10 - Icon only */
\`\`\`

### Card Components

From `components/ui/card.tsx`:

\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
\`\`\`

### Modal/Dialog Patterns

\`\`\`tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
\`\`\`

### Empty States

\`\`\`tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="mb-4 rounded-full bg-muted p-6">
    {/* Icon */}
  </div>
  <h3 className="mb-2 text-lg font-semibold">No items yet</h3>
  <p className="mb-6 text-sm text-muted-foreground">
    Get started by creating your first item
  </p>
  <Button>Create Item</Button>
</div>
\`\`\`

### Component Best Practices

1. **DO** use shadcn/ui components from `components/ui/`
2. **DO** extend components with `className` prop
3. **DON'T** modify base components directly
4. **DON'T** create custom variants without documenting them

---

## Animations & Transitions

### Custom Animations

Defined in `app/globals.css`:

\`\`\`tsx
/* Fade in */
<div className="animate-in fade-in duration-300">

/* Slide in from directions */
<div className="animate-in slide-in-from-bottom duration-300">
<div className="animate-in slide-in-from-top duration-300">
<div className="animate-in slide-in-from-left duration-300">
<div className="animate-in slide-in-from-right duration-300">

/* Scale in */
<div className="animate-in scale-in duration-200">
\`\`\`

### Duration Control

\`\`\`tsx
<div className="duration-200">  /* 0.2s - Fast interactions */
<div className="duration-300">  /* 0.3s - Standard (default) */
<div className="duration-500">  /* 0.5s - Slower, deliberate */
\`\`\`

### Smooth Transitions

\`\`\`tsx
/* Standard transition */
<button className="transition-smooth">
  /* Transitions all properties smoothly */
</button>

/* Transform only (better performance) */
<button className="transition-transform-smooth">
  /* Transitions transforms only */
</button>
\`\`\`

### Mobile Active States

\`\`\`tsx
<button className="active:scale-98">  /* Subtle press feedback */
<button className="active:scale-95">  /* Stronger press feedback */
\`\`\`

### Animation Best Practices

1. **DO** use `transition-transform-smooth` for better performance
2. **DO** add `active:scale-*` for mobile touch feedback
3. **DON'T** animate too many properties at once
4. **DON'T** use animations longer than 500ms for UI interactions

---

## Breakpoints

### Responsive Breakpoints

\`\`\`tsx
/* Mobile-first approach */
<div className="text-sm md:text-base lg:text-lg">

/* Breakpoint values */
sm: 640px   /* Small devices (landscape phones) */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
\`\`\`

### Common Responsive Patterns

\`\`\`tsx
/* Stack on mobile, row on desktop */
<div className="flex flex-col md:flex-row gap-4">

/* Hide on mobile, show on desktop */
<div className="hidden md:block">

/* Full width on mobile, constrained on desktop */
<div className="w-full md:w-auto">

/* Grid columns */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

/* Responsive padding */
<div className="px-4 md:px-6 lg:px-8">
\`\`\`

### Mobile-First Guidelines

1. **DO** design for mobile first (320px min-width)
2. **DO** test at 320px, 375px, 768px, 1024px+ breakpoints
3. **DO** use touch-friendly sizes (min 44x44px for buttons)
4. **DON'T** hide critical content on mobile

---

## Usage Guidelines

### Design Checklist

When implementing new features:

- [ ] Uses semantic color tokens (`bg-card`, not `bg-gray-800`)
- [ ] Text is readable (proper contrast with background)
- [ ] Typography uses `leading-relaxed` or `leading-6` for body text
- [ ] Spacing uses `gap-*` for flex/grid layouts
- [ ] Mobile-first responsive design (works at 320px+)
- [ ] Touch targets are 44x44px minimum on mobile
- [ ] Uses existing shadcn/ui components where possible
- [ ] Animations are subtle and under 500ms
- [ ] Follows the Layout Method Priority (flexbox > grid > absolute)

### Common Patterns

#### Page Header

\`\`\`tsx
<div className="mb-6 md:mb-10">
  <h1 className="text-3xl font-bold md:text-4xl">Page Title</h1>
  <p className="mt-2 text-muted-foreground">
    Page description goes here
  </p>
</div>
\`\`\`

#### Two-Column Layout

\`\`\`tsx
<div className="grid gap-6 md:grid-cols-2">
  <div>Left column</div>
  <div>Right column</div>
</div>
\`\`\`

#### Form Field

\`\`\`tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" placeholder="Enter value..." />
  <p className="text-xs text-muted-foreground">
    Helper text goes here
  </p>
</div>
\`\`\`

---

## Clerk Authentication Styling

### Global Configuration

All Clerk components (`<SignIn>`, `<SignUp>`, `<UserProfile>`) are styled centrally in `app/ClientProviders.tsx`.

**✅ DO NOT** add `appearance` props to individual `<SignIn>` or `<SignUp>` components.

### Configuration Location

```tsx
// app/ClientProviders.tsx
import { dark } from '@clerk/themes';

<ClerkProvider
  appearance={{
    baseTheme: dark,
    variables: { /* Design system tokens */ },
    elements: { /* Tailwind classes */ },
  }}
>
  {children}
</ClerkProvider>
```

### Color Variable Mapping

Clerk's `variables` object uses HSL values that map directly to our design system:

```tsx
variables: {
  colorPrimary: "hsl(207 100% 50%)",        // --primary
  colorBackground: "hsl(207 35% 10%)",      // --background
  colorInputBackground: "hsl(210 30% 12%)", // --card
  colorInputText: "hsl(0 0% 100%)",         // --foreground
  colorText: "hsl(0 0% 100%)",              // --foreground
  colorTextSecondary: "hsl(0 0% 82%)",      // --muted-foreground
  colorDanger: "hsl(0 84% 60%)",            // --destructive
  borderRadius: "0.75rem",                  // --radius
  fontFamily: '"Space Grotesk", "Noto Sans", sans-serif',
}
```

### Element Class Mapping

Clerk's `elements` object uses our Tailwind design system tokens:

```tsx
elements: {
  // Cards
  card: "bg-card shadow-lg rounded-lg border border-border",
  
  // Headers
  headerTitle: "text-foreground font-bold",
  headerSubtitle: "text-muted-foreground",
  
  // Buttons
  formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] transition-smooth",
  socialButtonsBlockButton: "min-h-[44px] border-border bg-secondary hover:bg-secondary/80 text-foreground transition-smooth",
  
  // Form Fields
  formFieldInput: "min-h-[48px] bg-input border-border text-foreground placeholder:text-muted-foreground",
  formFieldLabel: "text-muted-foreground",
  
  // Links
  footerActionLink: "text-primary hover:text-primary/90 min-h-[44px] transition-smooth",
}
```

### Customization Guidelines

#### ✅ DO:
- Use design system tokens (`bg-card`, `text-foreground`)
- Maintain min-height 44px for touch targets (WCAG 2.1 AA)
- Use `transition-smooth` for interactive elements
- Keep all styling in `ClientProviders.tsx`

#### ❌ DON'T:
- Add `appearance` props to individual Clerk components
- Use hardcoded hex colors (e.g., `#0d7ff2`)
- Override global styles at page level
- Skip accessibility requirements

### Touch Target Requirements (WCAG 2.1 AA)

All interactive elements must be ≥ 44x44px:

```tsx
// Buttons
"min-h-[44px]"

// Input fields (extra height for text)
"min-h-[48px]"

// Links (with padding to reach 44px)
"min-h-[44px]"
```

### Example: Custom Auth Page

When creating custom auth pages, keep them simple:

```tsx
// ✅ GOOD: Minimal, clean page
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center md:mb-8">
          <h1 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Sign in to continue
          </p>
        </div>
        
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}

// ❌ BAD: Don't add inline appearance config
<SignIn
  appearance={{
    elements: { /* 40 lines of config */ }
  }}
/>
```

### Benefits of Centralized Styling

1. **Single Source of Truth**: Change theme once, applies everywhere
2. **Consistency**: All auth UI uses same styles
3. **Maintainability**: Easy to update colors and spacing
4. **Scalability**: Add new Clerk components with no extra config
5. **Clean Code**: Auth pages stay under 30 lines

---

## Quick Reference

### Most Common Classes

\`\`\`tsx
/* Layout */
container mx-auto px-4 md:px-6
flex items-center justify-between gap-4
grid grid-cols-1 md:grid-cols-2 gap-4

/* Typography */
text-3xl font-bold
text-sm text-muted-foreground leading-relaxed

/* Spacing */
p-6 md:p-8
gap-4
space-y-4

/* Colors */
bg-card text-card-foreground
bg-secondary hover:bg-secondary/80

/* Interactive */
transition-smooth hover:bg-accent
active:scale-98
\`\`\`

---

**Maintained By**: MyShortReel Development Team  
**Last Updated**: November 2025  
**Version**: 1.0
