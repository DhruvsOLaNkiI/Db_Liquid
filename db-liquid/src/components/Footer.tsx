import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="brand-logo text-xl">
                <span className="text-white">Digital</span>
                <span className="text-[#FF7A00]">Broker</span>
              </span>
            </div>
            <p className="text-white/60 mb-6 max-w-sm">
              The smart way to buy & sell properties through competitive bidding. Part of the trusted DB Ecosystem.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/70">
                <Mail size={18} />
                <a href="mailto:marketing@digitalbroker.in" className="hover:text-white transition-colors">marketing@digitalbroker.in</a>
              </div>
              <div className="text-sm text-white/50 mt-2">
                Support Hours: Mon-Sat, 9 AM - 6 PM
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Browse Properties</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">List Property</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Pricing & Fees</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Ecosystem</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">DB Asset</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">DB Expo</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Single Sign-On</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">KYC Verification</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Trust & Security</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Bank-level Encryption</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-white/60 hover:text-white transition-colors">Dispute Resolution</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
          <p>© 2026 DB Liquid. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
