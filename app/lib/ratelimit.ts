import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const loginRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
    prefix: "authra:login",
});

export const forgotPasswordRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "10 m"),
    analytics: true,
    prefix: "authra:forgot-password",
});