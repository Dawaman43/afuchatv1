import React from 'react';
import { 
  Ellipsis, Trash2, Flag, Maximize2, Share, MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose 
} from '@/components/ui/sheet'; 

// --- INTERFACES (You should ideally import these from a types file if using TypeScript) ---
interface Post {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    profiles: any; // Simplified for this component
    replies: any[];
    like_count: number;
    reply_count: number;
    has_liked: boolean;
}

interface PostActionsSheetProps {
  post: Post;
  user: any; // Current authenticated user object
  navigate: (path: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
}

/**
 * Renders a mobile-friendly bottom sheet modal containing actions for a specific post.
 * @param {PostActionsSheetProps} props - Component properties.
 */
const PostActionsSheet = ({ post, user, navigate, onDelete, onReport }: PostActionsSheetProps) => {
    // Determine if the current user is the author of the post
    const isAuthor = user?.id === post.author_id;

    const handleViewDetails = () => {
        // Navigates to the single post view
        navigate(`/post/${post.id}`);
    };

    return (
        // The Sheet wrapper manages the open/close state
        <Sheet>
            {/* SheetTrigger is the button that opens the sheet */}
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                    <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </Button>
            </SheetTrigger>
            
            {/* SheetContent is the actual modal that slides up from the bottom */}
            <SheetContent 
                side="bottom" 
                className="h-auto max-h-[80vh] rounded-t-lg p-0"
            >
                <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="text-center font-bold">Post Actions</SheetTitle>
                </SheetHeader>
                
                <div className="flex flex-col space-y-1 p-2">
                    
                    {/* Action 1: View Post Details */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto"
                            onClick={handleViewDetails}
                        >
                            <Maximize2 className="h-4 w-4 mr-3 text-primary/80" />
                            <span className="font-medium">View Post Details</span>
                        </Button>
                    </SheetClose>

                    {/* Action 2: Share Post */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto"
                            // Placeholder for actual share logic (e.g., navigator.share)
                            onClick={() => console.log('Share action called')} 
                        >
                            <Share className="h-4 w-4 mr-3" />
                            <span className="font-medium">Share Post</span>
                        </Button>
                    </SheetClose>

                    {/* Action 3: Report Post (Non-author) */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto text-red-500 hover:text-red-600" 
                            onClick={() => onReport(post.id)}
                        >
                            <Flag className="h-4 w-4 mr-3" />
                            <span className="font-medium">Report Post</span>
                        </Button>
                    </SheetClose>

                    {/* Action 4: Delete (Author Only) */}
                    {isAuthor && (
                        <SheetClose asChild>
                            <Button 
                                variant="ghost" 
                                className="justify-start w-full text-left py-4 h-auto text-red-600 hover:bg-red-50 font-bold"
                                onClick={() => onDelete(post.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-3" />
                                <span className="font-bold">Delete Post</span>
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default PostActionsSheet;
