import { Layers, Network, Zap } from 'lucide-react';

export function Ecosystem() {
  return (
    <section id="ecosystem" className="py-24 bg-primary text-white overflow-hidden relative">
      {/* Background abstract elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-sm font-medium text-white">The DB Ecosystem</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">One Account.<br/>Unlimited Possibilities.</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              DB Liquid is part of the comprehensive DB Ecosystem. Experience seamless single sign-on across our integrated services. Already registered on DB Asset or DB Expo? Login instantly with your existing credentials!
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">DB Asset</h4>
                  <p className="text-gray-400 text-sm">Comprehensive asset management solutions for your real estate portfolio.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Network className="text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">DB Expo</h4>
                  <p className="text-gray-400 text-sm">Premier business exhibition platform connecting professionals globally.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-lg">DB</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-1">DB Liquid</h4>
                  <p className="text-gray-300 text-sm">Revolutionary property bidding & sales platform for buyers and sellers.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-full border border-white/10 flex items-center justify-center relative p-8">
              {/* Center */}
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl z-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="font-display font-bold text-4xl text-primary">DB</span>
              </div>
              
              {/* Orbit 1 */}
              <div className="absolute w-full h-full border border-dashed border-white/20 rounded-full animate-[spin_20s_linear_infinite]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  DB Asset
                </div>
              </div>
              
              {/* Orbit 2 */}
              <div className="absolute w-3/4 h-3/4 border border-dashed border-white/20 rounded-full animate-[spin_15s_linear_infinite_reverse]">
                <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 bg-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  DB Expo
                </div>
              </div>
              
              {/* Orbit 3 */}
              <div className="absolute w-1/2 h-1/2 border border-dashed border-white/20 rounded-full animate-[spin_10s_linear_infinite]">
                <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white text-primary px-4 py-2 rounded-full font-bold shadow-lg">
                  DB Liquid
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
