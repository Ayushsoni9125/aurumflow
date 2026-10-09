import { Link } from 'react-router-dom';
import { ChevronRight, ShieldCheck, Banknote, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 w-full relative">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-4 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="absolute top-0 w-full h-full overflow-hidden -z-10 flex justify-center pointer-events-none">
          <div className="w-[800px] h-[500px] bg-gold-400/10 blur-[120px] rounded-full absolute -top-20"></div>
        </div>
        

        
        <h1 className="text-5xl md:text-7xl font-display font-bold text-forest-900 tracking-tight leading-tight max-w-4xl mb-6">
          Unlock the true value of your gold, <span className="text-gold-500 italic">instantly.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-charcoal-800 max-w-2xl mb-10 leading-relaxed">
          AurumFlow offers seamless, AI-assisted gold loans with absolute transparency. Get a real-time quote, choose your scheme, and access funds faster than ever before.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/apply" className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20">
            Get an Instant Quote <ChevronRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="btn-secondary text-lg px-8 py-4 flex items-center justify-center bg-white">
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-y border-ivory-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-forest-900">Why choose AurumFlow?</h2>
            <p className="text-charcoal-800 mt-4 max-w-2xl mx-auto">We combine traditional banking security with modern AI technology to give you the best loan experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-6">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-3">Maximum Value</h3>
              <p className="text-charcoal-800">We offer highly competitive Loan-to-Value (LTV) ratios, ensuring you get the maximum possible funds for your gold.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-3">Absolute Security</h3>
              <p className="text-charcoal-800">Your assets are stored in bank-grade vaults. Our transparent AI ensures you understand every part of the terms.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-ivory-50 border border-ivory-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-gold-100 text-gold-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-forest-900 mb-3">Lightning Fast</h3>
              <p className="text-charcoal-800">Complete your preliminary application in 3 simple steps online, and fast-track your in-branch verification.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-forest-900 mb-6">Ready to see what your gold is worth?</h2>
        <p className="text-lg text-charcoal-800 mb-10">Our AI assistant is ready to help you find the perfect loan scheme tailored exactly to your needs.</p>
        <Link to="/apply" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
          Start Your Application <ChevronRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
