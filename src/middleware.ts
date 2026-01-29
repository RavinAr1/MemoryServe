import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect API routes and certain pages so that only authenticated users can access them
const isProtectedRoute = createRouteMatcher([
  '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    
    // Protect all routes except static files and public assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        
    // Protect API routes
    '/(api|trpc)(.*)',
  ],
};