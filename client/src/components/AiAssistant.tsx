import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { sendChatMessageStream, type ChatMessage } from '../api';
import { MessageSquare, X, Send, Bot, User, Lock, LogIn, UserPlus, Sparkles, StopCircle, RefreshCw } from 'lucide-react';

const QUICK_SUGGESTIONS = [
  "Calculate quote for 10g 22K gold",
  "Compare loan schemes & interest rates",
  "What is the maximum LTV I can get?",
  "How does bullet repayment work?"
];

export default function AiAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId') || (isAuthenticated ? 'authenticated-user' : undefined);
  const userName = localStorage.getItem('userName') || 'there';

  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      content: `Hi **${userName}**! 👋 I am your **AurumFlow AI Assistant**.\n\nI can help you explore our gold loan schemes, calculate accurate quotes, or guide you through your application. How can I help you today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update greeting when username changes
  useEffect(() => {
    if (isAuthenticated) {
      setMessages([
        { 
          role: 'model', 
          content: `Hi **${userName}**! 👋 I am your **AurumFlow AI Assistant**.\n\nI can help you explore our gold loan schemes, calculate accurate quotes, or guide you through your application. How can I help you today?` 
        }
      ]);
    }
  }, [userName, isAuthenticated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      scrollToBottom();
    }
  }, [messages, isOpen, isAuthenticated, isStreaming, statusMessage]);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStatusMessage(null);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isStreaming) return;
    if (!isAuthenticated) return;

    const userMsg: ChatMessage = { role: 'user', content: textToSend.trim() };
    const historySnapshot = [...messages];

    // Add user message + empty model message placeholder
    setMessages(prev => [
      ...prev,
      userMsg,
      { role: 'model', content: '' }
    ]);
    setInput('');
    setIsStreaming(true);
    setStatusMessage('Thinking...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await sendChatMessageStream(
        {
          userId,
          history: historySnapshot.slice(1),
          message: userMsg.content,
        },
        {
          signal: controller.signal,
          onStatus: (status) => {
            setStatusMessage(status);
          },
          onChunk: (chunk) => {
            setStatusMessage(null); // Once chunks start arriving, clear status badge
            setMessages(prev => {
              const lastIdx = prev.length - 1;
              if (lastIdx < 0) return prev;
              const updated = [...prev];
              const lastMsg = updated[lastIdx];
              if (lastMsg && lastMsg.role === 'model') {
                updated[lastIdx] = {
                  ...lastMsg,
                  content: lastMsg.content + chunk
                };
              }
              return updated;
            });
          }
        }
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped streaming intentionally
        return;
      }
      const errorMsg = err?.message || "I'm having trouble connecting to the server right now. Please try again later.";
      setMessages(prev => {
        const lastIdx = prev.length - 1;
        const updated = [...prev];
        if (lastIdx >= 0 && updated[lastIdx]?.role === 'model' && !updated[lastIdx]?.content) {
          updated[lastIdx] = { role: 'model', content: errorMsg };
        } else {
          updated.push({ role: 'model', content: errorMsg });
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setStatusMessage(null);
      abortControllerRef.current = null;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-forest-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-forest-800 transition-all hover:scale-105 active:scale-95 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'} z-50 border border-gold-500/30 group`}
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-gold-400 group-hover:rotate-6 transition-transform" />
      </button>

      {/* Chat Window */}
      <div className={`fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[460px] sm:h-[640px] bg-white sm:rounded-2xl shadow-2xl flex flex-col transition-all duration-200 transform origin-bottom-right z-50 sm:border border-ivory-300 overflow-hidden ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-850 text-white px-4 py-3 sm:rounded-t-2xl flex justify-between items-center shadow-md border-b border-forest-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-forest-800/80 rounded-xl flex items-center justify-center border border-forest-700/60 shadow-inner">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-sm tracking-tight text-white leading-none">
                  AurumFlow AI
                </h3>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-800/80 border border-gold-500/30 text-[9.5px] font-medium text-gold-300 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Fast Stream
                </span>
              </div>
              <p className="text-[11px] text-gold-400/90 font-sans mt-0.5">
                Instant Gold Loan Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                if (isStreaming) handleStopStreaming();
                setMessages([
                  { 
                    role: 'model', 
                    content: `Hi **${userName}**! 👋 I am your **AurumFlow AI Assistant**.\n\nI can help you explore our gold loan schemes, calculate accurate quotes, or guide you through your application. How can I help you today?` 
                  }
                ]);
              }}
              title="Reset conversation"
              className="text-forest-300 hover:text-white hover:bg-forest-800/80 p-2 rounded-lg transition-colors focus:outline-none"
              aria-label="Reset conversation"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-forest-300 hover:text-white hover:bg-forest-800/80 p-2 rounded-lg transition-colors focus:outline-none"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content based on Authentication */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-ivory-50">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gold-100 text-gold-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <Lock className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h4 className="text-lg font-bold text-forest-900 font-display mb-2">
              Sign In to Chat with AI
            </h4>
            <p className="text-xs sm:text-sm text-charcoal-600 mb-6 max-w-xs leading-relaxed">
              Our AI Assistant provides real-time personalized loan quotes, scheme comparisons, and guided application support.
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
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-ivory-50/70">
              {messages.map((msg, idx) => {
                const isLastModel = idx === messages.length - 1 && msg.role === 'model';
                const isCurrentlyStreamingThis = isLastModel && isStreaming;

                return (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-gold-500 text-white shadow-sm' : 'bg-forest-900 text-gold-400 shadow-sm'}`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {/* Live Status Pill */}
                        {isCurrentlyStreamingThis && statusMessage && (
                          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[11px] font-medium bg-forest-900/10 text-forest-900 border border-forest-900/15 animate-pulse">
                            <Sparkles className="w-3 h-3 text-gold-600 animate-spin" />
                            <span>{statusMessage}</span>
                          </div>
                        )}

                        <div className={`p-3 sm:p-3.5 rounded-2xl ${msg.role === 'user' ? 'bg-gold-500 text-white rounded-tr-none shadow-sm text-xs sm:text-[13.5px] leading-relaxed font-sans' : 'bg-white border border-ivory-200/90 text-charcoal-800 rounded-tl-none shadow-sm'}`}>
                          {msg.role === 'user' ? (
                            <div className="break-words">{msg.content}</div>
                          ) : (
                            <div className="text-xs sm:text-[13.5px] text-charcoal-800 font-sans leading-relaxed break-words">
                              {msg.content ? (
                                <>
                                  <ReactMarkdown
                                    components={{
                                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-charcoal-800 text-xs sm:text-[13.5px]">{children}</p>,
                                      strong: ({ children }) => <strong className="font-semibold text-forest-900">{children}</strong>,
                                      ul: ({ children }) => <ul className="space-y-1 my-2 ml-3.5 list-disc marker:text-gold-500 text-xs sm:text-[13.5px]">{children}</ul>,
                                      ol: ({ children }) => <ol className="space-y-1.5 my-2 ml-3.5 list-decimal marker:text-gold-600 font-medium text-xs sm:text-[13.5px]">{children}</ol>,
                                      li: ({ children }) => <li className="leading-relaxed font-normal text-charcoal-800">{children}</li>,
                                      h1: ({ children }) => <h4 className="font-display font-bold text-forest-900 mt-2.5 mb-1 text-xs sm:text-sm">{children}</h4>,
                                      h2: ({ children }) => <h4 className="font-display font-bold text-forest-900 mt-2.5 mb-1 text-xs sm:text-sm">{children}</h4>,
                                      h3: ({ children }) => <h5 className="font-display font-semibold text-forest-900 mt-2 mb-1 text-xs sm:text-[13.5px]">{children}</h5>,
                                      code: ({ children }) => <code className="bg-ivory-200 text-forest-900 px-1 py-0.5 rounded text-[11px] font-mono break-all">{children}</code>,
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                  {isCurrentlyStreamingThis && (
                                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gold-500 animate-pulse align-middle" />
                                  )}
                                </>
                              ) : isCurrentlyStreamingThis ? (
                                <div className="flex items-center gap-1.5 py-1 text-charcoal-500 text-xs">
                                  <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                  <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-2 h-2 bg-gold-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips (Shown on initial conversation) */}
            {messages.length <= 1 && !isStreaming && (
              <div className="px-3 py-2 bg-ivory-100/70 border-t border-ivory-200/60 flex flex-wrap gap-1.5 flex-shrink-0">
                {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-[11px] sm:text-[11.5px] bg-white hover:bg-gold-50 text-forest-900 hover:text-gold-800 border border-ivory-300 hover:border-gold-300 px-2.5 py-1 rounded-full transition-all text-left shadow-2xs hover:scale-[1.01] active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="p-2.5 sm:p-3 bg-white border-t border-ivory-200/90 sm:rounded-b-2xl flex-shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask loan questions, calculate quotes..."
                  className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-500 text-xs sm:text-[13px] bg-ivory-50/70 placeholder:text-charcoal-400"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={handleStopStreaming}
                    className="bg-red-500 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0 shadow-sm focus:outline-none active:scale-95"
                    aria-label="Stop generation"
                    title="Stop response"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-gold-500 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-gold-600 disabled:opacity-40 transition-colors flex-shrink-0 shadow-sm focus:outline-none active:scale-95"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4 ml-[-2px]" />
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
}
