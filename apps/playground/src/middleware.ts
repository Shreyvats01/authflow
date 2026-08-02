import { bolkAuthMiddleware } from "@bolkauth/nextjs";

export default bolkAuthMiddleware(
  { secret: "playground_secret_key_min_32_characters_long_12345" },
  {
    publicRoutes: ["/", "/sign-in", "/sign-up", "/api/auth/(.*)"],
    signInUrl: "/sign-in",
    onboardingUrl: "/onboarding",
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
