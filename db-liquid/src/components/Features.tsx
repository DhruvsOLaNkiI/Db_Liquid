import { Activity, Clock, ShieldCheck, Tag } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const chartData = [
  { name: 'Day 1', bid: 8500 },
  { name: 'Day 2', bid: 8900 },
  { name: 'Day 3', bid: 9200 },
  { name: 'Day 4', bid: 9800 },
  { name: 'Day 5', bid: 10500 },
  { name: 'Day 6', bid: 11200 },
  { name: 'Day 7', bid: 12500 },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">Featured</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Discover the Power of <br/> Our Platform</h2>
          <p className="text-gray-600 text-lg">Experience a secure, transparent, and competitive property bidding environment designed to maximize value for everyone.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Bidding Process */}
          <div className="bg-secondary rounded-[2rem] p-8 md:p-10 flex flex-col overflow-hidden relative group">
            <div className="mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Activity className="text-primary" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Competitive Bidding</h3>
              <p className="text-gray-600">Watch the value of your property increase with our transparent, market-driven competitive bidding system over 7 days.</p>
            </div>
            
            <div className="mt-auto pt-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">Current Highest Bid</p>
                    <p className="text-2xl font-bold">₹12,500 <span className="text-sm font-normal text-gray-500">/ sq.ft</span></p>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                    +47%
                  </div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="bid" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBid)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Transparent Pricing */}
          <div className="bg-secondary rounded-[2rem] p-8 md:p-10 flex flex-col overflow-hidden relative group">
            <div className="mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Tag className="text-primary" size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Transparent Pricing</h3>
              <p className="text-gray-600">Clear price per square foot on every listing. No hidden charges. What you see is exactly what you get with our fee structure.</p>
            </div>
            
            <div className="mt-auto pt-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-sm">Transferred to Seller</span>
                  </div>
                  <span className="font-bold">₹75,000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="font-medium text-sm">Platform Processing</span>
                  </div>
                  <span className="font-bold">₹25,000</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900 text-white rounded-xl mt-2">
                  <span className="font-medium text-sm">Total Token Amount</span>
                  <span className="font-bold text-lg">₹1,00,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 7-Day Cycle */}
          <div className="bg-secondary rounded-[2rem] p-8 md:p-10 flex flex-col">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <Clock className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">7-Day Bidding Cycle</h3>
            <p className="text-gray-600 mb-6">Fair opportunity for all buyers with a structured 7-day bidding period. Create urgency and get the best market value.</p>
            
            <div className="mt-auto bg-white rounded-2xl p-4 flex items-center justify-center gap-4">
               <div className="text-center">
                 <div className="text-2xl font-bold font-display">02</div>
                 <div className="text-xs text-gray-500 font-medium uppercase">Days</div>
               </div>
               <div className="text-2xl font-bold text-gray-300">:</div>
               <div className="text-center">
                 <div className="text-2xl font-bold font-display">14</div>
                 <div className="text-xs text-gray-500 font-medium uppercase">Hours</div>
               </div>
               <div className="text-2xl font-bold text-gray-300">:</div>
               <div className="text-center">
                 <div className="text-2xl font-bold font-display">23</div>
                 <div className="text-xs text-gray-500 font-medium uppercase">Mins</div>
               </div>
            </div>
          </div>

          {/* Card 4: Verified Users */}
          <div className="bg-secondary rounded-[2rem] p-8 md:p-10 flex flex-col">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <ShieldCheck className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Bank-Grade Security</h3>
            <p className="text-gray-600 mb-6">All buyers and sellers are KYC verified through the DB Ecosystem. Enjoy secure transactions with end-to-end encryption.</p>
            
            <div className="mt-auto flex flex-col gap-3">
              {['Verified User KYC', 'Secure Payment Gateways', 'Transparent Records'].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
