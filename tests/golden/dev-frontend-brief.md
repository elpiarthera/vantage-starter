# Golden — dev-frontend delegation brief

## Expected behavior

When delegating to `dev-frontend`, the brief MUST:

1. State the component/page to build
2. Reference the design system (OKLCH, shadcn/ui, Tailwind)
3. Specify mobile-first requirement
4. Include any relevant file paths
5. Stay under 1000 characters (no micromanagement)

## Example GOOD brief

```
Build a UserProfile card component using shadcn/ui Card + Avatar.
Mobile-first, Tailwind OKLCH warm amber primary.
Location: components/user/UserProfileCard.tsx
Must support dark mode. Show display name, avatar, email, member since.
No "use client" unless absolutely needed.
```

## Example BAD brief (too long — micromanagement)

```
Build a UserProfile card component. Here is exactly how to do it:
1. Import Card from shadcn/ui
2. Import Avatar from shadcn/ui
3. Use cn() for conditional classes
4. The outer div should have className="rounded-lg border..."
5. The avatar should be 48px...
[...500 more chars of implementation detail...]
```

## Anti-patterns to catch

- Brief > 5000 chars: orchestrator is doing the agent's job
- No mention of design system: agent will make arbitrary choices
- Missing file path: agent has to guess
