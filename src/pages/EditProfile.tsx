import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Upload, X } from 'lucide-react';

// Import Supabase types (assuming types/supabase.ts exists)
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string; // Note: Using 'handle' from schema instead of 'username'
  bio: string;
  location?: string; // Optional, not in schema but added for completeness
  website?: string; // Optional, not in schema
  avatar_url?: string;
  banner_url?: string;
}

const EditProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
    location: '',
    website: '',
    avatar_url: '',
    banner_url: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: ProfileRow | null; error: any };

        if (error) throw error;

        if (data) {
          setProfile({
            display_name: data.display_name,
            handle: data.handle,
            bio: data.bio || '',
            location: '', // Not in schema; default empty
            website: '', // Not in schema; default empty
            avatar_url: '', // Not in schema; add if extended
            banner_url: '', // Not in schema; add if extended
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const uploadFile = async (file: File, type: 'avatar' | 'banner'): Promise<string | null> => {
    if (!file) return null;

    setUploading(true);
    try {
      // Basic validation
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File too large (max 5MB)');
        return null;
      }

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${user?.id}-${type}-${Date.now()}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Adjust bucket if separate for banners
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl || null;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'avatar');
    if (url) {
      setProfile((prev) => ({ ...prev, avatar_url: url }));
    }
    // Reset input
    e.target.value = '';
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file, 'banner');
    if (url) {
      setProfile((prev) => ({ ...prev, banner_url: url }));
    }
    // Reset input
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Map to Supabase profile update (only schema fields)
      const updateData: ProfileUpdate = {
        display_name: profile.display_name,
        handle: profile.handle,
        bio: profile.bio || null,
        updated_at: new Date().toISOString(),
        // Note: location/website not in schema; ignore or extend schema
        // avatar_url/banner_url not in schema; ignore or extend
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/profile/${user.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Banner Upload (Optional/Extended) */}
          {profile.banner_url && (
            <div className="space-y-2">
              <Label htmlFor="banner">Banner Image</Label>
              <div className="relative">
                <img
                  src={profile.banner_url}
                  alt="Banner"
                  className="w-full h-32 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => setProfile((prev) => ({ ...prev, banner_url: '' }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                id="banner"
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploading || saving}
              />
            </div>
          )}

          {/* Avatar */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {profile.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={uploading || saving}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              value={profile.display_name}
              onChange={handleInputChange}
              placeholder="Your display name"
              disabled={saving}
            />
          </div>

          {/* Handle (Username) */}
          <div className="space-y-2">
            <Label htmlFor="handle">Handle</Label>
            <Input
              id="handle"
              name="handle"
              value={profile.handle}
              onChange={handleInputChange}
              placeholder="@handle"
              disabled={saving}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself (max 150 chars)"
              rows={4}
              maxLength={150}
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              {profile.bio.length}/150
            </p>
          </div>

          {/* Location (Extended Field) */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              name="location"
              value={profile.location}
              onChange={handleInputChange}
              placeholder="Where are you from?"
              disabled={saving}
            />
          </div>

          {/* Website (Extended Field) */}
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              name="website"
              value={profile.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              type="url"
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
