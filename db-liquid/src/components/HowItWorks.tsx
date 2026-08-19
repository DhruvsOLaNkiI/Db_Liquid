import { Building, CheckCircle2, UserCheck } from 'lucide-react';
import { useState } from 'react';

const steps = {
  sellers: [
    {
      title: 'Post Your Free Property Ad',
      description:
        'Describe your property accurately and upload high-quality photos and videos.',
    },
    {
      title: 'Let Buyers Bid on Your Listing',
      description:
        'View all bids on your dashboard and choose the offer that suits you best.',
    },
    {
      title: 'Connect with the Buyer',
      description:
        'After a successful match, communicate with the buyer through the chat window and finalise the terms.',
    },
    {
      title: 'Finalise the Deal',
      description:
        'Click on Proceed to instantly generate the Agreement to Sale (ATS) and MOU.',
    },
  ],
  buyers: [
    {
      title: 'Browse Properties',
      description:
        'Explore verified listings across locations. View detailed property information, pricing, and filter by budget.',
    },
    {
      title: 'Place Your Bid',
      description:
        'Participate in competitive bidding during the 7-day window. Track bids in real-time.',
    },
    {
      title: 'Win & Connect',
      description:
        'If accepted, pay a ₹1,00,000 token amount to instantly access seller details (₹75K goes directly to seller).',
    },
    {
      title: 'Complete Purchase',
      description:
        'Directly negotiate and complete the legal documentation for a secure property transfer.',
    },
  ],
};

export function HowItWorks() {
  const [activeTab, setActiveTab] = useState<'sellers' | 'buyers'>('sellers');

  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight text-white">How It Works</h2>
          <p className="text-white/70 text-lg">
            Simple steps to connect, negotiate & close the best property deals.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white p-1.5 rounded-full inline-flex shadow-sm border border-gray-200">
            <button 
              onClick={() => setActiveTab('sellers')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all ${activeTab === 'sellers' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
            >
              For Sellers
            </button>
            <button 
              onClick={() => setActiveTab('buyers')}
              className={`px-8 py-3 rounded-full text-sm font-semibold transition-all ${activeTab === 'buyers' ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
            >
              For Buyers
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              {steps[activeTab].map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{step.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col justify-center border border-gray-100">
              <div className="text-center mb-8">
                {activeTab === 'sellers' ? (
                  <Building className="w-16 h-16 text-primary mx-auto mb-4" />
                ) : (
                  <UserCheck className="w-16 h-16 text-primary mx-auto mb-4" />
                )}
                <h3 className="text-2xl font-bold mb-2">
                  Ready to {activeTab === 'sellers' ? 'Sell?' : 'Buy?'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'sellers'
                    ? 'List it. Connect it. Close it.'
                    : 'Join thousands of verified users on DB Liquid today.'}
                </p>
              </div>
              
              <div className="space-y-4">
                <button className="w-full py-4 bg-primary text-white rounded-xl font-medium hover:bg-blue-950 transition-colors">
                  {activeTab === 'sellers' ? 'Post Your Free Property Ad' : 'Browse Properties'}
                </button>
                <button className="w-full py-4 bg-white border border-gray-200 text-gray-900 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Learn More
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
