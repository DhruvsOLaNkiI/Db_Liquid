import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-primary text-white rounded-[3rem] p-10 md:p-16 lg:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-white/5 rotate-12 blur-2xl"></div>
           <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[100%] bg-blue-500/20 -rotate-12 blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-xl text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
            Ready to experience the future of property trading?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join DB Liquid today. Transparent. Secure. Efficient. Part of the DB Ecosystem.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button className="w-full sm:w-auto px-8 py-4 bg-white text-primary rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">
              Get Started Now
            </button>
            <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              Browse Listings
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="relative z-10 hidden lg:block w-full max-w-sm">
           {/* Mock App Interface preview */}
           <div className="bg-white rounded-3xl p-4 shadow-2xl rotate-[-5deg] transform transition-transform hover:rotate-0 duration-500">
             <div className="bg-gray-100 rounded-2xl h-64 mb-4 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Property" className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                  Active Bid
                </div>
             </div>
             <div className="flex justify-between items-center mb-2">
               <h4 className="font-bold text-gray-900 text-lg">Luxury Villa</h4>
               <span className="font-bold text-blue-600">₹14,200/sq.ft</span>
             </div>
             <p className="text-sm text-gray-500 mb-4">Ends in 2d 14h</p>
             <button className="w-full bg-primary text-white py-3 rounded-xl font-medium text-sm">Place Bid</button>
           </div>
        </div>

      </div>
    </section>
  );
}
