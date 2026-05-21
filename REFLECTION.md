# Authra — Reflection & Engineering Analysis

**Name:** Igbayilola Rashidat Kazeem
**Cohort:** Design to MVP Bootcamp
**Live URL:** https://authra-umber.vercel.app
**GitHub Repo:** https://github.com/Igbailola/authra


## Part 1 — What I Built

Authra is a standalone, production-ready authentication system built with Next.js 14, TypeScript, Prisma, and PostgreSQL. I implemented a full identity and access management layer including sign up with email verification, login with JWT session handling, forgot and reset password flows, and a protected dashboard that only verified users can access. Every feature was built with security in mind — passwords are hashed with bcrypt at 12 salt rounds, tokens expire, rate limiting blocks brute force attacks on the login endpoint, and no API response leaks sensitive user information.

## Part 2 — What Surprised Me

The hardest part was understanding how NextAuth interacts with the underlying Next.js request lifecycle. I assumed throwing a custom error inside the authorize() function would pass the message directly to the client, but NextAuth intercepts all errors and returns a generic CredentialsSignin code instead. This forced me to design my error messages at the UI layer rather than the API layer, and taught me that abstractions have opinions — you have to understand what happens beneath them to build correctly on top of them.

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