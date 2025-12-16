import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, Menu, Mail, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useAfuMail, EmailMessage, EmailDetail, EmailFolder } from '@/hooks/useAfuMail';
import { FolderSidebar } from '@/components/afumail/FolderSidebar';
import { EmailList } from '@/components/afumail/EmailList';
import { EmailView } from '@/components/afumail/EmailView';
import { ComposeEmail } from '@/components/afumail/ComposeEmail';
import { AfuMailTermsDialog } from '@/components/afumail/AfuMailTermsDialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import afumailLogo from '@/assets/mini-apps/afumail-logo.png';

type ViewMode = 'list' | 'email' | 'compose';

const AFUMAIL_TERMS_ACCEPTED_KEY = 'afumail_terms_accepted';

export default function AfuMail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const afuMail = useAfuMail();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [replyToEmail, setReplyToEmail] = useState<EmailDetail | null>(null);
  
  // Email eligibility and terms state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return localStorage.getItem(AFUMAIL_TERMS_ACCEPTED_KEY) === 'true';
  });

  // Check user eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        toast.error('Please sign in to access AfuMail');
        navigate('/auth/signin');
        return;
      }

      // Get user's email from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('handle')
        .eq('id', user.id)
        .single();

      if (profile?.handle) {
        const afuchatEmail = `${profile.handle}@afuchat.com`;
        setUserEmail(afuchatEmail);
        setIsEligible(true);

        // Show terms dialog if not accepted yet
        if (!termsAccepted) {
          setShowTermsDialog(true);
        } else {
          initializeAfuMail();
        }
      } else {
        // User doesn't have a handle, not eligible
        setIsEligible(false);
      }
    };

    checkEligibility();
  }, [user, termsAccepted]);

  const handleTermsAccept = () => {
    localStorage.setItem(AFUMAIL_TERMS_ACCEPTED_KEY, 'true');
    setTermsAccepted(true);
    setShowTermsDialog(false);
    initializeAfuMail();
  };

  const handleTermsDecline = () => {
    setShowTermsDialog(false);
    navigate(-1);
  };

  const initializeAfuMail = async () => {
    const authenticated = await afuMail.authenticate();
    if (authenticated) {
      loadFolders();
      loadEmails('inbox');
    }
  };

  const loadFolders = async () => {
    const folderList = await afuMail.getFolders();
    setFolders(folderList);
  };

  const loadEmails = async (folder: string) => {
    const { messages } = await afuMail.getMessages(folder);
    setEmails(messages);
  };

  const handleSelectFolder = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedEmail(null);
    setViewMode('list');
    loadEmails(folder);
    setMobileSidebarOpen(false);
  };

  const handleSelectEmail = async (email: EmailMessage) => {
    const detail = await afuMail.getMessage(email.id);
    if (detail) {
      setSelectedEmail(detail);
      setViewMode('email');
      
      // Mark as read
      if (!email.read_status) {
        await afuMail.performAction(email.id, 'read');
        setEmails(prev => prev.map(e => 
          e.id === email.id ? { ...e, read_status: true } : e
        ));
      }
    }
  };

  const handleStar = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId);
    if (!email) return;
    
    const action = email.starred ? 'unstar' : 'star';
    const success = await afuMail.performAction(emailId, action);
    
    if (success) {
      setEmails(prev => prev.map(e => 
        e.id === emailId ? { ...e, starred: !e.starred } : e
      ));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
      }
    }
  };

  const handleCompose = () => {
    setComposeMode('new');
    setReplyToEmail(null);
    setViewMode('compose');
  };

  const handleReply = () => {
    if (selectedEmail) {
      setComposeMode('reply');
      setReplyToEmail(selectedEmail);
      setViewMode('compose');
    }
  };

  const handleForward = () => {
    if (selectedEmail) {
      setComposeMode('forward');
      setReplyToEmail(selectedEmail);
      setViewMode('compose');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmail) return;
    
    const success = await afuMail.performAction(selectedEmail.id, 'delete');
    if (success) {
      toast.success('Email moved to trash');
      setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
      setSelectedEmail(null);
      setViewMode('list');
    }
  };

  const handleArchive = async () => {
    if (!selectedEmail) return;
    
    const success = await afuMail.performAction(selectedEmail.id, 'move', 'archive');
    if (success) {
      toast.success('Email archived');
      setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
      setSelectedEmail(null);
      setViewMode('list');
    }
  };

  const handleMarkUnread = async () => {
    if (!selectedEmail) return;
    
    const success = await afuMail.performAction(selectedEmail.id, 'unread');
    if (success) {
      setEmails(prev => prev.map(e => 
        e.id === selectedEmail.id ? { ...e, read_status: false } : e
      ));
      setSelectedEmail(null);
      setViewMode('list');
    }
  };

  const handleSendEmail = async (email: any) => {
    const result = await afuMail.sendEmail(email);
    if (result.success) {
      setViewMode('list');
      setReplyToEmail(null);
    }
  };

  const handleSaveDraft = async (email: any) => {
    await afuMail.saveDraft(email);
  };

  const handleDiscardCompose = () => {
    setViewMode(selectedEmail ? 'email' : 'list');
    setReplyToEmail(null);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEmails(selectedFolder);
      return;
    }
    
    const results = await afuMail.searchEmails({ keyword: searchQuery });
    setEmails(results);
  };

  const handleRefresh = () => {
    loadEmails(selectedFolder);
  };

  // Show terms dialog
  if (showTermsDialog) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <AfuMailTermsDialog
          open={showTermsDialog}
          onAccept={handleTermsAccept}
          onDecline={handleTermsDecline}
        />
      </div>
    );
  }

  // Show ineligible screen if user doesn't have @afuchat.com email
  if (isEligible === false) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="border-b border-border px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">AfuMail</h1>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Access Restricted</h2>
              <p className="text-muted-foreground">
                AfuMail is only available for users with an @afuchat.com email address.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    Experimental Service
                  </p>
                  <p className="text-sm text-muted-foreground">
                    AfuMail is currently in beta. Report any issues to{' '}
                    <strong>support@afuchat.com</strong>
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => navigate(-1)} className="w-full">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isEligible === null || !termsAccepted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Mail className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading AfuMail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-4 shrink-0">
        {/* Mobile menu trigger */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <FolderSidebar
              folders={folders}
              selectedFolder={selectedFolder}
              onSelectFolder={handleSelectFolder}
              onCompose={() => {
                handleCompose();
                setMobileSidebarOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <img src={afumailLogo} alt="AfuMail" className="h-8 w-8 rounded-lg" />
          <h1 className="text-lg font-bold text-blue-600">AfuMail</h1>
          {userEmail && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              ({userEmail})
            </span>
          )}
        </div>

        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search emails..."
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className={cn("h-5 w-5", afuMail.loading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <FolderSidebar
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={handleSelectFolder}
            onCompose={handleCompose}
          />
        </div>

        {/* Email list / view / compose */}
        <div className="flex-1 flex min-w-0">
          {viewMode === 'compose' ? (
            <div className="flex-1">
              <ComposeEmail
                initialTo={composeMode === 'reply' && replyToEmail ? [replyToEmail.from] : []}
                replyTo={composeMode === 'reply' && replyToEmail ? {
                  from: replyToEmail.from,
                  subject: replyToEmail.subject,
                  body: replyToEmail.body_text,
                } : undefined}
                forwardFrom={composeMode === 'forward' && replyToEmail ? {
                  subject: replyToEmail.subject,
                  body: replyToEmail.body_text,
                } : undefined}
                onSend={handleSendEmail}
                onSaveDraft={handleSaveDraft}
                onDiscard={handleDiscardCompose}
                onUploadAttachment={afuMail.uploadAttachment}
                sending={afuMail.loading}
                senderEmail={userEmail || undefined}
              />
            </div>
          ) : (
            <>
              {/* Email list - hidden on mobile when viewing email */}
              <div className={cn(
                "w-full md:w-96 md:border-r md:border-border overflow-y-auto",
                viewMode === 'email' && "hidden md:block"
              )}>
                <EmailList
                  emails={emails}
                  selectedId={selectedEmail?.id}
                  onSelect={handleSelectEmail}
                  onStar={handleStar}
                  loading={afuMail.loading}
                />
              </div>

              {/* Email view */}
              <div className={cn(
                "flex-1 min-w-0",
                viewMode === 'list' && "hidden md:flex"
              )}>
                <EmailView
                  email={selectedEmail}
                  loading={afuMail.loading}
                  onBack={() => setViewMode('list')}
                  onReply={handleReply}
                  onForward={handleForward}
                  onDelete={handleDelete}
                  onStar={() => selectedEmail && handleStar(selectedEmail.id)}
                  onArchive={handleArchive}
                  onMarkUnread={handleMarkUnread}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile compose FAB */}
      {viewMode === 'list' && (
        <Button
          onClick={handleCompose}
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg md:hidden"
          size="icon"
        >
          <span className="text-2xl">+</span>
        </Button>
      )}
    </div>
  );
}
