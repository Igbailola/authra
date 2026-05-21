# Authra — Reflection & Engineering Analysis

**Name:** Igbayilola Rashidat Kazeem
**Cohort:** Design to MVP Bootcamp
**Live URL:** https://authra-umber.vercel.app
**GitHub Repo:** https://github.com/Igbailola/authra

---

## Part 1 — What I Built

Authra is a standalone, production-ready authentication system built with Next.js 14, TypeScript, Prisma, and PostgreSQL. I implemented a full identity and access management layer including sign up with email verification, login with JWT session handling, forgot and reset password flows, and a protected dashboard that only verified users can access. Every feature was built with security in mind — passwords are hashed with bcrypt at 12 salt rounds, tokens expire, rate limiting blocks brute force attacks on the login endpoint, and no API response leaks sensitive user information.

## Part 2 — What Surprised Me

The hardest part was understanding how NextAuth interacts with the underlying Next.js request lifecycle. I assumed throwing a custom error inside the authorize() function would pass the message directly to the client, but NextAuth intercepts all errors and returns a generic CredentialsSignin code instead. This forced me to design my error messages at the UI layer rather than the API layer, and taught me that abstractions have opinions — you have to understand what happens beneath them to build correctly on top of them.

## Part 3 — Engineering Laws Quiz

### Q1 — Murphy's Law
**Code reference:** `app/lib/tokens.ts` lines 8-9, `app/lib/auth.ts` lines 18-35

**My Answer:** Murphy's Law forced me to add protection in two specific places. First, in `app/lib/tokens.ts`, I set a 15-minute expiry on verification tokens and a 1-hour expiry on password reset tokens. Without expiry, an intercepted token would work forever — an attacker who reads someone's email days later could still verify an account or reset a password they shouldn't control. Second, in `app/lib/auth.ts`, I added rate limiting inside the authorize() function using Upstash Redis. Without this, an attacker could run an automated script trying thousands of passwords against any email address. Murphy's Law told me: if there is no limit on login attempts, someone will write a script to exploit that gap.

**What goes wrong if ignored:** Without token expiry, stolen tokens remain valid indefinitely. Without rate limiting, brute force attacks on the login endpoint succeed eventually — it is only a matter of time and computing power.

### Q2 — Law of Leaky Abstractions
**Code reference:** `app/lib/prisma.ts`

**My Answer:** Prisma leaked on me during development. Prisma presents itself as a simple database client — you import it, call it, and it works. What it does not tell you is that in Next.js development mode, hot module replacement creates a new PrismaClient instance every time you save a file. Each instance opens its own connection pool to the database. Without the singleton pattern I implemented in `app/lib/prisma.ts`, I would have exhausted my Neon database connections within minutes of development. The abstraction — "just use Prisma" — leaked because I had to understand what was happening at the connection pool level beneath it. Prisma does not warn you about this. You only discover it when you start getting mysterious connection errors. The fix was to attach the client to `globalThis` so only one instance exists across hot reloads.

**What goes wrong if ignored:** Without the singleton, every file save in development creates a new database connection pool. You exhaust your connection limit quickly and start getting cryptic errors that have nothing to do with your actual code logic.

### Q3 — YAGNI
**Code reference:** `app/lib/auth.ts` — CredentialsProvider only, no OAuthProvider

**My Answer:** Authra uses only the CredentialsProvider in NextAuth. I deliberately did not add Google login, GitHub login, multi-factor authentication, or audit logs. YAGNI says you should not build features until they are actually required. The assessment required email and password authentication — that is what I built. Adding social login would have meant configuring OAuth credentials, handling account merging when the same email exists in both systems, and managing different session shapes. Adding MFA would have meant a TOTP library, a separate setup flow, and recovery code logic. None of that was required. Each unbuilt feature is also one fewer attack surface, one fewer dependency, and one fewer thing that can break. When social login or MFA becomes a real requirement, I can add it correctly on top of a working foundation rather than building a half-finished version of everything now.

**What goes wrong if ignored:** Building features before they are needed adds complexity, increases the chance of bugs, and slows down delivery of what actually matters. A half-implemented OAuth flow is worse than no OAuth flow — it creates confusion and potential security gaps.

### Q4 — Kerckhoffs's Principle
**Code reference:** `app/api/signup/route.ts` line — `bcrypt.hash(password, 12)`

**My Answer:** In `app/api/signup/route.ts`, I hash every password using `bcrypt.hash(password, 12)`. A salt is a random string that bcrypt generates automatically and adds to the password before hashing. This means even if two users have the exact same password, their hashes in the database look completely different. The number 12 is the salt rounds — it controls how computationally expensive the hashing is. bcrypt is intentionally slow by design, which makes brute force attacks expensive. If I had used SHA-256 instead, three things would go wrong. First, SHA-256 is fast — an attacker with a GPU can compute billions of SHA-256 hashes per second. Second, SHA-256 does not automatically salt — identical passwords produce identical hashes, so an attacker can use precomputed rainbow tables to reverse them instantly. Third, SHA-256 was designed for speed and data integrity, not password storage. Kerckhoffs's Principle applies here because the security of my system does not depend on keeping the hashing algorithm secret — it depends on the strength of bcrypt itself, which is publicly known and battle-tested.

**What goes wrong if ignored:** SHA-256 hashed passwords can be cracked in seconds using rainbow tables or GPU-accelerated brute force. A database breach would expose every user's actual password.

### Q5 — Security by Design
**Code reference:** `app/api/forgot-password/route.ts` lines — both branches return the same message

**My Answer:** In `app/api/forgot-password/route.ts`, whether the email exists in the database or not, I return the exact same response: "If an account exists with this email, you will receive a password reset link shortly." This is a deliberate security decision. If I returned "Email not found" for unregistered addresses and "Reset link sent" for registered ones, an attacker could use my forgot password endpoint as a tool to enumerate which email addresses have accounts on Authra. They could feed in thousands of emails and build a list of valid users. That list could then be used for targeted phishing attacks, credential stuffing, or sold. By returning the same message regardless of outcome, I give the attacker zero information. This is Security by Design — the system is architected to prevent information leakage at every response boundary. It also connects to the Principle of Least Privilege: the client only receives what it absolutely needs to know, which in this case is nothing about whether the email exists.

**What goes wrong if ignored:** A different response for existing versus non-existing emails turns your forgot password form into a free user enumeration tool. Attackers can silently map your entire user base without triggering any alarms.

### Q6 — The Boy Scout Rule
**Code reference:** `prisma/schema.prisma`, deleted `prisma.config.ts`

**My Answer:** When I first ran `npx prisma init`, it generated a `prisma.config.ts` file at the root of the project. This file used `dotenv/config` to read environment variables and duplicated the database URL configuration that was already handled correctly in `prisma/schema.prisma`. Having two places managing the same database connection was confusing and error-prone — if one was updated and the other was not, they could fall out of sync. I deleted `prisma.config.ts` entirely and kept the single source of truth in `prisma/schema.prisma` with `url = env("DATABASE_URL")`. I also encountered a situation where Prisma created a `.env` file alongside my existing `.env.local`. I cleaned this up immediately, keeping `.env` only for Prisma CLI commands and `.env.local` for Next.js, making the purpose of each file clear. Neither of these cleanups was part of the original plan — but leaving them would have made the codebase harder to understand and maintain.

**What goes wrong if ignored:** Duplicate configuration files create confusion about which one is the source of truth. When they fall out of sync, you get mysterious bugs that are hard to trace because the error appears in one place but the cause is in another.

### Q7 — Gall's Law
**Code reference:** `prisma/migrations/20260520162312_init/migration.sql` — the starting point

**My Answer:** Gall's Law states that a complex system that works always evolves from a simple system that worked. Authra is a direct demonstration of this. I did not start by wiring NextAuth, Resend, Upstash, and Prisma all at once. I started with the simplest possible thing — a database schema and a working connection to Neon. Only after confirming those tables existed did I add NextAuth. Only after confirming login worked did I add email verification. Only after the full auth flow worked did I add rate limiting. Each phase built on a confirmed working foundation. When bugs appeared — like the Prisma version conflict, the missing `prisma.config.ts`, or the `useSearchParams` prerender error on Vercel — I knew exactly which layer had broken because I had introduced only one thing at a time. If I had tried to build all six phases simultaneously, a bug in the database connection would have looked like a NextAuth bug, a NextAuth bug would have looked like a Resend bug, and I would have had no reliable way to isolate the problem.

**What goes wrong if ignored:** Building everything at once means bugs from multiple layers overlap. You cannot isolate what is broken because everything is broken at the same time. Debugging becomes guesswork rather than systematic elimination.

### Q8 — Leaky Abstractions (ORM)
**Code reference:** `prisma/schema.prisma` — VerificationToken model with `@@unique([identifier, token])`

**My Answer:** In my Prisma schema, the `VerificationToken` model has this line: `@@unique([identifier, token])`. In Prisma, this looks like a simple uniqueness constraint on the model. What it actually generates in PostgreSQL is a composite index: `CREATE UNIQUE INDEX ON "VerificationToken"("identifier", "token")`. These are not the same thing conceptually. Prisma abstracts database indexes behind model-level decorators, but the actual database structure is a separate index object that affects query performance and storage. Another example is the `@default(cuid())` on User IDs — in Prisma this looks like a model property, but in the actual database the default value is not set at the database level. Prisma generates the cuid in application code before inserting, meaning if you bypassed Prisma and inserted directly into PostgreSQL, you would need to generate the ID yourself. The abstraction leaks — you need to understand what SQL Prisma is actually generating to build correctly and avoid surprises when querying the database directly.

**What goes wrong if ignored:** If you assume Prisma's model is identical to the database table, you will be surprised when direct SQL queries behave differently, when migrations fail unexpectedly, or when performance is poor because you did not understand which indexes were actually created.

### Q9 — Zawinski's Law
**Code reference:** `app/lib/ratelimit.ts`, `app/lib/auth.ts`

**My Answer:** Zawinski's Law says every program attempts to expand until it can read email. The deeper point is that applications grow beyond their original purpose when developers keep adding features without discipline. Rate limiting is not part of Next.js or NextAuth — both tools do one thing well and stop there. Next.js handles routing and rendering. NextAuth handles session management. Neither tries to be a security middleware framework. This demonstrates the Single Responsibility Principle — each tool has one job. When I needed rate limiting, I had to add it deliberately as a separate concern using Upstash Redis and the `@upstash/ratelimit` package. I wired it into the authorize function in `app/lib/auth.ts` myself. This is the correct approach — security hardening is a separate responsibility from authentication logic, and it should be added intentionally, not expected to appear magically from a framework. Zawinski's Law warns what happens when this discipline breaks down: frameworks that try to do everything become bloated, unpredictable, and hard to maintain. NextAuth stays focused. I added rate limiting on top of it, keeping the responsibilities separate and clear.

**What goes wrong if ignored:** Without deliberately adding rate limiting, the login endpoint has no brute force protection. An attacker can try unlimited password combinations. The framework will never add this for you automatically. 

### Q10 — Principle of Least Surprise
**Code reference:** `app/login/page.tsx` — `setError("Invalid email or password")`

**My Answer:** When a user enters wrong credentials in Authra, the login page shows exactly this message: "Invalid email or password." I chose this specific wording for two reasons. First, it follows the Principle of Least Surprise — users expect a clear, calm message that tells them something went wrong with their credentials without being alarming or technical. A message like "CredentialsSignin error code 401" would be surprising and confusing to a regular user. Second, the combined wording "email or password" is a deliberate security decision. If I said "email not found" when the email was wrong, and "incorrect password" when the email was right, an attacker would learn which emails are registered just by watching the error messages change. By saying "email or password" I give the user enough information to know what to check, while giving an attacker zero information about which field was wrong. The Principle of Least Surprise also applies to the loading state — the button changes to "Logging in..." during submission so users know their click was registered and the system is working.

**What goes wrong if ignored:** Separate error messages for wrong email versus wrong password turn your login form into a user enumeration tool. Attackers learn which emails are registered for free, enabling targeted attacks on real accounts.

### Q11 — Murphy's Law + Defensive Programming
**Code reference:** `proxy.ts`, `app/dashboard/page.tsx`, `app/lib/auth.ts`

**My Answer:** Authra has two layers of route protection for the dashboard. The first layer is `proxy.ts` — the Next.js middleware file. It uses NextAuth's `withAuth` helper which reads the `next-auth.session-token` cookie on every request to `/dashboard`. If the cookie is missing or invalid, the middleware redirects the user to `/login` before the dashboard page code ever runs. The second layer is inside `app/dashboard/page.tsx` itself, where I call `getServerSession(authOptions)` and redirect if no session is returned. If a user manually deletes their session cookie, this is what happens step by step: the browser sends a request to `/dashboard` with no cookie, the middleware in `proxy.ts` reads the request headers, finds no valid session token, and immediately issues a 302 redirect to `/login`. The dashboard page code never executes. The user lands on the login page. This is defensive programming — I do not trust that the cookie will always exist just because the user logged in. Murphy's Law says users will delete cookies, tokens will expire, and browsers will clear storage. The system must handle all of these cases gracefully without crashing or exposing protected content.

**What goes wrong if ignored:** Without middleware protection, a user who knows the dashboard URL can attempt to access it directly. Without the server-side session check inside the page itself, a clever bypass of the middleware could expose the dashboard to unauthenticated users.

### Q12 — Kerckhoffs's Principle + Technical Debt
**Code reference:** `.gitignore` — `.env` and `.env.local` are excluded, `NEXTAUTH_SECRET` in Vercel environment variables

**My Answer:** `NEXTAUTH_SECRET` is the key NextAuth uses to sign and verify JWT session tokens. If it was committed to GitHub, here is exactly what would happen step by step. First, any person who finds the secret in the public repository can use it to forge valid JWT session tokens for any user, including admin accounts, without knowing their password. Second, they could sign a token claiming to be any user ID in the database and gain full access to their account. Third, because JWTs are stateless, there is no server-side record to check against — the forged token looks completely legitimate. To recover, I would do four things immediately: one, remove the secret from GitHub using `git filter-branch` or BFG Repo Cleaner to rewrite history — but this does not help because GitHub caches commits and anyone could have already copied it. Two, generate a new `NEXTAUTH_SECRET` immediately using `openssl rand -base64 32`. Three, update the secret in Vercel environment variables and redeploy. Four, accept that all existing sessions are now invalid — every logged-in user will be logged out automatically because their tokens were signed with the old secret. This is security debt with compounding interest — the longer the secret is exposed, the more sessions could be compromised.

**What goes wrong if ignored:** A leaked NEXTAUTH_SECRET means an attacker can impersonate any user in your system indefinitely. Every account is compromised until the secret is rotated and all sessions are invalidated.

### Q13 — Conway's Law
**Code reference:** `app/lib/`, `app/api/`, `app/login/`, `app/dashboard/`

**My Answer:** Conway's Law states that systems mirror the communication structure of the people who build them. As a solo full-stack developer on Authra, my folder structure reflects how my mind organises the system into layers of responsibility. I separated pure logic into `app/lib/` — files like `prisma.ts`, `auth.ts`, `tokens.ts`, `email.ts`, and `ratelimit.ts` contain no UI and no route handling. They are utilities that any part of the system can call. I separated API handlers into `app/api/` — each route has one job, one file, one responsibility. I separated pages into named folders like `app/login/`, `app/signup/`, `app/dashboard/`. Each folder is a mental boundary. When I needed to fix the email sending logic, I went straight to `app/lib/email.ts` without searching. When I needed to fix the rate limiting, I went straight to `app/lib/ratelimit.ts`. The structure meant I never confused where things lived. Conway's Law explains why a team of specialists would organise this differently — a backend team might own `app/api/` and `app/lib/`, a frontend team might own the pages. As a solo developer, my structure reflects a single mind thinking in layers: data, logic, interface.

**What goes wrong if ignored:** Without a deliberate folder structure, logic leaks into pages, API calls leak into components, and database queries appear in UI files. The codebase becomes impossible to navigate and changes in one place break unexpected things elsewhere.

### Q14 — Technical Debt
**Code reference:** `app/signup/page.tsx` and `app/reset-password/[token]/page.tsx`

**My Answer:** The password strength indicator logic is duplicated in two separate files — `app/signup/page.tsx` and `app/reset-password/[token]/page.tsx`. Both files contain this identical function:

```typescript
const getPasswordStrength = (password: string) => {
  if (password.length === 0) return null;
  if (password.length < 6) return "weak";
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password))
    return "strong";
  return "fair";
};
```

This works right now because both copies are identical. But this is technical debt. If the password strength rules change — for example, adding a special character requirement — I would need to update two files. If I update one and forget the other, the signup page and the reset password page would have different strength rules, which would confuse users and create inconsistent security behaviour. The correct refactor is to extract this into a shared utility in `app/lib/password.ts` and import it in both places. I left it duplicated because the deadline pressure of the assessment made the quick copy-paste feel acceptable. But in a production codebase, this would be the first thing a code reviewer would flag.

**Refactored version:**
```typescript
// app/lib/password.ts
export function getPasswordStrength(password: string): "weak" | "fair" | "strong" | null {
  if (password.length === 0) return null;
  if (password.length < 6) return "weak";
  if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password))
    return "strong";
  return "fair";
}
```

**What goes wrong if ignored:** Duplicated logic drifts apart over time. Two files with different password strength rules create inconsistent user experiences and potential security gaps that are hard to detect because both versions appear to work correctly in isolation.

### Q15 — Synthesis
**Code reference:** All files — this question applies across the entire codebase

**My Answer:** Adding Flutterwave payments to Authra would not change the engineering principles — it would make every single one more critical because money is now involved.

**Murphy's Law** becomes the most important principle. Every payment can fail — network timeouts, duplicate charges, webhook delivery failures, expired cards. I would need idempotency keys on every payment request so that a user who clicks "Pay" twice does not get charged twice. I would need to handle Flutterwave webhook retries gracefully.

**Kerckhoffs's Principle** means the Flutterwave secret key must live in environment variables, never in code. A leaked payment secret key means an attacker can initiate refunds, query transaction histories, or impersonate webhooks. The `FLUTTERWAVE_SECRET_KEY` would go in Vercel environment variables exactly like `NEXTAUTH_SECRET`.

**Leaky Abstractions** apply to the Flutterwave SDK itself. The SDK abstracts HTTP calls to Flutterwave's API, but I would need to understand the raw webhook payload structure, signature verification, and error codes beneath it to handle edge cases correctly.

**YAGNI** means I would not build subscription billing, multiple currency support, or invoicing until those features are actually required. I would build pay-once for premium dashboard access and nothing more.

**Gall's Law** means I would add payments on top of a working auth system — exactly what we have. I would not rebuild auth and payments simultaneously.

**Rate Limiting** becomes critical on payment endpoints. An attacker should not be able to hammer a payment initiation endpoint thousands of times.

**Security by Design** means payment error messages must never reveal whether a card was declined due to insufficient funds versus a stolen card flag — both should return the same generic message to the user.

**Technical Debt** is most dangerous with payments. A hardcoded currency, a missing webhook signature check, or a duplicated payment handler that processes the same transaction twice — these are not just bugs, they are financial liabilities.

**What goes wrong if ignored:** Payment systems without these principles leak money, expose user financial data, process duplicate charges, and create legal liability. Every principle that matters for authentication matters twice as much when real money is involved.

## Part 4 — One Thing I Would Refactor

The password strength logic is duplicated in `app/signup/page.tsx` and `app/reset-password/[token]/page.tsx`. Both files contain an identical `getPasswordStrength` function. This works today but is a maintenance trap — if the password rules ever change, both files need updating simultaneously. Missing one creates inconsistent behaviour across the app.

The refactored version extracts the function into a shared utility:

```typescript
// app/lib/password.ts
export function getPasswordStrength(
  password: string
): "weak" | "fair" | "strong" | null {
  if (password.length === 0) return null;
  if (password.length < 6) return "weak";
  if (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  )
    return "strong";
  return "fair";
}
```

Both pages would then import it with:
```typescript
import { getPasswordStrength } from "@/app/lib/password";
```

One function. One place to update. Zero drift.

## Part 5 — How This Changes How I Build

Before Authra, I thought authentication was just a login form and a session. I now know it is an entire system of decisions — every one of which has a security consequence if made carelessly. I know why bcrypt uses 12 salt rounds and why SHA-256 is the wrong choice for passwords. I know why a forgot password endpoint must return the same message whether the email exists or not. I know why tokens must expire and why rate limiting is not optional.

The engineering laws changed how I think about code structure. Gall's Law taught me to resist the urge to build everything at once — a working simple system is more valuable than a broken complex one. The Law of Leaky Abstractions taught me to never fully trust a framework — NextAuth, Prisma, and Resend all have layers beneath them that I had to understand to use correctly. Conway's Law made me realise that my folder structure is not just organisation — it is a map of how I think about the system.

The biggest shift is this: I now think about what can go wrong before I think about what should go right. Murphy's Law is not a warning — it is a design principle. Every endpoint I build from now on, I will ask myself: what happens if this is called a thousand times in one second? What happens if the token is expired? What happens if the user deletes their cookie? What happens if the secret leaks? Authra taught me that security is not a feature you add at the end. It is the foundation everything else is built on.