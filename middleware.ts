import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define quais rotas são públicas (não precisam de autenticação)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
]);

// Define rotas de API que não devem ser protegidas pelo middleware
const isApiRoute = createRouteMatcher(['/api(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Rotas de API não são protegidas pelo middleware (podem ter autenticação própria)
  if (isApiRoute(req)) {
    return;
  }
  
  // Se a rota não for pública, o Clerk automaticamente verifica a autenticação
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};