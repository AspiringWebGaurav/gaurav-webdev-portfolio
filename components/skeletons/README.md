# 🎨 Skeleton Loader System

A comprehensive, non-invasive skeleton loading system for the portfolio. This system provides smooth loading states for all components without modifying existing code.

## 📂 Structure

```
components/skeletons/
├── core/                    # Reusable skeleton primitives
│   ├── Skeleton.tsx        # Base shimmer component
│   ├── SkeletonText.tsx    # Text line skeletons
│   ├── SkeletonCircle.tsx  # Circle skeletons (avatars, icons)
│   ├── SkeletonButton.tsx  # Button skeletons
│   ├── SkeletonImage.tsx   # Image placeholders
│   ├── SkeletonCard.tsx    # Card containers
│   ├── SkeletonGlobe.tsx   # Globe animation skeleton
│   ├── SkeletonMovingBorder.tsx  # Moving border effect
│   └── SkeletonPinContainer.tsx  # 3D pin container
│
├── sections/                # Section-specific skeletons
│   ├── FloatingNavSkeleton.tsx
│   ├── HeroSkeleton.tsx
│   ├── GridSkeleton.tsx
│   ├── CurrentlyWorkingSkeleton.tsx
│   ├── RecentProjectsSkeleton.tsx
│   ├── ClientsSkeleton.tsx
│   ├── ExperienceSkeleton.tsx
│   ├── ApproachSkeleton.tsx
│   ├── FooterSkeleton.tsx
│   └── VisitorTrackerSkeleton.tsx
│
├── wrappers/                # Wrapper layer (the magic!)
│   ├── WithSkeleton.tsx    # Manual wrapper component
│   ├── withAutoSkeleton.tsx # Auto-detection HOC
│   └── SkeletonProvider.tsx # Global state provider
│
└── index.ts                # Barrel exports

hooks/
├── useComponentLoading.ts  # Loading state management
└── useSkeletonState.ts     # Skeleton visibility state
```

## 🚀 Usage

### Basic Usage (Recommended) - Pure Dynamic

Wrap any component with `WithSkeleton` for automatic, pure dynamic loading:

```tsx
import { WithSkeleton, HeroSkeleton } from '@/components/skeletons';

<WithSkeleton skeleton={<HeroSkeleton />}>
  <Hero />
</WithSkeleton>
```

**How it works:**
1. ✅ Content pre-renders invisibly (opacity: 0)
2. ✅ Skeleton shows while images/data loading
3. ✅ When ALL images loaded → instant transition
4. ✅ **NO blank screen!** Smooth fade skeleton → content
5. ✅ Pure dynamic - only shows during actual loading

### Auto-Detection (Advanced)

Use HOC for automatic loading detection:

```tsx
import { withAutoSkeleton } from '@/components/skeletons/wrappers/withAutoSkeleton';
import { HeroSkeleton } from '@/components/skeletons';

const HeroWithSkeleton = withAutoSkeleton(Hero, HeroSkeleton);

<HeroWithSkeleton />
```

### Global State Management

Wrap your app with `SkeletonProvider`:

```tsx
import { SkeletonProvider } from '@/components/skeletons';

<SkeletonProvider>
  <App />
</SkeletonProvider>
```

## 🎯 Features

### ✅ Non-Invasive
- **Zero modifications** to existing components
- Wrapper layer handles all loading logic
- Easy to add/remove without breaking code

### ✅ Automatic Detection
- Tracks component mount state
- Detects image loading
- Monitors data fetching
- Minimum display time (300ms) prevents flash

### ✅ Smooth Transitions
- 200ms fade between skeleton and content
- Shimmer animation on all skeletons
- No layout shift (CLS = 0)

### ✅ Responsive
- Works on all screen sizes
- Mobile, tablet, desktop layouts
- Matches actual component dimensions

### ✅ Production-Ready
- Error boundaries
- Fallback states
- Performance optimized
- Accessibility compliant

## 🎨 Core Components

### Skeleton
Base shimmer component with customizable size and animation:

```tsx
<Skeleton width={200} height={20} rounded="md" animation="shimmer" />
```

### SkeletonText
Text lines with size variants:

```tsx
<SkeletonText lines={3} size="lg" width="full" />
```

### SkeletonCircle
Circular placeholders for avatars and icons:

```tsx
<SkeletonCircle size="lg" />
```

### SkeletonButton
Button placeholders matching portfolio styles:

```tsx
<SkeletonButton variant="magic" size="md" />
```

### SkeletonImage
Image placeholders with aspect ratios:

```tsx
<SkeletonImage aspectRatio="video" />
```

## 🔧 Hooks

### useComponentLoading
Manages loading state with minimum display time:

```tsx
const { isLoading, setLoaded } = useComponentLoading({
  minLoadTime: 300,
  maxLoadTime: 10000,
});
```

### useSkeletonState
Controls skeleton visibility:

```tsx
const { isVisible, showSkeleton, hideSkeleton } = useSkeletonState();
```

## ⚙️ Configuration

### Timing (Pure Dynamic Mode)
- **Minimum display**: 0ms (pure dynamic - no forced delay)
- **Maximum timeout**: 10s (handles slow networks)
- **Fade transition**: 200ms
- **Image detection**: Waits for ALL images to load
- **Backup timeout**: 3s per component (prevents infinite loading)

### How Pure Dynamic Works
```tsx
1. Component mounts → skeleton shows
2. Content pre-renders invisibly (opacity: 0)
3. System detects all images in content
4. Waits for ALL images to load (img.complete)
5. When ready → instant fade skeleton → content
6. NO blank screen (content already rendered)
```

### Animations
- **Shimmer**: 2s ease-in-out infinite
- **Pulse**: 1.5s ease-in-out infinite
- **Fade**: 200ms ease-in-out

### Colors (Dark Theme)
- Background: `rgba(4, 7, 29, 1)`
- Skeleton: `rgba(255, 255, 255, 0.05)`
- Shimmer: `rgba(255, 255, 255, 0.1)`
- Borders: `rgba(255, 255, 255, 0.1)`

## 📊 Coverage

| Component | Skeleton | Status |
|-----------|----------|--------|
| FloatingNav | ✅ | Complete |
| Hero | ✅ | Complete |
| Grid (BentoGrid) | ✅ | Complete |
| CurrentlyWorking | ✅ | Complete |
| RecentProjects | ✅ | Complete |
| Clients | ✅ | Complete |
| Experience | ✅ | Complete |
| Approach | ✅ | Complete |
| Footer | ✅ | Complete |
| VisitorTracker | ✅ | Complete |

## 🎭 Examples

### Hero Section
```tsx
<WithSkeleton skeleton={<HeroSkeleton />}>
  <Hero />
</WithSkeleton>
```

### Grid Section
```tsx
<WithSkeleton skeleton={<GridSkeleton />}>
  <Grid />
</WithSkeleton>
```

### Custom Loading Control
```tsx
const [loading, setLoading] = useState(true);

<WithSkeleton skeleton={<HeroSkeleton />} loading={loading}>
  <Hero onLoad={() => setLoading(false)} />
</WithSkeleton>
```

## 🚨 Important Notes

1. **No Code Changes**: Existing components remain untouched
2. **Wrapper Only**: All logic in wrapper layer
3. **Smooth Transitions**: Automatic fade between states
4. **Performance**: Optimized for production use
5. **Accessibility**: ARIA labels and semantic HTML

## 🎯 Benefits

- ✅ Better UX - Users see structure while loading
- ✅ Perceived Performance - Feels faster
- ✅ Professional Look - Modern skeleton loaders
- ✅ No Layout Shift - Matches exact dimensions
- ✅ Easy Maintenance - Centralized logic
- ✅ Reusable - Use anywhere in the app

## 📚 Learn More

- [Skeleton UI Patterns](https://www.nngroup.com/articles/skeleton-screens/)
- [React Loading Strategies](https://react.dev/reference/react/Suspense)
- [Web Performance](https://web.dev/vitals/)

---

**Created**: December 2025
**Version**: 1.0.0
**Architecture**: Wrapper Layer Pattern
