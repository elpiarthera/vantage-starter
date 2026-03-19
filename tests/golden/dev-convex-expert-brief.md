# Golden — dev-convex-expert delegation brief

## Expected behavior

When delegating to `dev-convex-expert`, the brief MUST:

1. State what function/schema change is needed
2. Specify the table and fields involved
3. Include auth requirements (user-scoped vs public vs internal)
4. Mention any index requirements
5. Reference the existing schema.ts if modifying

## Example GOOD brief

```
Add a Convex mutation `createProject` in convex/projects.ts.
Schema: projects table — name (string), userId (string), status ("active"|"archived"), createdAt (number).
Auth: user-scoped (ctx.auth.getUserIdentity() required, throw if null).
Add index by_user_id on userId for the list query.
Return the new document _id.
```

## Example BAD brief (missing auth requirement)

```
Add a createProject function to Convex.
It should save project data.
```

## Anti-patterns to catch

- No auth requirement specified: agent may write insecure mutations
- No field types: agent guesses schema
- No index mention when querying by field: N+1 or full scan risk
