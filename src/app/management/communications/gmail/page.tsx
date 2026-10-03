"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Mail, Star, Trash, Archive, RefreshCw, ChevronLeft, AlertCircle, X, Send, Paperclip, Bold, Italic, Underline, Link2 } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  snippet: string;
  isUnread: boolean;
  isStarred: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

export interface GmailMessageDetails extends GmailMessage {
  body?: {
    text: string;
    html: string;
  };
  attachments?: {
    attachmentId: string;
    filename: string;
    mimeType: string;
    size: number;
  }[];
}

export default function GmailWorkspace() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [messageDetails, setMessageDetails] = useState<GmailMessageDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async (token?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/integrations/gmail/messages${token ? `?pageToken=${token}` : ''}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'GMAIL_NOT_CONNECTED' || data.error === 'GMAIL_AUTH_FAILED') {
          setAuthError(true);
          return;
        }
        throw new Error(data.error || 'Failed to fetch messages');
      }
      
      setMessages(data.messages || []);
      setPageToken(data.nextPageToken || null);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
  }, [fetchMessages]);

  const loadMessage = async (msg: GmailMessage) => {
    setSelectedMessage(msg);
    setLoadingDetails(true);
    setMessageDetails(null);
    try {
      const res = await fetch(`/api/integrations/gmail/messages/${msg.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessageDetails(data);
      
      if (msg.isUnread) {
        // Mark as read in UI
        setMessages(msgs => msgs.map(m => m.id === msg.id ? { ...m, isUnread: false } : m));
        // Mark as read in API
        await fetch(`/api/integrations/gmail/messages/${msg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read' })
        });
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const performAction = async (msgId: string, action: string) => {
    try {
      if (action === 'trash' || action === 'archive') {
        setSelectedMessage(null);
        setMessages(msgs => msgs.filter(m => m.id !== msgId));
      } else if (action === 'star') {
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isStarred: true } : m));
        if (selectedMessage?.id === msgId) setSelectedMessage({ ...selectedMessage, isStarred: true });
      } else if (action === 'unstar') {
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isStarred: false } : m));
        if (selectedMessage?.id === msgId) setSelectedMessage({ ...selectedMessage, isStarred: false });
      } else if (action === 'unread') {
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isUnread: true } : m));
        setSelectedMessage(null); // Go back to list
      }

      await fetch(`/api/integrations/gmail/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMessageBody = (payload: any): { text: string, html: string } => {
    let text = '';
    let html = '';
    
    if (!payload) return { text, html };
    
    const decodeBase64 = (str: string) => {
      try {
        return decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
      } catch (e) {
        return '';
      }
    };

    if (payload.body?.data) {
      if (payload.mimeType === 'text/html') html = decodeBase64(payload.body.data);
      else if (payload.mimeType === 'text/plain') text = decodeBase64(payload.body.data);
    }
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          text = decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          html = decodeBase64(part.body.data);
        } else if (part.parts) {
          const nested = getMessageBody(part);
          if (nested.text) text = nested.text;
          if (nested.html) html = nested.html;
        }
      }
    }
    
    return { text, html };
  };

  const handleSend = async () => {
    if (!composeTo.trim()) {
      setSendError('Please enter at least one recipient.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = composeTo.split(',').map(e => e.trim()).filter(Boolean);
    if (toEmails.some(e => !emailRegex.test(e))) {
      setSendError('Please check the email addresses in the "To" field.');
      return;
    }

    setIsSending(true);
    setSendError('');
    
    try {
      const formData = new FormData();
      formData.append('to', composeTo);
      formData.append('cc', composeCc);
      formData.append('bcc', composeBcc);
      formData.append('subject', composeSubject);
      
      const textBody = editorRef.current ? editorRef.current.innerText : composeBody;
      const htmlBody = editorRef.current ? editorRef.current.innerHTML : composeBody;
      
      formData.append('textBody', textBody);
      formData.append('htmlBody', htmlBody);

      let totalSize = 0;
      for (const file of composeAttachments) {
        if (file.size > 20 * 1024 * 1024) {
          setSendError(`File ${file.name} is too large. Limit is 20MB.`);
          setIsSending(false);
          return;
        }
        totalSize += file.size;
        formData.append('attachments', file);
      }
      
      if (totalSize > 25 * 1024 * 1024) {
        setSendError('Total attachment size exceeds 25MB limit.');
        setIsSending(false);
        return;
      }

      const res = await fetch('/api/integrations/gmail/send', {
        method: 'POST',
        // Omit Content-Type to let browser set boundary for FormData
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'GMAIL_NOT_CONNECTED' || data.error === 'GMAIL_AUTH_FAILED') {
          throw new Error('Your Gmail connection needs to be reconnected.');
        }
        throw new Error('Unable to send the email. Please try again.');
      }
      
      alert('Email sent successfully.');
      
      setShowCompose(false);
      setComposeTo('');
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
      setComposeBody('');
      setComposeAttachments([]);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setSendError('');
    } catch (err: unknown) {
      const error = err as Error;
      setSendError(error.message || 'Unable to send the email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const closeCompose = () => {
    if (composeTo || composeSubject || composeBody) {
      if (!window.confirm('Discard this email?')) {
        return;
      }
    }
    setShowCompose(false);
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setSendError('');
  };

  if (authError) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3 bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-200">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <div>
            <h2 className="font-semibold text-lg">Gmail is not connected</h2>
            <p className="text-sm">Your Gmail connection needs to be configured or reconnected.</p>
          </div>
        </div>
        <a
          href="/api/integrations/gmail/auth"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Connect Gmail
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Gmail Workspace</h1>
          <button 
            onClick={() => fetchMessages()} 
            disabled={loading}
            className="p-2 hover:bg-muted rounded-full disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r p-4 hidden md:block">
          <button 
            onClick={() => setShowCompose(true)}
            className="w-full mb-6 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Compose
          </button>
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 bg-muted px-3 py-2 rounded-lg text-sm font-medium">
              <Mail className="w-4 h-4" /> Inbox
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 cursor-not-allowed">
              <Star className="w-4 h-4" /> Starred
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 cursor-not-allowed">
              <Archive className="w-4 h-4" /> Sent
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 cursor-not-allowed">
              <Trash className="w-4 h-4" /> Trash
            </a>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-card">
          {error ? (
            <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
              <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
              <p>Unable to load your Gmail inbox. Please try again.</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : selectedMessage ? (
            // Message View
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-muted rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-2 ml-auto">
                  <button 
                    onClick={() => performAction(selectedMessage.id, selectedMessage.isStarred ? 'unstar' : 'star')}
                    className="p-2 hover:bg-muted rounded-full"
                    title={selectedMessage.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-5 h-5 ${selectedMessage.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </button>
                  <button 
                    onClick={() => performAction(selectedMessage.id, 'unread')}
                    className="p-2 hover:bg-muted rounded-full"
                    title="Mark as unread"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => performAction(selectedMessage.id, 'archive')}
                    className="p-2 hover:bg-muted rounded-full"
                    title="Archive"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => performAction(selectedMessage.id, 'trash')}
                    className="p-2 hover:bg-muted rounded-full"
                    title="Trash"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="flex items-center justify-center p-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : messageDetails ? (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold">{selectedMessage.subject || '(No Subject)'}</h2>
                  <div className="flex flex-col gap-1 text-sm border-b pb-4">
                    <p><strong>From:</strong> {selectedMessage.from}</p>
                    <p><strong>To:</strong> {selectedMessage.to}</p>
                    <p className="text-muted-foreground">{new Date(selectedMessage.date).toLocaleString()}</p>
                  </div>
                  
                  <div className="prose max-w-none">
                    {(() => {
                      const { html, text } = getMessageBody(messageDetails.payload);
                      if (html) {
                        return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
                      }
                      return <pre className="whitespace-pre-wrap font-sans">{text}</pre>;
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            // Message List
            <div className="flex flex-col h-full">
              {loading && messages.length === 0 ? (
                <div className="p-8 flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Loading your inbox...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-8 flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Mail className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your inbox is empty.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => loadMessage(msg)}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${msg.isUnread ? 'bg-muted/20 font-semibold' : ''}`}
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); performAction(msg.id, msg.isStarred ? 'unstar' : 'star'); }}
                        className="flex-shrink-0"
                      >
                        <Star className={`w-5 h-5 ${msg.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                      </button>
                      
                      <div className="w-1/4 min-w-0 truncate">
                        {msg.from.split('<')[0].trim() || msg.from}
                      </div>
                      
                      <div className="flex-1 min-w-0 truncate">
                        <span>{msg.subject || '(No Subject)'}</span>
                        <span className="text-muted-foreground font-normal ml-2">- {DOMPurify.sanitize(msg.snippet)}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                        {new Date(msg.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b border-slate-200">
              <h3 className="font-semibold text-sm text-slate-800">New Message</h3>
              <button 
                onClick={closeCompose}
                className="text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded p-1 transition-colors"
                disabled={isSending}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col flex-1 overflow-auto p-4 space-y-4 bg-white">
              {sendError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                  {sendError}
                </div>
              )}
              
              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm w-16">To:</span>
                <input 
                  type="text" 
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="flex-1 bg-white border-none focus:outline-none text-sm text-slate-900"
                  placeholder="recipient@example.com"
                  disabled={isSending}
                />
              </div>
              
              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm w-16">Cc:</span>
                <input 
                  type="text" 
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className="flex-1 bg-white border-none focus:outline-none text-sm text-slate-900"
                  disabled={isSending}
                />
              </div>
              
              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm w-16">Bcc:</span>
                <input 
                  type="text" 
                  value={composeBcc}
                  onChange={(e) => setComposeBcc(e.target.value)}
                  className="flex-1 bg-white border-none focus:outline-none text-sm text-slate-900"
                  disabled={isSending}
                />
              </div>

              <div className="flex items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500 text-sm w-16">Subject:</span>
                <input 
                  type="text" 
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="flex-1 bg-white border-none focus:outline-none text-sm font-medium text-slate-900"
                  disabled={isSending}
                />
              </div>

              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-slate-50 p-1 mt-2">
                <button
                  onClick={() => document.execCommand('bold', false)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.execCommand('italic', false)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => document.execCommand('underline', false)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <button
                  onClick={() => {
                    const url = prompt('Enter link URL:');
                    if (url) document.execCommand('createLink', false, url);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors"
                  title="Insert Link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              </div>

              {/* Rich Text Editor area */}
              <div 
                ref={editorRef}
                contentEditable={!isSending}
                onInput={(e) => setComposeBody(e.currentTarget.innerHTML)}
                className="flex-1 min-h-[300px] w-full resize-none bg-white focus:outline-none text-sm p-2 border border-slate-200 rounded-md overflow-y-auto text-slate-900"
                style={{ outline: 'none' }}
              />

              {/* Attachments List */}
              {composeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {composeAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-700">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                      <button
                        onClick={() => setComposeAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 ml-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setComposeAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                    e.target.value = ''; // Reset for re-selection
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={closeCompose}
                disabled={isSending}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md text-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
