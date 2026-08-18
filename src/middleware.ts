import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (
      request.nextUrl.pathname.startsWith("/admin") &&
      !(await convexAuth.isAuthenticated())
    ) {
      return nextjsMiddlewareRedirect(request, "/account");
    }
  },
);

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
