import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import {
  About,
  Download,
  Faq,
  Features,
  Footer,
  HowItWorks,
} from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <About />
        <Download />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
