import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ReuneWaitlist from "./pages/ReuneWaitlist";
import Index from "./pages/Index";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";
import MockupGenerator from "./pages/MockupGenerator";
import MarketingScreenshots from "./pages/MarketingScreenshots";
import SecretSantaSetup from "./pages/SecretSantaSetup";
import SecretSantaParticipants from "./pages/SecretSantaParticipants";
import SecretSantaResults from "./pages/SecretSantaResults";
import SecretSantaMyResult from "./pages/SecretSantaMyResult";
import SecretSantaWishlist from "./pages/SecretSantaWishlist";
import SecretSantaAdmin from "./pages/SecretSantaAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/waitlist" element={<ReuneWaitlist />} />
          <Route path="/app" element={<Index />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/mockups" element={<MockupGenerator />} />
          <Route path="/marketing-screenshots" element={<MarketingScreenshots />} />
          <Route path="/event/:eventId/secret-santa/setup" element={<SecretSantaSetup />} />
          <Route path="/event/:eventId/secret-santa/participants" element={<SecretSantaParticipants />} />
          <Route path="/event/:eventId/secret-santa/results" element={<SecretSantaResults />} />
          <Route path="/event/:eventId/secret-santa/my-result" element={<SecretSantaMyResult />} />
          <Route path="/event/:eventId/secret-santa/wishlist" element={<SecretSantaWishlist />} />
          <Route path="/event/:eventId/secret-santa/admin" element={<SecretSantaAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
