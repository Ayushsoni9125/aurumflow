import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ApplicationFlow from './pages/ApplicationFlow';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/Header';
import AiAssistant from './components/AiAssistant';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col relative bg-ivory-100">
        <Header />
        
        <main className="flex-1 flex flex-col pt-8 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<ApplicationFlow />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>

        <AiAssistant />
      </div>
    </BrowserRouter>
  );
}

export default App;
