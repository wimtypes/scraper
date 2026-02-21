import { HeroSection, LogosSection } from "@/components/ui/hero-1";
import { Header } from "@/components/ui/header-1";
import { Feed } from "@/components/Feed";

export default function App() {
  return (
    <div className="flex min-h-screen w-full flex-col dark bg-background text-foreground font-sans">
      <Header />
      <main className="grow">
        <HeroSection />
        <LogosSection />
        <Feed />
      </main>
    </div>
  );
}
