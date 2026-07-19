# Implementation Plans

Step-by-step plans for standing up this template's backend infrastructure — the
work you do once, per project, before building your own product on top of it.

## Structure

### `/ToDo`
Contains implementation plans that have **not yet been started** or are **in progress**.

Current plans:
- `auth-implementation-plan.md` - Clerk + Convex authentication

### `/Done`
Contains implementation plans that have been **completed and deployed**.

Plans are moved here once:
- All implementation steps are complete
- Testing has been performed
- Code has been deployed to production
- Post-implementation verification is done

## Usage

1. Review plans in `/ToDo` before starting implementation
2. Follow the step-by-step instructions in each plan
3. Move completed plans to `/Done` folder
4. Update this README with completion dates

## Implementation Order

Recommended order:

1. **Clerk Authentication** - User management and security with organizations
2. **Convex Backend** - Foundation for data persistence and real-time sync

Authentication comes first: the Convex schema and its access rules are written
against an identity that already exists.

## Notes

- Each plan is designed for MVP scope - no over-complication
- Plans follow production-ready best practices
- Plans assume a solo developer workflow
