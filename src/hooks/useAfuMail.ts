import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AFUMAIL_API_BASE = 'https://vfcukxlzqfeehhkiogpf.supabase.co/functions/v1/afumail-api';

export interface MailboxInfo {
  email_address: string;
  storage_used: number;
  storage_limit: number;
}

export interface EmailFolder {
  id: string;
  name: string;
  unread_count: number;
  total_count: number;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  subject: string;
  preview: string;
  timestamp: string;
  read_status: boolean;
  starred: boolean;
  has_attachments: boolean;
}

export interface EmailDetail {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_html: string;
  body_text: string;
  attachments: Attachment[];
  timestamp: string;
  read_status: boolean;
  starred: boolean;
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url: string;
}

export interface ComposeEmail {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text: string;
  body_html?: string;
  attachments?: string[];
}

export interface SearchParams {
  keyword?: string;
  sender?: string;
  date_from?: string;
  date_to?: string;
}

export function useAfuMail() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const getHeaders = useCallback(async () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Get the current session access token
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else if (sessionToken) {
      headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    if (user?.id) {
      headers['X-User-Id'] = user.id;
    }
    return headers;
  }, [sessionToken, user?.id]);

  const authenticate = useCallback(async () => {
    if (!user?.id) {
      toast.error('Please sign in to access AfuMail');
      return false;
    }

    try {
      setLoading(true);
      
      // Get the current session access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No valid session');
      }
      
      const response = await fetch(`${AFUMAIL_API_BASE}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('AfuMail auth response:', errorData);
        throw new Error(errorData.error || 'Failed to authenticate with AfuMail');
      }

      const data = await response.json();
      setSessionToken(data.token);
      return true;
    } catch (error) {
      console.error('AfuMail auth error:', error);
      toast.error('Failed to connect to AfuMail');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const getMailboxInfo = useCallback(async (): Promise<MailboxInfo | null> => {
    try {
      setLoading(true);
      const response = await fetch(`${AFUMAIL_API_BASE}/mailbox`, {
        headers: await getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch mailbox info');
      return await response.json();
    } catch (error) {
      console.error('Get mailbox error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const getFolders = useCallback(async (): Promise<EmailFolder[]> => {
    try {
      const response = await fetch(`${AFUMAIL_API_BASE}/mail/folders`, {
        headers: await getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      return data.folders || [];
    } catch (error) {
      console.error('Get folders error:', error);
      return [];
    }
  }, [getHeaders]);

  const getMessages = useCallback(async (
    folder: string = 'inbox',
    page: number = 1,
    limit: number = 20
  ): Promise<{ messages: EmailMessage[]; total: number; has_more: boolean }> => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        folder,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${AFUMAIL_API_BASE}/mail/messages?${params}`, {
        headers: await getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch messages');
      return await response.json();
    } catch (error) {
      console.error('Get messages error:', error);
      return { messages: [], total: 0, has_more: false };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const getMessage = useCallback(async (messageId: string): Promise<EmailDetail | null> => {
    try {
      setLoading(true);
      const response = await fetch(`${AFUMAIL_API_BASE}/mail/message/${messageId}`, {
        headers: await getHeaders(),
      });

      if (!response.ok) throw new Error('Failed to fetch message');
      return await response.json();
    } catch (error) {
      console.error('Get message error:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const sendEmail = useCallback(async (email: ComposeEmail): Promise<{ success: boolean; message_id?: string }> => {
    try {
      setLoading(true);
      const response = await fetch(`${AFUMAIL_API_BASE}/mail/send`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(email),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      const data = await response.json();
      toast.success('Email sent successfully');
      return { success: true, message_id: data.message_id };
    } catch (error: any) {
      console.error('Send email error:', error);
      toast.error(error.message || 'Failed to send email');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const saveDraft = useCallback(async (email: ComposeEmail, draftId?: string): Promise<{ success: boolean; draft_id?: string }> => {
    try {
      setLoading(true);
      const url = draftId 
        ? `${AFUMAIL_API_BASE}/mail/draft/${draftId}`
        : `${AFUMAIL_API_BASE}/mail/draft`;
      
      const response = await fetch(url, {
        method: draftId ? 'PUT' : 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(email),
      });

      if (!response.ok) throw new Error('Failed to save draft');
      
      const data = await response.json();
      toast.success('Draft saved');
      return { success: true, draft_id: data.draft_id };
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${AFUMAIL_API_BASE}/mail/draft/${draftId}`, {
        method: 'DELETE',
        headers: await getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error('Delete draft error:', error);
      return false;
    }
  }, [getHeaders]);

  const performAction = useCallback(async (
    messageId: string,
    action: 'read' | 'unread' | 'move' | 'delete' | 'star' | 'unstar' | 'restore',
    targetFolder?: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${AFUMAIL_API_BASE}/mail/action`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({
          message_id: messageId,
          action,
          target_folder: targetFolder,
        }),
      });

      if (!response.ok) throw new Error('Action failed');
      return true;
    } catch (error) {
      console.error('Perform action error:', error);
      return false;
    }
  }, [getHeaders]);

  const searchEmails = useCallback(async (params: SearchParams): Promise<EmailMessage[]> => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      if (params.keyword) searchParams.set('keyword', params.keyword);
      if (params.sender) searchParams.set('sender', params.sender);
      if (params.date_from) searchParams.set('date_from', params.date_from);
      if (params.date_to) searchParams.set('date_to', params.date_to);

      const response = await fetch(`${AFUMAIL_API_BASE}/mail/search?${searchParams}`, {
        headers: await getHeaders(),
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  const uploadAttachment = useCallback(async (file: File): Promise<{ id: string; url: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${AFUMAIL_API_BASE}/mail/attachment/upload`, {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : 
             sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
          ...(user?.id ? { 'X-User-Id': user.id } : {}),
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload attachment');
      return null;
    }
  }, [sessionToken, user?.id]);

  return {
    loading,
    sessionToken,
    authenticate,
    getMailboxInfo,
    getFolders,
    getMessages,
    getMessage,
    sendEmail,
    saveDraft,
    deleteDraft,
    performAction,
    searchEmails,
    uploadAttachment,
  };
}
