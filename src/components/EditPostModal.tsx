import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { postSchema } from '@/lib/validation';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    image_url: string | null;
  };
  onPostUpdated: () => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ 
  isOpen, 
  onClose, 
  post,
  onPostUpdated 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setRemoveExistingImage(false);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    try {
      postSchema.parse(content);
    } catch (error: any) {
      toast.error(error.errors?.[0]?.message || 'Invalid post');
      return;
    }

    setIsUpdating(true);
    const postContent = content.trim();
    let imageUrl: string | null = post.image_url;

    try {
      // Handle image upload if new image selected
      if (selectedImage) {
        setUploadingImage(true);
        
        // Delete old image if exists
        if (post.image_url) {
          const oldPath = post.image_url.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('post-images')
              .remove([`${user.id}/${oldPath}`]);
          }
        }

        // Upload new image
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          toast.error('Failed to upload image');
          setUploadingImage(false);
          setIsUpdating(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = publicUrl;
        setUploadingImage(false);
      } else if (removeExistingImage && post.image_url) {
        // Remove existing image
        const oldPath = post.image_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('post-images')
            .remove([`${user.id}/${oldPath}`]);
        }
        imageUrl = null;
      }

      // Update post
      const { error } = await supabase
        .from('posts')
        .update({
          content: postContent,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)
        .eq('author_id', user.id);

      if (error) {
        console.error('Supabase Update Error:', error);
        toast.error('Failed to update post. Please try again.');
      } else {
        toast.success('Post updated successfully!');
        onPostUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Update Error:', err);
      toast.error('Network error—check connection.');
    } finally {
      setIsUpdating(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-sm sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Edit your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={4}
            className="resize-none"
            disabled={isUpdating}
          />

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            
            {!imagePreview ? (
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
                disabled={isUpdating}
              >
                <ImageIcon className="h-4 w-4" />
                Add Image
              </Button>
            ) : (
              <div className="relative rounded-lg overflow-hidden border-2 border-border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  onClick={handleRemoveImage}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  disabled={isUpdating || uploadingImage}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.length}/280</span>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="flex-1"
              disabled={isUpdating || !content.trim() || content.length > 280}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
