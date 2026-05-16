import FirstSectionHome from "../Components/home/FirstSectionHome";
import SecondSectionHomePage from "../Components/home/SecondSectionHomePage";
import FeaturesSection from "../Components/home/FeaturesSection";
import CryptoJourneySection from "../Components/home/CryptoJourneySection";
import AnimatedLogoSection from "../Components/home/AnimatedLogoSection";
import FAQSection from "../Components/home/FAQSection";
import NewsletterSection from "../Components/home/NewsletterSection";
import TradingExecutionSection from "../Components/home/TradingExecutionSection";
import NavigationSection from "../Components/layout/NavigationSection";
import BottomBar from "../Components/layout/BottomBar";

// Homepage composition.
const Home = () => {
  return (
    <>
      <FirstSectionHome />
      <SecondSectionHomePage />
      <FeaturesSection />
      <TradingExecutionSection />
      <CryptoJourneySection />
      <AnimatedLogoSection />
      <FAQSection />
      <NewsletterSection />
      <NavigationSection />
      <BottomBar />
    </>
  );
};

export default Home;
