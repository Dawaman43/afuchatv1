import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card'; // Used for rich styling inside modal

// NOTE: This interface syntax is valid in a .tsx file.
interface NewPostModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// NOTE: Component declaration should use React.FC<NewPostModalProps>
const NewPostModal: React.FC<NewPostModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const handlePost = async () => {
        // Validation based on AfuChat project brief
        if (!newPost.trim() || !user || newPost.length > 280) {
            if (newPost.length > 280) toast.error('Post must be 280 characters or less');
            return;
        }

        setIsPosting(true);
        const postContent = newPost.trim();

        // Database insert
        const { error } = await supabase.from('posts').insert({
            content: postContent,
            author_id: user.id,
        });

        setIsPosting(false);

        if (error) {
            console.error("Supabase Post Error:", error);
            toast.error('Failed to post. Please try again.');
        } else {
            setNewPost(''); 
            onClose(); // Close modal on success
            // Success toast handled by the real-time subscription in Feed.tsx 
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* DialogContent: Rich design with rounded corners and high shadow */}
            <DialogContent className="sm:max-w-[425px] rounded-xl shadow-2xl p-0">
                <DialogHeader className="p-4 border-b border-muted-foreground/10 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-extrabold text-foreground">Create New Post</DialogTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>
                
                {/* Post Input Area: Elevated Card Style */}
                <Card className="p-5 m-4 rounded-xl shadow-lg border-none"> 
                    <Textarea
                        placeholder="What's happening? (Text-only, max 280 characters)"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        maxLength={280}
                        rows={5}
                        className="mb-3 resize-none focus-visible:ring-primary"
                        disabled={isPosting}
                    />
                    <div className="flex justify-between items-center">
                        {/* Character counter logic */}
                        <span className={`text-sm ${newPost.length > 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {280 - newPost.length} characters left
                        </span>
                        <Button 
                            onClick={handlePost} 
                            disabled={!newPost.trim() || newPost.length > 280 || isPosting} 
                            className="flex items-center space-x-2 shadow-md rounded-full px-5"
                        >
                            <Send className="h-4 w-4" />
                            <span>{isPosting ? 'Posting...' : 'Post'}</span>
                        </Button>
                    </div>
                </Card>
            </DialogContent>
        </Dialog>
    );
};

export default NewPostModal;
