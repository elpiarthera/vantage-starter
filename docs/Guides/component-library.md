# Component Library Reference

> **Quick reference for all custom components** - What exists and when to use it

## UI Components (shadcn/ui)

Located in: `components/ui/`

### Core Components

**button.tsx**
- Variants: default, destructive, outline, secondary, ghost, link
- Sizes: default, sm, lg, icon
\`\`\`tsx
<Button variant="default" size="default">Click Me</Button>
<Button variant="outline" size="sm">Small Outline</Button>
\`\`\`

**card.tsx**
- Components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
\`\`\`tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
\`\`\`

**dialog.tsx** - Modals
\`\`\`tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
\`\`\`

**input.tsx** - Text inputs
\`\`\`tsx
<Input type="text" placeholder="Enter text..." />
\`\`\`

**label.tsx** - Form labels
\`\`\`tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
\`\`\`

**select.tsx** - Dropdowns
\`\`\`tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
\`\`\`

**textarea.tsx** - Multi-line text
\`\`\`tsx
<Textarea placeholder="Enter description..." rows={4} />
\`\`\`

**badge.tsx** - Status indicators
\`\`\`tsx
<Badge variant="default">Active</Badge>
<Badge variant="outline">Draft</Badge>
\`\`\`

**progress.tsx** - Progress bars
\`\`\`tsx
<Progress value={60} />
\`\`\`

**slider.tsx** - Range inputs
\`\`\`tsx
<Slider value={[50]} max={100} step={1} />
\`\`\`

**switch.tsx** - Toggle switches
\`\`\`tsx
<Switch checked={enabled} onCheckedChange={setEnabled} />
\`\`\`

**tabs.tsx** - Tab navigation
\`\`\`tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content</TabsContent>
</Tabs>
\`\`\`

## Dashboard Components

Located in: `components/dashboard/`

### Layout Components

**DashboardHeader.tsx** - Top navigation bar
- Logo, navigation links, user menu
\`\`\`tsx
<DashboardHeader />
\`\`\`

**DashboardNav.tsx** - Side navigation (if implemented)

### Home Page Components

**DashboardStats.tsx** - Stats cards
\`\`\`tsx
<DashboardStats stats={statsData} />
\`\`\`

**QuickActions.tsx** - Action buttons grid
\`\`\`tsx
<QuickActions />
\`\`\`

**RecentProjects.tsx** - Recent projects list
\`\`\`tsx
<RecentProjects projects={recentProjects} />
\`\`\`

**ActivityFeed.tsx** - Activity timeline
\`\`\`tsx
<ActivityFeed activities={activities} />
\`\`\`

### Project Components

**ProjectsList.tsx** - Projects grid/list view
\`\`\`tsx
<ProjectsList projects={projects} viewMode="grid" />
\`\`\`

**ProjectCard.tsx** - Individual project card
\`\`\`tsx
<ProjectCard project={projectData} />
\`\`\`

**ProjectDetail.tsx** - Project detail page
\`\`\`tsx
<ProjectDetail project={projectData} />
\`\`\`

**ProjectTabs.tsx** - Project detail tabs
- Scenes, Assets, Audio, Share, Settings

### Scene Components

**ScenesTab.tsx** - Scenes management
\`\`\`tsx
<ScenesTab projectId={projectId} scenes={scenes} />
\`\`\`

**SceneCard.tsx** - Individual scene card
\`\`\`tsx
<SceneCard scene={sceneData} onEdit={handleEdit} />
\`\`\`

### Asset Components

**AssetsTab.tsx** - Assets management
\`\`\`tsx
<AssetsTab projectId={projectId} />
\`\`\`

**AssetCard.tsx** - Individual asset card
\`\`\`tsx
<AssetCard asset={assetData} />
\`\`\`

### Audio Components

**AudioTab.tsx** - Audio management
\`\`\`tsx
<AudioTab projectId={projectId} />
\`\`\`

**AudioPlayer.tsx** - Custom audio player
\`\`\`tsx
<AudioPlayer src={audioUrl} />
\`\`\`

### Template Components

**TemplatesList.tsx** - Templates browser
\`\`\`tsx
<TemplatesList templates={templates} />
\`\`\`

**TemplateCard.tsx** - Template card
\`\`\`tsx
<TemplateCard template={templateData} />
\`\`\`

### Account Components

**AccountTabs.tsx** - Account settings tabs
- Profile, Subscription, Usage, Notifications

## Guided Flow Components

Located in: `components/guided/`

**GuidedFlowLayout.tsx** - Layout wrapper
\`\`\`tsx
<GuidedFlowLayout step={1} totalSteps={6}>
  {/* Step content */}
</GuidedFlowLayout>
\`\`\`

**ProjectTypeCard.tsx** - Project type selector
\`\`\`tsx
<ProjectTypeCard type="wedding" onSelect={handleSelect} />
\`\`\`

**SceneBuilder.tsx** - Scene creation interface
\`\`\`tsx
<SceneBuilder scenes={scenes} onUpdate={handleUpdate} />
\`\`\`

**AudioGenerator.tsx** - Audio generation interface
\`\`\`tsx
<AudioGenerator onGenerate={handleGenerate} />
\`\`\`

**VideoPreview.tsx** - Video preview player
\`\`\`tsx
<VideoPreview videoUrl={url} />
\`\`\`

## Modal Components

Located in: `components/modals/`

**CreateProjectModal.tsx**
**DeleteProjectModal.tsx**
**ShareProjectModal.tsx**
**UploadAssetModal.tsx**
**AssetPreviewModal.tsx**
**ScenePreviewModal.tsx**

Usage pattern:
\`\`\`tsx
<CreateProjectModal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)}
  onSubmit={handleSubmit}
/>
\`\`\`

## Common Patterns

### Loading State
\`\`\`tsx
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <Spinner />
  </div>
) : (
  <Content />
)}
\`\`\`

### Empty State
\`\`\`tsx
{items.length === 0 ? (
  <EmptyState 
    icon={<FolderIcon />}
    title="No projects yet"
    description="Create your first project to get started"
    action={<Button>Create Project</Button>}
  />
) : (
  <ItemsList items={items} />
)}
\`\`\`

### Error State
\`\`\`tsx
{error ? (
  <ErrorState 
    message={error.message}
    onRetry={handleRetry}
  />
) : (
  <Content />
)}
\`\`\`

## When to Use What

| Need | Use Component |
|------|---------------|
| Action button | Button |
| Content container | Card |
| Modal dialog | Dialog |
| Form input | Input + Label |
| Dropdown selection | Select |
| Multi-line text | Textarea |
| Status indicator | Badge |
| Loading progress | Progress |
| Settings toggle | Switch |
| Multiple views | Tabs |
| Project display | ProjectCard |
| Scene editing | SceneCard |
| Asset preview | AssetCard |
| Audio playback | AudioPlayer |

---

**Tip**: All UI components are in Storybook format (if you set it up). Check component files for full prop definitions.
