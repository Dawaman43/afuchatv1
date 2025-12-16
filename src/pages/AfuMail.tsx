import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, RefreshCw, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useAfuMail, EmailMessage, EmailDetail, EmailFolder } from '@/hooks/useAfuMail';
import { FolderSidebar } from '@/components/afumail/FolderSidebar';
import { EmailList } from '@/components/afumail/EmailList';
import { EmailView } from '@/components/afumail/EmailView';
import { ComposeEmail } from '@/components/afumail/ComposeEmail';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ViewMode = 'list' | 'email' | 'compose';

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

  // Initialize
  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access AfuMail');
      navigate('/auth/signin');
      return;
    }
    
    initializeAfuMail();
  }, [user]);

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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

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

        <h1 className="text-lg font-semibold">AfuMail</h1>

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
