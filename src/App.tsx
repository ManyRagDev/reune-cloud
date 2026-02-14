import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage"; // Kept for reference or removed if strict
import Index from "./pages/Index";
// import Index2 from "./pages/Index2"; 
// import LandingV2 from "./pages/LandingV2";
import LandingV3 from "./pages/LandingV3";
import NotFound from "./pages/NotFound";
import SecretSantaSetup from "./pages/SecretSantaSetup";
import SecretSantaParticipants from "./pages/SecretSantaParticipants";
import SecretSantaResults from "./pages/SecretSantaResults";
import SecretSantaMyResult from "./pages/SecretSantaMyResult";
import SecretSantaWishlist from "./pages/SecretSantaWishlist";
import SecretSantaAdmin from "./pages/SecretSantaAdmin";
import SecretSantaLanding from "./pages/SecretSantaLanding";
import MarketingScreenshots from "./pages/MarketingScreenshots";
import AcceptInvite from "./pages/AcceptInvite";
import ResetPassword from "./pages/ResetPassword";
import { EnableDevMode } from "./components/EnableDevMode";
import AdminDashboard from "./pages/AdminDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import StudioPreview from "./pages/StudioPreview";

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingV3 />} />
            <Route path="/v3" element={<LandingV3 />} />
            <Route path="/app" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/convite/:token" element={<AcceptInvite />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Studio Route */}
            <Route path="/studio-preview" element={<StudioPreview />} />

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
            <Route path="/marketing-screenshots" element={<MarketingScreenshots />} />
            <Route path="/r3un3test4ndo" element={<EnableDevMode />} />

            {/* Legal Pages */}
            <Route path="/privacidade" element={<PrivacyPolicy />} />
            <Route path="/termos" element={<TermsOfService />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
