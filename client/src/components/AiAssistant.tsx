import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage, type ChatMessage } from '../api';
import { MessageSquare, X, Send, Bot, User, Lock, LogIn, UserPlus } from 'lucide-react';

export default function AiAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId') || undefined;
  const userName = localStorage.getItem('userName') || 'there';

  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: `Hi ${userName}! I am your AurumFlow assistant. I can help you explore our gold loan schemes, calculate accurate quotes, or guide you through the application. How can I assist you today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting when username changes
  useEffect(() => {
    if (isAuthenticated) {
      setMessages([
        { 
          role: 'model', 
          content: `Hi ${userName}! I am your AurumFlow assistant. I can help you explore our gold loan schemes, calculate accurate quotes, or guide you through the application. How can I assist you today?` 
        }
      ]);
    }
  }, [userName, isAuthenticated]);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
    },
    onError: (err: any) => {
      const errorMsg = err?.response?.data?.error?.message || "I'm having trouble connecting to the server right now. Please try again later.";
      setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      scrollToBottom();
    }
  }, [messages, isOpen, isAuthenticated]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    if (!isAuthenticated) {
      return;
    }

    const newMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Send history + new message with userId
    chatMutation.mutate({
      userId,
      history: messages.slice(1),
      message: newMsg.content,
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-forest-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-forest-800 transition-transform ${isOpen ? 'scale-0' : 'scale-100'} z-50`}
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[420px] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl flex flex-col transition-transform transform origin-bottom-right z-50 border border-ivory-200 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-forest-900 text-white p-4 sm:rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-gold-400" />
            <div>
              <h3 className="font-display font-bold">AurumFlow AI</h3>
              <p className="text-xs text-forest-200">Gold Loan Assistant</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-forest-200 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on Authentication */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-ivory-50">
            <div className="w-16 h-16 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-forest-900 font-display mb-2">
              Sign In to Chat with AI
            </h4>
            <p className="text-sm text-charcoal-600 mb-6 max-w-xs leading-relaxed">
              Our AI Assistant provides personalized loan quotes, scheme comparisons, and guided application support for registered users.
            </p>
            <div className="w-full space-y-3 max-w-xs">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/login');
                }}
                className="w-full py-2.5 px-4 bg-forest-900 text-white font-medium rounded-xl hover:bg-forest-800 transition-colors flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <LogIn className="w-4 h-4 text-gold-400" />
                Sign In to Your Account
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/signup');
                }}
                className="w-full py-2.5 px-4 bg-white border border-forest-900 text-forest-900 font-medium rounded-xl hover:bg-forest-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4 text-gold-600" />
                Create Free Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ivory-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gold-100 text-gold-700' : 'bg-forest-100 text-forest-700'}`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gold-500 text-white rounded-tr-none' : 'bg-white border border-ivory-200 text-charcoal-900 rounded-tl-none shadow-sm'}`}>
                      {msg.content.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-forest-100 text-forest-700">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-ivory-200 text-charcoal-900 rounded-tl-none shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-ivory-200 sm:rounded-b-2xl">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about our loan schemes or calculate quotes..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm bg-ivory-50"
                  disabled={chatMutation.isPending}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || chatMutation.isPending}
                  className="bg-gold-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gold-600 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4 ml-[-2px]" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
