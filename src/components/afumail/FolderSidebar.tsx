import React from 'react';
import { 
  Inbox, 
  Send, 
  FileText, 
  AlertTriangle, 
  Trash2, 
  Star,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmailFolder } from '@/hooks/useAfuMail';

interface FolderSidebarProps {
  folders: EmailFolder[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCompose: () => void;
}

const FOLDER_ICONS: Record<string, React.ReactNode> = {
  inbox: <Inbox className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  drafts: <FileText className="h-4 w-4" />,
  spam: <AlertTriangle className="h-4 w-4" />,
  trash: <Trash2 className="h-4 w-4" />,
  starred: <Star className="h-4 w-4" />,
};

const DEFAULT_FOLDERS: EmailFolder[] = [
  { id: 'inbox', name: 'Inbox', unread_count: 0, total_count: 0 },
  { id: 'starred', name: 'Starred', unread_count: 0, total_count: 0 },
  { id: 'sent', name: 'Sent', unread_count: 0, total_count: 0 },
  { id: 'drafts', name: 'Drafts', unread_count: 0, total_count: 0 },
  { id: 'spam', name: 'Spam', unread_count: 0, total_count: 0 },
  { id: 'trash', name: 'Trash', unread_count: 0, total_count: 0 },
];

export function FolderSidebar({ 
  folders, 
  selectedFolder, 
  onSelectFolder, 
  onCompose 
}: FolderSidebarProps) {
  // Merge API folders with defaults
  const displayFolders = DEFAULT_FOLDERS.map(defaultFolder => {
    const apiFolder = folders.find(f => f.id.toLowerCase() === defaultFolder.id);
    return apiFolder || defaultFolder;
  });

  return (
    <div className="w-full md:w-56 shrink-0 border-r border-border bg-muted/30 p-4">
      {/* Compose button */}
      <Button onClick={onCompose} className="w-full mb-4 gap-2">
        <Plus className="h-4 w-4" />
        Compose
      </Button>

      {/* Folders */}
      <nav className="space-y-1">
        {displayFolders.map(folder => (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              selectedFolder === folder.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {FOLDER_ICONS[folder.id] || <Inbox className="h-4 w-4" />}
            <span className="flex-1 text-left capitalize">{folder.name}</span>
            {folder.unread_count > 0 && (
              <span className={cn(
                "text-xs font-medium px-1.5 py-0.5 rounded-full",
                selectedFolder === folder.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/20"
              )}>
                {folder.unread_count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
