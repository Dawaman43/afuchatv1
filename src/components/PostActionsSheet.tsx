import React from 'react';
import { 
  Ellipsis, Trash2, Flag, Maximize2, Share, Link, X, LogIn 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose 
} from '@/components/ui/sheet'; 

// --- INTERFACES (Ensure these match the interfaces in your Feed.tsx) ---
interface Post {
    id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author_id: string;
    profiles: {
        display_name: string;
        handle: string;
        is_verified: boolean;
        is_organization_verified: boolean;
    };
    replies: any[];
    like_count: number;
    reply_count: number;
    has_liked: boolean;
}

interface AuthUser {
    id: string;
    user_metadata: {
        display_name?: string;
        handle?: string;
        is_verified?: boolean;
        is_organization_verified?: boolean;
    }
}

interface PostActionsSheetProps {
  post: Post;
  user: AuthUser | null; 
  navigate: (path: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
}

/**
 * Renders a type-safe bottom sheet modal for contextual post actions with a richer UI.
 */
const PostActionsSheet: React.FC<PostActionsSheetProps> = ({ post, user, navigate, onDelete, onReport }) => {
    const isAuthor = user?.id === post.author_id;

    const handleViewDetails = () => {
        // Navigates to the single post view
        navigate(`/post/${post.id}`);
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}/post/${post.id}`;
        
        if (navigator.share) {
            // Use the native Web Share API for a rich experience
            navigator.share({
                title: `Post by @${post.profiles.handle}`,
                text: post.content.substring(0, 100) + '...',
                url: postUrl,
            }).catch(error => console.error('Error sharing:', error));
        } else {
            // Fallback: Copy to clipboard (requires HTTPS)
            navigator.clipboard.writeText(postUrl)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Could not copy link.'));
        }
    };

    // --- RENDER LOGIC ---
    const renderActions = () => {
        if (!user) {
            // Richer UI for unauthenticated users
            return (
                <div className="flex flex-col space-y-2 pt-2 pb-4 px-2">
                    <div className="text-center text-muted-foreground text-sm py-4">
                        Log in to interact with this post.
                    </div>
                    <SheetClose asChild>
                        <Button 
                            className="w-full text-center py-4 h-auto bg-primary hover:bg-primary/90 text-white font-semibold"
                            onClick={() => navigate('/auth')} // Assuming '/auth' is your login route
                        >
                            <LogIn className="h-4 w-4 mr-3" />
                            Log In to Engage
                        </Button>
                    </SheetClose>
                </div>
            );
        }

        // Actions for authenticated users
        return (
            <div className="flex flex-col p-2 space-y-1">
                
                {/* === GROUP 1: Navigation & Utility === */}
                <div className="space-y-1 pb-2 border-b border-border/70">
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto text-foreground hover:bg-muted"
                            onClick={handleViewDetails}
                        >
                            <Maximize2 className="h-4 w-4 mr-3 text-primary/80" />
                            <span className="font-medium">View Post Details</span>
                        </Button>
                    </SheetClose>

                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto text-foreground hover:bg-muted"
                            onClick={handleShare}
                        >
                            <Share className="h-4 w-4 mr-3" />
                            <span className="font-medium">Share Post</span>
                        </Button>
                    </SheetClose>
                </div>

                {/* === GROUP 2: Critical Actions (Report/Delete) === */}
                <div className="space-y-1 pt-2">
                    
                    {/* Report Post */}
                    <SheetClose asChild>
                        <Button 
                            variant="ghost" 
                            className="justify-start w-full text-left py-4 h-auto text-red-500 hover:bg-red-50" 
                            onClick={() => onReport(post.id)}
                        >
                            <Flag className="h-4 w-4 mr-3" />
                            <span className="font-medium">Report Post</span>
                        </Button>
                    </SheetClose>

                    {/* Delete (Author Only) */}
                    {isAuthor && (
                        <SheetClose asChild>
                            <Button 
                                variant="ghost" 
                                className="justify-start w-full text-left py-4 h-auto text-red-600 hover:bg-red-100 font-bold"
                                onClick={() => onDelete(post.id)}
                            >
                                <Trash2 className="h-4 w-4 mr-3" />
                                <span className="font-bold">Delete Post</span>
                            </Button>
                        </SheetClose>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                    <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </Button>
            </SheetTrigger>
            
            <SheetContent 
                side="bottom" 
                className="h-auto max-h-[80vh] rounded-t-xl p-0 overflow-hidden" // Changed to rounded-xl
            >
                <SheetHeader className="relative p-4 border-b border-border">
                    <SheetTitle className="text-center text-lg font-semibold text-foreground">
                        Options
                    </SheetTitle>
                    {/* Custom Close Button for a cleaner look */}
                    <SheetClose className="absolute top-1 right-2 p-2 rounded-full hover:bg-muted transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </SheetClose>
                </SheetHeader>
                
                {renderActions()}

                {/* Optional: Add a subtle padding/separator at the bottom */}
                <div className="h-2 bg-background/50" />
            </SheetContent>
        </Sheet>
    );
};

export default PostActionsSheet;
