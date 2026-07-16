import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { PROPERTY_TYPES } from '../data/propertyTypes';
import { useAuth } from '../context/AuthContext';

type SearchTab = 'buy' | 'sell';

function InlineLoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/');
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl relative z-10 w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500">
          One account to browse, bid, and list properties.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1.5 text-left">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1.5 text-left">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-600 text-left">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 mt-2 bg-primary text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function SearchBanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchTab>('buy');
  const [typeOpen, setTypeOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('All Residential');
  const [searchQuery, setSearchQuery] = useState('');
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) {
        setTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (tab: SearchTab) => {
    setActiveTab(tab);
    setTypeOpen(tab === 'buy');
  };

  const selectType = (option: string) => {
    setSelectedType(option);
    setTypeOpen(false);
  };

  const handleSearch = () => {
    if (activeTab === 'sell') {
      navigate('/list-your-property');
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedType !== 'All Residential') params.set('type', selectedType);
    const query = params.toString();
    navigate(query ? `/browse-property?${query}` : '/browse-property');
  };

  return (
    <div className={`bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[1000px] mx-auto w-full ${activeTab === 'sell' ? 'p-2 md:p-3' : 'p-2 md:p-4'}`}>
      <div className={`flex items-center justify-between border-b border-gray-100 px-4 ${activeTab === 'sell' ? 'mb-2' : 'mb-3'}`}>
        <div className="flex items-center gap-6">
          {(['buy', 'sell'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={`text-sm capitalize whitespace-nowrap transition-colors ${
                activeTab === 'sell' ? 'py-2' : 'py-3'
              } ${
                activeTab === tab
                  ? 'font-semibold text-gray-900 border-b-2 border-[#FF7A00]'
                  : 'font-medium text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <Link
          to="/list-your-property"
          className="hidden sm:inline-flex mb-1 items-center px-6 py-2 bg-[#FF7A00] text-white text-xs font-bold rounded-full hover:bg-[#E66E00] transition-colors shadow-sm"
        >
          Post Your Property For Free
        </Link>
      </div>

      {activeTab === 'buy' ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex flex-col md:flex-row items-center gap-3 px-2 pb-2"
        >
          <div ref={typeRef} className="relative w-full md:w-[220px] shrink-0">
            <button
              type="button"
              onClick={() => setTypeOpen((open) => !open)}
              className="flex items-center justify-between w-full px-4 py-3.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <span className="text-sm text-gray-700 font-medium truncate pr-2">{selectedType}</span>
              <ChevronDown size={16} className={`text-gray-500 shrink-0 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
            </button>

            {typeOpen && (
              <div className="absolute z-[200] top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => selectType('All Residential')}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 transition-colors ${selectedType === 'All Residential' ? 'bg-orange-50 text-gray-900 font-medium' : 'text-gray-800 hover:bg-gray-50'}`}
                >
                  All Residential
                </button>
                {PROPERTY_TYPES.map((group) => (
                  <div key={group.category}>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 sticky top-0">
                      {group.category}
                    </div>
                    {group.options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectType(option)}
                        className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 last:border-b-0 transition-colors ${selectedType === option ? 'bg-orange-50 text-gray-900 font-medium' : 'text-gray-800 hover:bg-gray-50'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center w-full bg-white rounded-xl border border-gray-200 px-4 py-3.5 hover:border-gray-300 transition-colors">
            <Search size={18} className="text-gray-400 mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 'Noida'"
              className="bg-transparent border-none outline-none w-full text-sm text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-8 py-3.5 bg-[#FF7A00] hover:bg-[#E66E00] text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-orange-500/20 shrink-0"
          >
            Search
          </button>
        </form>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-3 py-2 sm:py-2.5">
          <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            List your property for free and receive competitive bids from verified buyers.
          </p>
          <Link
            to="/list-your-property"
            className="shrink-0 px-6 py-2.5 bg-[#FF7A00] hover:bg-[#E66E00] text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-orange-500/20 whitespace-nowrap"
          >
            List Property
          </Link>
        </div>
      )}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative w-full mb-16">
      {/* Background Image Container */}
      <div className="relative w-full h-[300px] md:h-[400px]">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80"
          alt="Real Estate Handshake"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
        />
        {/* Dark overlay gradient to blend with the rest of the dark page */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#000000]" />
      </div>

      {/* Search Banner overlapping the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 px-4 z-20 translate-y-1/2">
        <SearchBanner />
      </div>
    </section>
  );
}
