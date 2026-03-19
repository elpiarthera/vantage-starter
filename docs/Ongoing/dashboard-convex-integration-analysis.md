# 🔴 Dashboard Convex Integration - Gap Analysis

**Date**: 2025-11-24
**Status**: ⚠️ CRITICAL - Dashboard using 100% mock data
**Priority**: P1 - High Impact

---

## 📊 Current State: What's Hardcoded

### **1. Dashboard Home (`app/dashboard/page.tsx`)**

#### ❌ **Problems:**
- Fake loading simulation with `setTimeout()`
- No actual data fetching
- Components receive NO data from parent

#### 🔍 **What Should Be Real:**
```typescript
// CURRENT (FAKE):
useEffect(() => {
  setTimeout(() => setIsLoading(false), 500);
}, []);

// SHOULD BE (REAL):
const projects = useQuery(api.projects.list);
const currentUser = useQuery(api.users.getCurrentUser);
const usage = useQuery(api.usageTracking.getUserTotalUsage, {});
```

---

### **2. Welcome Header** (`components/dashboard/home/WelcomeHeader.tsx`)

#### ✅ **What Works:**
- User name from Clerk (`useUser()`) ✅
- Displays correctly

#### ❌ **Problem:**
- `QuickStatsCards` is 100% hardcoded!

---

### **3. Quick Stats Cards** (`components/dashboard/home/QuickStatsCards.tsx`)

#### ❌ **Hardcoded Data:**
```typescript
const stats = [
  { label: "Total Projects", value: "12" },      // ← FAKE!
  { label: "Credits Remaining", value: "$150" }, // ← FAKE!
  { label: "Videos Generated", value: "24" },    // ← FAKE!
  { label: "Storage Used", value: "2.4 GB" },    // ← FAKE!
]
```

#### ✅ **Available in Convex:**
- **Total Projects**: `users.totalProjects` field ✅
- **Credits**: `usageTracking.getUserTotalUsage` → `totalCredits` ✅
- **Videos Generated**: Count `projects` with `status: "completed"` ✅
- **Storage**: Need to calculate from `assets` table (files sizes) ⚠️

---

### **4. Recent Projects** (`components/dashboard/home/RecentProjects.tsx`)

#### ❌ **Hardcoded Data:**
```typescript
const recentProjects = mockProjects.slice(0, 3); // ← FAKE!
```

#### ✅ **Available in Convex:**
```typescript
// Already exists!
const projects = useQuery(api.projects.list);
const recentProjects = projects?.slice(0, 3) || [];
```

---

### **5. Activity Feed** (`components/dashboard/home/ActivityFeed.tsx`)

#### ❌ **Hardcoded Data:**
```typescript
const recentActivities = mockActivities.slice(0, 5); // ← FAKE from lib/mock-data/activities
```

#### ⚠️ **Not Available in Convex:**
- NO activity/audit log table in schema
- NO activity tracking system
- Would need to be built OR derived from existing data

---

### **6. Projects Page** (`app/dashboard/projects/page.tsx`)

#### ❌ **Hardcoded Data:**
```typescript
const [projects, setProjects] = useState<MockProject[]>([]);

useEffect(() => {
  setTimeout(() => {
    setProjects(mockProjects);     // ← FAKE!
    setFilteredProjects(mockProjects);
  }, 500);
}, []);
```

#### ✅ **Available in Convex:**
```typescript
const projects = useQuery(api.projects.list);
```

#### ⚠️ **Filtering/Sorting:**
- Client-side filtering works but should be optimized
- Consider server-side filtering for large datasets

---

## 🎯 Available Convex Queries (Already Built)

### ✅ **Users:**
- `users.getCurrentUser` - Get authenticated user
- `users.getUserByClerkId` - Get user by Clerk ID

### ✅ **Projects:**
- `projects.list` - List all user projects (sorted by recent)
- `projects.get` - Get single project by ID
- `projects.create` - Create new project
- `projects.update` - Update project
- `projects.remove` - Delete project

### ✅ **Scenes:**
- `scenes.list` - List scenes for a project
- `scenes.get` - Get single scene
- `scenes.create` - Create scene
- `scenes.update` - Update scene
- `scenes.remove` - Delete scene
- `scenes.reorder` - Reorder scenes

### ✅ **Usage Tracking:**
- `usageTracking.getUserTotalUsage` - Get user's total credits/cost
- `usageTracking.getProjectUsage` - Get project-specific usage

### ✅ **Assets:**
- `assets.list` - List assets (with filters for project/type)
- `assets.get` - Get single asset

### ✅ **Video Status:**
- `videoStatus.getByProject` - Get video generation status

### ✅ **Chat Messages:**
- `chatMessages.list` - Get chat history for project/step

---

## 🚫 What's Missing in Convex

### **1. Activity/Audit Log** ❌
- No activity tracking table
- No historical events stored
- **Options:**
  - Build activity log system (new table + mutations)
  - Derive from existing data (projects.createdAt, scenes.createdAt, etc.)
  - Skip for MVP and show only recent projects

### **2. Storage Calculation** ⚠️
- `assets` table has `fileSize` field but not aggregated
- Need query to sum all asset sizes per user
- **Solution:** Create new query `assets.getUserStorageUsage`

### **3. Videos Generated Count** ⚠️
- No direct count of completed videos
- **Solution:** Count projects where `status === "completed"`

---

## 📝 Implementation Plan

### **Phase 1: Core Dashboard Data (Priority: P0)**

#### **Task 1.1: Dashboard Home - Real Data** (2h)
**File**: `app/dashboard/page.tsx`

**Changes:**
```typescript
// Add Convex queries
const projects = useQuery(api.projects.list);
const currentUser = useQuery(api.users.getCurrentUser);
const usage = useQuery(api.usageTracking.getUserTotalUsage, {});

// Pass data to components
<QuickStatsCards 
  totalProjects={currentUser?.totalProjects || 0}
  creditsUsed={usage?.totalCredits || 0}
  videosGenerated={projects?.filter(p => p.status === "completed").length || 0}
/>
<RecentProjects projects={projects?.slice(0, 3) || []} />
```

**QA:**
- [ ] TypeScript: No errors
- [ ] Biome: Clean
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled

---

#### **Task 1.2: Quick Stats Cards - Real Data** (1h)
**File**: `components/dashboard/home/QuickStatsCards.tsx`

**Changes:**
```typescript
interface QuickStatsCardsProps {
  totalProjects: number;
  creditsUsed: number;
  videosGenerated: number;
  storageUsed?: number; // Optional until we build storage query
}

export function QuickStatsCards({ 
  totalProjects, 
  creditsUsed, 
  videosGenerated 
}: QuickStatsCardsProps) {
  const stats = [
    { 
      icon: <FolderOpen />, 
      label: "Total Projects", 
      value: totalProjects.toString() 
    },
    { 
      icon: <CreditCard />, 
      label: "Credits Used", 
      value: creditsUsed.toFixed(0) 
    },
    { 
      icon: <Video />, 
      label: "Videos Generated", 
      value: videosGenerated.toString() 
    },
    { 
      icon: <HardDrive />, 
      label: "Storage Used", 
      value: "N/A" // TODO: Implement storage calculation
    },
  ];
  // ...
}
```

**QA:**
- [ ] TypeScript: Props typed correctly
- [ ] Biome: Clean
- [ ] Displays 0 for new users
- [ ] Formats numbers correctly

---

#### **Task 1.3: Recent Projects - Real Data** (0.5h)
**File**: `components/dashboard/home/RecentProjects.tsx`

**Changes:**
```typescript
interface RecentProjectsProps {
  projects: Array<{
    _id: string;
    name: string;
    occasion: string;
    status: string;
    // ... other fields
  }>;
}

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {projects.length === 0 ? (
        <EmptyState 
          title="No projects yet"
          description="Create your first video project"
        />
      ) : (
        projects.map((project) => (
          <Link key={project._id} href={`/dashboard/projects/${project._id}`}>
            {/* Render project card */}
          </Link>
        ))
      )}
    </div>
  );
}
```

**QA:**
- [ ] TypeScript: Props typed correctly
- [ ] Biome: Clean
- [ ] Empty state shows for new users
- [ ] Links to correct project pages

---

#### **Task 1.4: Projects Page - Real Data** (1h)
**File**: `app/dashboard/projects/page.tsx`

**Changes:**
```typescript
export default function ProjectsPage() {
  const { isMobile } = useDevice();
  const projects = useQuery(api.projects.list);
  const isLoading = projects === undefined;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // ... other filters

  // Client-side filtering
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    let filtered = [...projects];
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    return filtered;
  }, [projects, searchQuery, statusFilter]);
  
  // ...
}
```

**QA:**
- [ ] TypeScript: No errors
- [ ] Biome: Clean
- [ ] Filtering works
- [ ] Sorting works
- [ ] Search works
- [ ] Empty state shows

---

### **Phase 2: Storage & Activity (Priority: P1)**

#### **Task 2.1: Create Storage Usage Query** (1h)
**File**: `convex/assets.ts`

**New Query:**
```typescript
/**
 * Get total storage used by user
 */
export const getUserStorageUsage = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { totalBytes: 0, totalGB: 0 };
    }

    const assets = await ctx.db
      .query("assets")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    const totalBytes = assets.reduce((sum, asset) => sum + asset.fileSize, 0);
    const totalGB = totalBytes / (1024 * 1024 * 1024);

    return {
      totalBytes,
      totalGB: Number(totalGB.toFixed(2)),
      assetCount: assets.length,
    };
  },
});
```

**QA:**
- [ ] TypeScript: No errors
- [ ] Biome: Clean
- [ ] Returns 0 for users with no assets
- [ ] Calculates GB correctly
- [ ] Test with vitest

---

#### **Task 2.2: Activity Feed - Derived Data** (1.5h)
**File**: `components/dashboard/home/ActivityFeed.tsx`

**Option A: Derive from existing data**
```typescript
interface ActivityFeedProps {
  projects: Project[];
  scenes?: Scene[];
}

export function ActivityFeed({ projects }: ActivityFeedProps) {
  // Derive activities from projects
  const activities = useMemo(() => {
    return projects
      .map(p => ({
        id: p._id,
        type: "project_created",
        description: `Created project "${p.name}"`,
        timestamp: p.createdAt,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [projects]);
  
  // ...
}
```

**Option B: Build proper activity log (FUTURE - Not for this sprint)**
- Create `activities` table in schema
- Add mutations to log events
- Query recent activities
- **Time Estimate**: 4-6h (NOT RECOMMENDED FOR NOW)

**QA:**
- [ ] TypeScript: Props typed
- [ ] Biome: Clean
- [ ] Shows real project creation times
- [ ] Empty state works

---

### **Phase 3: Update Usage After Project Operations** (Priority: P2)

#### **Task 3.1: Update totalProjects Counter** (Already Done! ✅)
**File**: `convex/projects.ts`

The `create` and `remove` mutations already update `user.totalProjects`:
- Line 33-39: Increment on create ✅
- Line 228-230: Decrement on delete ✅

**No changes needed!**

---

## 🧪 Testing Strategy

### **Integration Tests**

**File**: `__tests__/integration/dashboard-data.test.tsx`
```typescript
describe("Dashboard Data Integration", () => {
  it("should fetch real user data from Convex", async () => {
    // Test currentUser query
    // Test projects.list query
    // Test usage query
  });

  it("should calculate stats correctly", () => {
    // Test QuickStatsCards calculations
  });

  it("should filter and search projects", () => {
    // Test client-side filtering
  });
});
```

### **Manual Testing Checklist**
- [ ] New user with 0 projects shows empty states
- [ ] User with projects shows real data
- [ ] Stats update after creating project
- [ ] Stats update after deleting project
- [ ] Search and filters work
- [ ] Loading states show correctly
- [ ] Error states show correctly
- [ ] Mobile responsive

---

## 📋 Summary Table: Mock → Real Data

| Component | Current State | Convex Query Available | Changes Needed |
|-----------|---------------|------------------------|----------------|
| **Dashboard Home** | Fake loading | ✅ Yes | Replace mock with queries |
| **QuickStatsCards** | 100% hardcoded | ✅ Partial | Add props, calculate stats |
| **RecentProjects** | mockProjects | ✅ Yes | Use `projects.list` |
| **ActivityFeed** | mockActivities | ⚠️ Partial | Derive from projects OR skip |
| **Projects Page** | mockProjects | ✅ Yes | Use `projects.list` |
| **Storage Stat** | Hardcoded | ❌ No | Need new query |

---

## 🎯 Recommended Approach

### **Sprint: Dashboard Real Data Integration**

**Goal**: Replace all mock data with real Convex queries

**Time Estimate**: 6-8 hours

**Tasks** (in order):
1. ✅ **Task 1.1**: Dashboard Home - Real Data (2h)
2. ✅ **Task 1.2**: Quick Stats Cards - Real Data (1h)
3. ✅ **Task 1.3**: Recent Projects - Real Data (0.5h)
4. ✅ **Task 1.4**: Projects Page - Real Data (1h)
5. ✅ **Task 2.1**: Create Storage Usage Query (1h)
6. ✅ **Task 2.2**: Activity Feed - Derived Data (1.5h)
7. ✅ **Testing**: Integration tests (1h)
8. ✅ **QA**: Biome, TypeScript, Manual testing (1h)

**Total**: 8 hours

---

## 🚨 What NOT To Do

### ❌ **Don't Build Activity Log System (Yet)**
- Complex to implement (4-6h)
- Low ROI for MVP
- Can derive activities from existing data
- **Save for future sprint**

### ❌ **Don't Add Server-Side Filtering (Yet)**
- Current dataset small enough for client-side
- Add complexity without clear benefit
- **Wait until performance issues appear**

### ❌ **Don't Touch Mock Files**
- Keep `lib/mock-data/*` for reference
- May be useful for Storybook/testing
- Delete after confirming all components work

---

## ✅ Success Metrics

After implementation:
- ✅ 0% mock data in production dashboard
- ✅ Real-time updates from Convex
- ✅ Stats accurate for all users
- ✅ Empty states for new users
- ✅ Loading states smooth
- ✅ Error handling robust
- ✅ All tests passing
- ✅ Biome clean
- ✅ TypeScript clean
- ✅ Mobile responsive

---

## 📄 Files to Modify

### **Core Files** (Must Change):
1. `app/dashboard/page.tsx`
2. `components/dashboard/home/QuickStatsCards.tsx`
3. `components/dashboard/home/RecentProjects.tsx`
4. `components/dashboard/home/ActivityFeed.tsx`
5. `app/dashboard/projects/page.tsx`
6. `convex/assets.ts` (new query)

### **Test Files** (Create):
7. `__tests__/integration/dashboard-data.test.tsx`
8. `__tests__/convex/assets.test.ts` (for storage query)

### **Files to Keep** (Reference Only):
- `lib/mock-data/projects.ts`
- `lib/mock-data/activities.ts`

---

## 🔄 Next Steps

1. **Review this analysis** with team
2. **Get approval** on approach (Activity Feed: derive vs. build)
3. **Create sprint document** in `docs/Ongoing/sprint-dashboard-real-data.md`
4. **Begin implementation** following task order
5. **Deploy incrementally** (one component at a time)
6. **Test thoroughly** before marking complete

---

**End of Analysis**

