import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { sendChatMessage, type ChatMessage } from '../api';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: 'Hi there! I am your AurumFlow assistant. I can help you understand our gold loan schemes, calculate a quote, or guide you through the application. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'model', content: data.text }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to the server right now. Please try again later." }]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const newMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Send history + new message
    chatMutation.mutate({
      history: messages.slice(1), // exclude initial greeting from history if you want, but including it is fine too
      message: newMsg.content,
      // confirmationToken would be passed here if we had a global context for it,
      // but for this UI, the agent can't submit anyway unless the form generates a token.
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
      <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full h-full sm:w-[400px] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col transition-transform transform origin-bottom-right z-50 border border-ivory-200 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ivory-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gold-100 text-gold-700' : 'bg-forest-100 text-forest-700'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-gold-500 text-white rounded-tr-none' : 'bg-white border border-ivory-200 text-charcoal-900 rounded-tl-none shadow-sm'}`}>
                  {/* Basic markdown-like rendering for simplicity, or just plain text */}
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
              placeholder="Ask about our loan schemes..."
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
      </div>
    </>
  );
}
