import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Index2 from "./pages/Index2";
import NotFound from "./pages/NotFound";
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
import { EnableDevMode } from "./components/EnableDevMode";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index2 />} />
            <Route path="/old-landing" element={<LandingPage />} />
            <Route path="/app" element={<Index />} />
            <Route path="/convite/:token" element={<AcceptInvite />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Secret Santa Routes */}
            <Route path="/amigo-secreto" element={<SecretSantaLanding />} />
            <Route path="/amigosecreto" element={<SecretSantaLanding />} />
            <Route path="/event/:id/secret-santa/setup" element={<SecretSantaSetup />} />
            <Route path="/event/:id/secret-santa/participants" element={<SecretSantaParticipants />} />
            <Route path="/event/:id/secret-santa/results" element={<SecretSantaResults />} />
            <Route path="/event/:id/secret-santa/my-result" element={<SecretSantaMyResult />} />
            <Route path="/event/:id/secret-santa/wishlist" element={<SecretSantaWishlist />} />
            <Route path="/event/:id/secret-santa/admin" element={<SecretSantaAdmin />} />

            {/* Utility Routes */}
            <Route path="/mockup" element={<MockupGenerator />} />
            <Route path="/marketing-screenshots" element={<MarketingScreenshots />} />
            <Route path="/r3un3test4ndo" element={<EnableDevMode />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
