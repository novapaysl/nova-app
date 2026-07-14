import { LandingLayout } from "@/components/landing/LandingLayout";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustSection } from "@/components/landing/TrustSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { MerchantSection } from "@/components/landing/MerchantSection";

export const LandingPage = () => {
  return (
    <LandingLayout>
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <FeaturesSection />
      <MerchantSection />
    </LandingLayout>
  );
};
