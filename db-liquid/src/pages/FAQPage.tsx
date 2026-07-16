import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Link } from 'react-router-dom';

const faqCategories = [
  {
    title: 'General',
    faqs: [
      {
        question: "Can I list on DB Liquid if I'm already on DB Asset?",
        answer:
          "Yes! Your DB Asset credentials work seamlessly on DB Liquid through our unified login system. This means single sign-on across the entire DB Ecosystem.",
      },
      {
        question: 'Is DB Liquid free to use?',
        answer:
          "Browsing and listing properties is free. Buyers need credits to place bids, and a token amount is collected when a deal progresses to ensure serious commitment from both parties.",
      },
      {
        question: 'What documents are required?',
        answer:
          "Sellers need property documents and ID proof (Aadhar / PAN). Buyers need KYC verification through the DB Ecosystem before they can place bids.",
      },
    ],
  },
  {
    title: 'Bidding',
    faqs: [
      {
        question: 'How long does the bidding process take?',
        answer:
          "Each property has a standard 7-day bidding cycle from the listing date to ensure a fair opportunity for all interested buyers.",
      },
      {
        question: 'Can I bid on multiple properties?',
        answer:
          "Yes, you can place bids on as many properties as you like, as long as you have sufficient credits and have completed KYC verification.",
      },
      {
        question: 'What happens if no one bids on my property?',
        answer:
          "You can relist the property with adjusted pricing or extend the bidding period to attract more potential buyers. There is no penalty for relisting.",
      },
      {
        question: 'Can I withdraw my bid?',
        answer:
          "Once placed, bids cannot be withdrawn during the active bidding period to maintain fairness. However, the seller can choose to accept or decline any bid.",
      },
    ],
  },
  {
    title: 'Payments & Token',
    faqs: [
      {
        question: 'Is the token amount refundable?',
        answer:
          "The token amount is a commitment fee. Refund policies apply based on specific circumstances outlined in our terms and conditions. Generally, if a deal falls through due to documentation issues, a partial refund may be issued.",
      },
      {
        question: 'How is the token amount split?',
        answer:
          "When a buyer pays the ₹1,00,000 token amount, ₹75,000 goes directly to the seller and ₹25,000 covers the platform processing fee.",
      },
      {
        question: 'What are buyer credits?',
        answer:
          "Credits are used to place bids. Each bid costs 1 credit. You can top up credits from the coin icon in the header. This ensures only serious buyers participate in the bidding process.",
      },
      {
        question: 'When do I get a credit refund?',
        answer:
          "If a seller declines your accepted bid, that 1 bid credit is refunded automatically. If an auction closes with no accepted bid, every bidder on that listing also gets their 1 credit back. Credits spent on a winning accepted deal are not refunded.",
      },
    ],
  },
  {
    title: 'Security & Verification',
    faqs: [
      {
        question: 'How is my data protected?',
        answer:
          "We use bank-grade encryption for all transactions and personal data. Your documents are securely stored and only accessible to verified parties involved in a deal.",
      },
      {
        question: 'What KYC verification is needed?',
        answer:
          "Both buyers and sellers need to verify their Aadhar number and PAN card through the profile page. This builds trust and ensures accountability.",
      },
    ],
  },
];

export function FAQPage() {
  const [openKey, setOpenKey] = useState<string | null>('General-0');

  return (
    <div className="min-h-screen selection:bg-orange-100 selection:text-orange-900">
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to know about DB Liquid. Can't find what you're looking for?
              Contact our support team.
            </p>
          </div>

          <div className="space-y-10">
            {faqCategories.map((category) => (
              <div key={category.title}>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-4">
                  {category.title}
                </h2>
                <div className="space-y-3">
                  {category.faqs.map((faq, index) => {
                    const key = `${category.title}-${index}`;
                    const isOpen = openKey === key;
                    return (
                      <div
                        key={key}
                        className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                          isOpen
                            ? 'border-accent/50 bg-white/10 shadow-md'
                            : 'border-white/15 hover:border-white/30 bg-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                          onClick={() => setOpenKey(isOpen ? null : key)}
                        >
                          <span className="font-semibold text-lg pr-8 text-white">
                            {faq.question}
                          </span>
                          <div
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isOpen
                                ? 'bg-accent text-white'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                          </div>
                        </button>
                        <div
                          className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                            isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center glass-card rounded-3xl p-10">
            <h2 className="text-2xl font-bold text-white mb-3">Still have questions?</h2>
            <p className="text-white/65 mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Get in touch and our team will help you out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/browse-property"
                className="px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
              >
                Browse Properties
              </Link>
              <Link
                to="/how-it-works"
                className="px-8 py-4 border border-white/25 text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
