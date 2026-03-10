import { clerkSetup } from "@clerk/testing/playwright";

const CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

export default async () => {
  if (CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY) {
    await clerkSetup({
      publishableKey: CLERK_PUBLISHABLE_KEY,
      secretKey: CLERK_SECRET_KEY,
    });
  } else {
    console.warn("Missing Clerk keys - authenticated tests may fail");
  }
};
