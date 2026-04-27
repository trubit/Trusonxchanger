import FirstSectionHome from "../Homepage/FirstSectionHome";
import SecondSectionHomePage from "../Homepage/SecondSectionHomePage";
import FeaturesSection from "../Homepage/FeaturesSection";
import CryptoJourneySection from "../Homepage/CryptoJourneySection";
import AnimatedLogoSection from "../Homepage/AnimatedLogoSection";
import FAQSection from "../Homepage/FAQSection";
import NewsletterSection from "../Homepage/NewsletterSection";
import TradingExecutionSection from "../Homepage/TradingExecutionSection";
import NavigationSection from "../Components/NavigationSection";
import BottomBar from "../Components/BottomBar";

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
