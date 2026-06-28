import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                <span className="text-sm font-medium text-gray-800">Part of the DB Ecosystem</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1] mb-6">
                The Smart Way to <br className="hidden lg:block" />
                <span className="text-gray-400">Buy & Sell Properties</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                DB Liquid is a revolutionary real estate platform connecting sellers with serious buyers through a transparent, competitive bidding system.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  to="/list-your-property"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-full font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95"
                >
                  List Your Property
                  <ArrowRight size={20} />
                </Link>
                <Link
                  to="/browse-property"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-full font-medium text-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  Browse Listings
                </Link>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 flex items-center justify-center lg:justify-start gap-8"
            >
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-gray-100 z-[${5-i}]`}>
                    <img src={`https://i.pravatar.cc/150?img=${i+10}`} alt="User" className="w-full h-full rounded-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 text-yellow-400 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="font-medium text-gray-900">Trusted by 10k+ users</p>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-lg lg:max-w-none relative"
          >
            <div className="relative aspect-[4/5] md:aspect-[4/4] lg:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
               <img 
                 src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                 alt="Modern House" 
                 className="w-full h-full object-cover"
               />
               
               {/* Floating UI Element 1 */}
               <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium">Highest Bid</p>
                     <p className="text-sm font-bold text-gray-900">₹12,500 / sq.ft</p>
                   </div>
                 </div>
               </div>

               {/* Floating UI Element 2 */}
               <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 font-medium">Time Remaining</p>
                     <p className="text-sm font-bold text-gray-900">2d 14h 23m</p>
                   </div>
                 </div>
               </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-blue-100 to-purple-50 rounded-full blur-3xl opacity-50"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
