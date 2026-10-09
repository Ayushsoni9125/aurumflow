import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Banknote, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 w-full relative">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-20 md:pt-28 md:pb-32 px-2 sm:px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 w-full h-full overflow-hidden -z-10 flex justify-center pointer-events-none">
          <div className="w-[320px] sm:w-[600px] md:w-[800px] h-[300px] sm:h-[400px] md:h-[500px] bg-gold-400/10 blur-[100px] sm:blur-[120px] rounded-full absolute -top-10 sm:-top-20"></div>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-forest-900 text-xs font-semibold mb-6 border border-gold-300/60 shadow-2xs">
          <span>✨</span>
          <span>Instant AI-Assisted Valuation & Transparent Schemes</span>
        </div>
        
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-forest-900 tracking-tight leading-tight max-w-4xl mb-4 sm:mb-6">
          Unlock the true value of your gold, <span className="text-gold-500 italic">instantly.</span>
        </h1>
        
        <p className="text-sm sm:text-lg md:text-xl text-charcoal-800 max-w-2xl mb-8 sm:mb-10 leading-relaxed px-2">
          AurumFlow offers seamless, AI-assisted gold loans with absolute transparency. Get a real-time quote, choose your scheme, and access funds faster than ever before.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/apply" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20 w-full sm:w-auto">
            Get an Instant Quote <ChevronRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 flex items-center justify-center bg-white w-full sm:w-auto">
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-14 sm:py-20 md:py-24 border-y border-ivory-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-forest-900">Why choose AurumFlow?</h2>
            <p className="text-charcoal-800 text-xs sm:text-base mt-2 sm:mt-4 max-w-2xl mx-auto px-2">We combine traditional banking security with modern AI technology to give you the best loan experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-5 sm:mb-6 shadow-inner">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 sm:mb-3">Maximum Value</h3>
              <p className="text-charcoal-800 text-xs sm:text-sm leading-relaxed">We offer highly competitive Loan-to-Value (LTV) ratios, ensuring you get the maximum possible funds for your gold.</p>
            </div>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-5 sm:mb-6 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 sm:mb-3">Absolute Security</h3>
              <p className="text-charcoal-800 text-xs sm:text-sm leading-relaxed">Your assets are stored in bank-grade vaults. Our transparent AI ensures you understand every part of the terms.</p>
            </div>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-5 sm:mb-6 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-forest-900 mb-2 sm:mb-3">Lightning Fast</h3>
              <p className="text-charcoal-800 text-xs sm:text-sm leading-relaxed">Complete your preliminary application in 3 simple steps online, and fast-track your in-branch verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 md:py-24 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-forest-900 mb-4 sm:mb-6">Ready to see what your gold is worth?</h2>
        <p className="text-sm sm:text-lg text-charcoal-800 mb-8 sm:mb-10 max-w-xl mx-auto">Our AI assistant is ready to help you find the perfect loan scheme tailored exactly to your needs.</p>
        <Link to="/apply" className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3.5 sm:py-4 inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-md">
          Start Your Application <ChevronRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
