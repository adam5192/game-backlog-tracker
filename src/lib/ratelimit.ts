import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

// steam import is expenisve so the limit is more strict
export const importRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "30 s"),
});

export const recommendationsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "5 s"),
});
