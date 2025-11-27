import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LaunchLandingPage from "./pages/LaunchLandingPage";
import ReuneWaitlist from "./pages/ReuneWaitlist";
import SecretSantaSetup from "./pages/SecretSantaSetup";
import SecretSantaParticipants from "./pages/SecretSantaParticipants";
import SecretSantaResults from "./pages/SecretSantaResults";
import SecretSantaMyResult from "./pages/SecretSantaMyResult";
import SecretSantaWishlist from "./pages/SecretSantaWishlist";
import SecretSantaAdmin from "./pages/SecretSantaAdmin";
import SecretSantaLanding from "./pages/SecretSantaLanding";
import MockupGenerator from "./pages/MockupGenerator";
import MarketingScreenshots from "./pages/MarketingScreenshots";
import AcceptInvite from "./pages/AcceptInvite";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<Index />} />
          <Route path="/convite/:token" element={<AcceptInvite />} />
          <Route path="/lancamento" element={<LaunchLandingPage />} />
          <Route path="/reune" element={<ReuneWaitlist />} />
          <Route path="/amigo-secreto" element={<SecretSantaLanding />} />
          <Route path="/event/:id/secret-santa/setup" element={<SecretSantaSetup />} />
          <Route path="/event/:id/secret-santa/participants" element={<SecretSantaParticipants />} />
          <Route path="/event/:id/secret-santa/results" element={<SecretSantaResults />} />
          <Route path="/event/:id/secret-santa/my-result" element={<SecretSantaMyResult />} />
          <Route path="/event/:id/secret-santa/wishlist" element={<SecretSantaWishlist />} />
          <Route path="/event/:id/secret-santa/admin" element={<SecretSantaAdmin />} />
          <Route path="/mockup" element={<MockupGenerator />} />
          <Route path="/marketing-screenshots" element={<MarketingScreenshots />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
