import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/become-a-groomer(.*)',
  '/register/groomer(.*)',
  '/founder(.*)',
  '/search(.*)',
  '/groomers(.*)',
  // Legal & policy pages — must be readable without an account
  '/terms(.*)',
  '/privacy-policy(.*)',
  '/cookie-policy(.*)',
  '/verification-policy(.*)',
  '/acceptable-use(.*)',
  '/disputes-policy(.*)',
  '/refunds-policy(.*)',
  '/code-of-conduct(.*)',
  '/personal-development-policy(.*)',
  '/employee-benefits-policy(.*)',
  '/holidays-policy(.*)',
  '/sickness-policy(.*)',
  '/remote-working-policy(.*)',
  '/travel-for-work-policy(.*)',
  '/expenses-policy(.*)',
  '/use-of-company-equipment-policy(.*)',
  '/groomer-sign-up-incentive(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}