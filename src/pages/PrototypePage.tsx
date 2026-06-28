import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { TestDataPanel } from '../components/TestDataPanel';

export function PrototypePage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Header />
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Prototype</h1>
          <p className="text-lg text-gray-600 mb-12">
            Choose a flow to preview the DB Liquid experience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/list-your-property"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95"
            >
              List your property
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/browse-property"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              Browse property
            </Link>
            <Link
              to="/prototype/users"
              className="w-full sm:w-auto px-8 py-4 bg-gray-100 text-gray-900 rounded-full font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              View registered users
            </Link>
          </div>

          <TestDataPanel />
        </div>
      </main>
    </div>
  );
}
