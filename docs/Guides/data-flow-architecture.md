# Data Flow Architecture

> **MVP Focus**: Simple, practical guide to how data moves through the app

## Overview

This app follows a straightforward flow: User Input → Convex Database → AI APIs → Results

**IMPORTANT**: All data is stored in Convex from the start. No localStorage/sessionStorage is used for production data.

## Guided Flow Journey (Step 1 → Step 6)

### Step 1: Project Type Selection
- **Input**: User selects project type (Wedding, Birthday, etc.)
- **Storage**: Create draft project in Convex via mutation
- **Output**: Navigate to Step 2 with projectId

### Step 2: Event Details
- **Input**: Title, date, description, theme
- **Storage**: Update project in Convex database
- **Output**: Navigate to Step 2b or Step 3

### Step 2b: Photo Upload (Optional)
- **Input**: User uploads photos
- **Storage**: Upload to Convex Storage, save reference in `assets` table
- **AI Call**: None (uploaded assets stored directly)
- **Output**: Navigate to Step 3

### Step 3: Scene Builder
- **Input**: Scene prompts, durations
- **AI Call**: `fal-ai/nano-banana-pro` for image generation per scene
- **Storage**: Scene data with generated image URLs in Convex `scenes` table
- **Output**: Navigate to Step 4

### Step 4: Audio Generation
- **Input**: Music/narration preferences
- **AI Call**: 
  - Music: `fal-ai/stable-audio-25/text-to-audio` (primary) or `fal-ai/minimax-music` (fallback)
  - Narration: `fal-ai/minimax/speech-2.6-hd` (primary) or `fal-ai/minimax/speech-2.6-turbo` (fallback)
- **Storage**: Audio URLs in Convex `audioTracks` table
- **Output**: Navigate to Step 5

### Step 5: Review & Edit
- **Input**: User reviews all scenes, audio
- **Storage**: Updates to Convex via mutations
- **Output**: Navigate to Step 6

### Step 6: Video Assembly & Save
- **Input**: Final confirmation
- **AI Call**: `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` for video generation per scene
- **Process**: 
  1. Generate video for each scene
  2. Assemble final video using **Rendi API** (including cinematic xfade transitions and professional audio mixing)
  3. Save final video to Convex Storage
  4. Update project status to "completed"
- **Storage**: 
  - Convex Storage: Final video file
  - Convex DB: Project status and video metadata
- **Output**: Redirect to `/dashboard/projects`

## Data Persistence Strategy

### Production Architecture (Convex Only)
\`\`\`typescript
// All data stored in Convex from the start
// Step 1: Create draft project
const projectId = await ctx.db.insert('projects', {
  name: projectData.name,
  status: 'draft',
  userId: identity.subject,
  organizationId: identity.organizationId,
  // ... other fields
})

// Step 3: Save scenes
await ctx.db.insert('scenes', {
  projectId,
  prompt: sceneData.prompt,
  imageUrl: generatedImageUrl,
  // ... other fields
})

// Step 6: Mark complete
await ctx.db.patch(projectId, { status: 'completed' })
\`\`\`

### No localStorage/sessionStorage
**IMPORTANT**: This app does NOT use localStorage or sessionStorage for production data. All persistence is through Convex.

## Asset Upload Flow

\`\`\`
User Upload → File Input → Convex Storage API → Storage ID → Database Reference
\`\`\`

**Implementation**:
\`\`\`typescript
// 1. User selects file
<input type="file" onChange={handleUpload} />

// 2. Upload to Convex storage
const storageId = await storage.store(file)

// 3. Save reference in database
await ctx.db.insert('assets', {
  projectId,
  type: 'image',
  storageId,
  url: await storage.getUrl(storageId),
  userId: identity.subject,
})
\`\`\`

## Video Assembly Workflow

### Step 1: Scene Videos
- Generate video for each scene using `fal-ai/kling-video/v2.5-turbo/pro/image-to-video`
- Store individual scene video URLs in Convex

### Step 2: Audio Mixing (Parallel Task)
- Mix narration and music with professional audio engineering
- Implement "music ducking" and loudness normalization (-16 LUFS)
- Use **Rendi API**

### Step 3: Video Merging & Final Assembly
- Merge all scene videos using **Rendi API** with cinematic **xfade** transitions
- Perform final render by merging the merged video with the Rendi-mixed audio track
- Generate final video URL

### Step 4: Save to Database
- Upload final video to Convex Storage
- Save metadata to `videos` table
- Link to project in `projects` table
- Update project status to "completed"

## Real-Time Updates Pattern

**For Video Generation**:
\`\`\`typescript
// Subscribe to video generation status
const video = useQuery(api.videos.get, { id: videoId })

// Display progress to user
if (video.status === 'processing') {
  // Show loading state with progress
}
\`\`\`

**For Project Updates**:
\`\`\`typescript
// Subscribe to project changes
const project = useQuery(api.projects.getById, { id: projectId })

// Auto-refresh when data changes
useEffect(() => {
  // Update UI when project data changes
}, [project])
\`\`\`

## State Management Strategy

### Production (MVP)
- **Local State**: React useState for UI state only (modals, loading states)
- **Server State**: Convex queries/mutations for ALL persisted data
- **Real-time**: Convex subscriptions for live updates
- **No localStorage**: All data persists in Convex from the start

### Data Flow Pattern

\`\`\`
User Action → React Component → Convex Mutation → Database Update → 
Convex Subscription → UI Auto-Update
\`\`\`

## Error Handling Flow

\`\`\`
User Action → API Call → Error? → Retry Logic → Still Error? → Show User Message
\`\`\`

**Implementation**:
\`\`\`typescript
try {
  const result = await generateImage(prompt)
  return result
} catch (error) {
  // Retry once
  await new Promise(r => setTimeout(r, 2000))
  try {
    return await generateImage(prompt)
  } catch (retryError) {
    // Show user-friendly error
    toast.error('Failed to generate image. Please try again.')
    return null
  }
}
\`\`\`

## Quick Reference

| Data Type | Storage Location | Model Used |
|-----------|------------------|------------|
| Projects | Convex `projects` table | N/A |
| Scenes | Convex `scenes` table | `fal-ai/nano-banana-pro` |
| Assets | Convex Storage + `assets` table | N/A |
| Videos | Convex Storage + `videos` table | `fal-ai/kling-video/v2.5-turbo/pro/image-to-video` |
| Music | Convex Storage + `audioTracks` table | `fal-ai/stable-audio-25/text-to-audio` or `fal-ai/minimax-music` |
| Narration | Convex Storage + `audioTracks` table | `fal-ai/minimax/speech-2.6-hd` |
| Video Assembly | Convex Storage | Rendi API |

---

**Next Steps**: Implement Convex schema → Set up authentication → Connect AI APIs → Build guided flow
