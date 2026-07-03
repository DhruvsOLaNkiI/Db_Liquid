import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { RecommendedProperties } from '../components/RecommendedProperties';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <main>
        <Hero />
        <RecommendedProperties />
      </main>
      <Footer />
    </div>
  );
}
