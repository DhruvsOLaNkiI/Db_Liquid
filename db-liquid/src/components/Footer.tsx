import { Mail, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary text-white flex items-center justify-center rounded-lg font-display font-bold">
                DB
              </div>
              <span className="font-display font-bold text-xl tracking-tight">Liquid</span>
            </div>
            <p className="text-gray-500 mb-6 max-w-sm">
              The smart way to buy & sell properties through competitive bidding. Part of the trusted DB Ecosystem.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail size={18} />
                <span>support@dbliquid.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone size={18} />
                <span>+91-XXXXXXXXXX</span>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Support Hours: Mon-Sat, 9 AM - 6 PM
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">How it Works</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Browse Properties</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">List Property</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Pricing & Fees</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Ecosystem</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">DB Asset</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">DB Expo</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Single Sign-On</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">KYC Verification</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-6">Trust & Security</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Bank-level Encryption</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-500 hover:text-primary transition-colors">Dispute Resolution</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© 2026 DB Liquid. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
