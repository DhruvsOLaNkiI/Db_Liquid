import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "Can I list on DB Liquid if I'm already on DB Asset?",
    answer: "Yes! Your DB Asset credentials work seamlessly on DB Liquid through our unified login system."
  },
  {
    question: "What happens if no one bids on my property?",
    answer: "You can relist the property with adjusted pricing or extend the bidding period to attract more potential buyers."
  },
  {
    question: "Is the token amount refundable?",
    answer: "The token amount is a commitment fee. Refund policies apply based on specific circumstances outlined in our terms and conditions."
  },
  {
    question: "How long does the bidding process take?",
    answer: "Each property has a standard 7-day bidding cycle from the listing date to ensure a fair opportunity for all interested buyers."
  },
  {
    question: "Can I bid on multiple properties?",
    answer: "Yes, you can place bids on as many properties as you like, subject to successful KYC verification."
  },
  {
    question: "What documents are required?",
    answer: "Sellers need property documents and ID proof. Buyers need KYC verification through the DB Ecosystem."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">FAQs</h2>
          <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Frequently Asked</h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <button
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className="font-semibold text-lg pr-8">{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
