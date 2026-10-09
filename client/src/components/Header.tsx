import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Hexagon } from 'lucide-react';
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

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    setUserRole(localStorage.getItem('userRole') || 'user');
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserRole('user');
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-ivory-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="text-gold-500 group-hover:text-gold-600 transition-colors">
              <Hexagon className="w-8 h-8 fill-current" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-forest-900">
              AurumFlow
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {userRole !== 'admin' && (
                  <>
                    <Link 
                      to="/apply" 
                      className={`text-sm font-medium transition-colors ${location.pathname === '/apply' ? 'text-gold-600' : 'text-charcoal-800 hover:text-gold-500'}`}
                    >
                      Apply
                    </Link>
                    <Link 
                      to="/track" 
                      className={`text-sm font-medium transition-colors ${location.pathname === '/track' ? 'text-gold-600' : 'text-charcoal-800 hover:text-gold-500'}`}
                    >
                      My Applications
                    </Link>
                  </>
                )}
                
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`text-sm font-medium transition-colors ${location.pathname === '/admin' ? 'text-gold-600' : 'text-charcoal-800 hover:text-gold-500'}`}
                  >
                    Applications
                  </Link>
                )}
                
                <button 
                  onClick={handleSignOut}
                  className="text-sm font-medium bg-forest-900 text-white px-4 py-2 rounded-lg hover:bg-forest-800 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="text-sm font-medium bg-forest-900 text-white px-4 py-2 rounded-lg hover:bg-forest-800 transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
