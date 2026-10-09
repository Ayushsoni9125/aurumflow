import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hexagon, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [userRole, setUserRole] = useState(
    localStorage.getItem('userRole') || 'user'
  );
  const [userName, setUserName] = useState(
    localStorage.getItem('userName') || ''
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    setUserRole(localStorage.getItem('userRole') || 'user');
    setUserName(localStorage.getItem('userName') || '');
    setIsMobileMenuOpen(false); // Close mobile drawer on route change
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserRole('user');
    setUserName('');
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-ivory-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 group flex-shrink-0"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="text-gold-500 group-hover:text-gold-600 transition-colors">
              <Hexagon className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-forest-900">
              AurumFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {userName && (
                  <span className="text-xs text-charcoal-700 font-medium bg-ivory-100 px-2.5 py-1 rounded-full">
                    Hi, {userName}
                  </span>
                )}
                {userRole !== 'admin' && (
                  <>
                    <Link 
                      to="/apply" 
                      className={`text-sm font-medium transition-colors ${location.pathname === '/apply' ? 'text-gold-600 font-semibold' : 'text-charcoal-800 hover:text-gold-500'}`}
                    >
                      Apply
                    </Link>
                    <Link 
                      to="/track" 
                      className={`text-sm font-medium transition-colors ${location.pathname === '/track' ? 'text-gold-600 font-semibold' : 'text-charcoal-800 hover:text-gold-500'}`}
                    >
                      My Applications
                    </Link>
                  </>
                )}
                
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'text-gold-600 font-semibold' : 'text-charcoal-800 hover:text-gold-500'}`}
                  >
                    Applications
                  </Link>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium bg-forest-900 text-white px-4 py-2 rounded-lg hover:bg-forest-800 transition-colors active:scale-95"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-medium bg-forest-900 text-white px-4 py-2 rounded-lg hover:bg-forest-800 transition-colors active:scale-95"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-lg text-forest-900 hover:bg-ivory-100 transition-colors focus:outline-none"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-forest-900" />
              ) : (
                <Menu className="w-6 h-6 text-forest-900" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown / Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-ivory-200 bg-white shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-4 pt-3 pb-5 space-y-2">
            {isAuthenticated ? (
              <>
                {userName && (
                  <div className="px-3 py-2 text-xs text-charcoal-700 bg-ivory-50 rounded-lg font-medium border border-ivory-200">
                    Signed in as <span className="font-bold text-forest-900">{userName}</span> ({userRole})
                  </div>
                )}
                {userRole !== 'admin' && (
                  <>
                    <Link 
                      to="/apply" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${location.pathname === '/apply' ? 'bg-gold-50 text-gold-600 font-semibold' : 'text-charcoal-800 hover:bg-ivory-50'}`}
                    >
                      Apply for Gold Loan
                    </Link>
                    <Link 
                      to="/track" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${location.pathname === '/track' ? 'bg-gold-50 text-gold-600 font-semibold' : 'text-charcoal-800 hover:bg-ivory-50'}`}
                    >
                      My Applications
                    </Link>
                  </>
                )}
                
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${location.pathname === '/admin' ? 'bg-gold-50 text-gold-600 font-semibold' : 'text-charcoal-800 hover:bg-ivory-50'}`}
                  >
                    Admin Applications
                  </Link>
                )}

                <div className="pt-2 border-t border-ivory-200">
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-center text-sm font-medium bg-forest-900 text-white px-4 py-2.5 rounded-lg hover:bg-forest-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2 pt-1">
                <Link 
                  to="/login" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center text-sm font-medium bg-forest-900 text-white px-4 py-2.5 rounded-lg hover:bg-forest-800 transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center text-sm font-medium border border-forest-900 text-forest-900 px-4 py-2.5 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
