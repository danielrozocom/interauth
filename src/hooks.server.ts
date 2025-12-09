import { createSupabaseServerClient } from "$lib/supabase/serverClient";
import { type Handle, redirect } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // --- Logic for System Context Enforcement ---
  const url = event.url;
  const path = url.pathname;
  const params = url.searchParams;

  const hasSystem = params.has("system");

  // Exceptions where redirection should NOT happen
  const isSupabaseEndpoint = path.startsWith("/auth/v1");
  const isEmailTemplate = path.startsWith("/email-templates");
  const isStaticResource =
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path.startsWith("/_app") ||
    path.startsWith("/assets") ||
    path.startsWith("/build");

  // Check for auth tokens/codes typically found in email links
  const hasAuthTokens =
    params.has("code") ||
    params.has("token") ||
    params.has("access_token") ||
    params.has("email_change_token") ||
    params.get("type") === "recovery";

  if (!hasSystem) {
    const isException =
      isSupabaseEndpoint ||
      isEmailTemplate ||
      isStaticResource ||
      hasAuthTokens;

    if (!isException) {
      throw redirect(302, "https://interfundeoms.edu.co");
    }
  }
  // --------------------------------------------

  event.locals.supabase = createSupabaseServerClient({
    request: event.request,
    cookies: event.cookies,
  });

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser();
    if (error) {
      // JWT validation has failed
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === "content-range" || name === "x-supabase-api-version";
    },
  });
};
