# Performance Optimization Guide

> **Practical tips for MVP** - Speed improvements without premature optimization

## Image Optimization

### Use Next.js Image Component
\`\`\`tsx
import Image from 'next/image'

// Automatic optimization
<Image 
  src="/photo.jpg" 
  alt="Description"
  width={800}
  height={600}
  quality={75} // 75 is good balance
  priority // For above-fold images
/>
\`\`\`

### Lazy Load Images Below Fold
\`\`\`tsx
<Image 
  src="/photo.jpg" 
  alt="Description"
  width={800}
  height={600}
  loading="lazy" // Default behavior
/>
\`\`\`

### Optimize Image Sizes
\`\`\`bash
# Use appropriate image sizes
Small thumbnails: 200x200
Card images: 400x300
Full screen: 1200x800
Hero images: 1920x1080
\`\`\`

## Video Handling

### Stream, Don't Download
\`\`\`tsx
<video 
  src={videoUrl} 
  controls
  preload="metadata" // Only load metadata initially
/>
\`\`\`

### Progressive Loading
\`\`\`tsx
// Show thumbnail while video loads
<div className="relative">
  <Image src={thumbnailUrl || "/placeholder.svg"} alt="Video thumbnail" />
  {videoLoaded && <video src={videoUrl} autoPlay />}
</div>
\`\`\`

## API Calls

### Use SWR for Caching
\`\`\`typescript
import useSWR from 'swr'

function ProjectList() {
  const { data, error } = useSWR('/api/projects', fetcher, {
    revalidateOnFocus: false, // Don't refetch on tab focus
    dedupingInterval: 5000 // Cache for 5 seconds
  })
}
\`\`\`

### Debounce Search Inputs
\`\`\`typescript
import { useDebouncedCallback } from 'use-debounce'

const handleSearch = useDebouncedCallback((value) => {
  // API call here
}, 500) // Wait 500ms after user stops typing
\`\`\`

### Batch API Requests
\`\`\`typescript
// Bad: Multiple requests
const project1 = await fetch('/api/projects/1')
const project2 = await fetch('/api/projects/2')

// Good: Single batched request
const projects = await fetch('/api/projects?ids=1,2')
\`\`\`

## Convex Query Optimization

### Use Indexes
\`\`\`typescript
// Define index in schema
.index("by_user", ["userId"])

// Use index in query
.withIndex("by_user", (q) => q.eq("userId", userId))
\`\`\`

### Limit Results
\`\`\`typescript
// Get only what you need
await ctx.db
  .query("projects")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .order("desc")
  .take(10) // Only get 10 most recent
\`\`\`

### Paginate Large Lists
\`\`\`typescript
export const list = query({
  args: { 
    paginationOpts: paginationOptsValidator 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user")
      .paginate(args.paginationOpts)
  }
})
\`\`\`

## Loading States

### Skeleton Screens
\`\`\`tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <ContentList items={items} />
)}
\`\`\`

### Optimistic Updates
\`\`\`typescript
// Update UI immediately, sync later
const mutation = useMutation(api.projects.update)

function handleUpdate(data) {
  // Update local state immediately
  setLocalData(data)
  
  // Sync to server
  mutation(data).catch(() => {
    // Revert on error
    setLocalData(originalData)
  })
}
\`\`\`

## Code Splitting

### Dynamic Imports for Heavy Components
\`\`\`typescript
import dynamic from 'next/dynamic'

const VideoEditor = dynamic(() => import('@/components/VideoEditor'), {
  loading: () => <Spinner />,
  ssr: false // Don't render on server
})
\`\`\`

### Route-based Code Splitting
\`\`\`typescript
// Next.js automatically code-splits by route
// No configuration needed for MVP
\`\`\`

## Bundle Size

### Check Bundle Size
\`\`\`bash
npm run build
# Next.js shows bundle sizes automatically
\`\`\`

### Lazy Load Heavy Libraries
\`\`\`typescript
// Bad: Import on page load
import { Chart } from 'chart.js'

// Good: Import when needed
const loadChart = async () => {
  const { Chart } = await import('chart.js')
  // Use Chart
}
\`\`\`

## Caching Strategy

### Static Pages
\`\`\`typescript
// app/page.tsx - Static by default
export default function HomePage() {
  return <Home />
}
\`\`\`

### Revalidate on Interval
\`\`\`typescript
export const revalidate = 3600 // Revalidate every hour
\`\`\`

### Cache API Responses
\`\`\`typescript
// Route Handler with caching
export async function GET() {
  const data = await fetchData()
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
    }
  })
}
\`\`\`

## Real-time Optimization

### Debounce Real-time Updates
\`\`\`typescript
const debouncedUpdate = useDebouncedCallback((data) => {
  mutation(data)
}, 1000) // Save after 1 second of no changes
\`\`\`

### Batch Real-time Events
\`\`\`typescript
// Instead of sending each keystroke
// Batch updates every second
setInterval(() => {
  if (hasChanges) {
    sendUpdate(changes)
    clearChanges()
  }
}, 1000)
\`\`\`

## Performance Monitoring

### Add Performance Marks
\`\`\`typescript
performance.mark('video-generation-start')
// ... generation code
performance.mark('video-generation-end')
performance.measure(
  'video-generation',
  'video-generation-start',
  'video-generation-end'
)
\`\`\`

### Monitor Slow Queries
\`\`\`typescript
export const slowQuery = query({
  handler: async (ctx) => {
    const start = Date.now()
    const result = await ctx.db.query("projects").collect()
    const duration = Date.now() - start
    
    if (duration > 1000) {
      console.warn(`Slow query: ${duration}ms`)
    }
    
    return result
  }
})
\`\`\`

## Quick Wins Checklist

**Easy Optimizations** (Do these first):
- [ ] Use Next.js `<Image>` for all images
- [ ] Add `loading="lazy"` to below-fold content
- [ ] Use SWR for data fetching with caching
- [ ] Debounce search inputs (500ms)
- [ ] Add loading skeletons for better perceived performance
- [ ] Use Convex indexes for all queries
- [ ] Limit query results with `.take()`
- [ ] Paginate large lists

**When App Grows**:
- [ ] Dynamic imports for heavy components
- [ ] Optimize bundle size with lazy loading
- [ ] Add performance monitoring
- [ ] Implement advanced caching strategies
- [ ] Consider CDN for assets
- [ ] Database query optimization

## Performance Targets (MVP)

| Metric | Target | Good | Needs Work |
|--------|--------|------|------------|
| First Load | < 3s | < 2s | > 3s |
| Time to Interactive | < 4s | < 3s | > 4s |
| Image Load | < 2s | < 1s | > 2s |
| API Response | < 500ms | < 300ms | > 500ms |
| Query Response | < 200ms | < 100ms | > 200ms |

**Use Chrome DevTools**:
- Lighthouse for overall score
- Network tab for slow requests
- Performance tab for bottlenecks

---

**Remember**: Premature optimization is the root of all evil. Focus on user experience first, optimize when you have real performance data.
