import React from 'react';
import { 
  Ellipsis, Trash2, Flag, Maximize2, Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
// Assuming these are your shadcn/ui or custom Sheet components
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

// The 'user' object from useAuth will contain various metadata. 
// We define a simple type for the necessary properties here.
interface AuthUser {
    id: string;
    user_metadata: {
        display_name?: string;
        handle?: string;
        is_verified?: boolean;
        is_organization_verified?: boolean;
    }
    // Add other properties you might need
}

interface PostActionsSheetProps {
  post: Post;
  user: AuthUser | null; // Pass the user object, which might be null if logged out
  navigate: (path: string) => void;
  onDelete: (postId: string) => void;
  onReport: (postId: string) => void;
}

/**
 * Renders a type-safe bottom sheet modal for contextual post actions.
 * @param {PostActionsSheetProps} props - Component properties.
 */
const PostActionsSheet: React.FC<PostActionsSheetProps> = ({ post, user, navigate, onDelete, onReport }) => {
    // Determine if the current user is the author of the post
    const isAuthor = user?.id === post.author_id;

    const handleViewDetails = () => {
        // Navigates to the single post view using the provided navigate function
        navigate(`/post/${post.id}`);
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0">
                    <Ellipsis className="h-4 w-4 text-muted-foreground" />
                </Button>
            </SheetTrigger>
            
            {/* The modal sheet content */}
            <SheetContent 
                side="bottom" 
                className="h-auto max-h-[80vh] rounded-t-lg p-0"
            >
                <SheetHeader className="p-4 border-b border-border">
                    <SheetTitle className="text-center **font-bold**">Post Actions</SheetTitle>
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
                            onClick={() => console.log(`Share link for ${post.id}`)} 
                        >
                            <Share className="h-4 w-4 mr-3" />
                            <span className="font-medium">Share Post</span>
                        </Button>
                    </SheetClose>

                    {/* Action 3: Report Post */}
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
                                className="justify-start w-full text-left py-4 h-auto text-red-600 hover:bg-red-50 **font-bold**"
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
