import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/u",
  "/login",
  "/signup",
  "/auth/callback",
];

/* Metadata file conventions (robots, sitemap, manifest, icon, apple-icon,
   opengraph-image, twitter-image) and their numbered variants are public
   route handlers that must never be redirected to /login. Match the basename
   at any depth so per-segment OG images work too. */
const METADATA_RE =
  /^\/(robots\.txt|sitemap\.xml|manifest(?:\.webmanifest)?|favicon\.ico|icon\d*|apple-icon\d*|opengraph-image\d*|twitter-image\d*)(\.[a-z]+)?(\/|$)/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh the Supabase session on every request. This keeps cookies fresh
  // even in Server Components, and lets us gate protected routes.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect everything except public paths + static assets + the API.
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    METADATA_RE.test(pathname);

  if (!user && !isPublic && !isStatic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};