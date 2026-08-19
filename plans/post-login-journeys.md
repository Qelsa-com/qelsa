# Post-login HR & candidate journeys

Wire the screens in `plans/hr-journey/` and `plans/candidate-journey/` into a real onboarding path after sign-in. Role pick already exists on `/auth`. Everything after that currently dumps both roles onto the owner profile.

## Current state

| Step | Screens | Code today |
|------|---------|------------|
| Role pick | `Here's what to focus on` | `/auth` role step saves `users.account_type` then sends everyone to `/` |
| Candidate intent | `Where are you right now?` (1/2) | Missing. Old `OnboardingFlow` goals are disabled |
| HR company | `Which company are you hiring for?` (1/4) | `/create-page` exists but is not gated after signup |
| HR hiring seat | `How do you fit into hiring?` (2/4) | No `hiring_role` field |
| HR company about | Industry + size (3/4) | Page editor has these, not in onboarding |
| HR ready | `You're ready to hire` | Missing |
| Resume parse (pre-login) | `plans/candidate-journey/Non Logged in User flow*` | Out of scope for this pass — needs a parser |

`account_type` is stored and never used to branch UI. Layout still redirects users without old goal flags to `/`, which now renders `ProfilePage` instead of onboarding.

## Target flow

```
/auth (Google or email OTP)
  └─ role: seeker | recruiter
       ├─ seeker  → /onboarding  (intent 1/2 → ready 2/2 → /jobs/smart_matches)
       └─ recruiter → /onboarding (company 1/4 → seat 2/4 → about 3/4 → ready → /jobs/posted)
```

Returning users with a username skip this. New users (no username, onboarding not marked complete) cannot leave `/onboarding` until they finish.

## Candidate — after login

1. **Where are you right now?**
   - Actively job hunting → `job_seeking_status: actively_hunting` + `find_job`
   - Exploring options → `exploring` + `explore_career`
   - Building skills for later → `building_skills` + `upskill_and_learn`
2. **You're ready to look.** CTA → smart matches.

Step 2 is not in the screenshot folder (indicator is `1 / 2`). Use a ready screen that mirrors HR so the flow has a clear end.

## HR — after login

1. **Which company are you hiring for?** Search `companies` catalog. No match → create a `pages` row with that name, no verification.
2. **How do you fit into hiring?** Founder/CXO, HR/TA, Hiring Manager, Recruitment Agency.
3. **Tell us about the company.** Industry (searchable list) + company size (catalog).
4. **You're ready to hire.** CTA → posted-jobs dashboard.

Reuse an existing page the user already owns with the same name. Otherwise insert a company `pages` record and set `users.active_page_id`.

## Data

Add to `users`:

- `job_seeking_status`: `actively_hunting | exploring | building_skills`
- `hiring_role`: `founder_cxo | hr_ta | hiring_manager | recruitment_agency`
- `active_page_id`: `Id<"pages">`
- `onboarding_completed`: boolean

Mutations in `packages/backend/convex/onboarding.ts`:

- `completeCandidateOnboarding`
- `completeHrOnboarding` (find-or-create page, patch industry/size, mark user complete)
- `searchCompanies` with prefix match for 1-character queries

Mint a unique `username` from name/email if missing so the old layout gate cannot bounce them.

## UI

Match `/auth`: dark card, ambient purple glow, `gradient-primary` continue, segmented progress, selected row with purple border + check.

- `apps/web/src/components/onboarding/OnboardingShell.tsx`
- `apps/web/src/components/onboarding/CandidateOnboarding.tsx`
- `apps/web/src/components/onboarding/HrOnboarding.tsx`
- `apps/web/src/pages/onboarding/index.tsx`

Do not wrap these in `Layout` (no nav chrome).

## Routing

- `/auth` new user → `/onboarding`
- `RouteGuard`: logged-in + needs onboarding → `/onboarding`
- Remove the goal/username redirect in `apps/web/src/layout/index.tsx`
- `needsOnboarding(user)` = has `account_type`, no `onboarding_completed`, no `username`

## Out of scope

- Resume upload/parse (non-logged-in screens)
- Recruiter vs seeker nav chrome after onboarding
- Page team roles, ownership verification, email copy of setup
- Replacing `/create-page` (keep it for adding more pages later)

## Verify

- New seeker: auth → role → intent → ready → smart matches. Refresh stays on jobs, not onboarding.
- New recruiter: company search (hit + miss) → seat → industry/size → dashboard. Page exists under `/pages`.
- Existing user with username is not forced through the wizard.
- Back on step 1 re-opens role pick without dropping the session.
