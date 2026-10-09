"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Mail, Star, Trash, Archive, RefreshCw, ChevronLeft, AlertCircle, X, Send, Paperclip, Bold, Italic, Underline, Link2, Clock, CalendarClock, Reply, ReplyAll, Forward, FileEdit } from 'lucide-react';
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

export interface DraftAttachmentUI {
  id?: string;
  name: string;
  size: number;
  type: string;
  file?: File;
  status: 'uploading' | 'uploaded' | 'error';
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
  const [currentLabel, setCurrentLabel] = useState('INBOX');

  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<DraftAttachmentUI[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftRevision, setDraftRevision] = useState<number>(0);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const inFlightRef = React.useRef(false);
  const draftIdRef = React.useRef<string | null>(null);
  const revisionRef = React.useRef<number>(0);

  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [threadId, setThreadId] = useState('');
  const [inReplyTo, setInReplyTo] = useState('');
  const [references, setReferences] = useState('');
  const [forwardedMessageId, setForwardedMessageId] = useState('');
  const [isReplyAll, setIsReplyAll] = useState(false);

  const editorRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => { draftIdRef.current = draftId; }, [draftId]);
  useEffect(() => { revisionRef.current = draftRevision; }, [draftRevision]);

  useEffect(() => {
    if (!showCompose || isSending) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    // If not idle, go back to idle to let user know it's no longer 'saved' 
    // unless they didn't type anything. But this effect fires on any change.
    setSavingStatus('idle');
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (inFlightRef.current || !showCompose) return;
      
      const bodyText = editorRef.current?.innerText?.trim() || composeBody.replace(/<[^>]*>?/gm, '').trim();
      const isTotallyEmpty = !composeTo && !composeCc && !composeBcc && !composeSubject && !bodyText;
      
      if (isTotallyEmpty && !draftIdRef.current) return;
      
      inFlightRef.current = true;
      setSavingStatus('saving');

      try {
        const payload = {
          to: composeTo,
          cc: composeCc,
          bcc: composeBcc,
          subject: composeSubject,
          htmlBody: editorRef.current ? editorRef.current.innerHTML : composeBody,
          threadId: threadId || undefined,
          inReplyTo: inReplyTo || undefined,
          references: references || undefined
        };

        if (!draftIdRef.current) {
          const res = await fetch('/api/integrations/gmail/drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          
          setDraftId(data.draft.id);
          setDraftRevision(data.revision);
          draftIdRef.current = data.draft.id;
          revisionRef.current = data.revision;
          setSavingStatus('saved');
        } else {
          const res = await fetch(`/api/integrations/gmail/drafts/${draftIdRef.current}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...payload,
              revision: revisionRef.current
            })
          });
          
          if (res.status === 409) {
            setSavingStatus('error');
            return;
          }
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          
          setDraftRevision(data.revision);
          revisionRef.current = data.revision;
          setSavingStatus('saved');
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setSavingStatus('error');
      } finally {
        inFlightRef.current = false;
      }
    }, 3000);
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [composeTo, composeCc, composeBcc, composeSubject, composeBody, showCompose, isSending, threadId, inReplyTo, references]);

  const fetchMessages = useCallback(async (token?: string | null, label = currentLabel) => {
    try {
      setLoading(true);
      setError(null);
      
      if (label === 'SCHEDULED') {
        const res = await fetch(`/api/integrations/gmail/schedule`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch scheduled emails');
        }
        
        const mapped = data.emails.map((e: any) => ({
          id: e.id,
          threadId: e.id,
          subject: e.subject,
          from: 'You (Scheduled)',
          to: e.to,
          date: e.scheduledAt,
          snippet: `[${e.status}] Scheduled for ${new Date(e.scheduledAt).toLocaleString()}`,
          isUnread: false,
          isStarred: false,
          status: e.status
        }));
        
        setMessages(mapped);
        setPageToken(null);
      } else if (label === 'DRAFTS') {
        const res = await fetch(`/api/integrations/gmail/drafts`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch drafts');
        }
        
        const mapped = data.drafts.map((d: any) => ({
          id: d.id,
          threadId: d.threadId || '',
          subject: d.subject || '(No Subject)',
          from: 'Draft',
          to: d.to || '(No recipients)',
          date: d.updatedAt,
          snippet: d.textBody ? d.textBody.substring(0, 100) : '',
          isUnread: false,
          isStarred: false,
          status: 'DRAFT',
          htmlBody: d.htmlBody
        }));
        
        setMessages(mapped);
        setPageToken(null);
      } else {
        const res = await fetch(`/api/integrations/gmail/messages?label=${label}${token ? `&pageToken=${token}` : ''}`);
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
        if (data.emailAddress) {
          setCurrentUserEmail(data.emailAddress);
        }
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentLabel]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages(null, currentLabel);
  }, [fetchMessages, currentLabel]);

  const handleOpenDraft = async (msg: any) => {
    try {
      console.log('HANDLING OPEN DRAFT ID:', msg.id);
      const res = await fetch(`/api/integrations/gmail/drafts/${msg.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const d = data.draft;
      
      setComposeTo(d.to === '(No recipients)' ? '' : d.to);
      setComposeCc(d.cc || '');
      setComposeBcc(d.bcc || '');
      setComposeSubject(d.subject || '');
      setComposeBody(d.htmlBody || '');
      
      setComposeAttachments((d.attachments || []).map((att: { id: string; filename: string; size: number; mimeType: string }) => ({
        id: att.id,
        name: att.filename,
        size: att.size,
        type: att.mimeType,
        status: 'uploaded'
      })));

      setDraftId(d.id);
      setDraftRevision(d.revision);
      setThreadId(d.threadId || '');
      setInReplyTo(d.inReplyTo || '');
      setReferences(d.references || '');
      setIsReplyAll(d.isReplyAll || false);
      setForwardedMessageId(d.forwardedMessageId || '');
      
      draftIdRef.current = d.id;
      revisionRef.current = d.revision;
      
      setShowCompose(true);
      
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = d.htmlBody || '';
        }
      }, 10);
    } catch (err: unknown) {
      console.error('Failed to open draft', err);
    }
  };

  const loadMessage = async (msg: GmailMessage) => {
    setSelectedMessage(msg);
    setLoadingDetails(true);
    setMessageDetails(null);
    try {
      if (currentLabel === 'SCHEDULED') {
        // Just show basic info
        setMessageDetails({
          ...msg,
          body: {
            text: `This email is scheduled to be sent.\n\nStatus: ${(msg as any).status}\nScheduled for: ${new Date(msg.date).toLocaleString()}\n\nTo: ${msg.to}`,
            html: ''
          }
        });
      } else {
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
      } // close else block
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const performAction = async (msgId: string, action: string) => {
    try {
      if (action === 'cancel_scheduled') {
        const res = await fetch(`/api/integrations/gmail/schedule?id=${msgId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, status: 'CANCELLED', snippet: m.snippet.replace('[SCHEDULED]', '[CANCELLED]') } : m));
          if (selectedMessage?.id === msgId) {
            setSelectedMessage(null);
          }
        } else {
          alert('Failed to cancel scheduled email.');
        }
        return;
      }
      
      if (currentLabel === 'DRAFTS' && action === 'trash') {
        if (!window.confirm("Delete this draft permanently? This action cannot be undone.")) {
          return;
        }
        const res = await fetch(`/api/integrations/gmail/drafts/${msgId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setMessages(msgs => msgs.filter(m => m.id !== msgId));
        } else {
          alert('Failed to delete draft.');
        }
        return;
      }
      
      if (action === 'trash' || action === 'archive' || action === 'restore' || action === 'delete_permanently') {
        if (action === 'delete_permanently' && !window.confirm("Delete this email permanently? This action cannot be undone.")) {
          return;
        }
        setSelectedMessage(null);
        setMessages(msgs => msgs.filter(m => m.id !== msgId));
      } else if (action === 'star') {
        setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isStarred: true } : m));
        if (selectedMessage?.id === msgId) setSelectedMessage({ ...selectedMessage, isStarred: true });
      } else if (action === 'unstar') {
        if (currentLabel === 'STARRED') {
          setSelectedMessage(null);
          setMessages(msgs => msgs.filter(m => m.id !== msgId));
        } else {
          setMessages(msgs => msgs.map(m => m.id === msgId ? { ...m, isStarred: false } : m));
          if (selectedMessage?.id === msgId) setSelectedMessage({ ...selectedMessage, isStarred: false });
        }
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

  const handleReply = (type: 'reply' | 'replyAll' | 'forward') => {
    if (!messageDetails || !selectedMessage) return;
    
    setComposeAttachments([]);

    const getHeader = (name: string) => {
      const h = messageDetails.payload?.headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return h ? h.value : '';
    };

    const originalFrom = getHeader('from');
    const originalTo = getHeader('to');
    const originalCc = getHeader('cc');
    const originalReplyTo = getHeader('reply-to');
    const messageId = getHeader('message-id');
    const originalReferences = getHeader('references');
    
    const sender = originalReplyTo || originalFrom;

    if (type === 'reply' || type === 'replyAll') {
      setIsReplyAll(type === 'replyAll');
      setThreadId(messageDetails.threadId);
      setInReplyTo(messageId);
      setReferences(originalReferences ? `${originalReferences} ${messageId}` : messageId);
      setForwardedMessageId('');

      if (type === 'reply') {
        setComposeTo(sender);
        setComposeCc('');
      } else {
        const allTo = originalTo.split(',').map((e: string) => e.trim()).filter(Boolean);
        const allCc = originalCc.split(',').map((e: string) => e.trim()).filter(Boolean);
        
        const extractEmailAddress = (addr: string) => {
          const match = addr.match(/<([^>]+)>/);
          return match ? match[1].trim().toLowerCase() : addr.trim().toLowerCase();
        };
        const normalizedCurrentUser = currentUserEmail.trim().toLowerCase();
        const isMe = (addr: string) => extractEmailAddress(addr) === normalizedCurrentUser;
        
        const newTo: string[] = [];
        if (!isMe(sender)) {
          newTo.push(sender);
        }
        
        const addrsNormalizedTo = new Set(newTo.map(extractEmailAddress));
        
        allTo.forEach((addr: string) => {
          if (!isMe(addr) && !addrsNormalizedTo.has(extractEmailAddress(addr))) {
            newTo.push(addr);
            addrsNormalizedTo.add(extractEmailAddress(addr));
          }
        });
        
        const newCc: string[] = [];
        allCc.forEach((addr: string) => {
          if (!isMe(addr) && !addrsNormalizedTo.has(extractEmailAddress(addr))) {
            newCc.push(addr);
            addrsNormalizedTo.add(extractEmailAddress(addr));
          }
        });
        
        setComposeTo(newTo.join(', '));
        setComposeCc(newCc.join(', '));
      }
      
      const subject = selectedMessage.subject.toLowerCase().startsWith('re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`;
      setComposeSubject(subject);
    } else if (type === 'forward') {
      setThreadId('');
      setInReplyTo('');
      setReferences('');
      setForwardedMessageId(messageDetails.id);
      
      setComposeTo('');
      setComposeCc('');
      const subject = selectedMessage.subject.toLowerCase().startsWith('fwd:') ? selectedMessage.subject : `Fwd: ${selectedMessage.subject}`;
      setComposeSubject(subject);
    }

    setComposeBcc('');
    
    const { html, text } = getMessageBody(messageDetails.payload);
    const bodyContent = html || text.replace(/\n/g, '<br>');
    
    const dateStr = new Date(selectedMessage.date).toLocaleString();
    const quotedBody = `<br><br><div class="gmail_quote" style="border-left: 1px solid #ccc; padding-left: 1ex; margin-left: 1ex;">
      On ${dateStr} ${originalFrom} wrote:<br>
      ${DOMPurify.sanitize(bodyContent)}
    </div>`;
    
    setComposeBody(quotedBody);
    setShowCompose(true);
    
    setDraftId(null);
    setDraftRevision(0);
    setSavingStatus('idle');
    draftIdRef.current = null;
    revisionRef.current = 0;
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = quotedBody;
      }
    }, 10);
  };

  const handleSend = async () => {
    if (!composeTo.trim()) {
      setSendError('Please enter at least one recipient.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const toEmails = composeTo.split(',').map(e => e.trim()).filter(Boolean);
    if (toEmails.some(e => {
      const match = e.match(/<([^>]+)>/);
      const emailToTest = match ? match[1] : e;
      return !emailRegex.test(emailToTest);
    })) {
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
      
      if (threadId) formData.append('threadId', threadId);
      if (inReplyTo) formData.append('inReplyTo', inReplyTo);
      if (references) formData.append('references', references);
      if (forwardedMessageId) formData.append('forwardedMessageId', forwardedMessageId);
      if (isReplyAll) formData.append('isReplyAll', 'true');
      
      const textBody = editorRef.current ? editorRef.current.innerText : composeBody;
      const htmlBody = editorRef.current ? editorRef.current.innerHTML : composeBody;
      
      formData.append('textBody', textBody);
      formData.append('htmlBody', htmlBody);
      if (draftIdRef.current) {
        formData.append('draftId', draftIdRef.current);
      }

      if (composeAttachments.some(a => a.status === 'uploading')) {
        setSendError('Please wait for all attachments to finish uploading.');
        setIsSending(false);
        return;
      }
      if (composeAttachments.some(a => a.status === 'error')) {
        setSendError('Some attachments failed to upload. Please remove them and try again.');
        setIsSending(false);
        return;
      }

      let totalSize = 0;
      for (const att of composeAttachments) {
        if (att.size > 20 * 1024 * 1024) {
          setSendError(`File ${att.name} is too large. Limit is 20MB.`);
          setIsSending(false);
          return;
        }
        totalSize += att.size;
      }
      
      if (totalSize > 25 * 1024 * 1024) {
        setSendError('Total attachment size exceeds 25MB limit.');
        setIsSending(false);
        return;
      }

      if (scheduledDate) {
        formData.append('scheduledAt', new Date(scheduledDate).toISOString());
        const res = await fetch('/api/integrations/gmail/schedule', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to schedule email.');
        alert('Email scheduled successfully.');
      } else {
        const res = await fetch('/api/integrations/gmail/send', {
          method: 'POST',
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
      }
      
      const currentDraftId = draftIdRef.current;
      
      setShowCompose(false);
      setComposeTo('');
      setComposeCc('');
      setComposeBcc('');
      setComposeSubject('');
      setComposeBody('');
      setScheduledDate('');
      setComposeAttachments([]);
      setThreadId('');
      setInReplyTo('');
      setReferences('');
      setForwardedMessageId('');
      setIsReplyAll(false);
      
      setDraftId(null);
      setDraftRevision(0);
      setSavingStatus('idle');
      draftIdRef.current = null;
      revisionRef.current = 0;
      
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setSendError('');

      if (currentDraftId) {
        fetch(`/api/integrations/gmail/drafts/${currentDraftId}`, { method: 'DELETE' }).catch(() => {});
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSendError(error.message || 'Unable to send the email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const closeCompose = async () => {
    if (composeTo || composeSubject || composeBody) {
      if (!window.confirm('Discard this email?')) {
        return;
      }
    }

    const currentDraftId = draftIdRef.current;

    setShowCompose(false);
    setComposeTo('');
    setComposeCc('');
    setComposeBcc('');
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
    setThreadId('');
    setInReplyTo('');
    setReferences('');
    setForwardedMessageId('');
    setIsReplyAll(false);

    setDraftId(null);
    setDraftRevision(0);
    setSavingStatus('idle');
    draftIdRef.current = null;
    revisionRef.current = 0;

    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setSendError('');

    if (currentDraftId) {
      try {
        await fetch(`/api/integrations/gmail/drafts/${currentDraftId}`, { method: 'DELETE' });
      } catch (e) {}
    }
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
            onClick={() => {
              setShowCompose(true);
              setDraftId(null);
              setDraftRevision(0);
              setSavingStatus('idle');
              draftIdRef.current = null;
              revisionRef.current = 0;
              setComposeTo('');
              setComposeCc('');
              setComposeBcc('');
              setComposeSubject('');
              setComposeBody('');
              setThreadId('');
              setInReplyTo('');
              setReferences('');
              setForwardedMessageId('');
              setIsReplyAll(false);
              if (editorRef.current) {
                editorRef.current.innerHTML = '';
              }
            }}
            className="w-full mb-6 bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Compose
          </button>
          <nav className="space-y-1">
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('INBOX'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'INBOX' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Mail className="w-4 h-4" /> Inbox
            </button>
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('STARRED'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'STARRED' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Star className="w-4 h-4" /> Starred
            </button>
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('DRAFTS'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'DRAFTS' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <FileEdit className="w-4 h-4" /> Drafts
            </button>
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('SENT'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'SENT' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Send className="w-4 h-4" /> Sent
            </button>
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('SCHEDULED'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'SCHEDULED' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Clock className="w-4 h-4" /> Scheduled
            </button>
            <button 
              onClick={() => { setSelectedMessage(null); setCurrentLabel('TRASH'); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentLabel === 'TRASH' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Trash className="w-4 h-4" /> Trash
            </button>
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
                  {currentLabel === 'TRASH' ? (
                    <>
                      <button 
                        onClick={() => performAction(selectedMessage.id, 'restore')}
                        className="p-2 hover:bg-muted rounded-full text-green-600"
                        title="Restore"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => performAction(selectedMessage.id, 'delete_permanently')}
                        className="p-2 hover:bg-muted rounded-full text-red-600"
                        title="Delete permanently"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </>
                  ) : currentLabel === 'SCHEDULED' ? (
                    <button 
                      onClick={() => performAction(selectedMessage.id, 'cancel_scheduled')}
                      className="p-2 hover:bg-muted rounded-full text-red-600"
                      title="Cancel scheduled email"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => performAction(selectedMessage.id, 'archive')}
                        className="p-2 hover:bg-muted rounded-full"
                        title="Archive"
                      >
                        <Archive className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleReply('reply')}
                        className="p-2 hover:bg-muted rounded-full"
                        title="Reply"
                      >
                        <Reply className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleReply('replyAll')}
                        className="p-2 hover:bg-muted rounded-full"
                        title="Reply All"
                      >
                        <ReplyAll className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleReply('forward')}
                        className="p-2 hover:bg-muted rounded-full"
                        title="Forward"
                      >
                        <Forward className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => performAction(selectedMessage.id, 'trash')}
                        className="p-2 hover:bg-muted rounded-full"
                        title="Trash"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </>
                  )}
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
                    {messageDetails.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'cc') && (
                      <p><strong>CC:</strong> {messageDetails.payload.headers.find((h: any) => h.name.toLowerCase() === 'cc')?.value}</p>
                    )}
                    {messageDetails.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'bcc') && (
                      <p><strong>BCC:</strong> {messageDetails.payload.headers.find((h: any) => h.name.toLowerCase() === 'bcc')?.value}</p>
                    )}
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
                      onClick={() => {
                        if (currentLabel === 'DRAFTS') {
                          handleOpenDraft(msg);
                        } else {
                          loadMessage(msg);
                        }
                      }}
                      className={`flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer ${msg.isUnread ? 'bg-muted/20 font-semibold' : ''}`}
                    >
                      {currentLabel === 'DRAFTS' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); performAction(msg.id, 'trash'); }}
                          className="flex-shrink-0 p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500"
                          title="Delete draft"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); performAction(msg.id, msg.isStarred ? 'unstar' : 'star'); }}
                          className="flex-shrink-0"
                        >
                          <Star className={`w-5 h-5 ${msg.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        </button>
                      )}
                      
                      <div className="w-1/4 min-w-0 truncate">
                        {(currentLabel === 'SENT' || currentLabel === 'SCHEDULED')
                          ? `To: ${msg.to?.split('<')[0].trim() || msg.to}`
                          : (msg.from?.split('<')[0].trim() || msg.from)}
                      </div>
                      
                      <div className="flex-1 min-w-0 truncate flex items-center gap-2">
                        {(msg as any).status && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase border flex-shrink-0 ${
                            (msg as any).status === 'SENT' ? 'bg-green-50 text-green-700 border-green-200' :
                            (msg as any).status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                            (msg as any).status === 'CANCELLED' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {(msg as any).status}
                          </span>
                        )}
                        <span className="truncate">{msg.subject || '(No Subject)'}</span>
                        <span className="text-muted-foreground font-normal truncate max-w-[40%]">- {DOMPurify.sanitize(msg.snippet)}</span>
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
                  placeholder="Subject"
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
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0) {
                      alert('Please select some text to create a link.');
                      return;
                    }
                    const range = selection.getRangeAt(0);

                    const url = prompt('Enter link URL:');
                    if (!url) return;

                    let normalizedUrl = url.trim();
                    if (!normalizedUrl) return;

                    const lowerUrl = normalizedUrl.toLowerCase();
                    if (lowerUrl.startsWith('javascript:') || 
                        lowerUrl.startsWith('data:') || 
                        lowerUrl.startsWith('vbscript:')) {
                      alert('Unsafe URL scheme detected.');
                      return;
                    }

                    if (!lowerUrl.startsWith('http://') && 
                        !lowerUrl.startsWith('https://') && 
                        !lowerUrl.startsWith('mailto:')) {
                      normalizedUrl = 'https://' + normalizedUrl;
                    }

                    selection.removeAllRanges();
                    selection.addRange(range);

                    document.execCommand('createLink', false, normalizedUrl);
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
                  {composeAttachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-sm text-slate-700">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[200px]" title={att.name}>{att.name}</span>
                      <span className="text-xs text-slate-500 ml-1">
                        ({(att.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                      {att.status === 'uploading' && <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500 ml-1" />}
                      {att.status === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-500 ml-1" />}
                      <button
                        onClick={async () => {
                          if (att.id && draftIdRef.current) {
                            try {
                              const res = await fetch(`/api/integrations/gmail/drafts/${draftIdRef.current}/attachments/${att.id}?revision=${revisionRef.current}`, {
                                method: 'DELETE'
                              });
                              if (!res.ok) throw new Error('Failed to delete');
                              const data = await res.json();
                              setDraftRevision(data.revision);
                              revisionRef.current = data.revision;
                            } catch (e) {
                              console.error('Delete attachment error', e);
                              alert('Failed to delete attachment');
                              return;
                            }
                          }
                          setComposeAttachments(prev => prev.filter((_, i) => i !== idx));
                        }}
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
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleSend}
                    disabled={isSending}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    {scheduledDate ? <CalendarClock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {isSending ? 'Processing...' : scheduledDate ? 'Schedule' : 'Send'}
                  </button>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.currentTarget.files;
                      if (files && files.length > 0) {
                        const newFiles = Array.from(files);
                        
                        const currentSize = composeAttachments.reduce((acc, a) => acc + a.size, 0);
                        const newSize = newFiles.reduce((acc, f) => acc + f.size, 0);
                        if (currentSize + newSize > 25 * 1024 * 1024) {
                          setSendError('Total attachment size exceeds 25MB limit.');
                          e.currentTarget.value = '';
                          return;
                        }

                        // Add to UI state as uploading
                        const newUIAtts: DraftAttachmentUI[] = newFiles.map(f => ({
                          name: f.name,
                          size: f.size,
                          type: f.type,
                          file: f,
                          status: 'uploading'
                        }));
                        
                        setComposeAttachments(prev => [...prev, ...newUIAtts]);

                        // Ensure we have a draft ID by triggering autosave early if needed
                        let currentDraftId = draftIdRef.current;
                        let currentRevision = revisionRef.current;
                        
                        if (!currentDraftId) {
                          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                          setSavingStatus('saving');
                          const payload = {
                            to: composeTo,
                            cc: composeCc,
                            bcc: composeBcc,
                            subject: composeSubject,
                            htmlBody: editorRef.current ? editorRef.current.innerHTML : composeBody,
                          };
                          try {
                            const res = await fetch('/api/integrations/gmail/drafts', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            if (!res.ok) throw new Error('Failed to create draft');
                            const data = await res.json();
                            currentDraftId = data.draft.id;
                            currentRevision = data.revision;
                            setDraftId(currentDraftId);
                            setDraftRevision(currentRevision);
                            draftIdRef.current = currentDraftId;
                            revisionRef.current = currentRevision;
                            setSavingStatus('saved');
                          } catch (err) {
                            console.error('Failed to create draft for attachment', err);
                            // Set error on new attachments
                            setComposeAttachments(prev => prev.map(a => 
                              newUIAtts.find(na => na.name === a.name && na.size === a.size) 
                                ? { ...a, status: 'error' } 
                                : a
                            ));
                            return;
                          }
                        }

                        // Upload each file
                        for (const file of newFiles) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('revision', String(revisionRef.current));
                          
                          try {
                            const res = await fetch(`/api/integrations/gmail/drafts/${draftIdRef.current}/attachments`, {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!res.ok) throw new Error('Upload failed');
                            const data = await res.json();
                            
                            setDraftRevision(data.revision);
                            revisionRef.current = data.revision;
                            
                            setComposeAttachments(prev => prev.map(a => 
                              a.name === file.name && a.size === file.size && a.status === 'uploading'
                                ? { ...a, id: data.attachment.id, status: 'uploaded' }
                                : a
                            ));
                          } catch (err) {
                            console.error('Upload error', err);
                            setComposeAttachments(prev => prev.map(a => 
                              a.name === file.name && a.size === file.size && a.status === 'uploading'
                                ? { ...a, status: 'error' }
                                : a
                            ));
                          }
                        }
                      }
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''; // Reset for re-selection
                      }
                    }}
                  />
                  <button
                    type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                  disabled={isSending}
                  className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors"
                  title="Attach files"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                </div>
                <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                  <div className="flex items-center text-sm text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 flex-1 sm:flex-none">
                    <label htmlFor="scheduledAt" className="mr-2 shrink-0">Schedule:</label>
                    <input 
                      id="scheduledAt"
                      type="datetime-local" 
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                      className="bg-transparent border-none outline-none w-full text-slate-700 text-xs sm:text-sm"
                      disabled={isSending}
                    />
                    {scheduledDate && (
                      <button 
                        onClick={() => setScheduledDate('')}
                        className="ml-1 text-slate-400 hover:text-slate-600"
                        title="Clear schedule"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center text-xs text-slate-400 ml-2">
                    {savingStatus === 'saving' && <span>Saving...</span>}
                    {savingStatus === 'saved' && <span>Saved</span>}
                    {savingStatus === 'error' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Error saving</span>}
                  </div>

                  <button 
                    onClick={closeCompose}
                    disabled={isSending}
                    className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md text-sm transition-colors shrink-0 ml-2"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
