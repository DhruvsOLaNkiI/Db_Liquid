import { Link } from 'react-router-dom';
import { Building, CheckCircle2, ClipboardList, Gavel, MessageCircle, Shield, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

/** Seller steps — match listing poster / How It Works creative */
const sellerSteps = [
  {
    icon: ClipboardList,
    title: 'Post Your Free Property Ad',
    description:
      'Describe your property accurately and upload high-quality photos and videos.',
  },
  {
    icon: Gavel,
    title: 'Let Buyers Bid on Your Listing',
    description:
      'View all bids on your dashboard and choose the offer that suits you best.',
  },
  {
    icon: MessageCircle,
    title: 'Connect with the Buyer',
    description:
      'After a successful match, communicate with the buyer through the chat window and finalise the terms.',
  },
  {
    icon: CheckCircle2,
    title: 'Finalise the Deal',
    description:
      'Click on Proceed to instantly generate the Agreement to Sale (ATS) and MOU.',
  },
];

const buyerSteps = [
  {
    icon: Building,
    title: 'Browse Properties',
    description:
      'Explore verified listings across locations. View detailed property information, pricing, and filter by budget.',
  },
  {
    icon: Gavel,
    title: 'Place Your Bid',
    description:
      'Participate in competitive bidding during the 7-day window. Track bids in real-time.',
  },
  {
    icon: CheckCircle2,
    title: 'Win & Connect',
    description:
      'If accepted, pay a ₹1,00,000 token amount to instantly access seller details (₹75K goes directly to seller).',
  },
  {
    icon: MessageCircle,
    title: 'Complete Purchase',
    description:
      'Directly negotiate and complete the legal documentation for a secure property transfer.',
  },
];

type Tab = 'sellers' | 'buyers';

export function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sellers');
  const steps = activeTab === 'sellers' ? sellerSteps : buyerSteps;

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              How It Works
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              {activeTab === 'sellers'
                ? 'Simple steps to connect, negotiate & close the best property deals.'
                : "A simple, transparent process to find your dream home."}
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-full inline-flex border border-white/20">
              {(['sellers', 'buyers'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-3 rounded-full text-sm font-semibold transition-all capitalize ${
                    activeTab === tab
                      ? 'bg-accent text-white shadow-md'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  For {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-6 sm:p-8 flex gap-5 items-start hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-accent font-bold text-lg">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-white/65 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center glass-card rounded-3xl p-10 md:p-14">
            <div className="mb-6">
              {activeTab === 'sellers' ? (
                <Building className="w-14 h-14 text-accent mx-auto mb-4" />
              ) : (
                <UserCheck className="w-14 h-14 text-accent mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold text-white mb-3">
                Ready to {activeTab === 'sellers' ? 'Sell?' : 'Buy?'}
              </h2>
              <p className="text-white/65 max-w-md mx-auto">
                {activeTab === 'sellers'
                  ? 'List it. Connect it. Close it.'
                  : 'Join thousands of verified users on DB Liquid today.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={activeTab === 'sellers' ? '/list-your-property' : '/browse-property'}
                className="px-8 py-4 bg-accent text-white rounded-full font-semibold text-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
              >
                {activeTab === 'sellers' ? 'Post Your Free Property Ad' : 'Browse Properties'}
              </Link>
              <Link
                to="/browse-property"
                className="px-8 py-4 border border-white/25 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="mt-16 grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-6">
              <Shield className="w-10 h-10 text-accent mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Bank-Grade Security</h4>
              <p className="text-sm text-white/60">All transactions are encrypted and KYC verified</p>
            </div>
            <div className="p-6">
              <Gavel className="w-10 h-10 text-accent mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">7-Day Bidding</h4>
              <p className="text-sm text-white/60">Fair opportunity for all buyers with structured cycles</p>
            </div>
            <div className="p-6">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto mb-3" />
              <h4 className="text-lg font-bold text-white mb-1">Verified Users</h4>
              <p className="text-sm text-white/60">Every buyer and seller is KYC verified through DB Ecosystem</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
