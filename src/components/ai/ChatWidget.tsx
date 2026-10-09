'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Send, AlertCircle, Maximize2, Minimize2, 
  Trash2, Copy, Check, Mic, ChevronDown 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SetuAssistant } from '@/components/setu/SetuAssistant';
import Image from 'next/image';

type Role = 'user' | 'assistant';
interface Message {
  id: string;
  role: Role;
  content: string;
}

/** Small inline Setu avatar for chat messages */
function SetuAvatar({ size = 32 }: { size?: number }) {
  return (
    <div
      className="rounded-full shrink-0 shadow-sm overflow-hidden border border-gray-200 bg-white"
      style={{ width: size, height: size, position: 'relative' }}
    >
      <Image
        src="/images/setu/setu-character.png"
        alt="UK Setu"
        width={size * 2}
        height={size * 3}
        className="object-cover object-top"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

export function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isLoading, isOpen, isExpanded]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    setError('');
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) throw new Error("Please log in to use the AI assistant.");
        if (response.status === 403) throw new Error("You are not authorized to perform this action.");
        if (response.status === 429) throw new Error("Too many requests. Please try again later.");
        throw new Error(data.error || 'Failed to communicate with AI');
      }

      if (!data.success) {
        throw new Error(data.error || 'AI returned an error');
      }

      setMessages([...newMessages, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message
      }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Basic markdown parsing for bold and inline code
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      return (
        <p key={i} className="mb-2 last:mb-0 min-h-[1em] leading-relaxed">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={j} className="bg-gray-100 text-[#0A192F] px-1.5 py-0.5 rounded text-[13px] font-mono border border-gray-200">{part.slice(1, -1)}</code>;
            }
            if (part.trim().startsWith('* ') || part.trim().startsWith('- ')) {
              return <span key={j} className="pl-5 block relative before:content-['•'] before:absolute before:left-1 before:text-gray-400 text-gray-700">{part.replace(/^[\*-]\s/, '')}</span>;
            }
            if (/^\d+\.\s/.test(part.trim())) {
              return <span key={j} className="pl-5 block relative text-gray-700 font-medium before:content-[attr(data-prefix)]">
                {part.replace(/^\d+\.\s/, () => "")}
                <span className="absolute left-0 top-0 text-gray-500 font-normal">{part.match(/^\d+\.\s/)?.[0]}</span>
              </span>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const suggestedPrompts = [
    "Summarize all active projects in the pipeline.",
    "Show me projects with overdue action items.",
    "Give me the latest operational analytics.",
    "Which documents need my attention?",
  ];

  if (!user) return null;

  return (
    <>
      <SetuAssistant
        onOpenChat={() => setIsOpen(true)}
        isChatOpen={isOpen}
        userName={user.name}
      />
      
      {/* Backdrop for outside click */}
      <div 
        className={`fixed inset-0 z-40 bg-[#0A192F]/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      <div 
        role="dialog"
        aria-modal="true"
        className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 bg-white sm:rounded-2xl shadow-2xl border border-gray-200/60 z-50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] origin-bottom-right transform 
        ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-50 translate-y-10 pointer-events-none'}
        ${isExpanded ? 'w-full h-full sm:w-[850px] sm:h-[85vh]' : 'w-full h-full sm:w-[420px] sm:h-[650px]'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0A192F] to-[#112240] text-white sm:rounded-t-2xl shrink-0 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="flex items-center space-x-3 relative z-10">
          <div className="bg-white/10 rounded-lg backdrop-blur-sm border border-white/10 overflow-hidden w-9 h-9 relative">
            <Image
              src="/images/setu/setu-character.png"
              alt="UK Setu"
              width={72}
              height={108}
              className="object-cover object-top w-full h-full"
            />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] tracking-wide flex items-center gap-2">
              UK Setu
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-200 text-[10px] uppercase font-bold border border-blue-400/20">Beta</span>
            </h3>
            <p className="text-[10px] text-gray-300 flex items-center gap-1.5 mt-0.5 tracking-wider font-medium uppercase">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              UK Enterprise AI Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 relative z-10">
          {messages.length > 0 && (
            <button 
              onClick={clearChat} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white mr-1 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              title="New Chat"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block text-gray-300 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            title={isExpanded ? "Collapse" : "Expand"}
            aria-label={isExpanded ? "Collapse interface" : "Expand interface"}
          >
            {isExpanded ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            title="Close"
            aria-label="Close Assistant"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F8FAFC] flex flex-col space-y-5 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 animate-in fade-in duration-500 zoom-in-95">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-100 rounded-full blur-xl opacity-60"></div>
              <div className="relative w-24 h-24 bg-white shadow-xl rounded-[2rem] border border-gray-100/50 overflow-hidden rotate-2 transition-transform hover:rotate-3">
                <Image
                  src="/images/setu/setu-character.png"
                  alt="UK Setu"
                  width={192}
                  height={288}
                  className="object-cover object-top w-full h-full"
                  priority
                />
              </div>
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold text-lg mb-2">Nomoskar! 👋</h4>
              <p className="text-[14px] text-gray-500 max-w-[280px] mx-auto leading-relaxed">Moi SETU — UK Enterprise-or AI Assistant.<br/>Aji moi apunalukok ki dhorone help koribo paru?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-4 px-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-[13px] p-3.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-[#0A192F]/30 hover:shadow-md hover:-translate-y-0.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 group"
                >
                  <span className="text-[#0A192F] group-hover:text-blue-600 font-medium transition-colors">→</span> {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                {msg.role === 'assistant' && (
                  <div className="mr-3 mt-1">
                    <SetuAvatar size={32} />
                  </div>
                )}
                
                <div className={`relative max-w-[85%] rounded-2xl p-4 shadow-sm text-[14px] leading-relaxed 
                  ${msg.role === 'user' 
                    ? 'bg-[#0A192F] text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                  
                  {renderContent(msg.content)}
                  
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className={`absolute -right-12 top-2 p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 outline-none focus-visible:opacity-100 focus-visible:ring-2`}
                      title="Copy response"
                      aria-label="Copy to clipboard"
                    >
                      {copiedId === msg.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="mr-3 mt-1">
                  <SetuAvatar size={32} />
                </div>
                <div className="max-w-[85%] rounded-2xl p-4 bg-white border border-gray-200 text-gray-500 rounded-tl-sm flex flex-col justify-center shadow-sm min-w-[120px]">
                   <div className="flex items-center space-x-1.5 h-5">
                    <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="flex justify-center my-4 animate-in slide-in-from-bottom-2 fade-in">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] flex items-center space-x-3 shadow-sm max-w-[90%]">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 sm:rounded-b-2xl shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.02)]">
        <div className="relative flex items-end space-x-2 bg-[#F8FAFC] border border-gray-200 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400/40 transition-all shadow-inner">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about projects, docs, or analytics..."
            disabled={isLoading}
            className="flex-1 max-h-32 min-h-[44px] p-2.5 bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-[14px] text-gray-900 disabled:opacity-50 placeholder-gray-400"
            rows={1}
            style={{ overflow: 'hidden' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <div className="flex items-center shrink-0 mb-1 mr-1 space-x-1">
            <button
              type="button"
              disabled={true}
              className="p-2.5 text-gray-400 rounded-lg hover:bg-gray-200/50 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              title="Voice input coming soon"
              aria-label="Voice input (disabled)"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-[#0A192F] text-white rounded-lg hover:bg-[#112240] hover:shadow-md disabled:opacity-50 disabled:hover:bg-[#0A192F] disabled:hover:shadow-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-[11px] text-gray-400 font-medium">
            AI generated. Verify critical project data.
          </p>
          <div className="flex gap-4 text-[10px] text-gray-400">
            <span className="hidden sm:inline">Press <kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200">Enter</kbd> to send</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
