// src/pages/EditProfile.tsx - UPDATED TO GUARD AGAINST NULL USER

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; 
import { Loader2, User, Link, MapPin } from 'lucide-react'; 

// Import Supabase types (assuming types/supabase.ts exists)
import type { Database } from '@/types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface EditProfileForm {
  display_name: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
}

const EditProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth(); // Import authLoading state
  const navigate = useNavigate();

  const [profile, setProfile] = useState<EditProfileForm>({
    display_name: '',
    handle: '',
    bio: '',
    location: '',
    website: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // --- CRITICAL GUARD EFFECT (Runs first) ---
  useEffect(() => {
    // 1. Wait until the AuthContext has finished its initial loading check
    if (authLoading) return;

    // 2. If the user is null after the check, redirect to login
    if (!user) {
      toast.info("Please log in to edit your profile.");
      navigate('/auth', { replace: true });
      return;
    }
    
    // 3. If user is present, proceed to fetch the profile data
    const fetchProfile = async () => {
      // The user is guaranteed to exist here
      if (!user.id) {
          // This path should ideally not happen if user object is valid
          setLoading(false);
          toast.error("Authentication data is incomplete."); 
          return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, handle, bio, location, website')
          .eq('id', user.id)
          .single() as { data: ProfileRow | null; error: any }; // Note: RLS must allow reading

        if (error) throw error;

        if (data) {
          setProfile({
            display_name: data.display_name || '',
            handle: data.handle || '',
            bio: data.bio || '',
            location: data.location || '',
            website: data.website || '',
          });
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, navigate]); // Depend on user and authLoading

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'handle') {
      const sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
      setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: sanitizedValue }));
      return;
    }
    setProfile((prev) => ({ ...prev, [name as keyof EditProfileForm]: value }));
  };

  const handleSave = async () => {
    // User is guaranteed to exist by the effect, but we keep the guard
    if (!user) return; 

    if (!profile.display_name.trim() || !profile.handle.trim()) {
        toast.error("Display Name and Handle are required.");
        return;
    }
    
    // --- WEBSITE URL VALIDATION (NEW UX improvement) ---
    const websiteValue = profile.website.trim();
    if (websiteValue && !websiteValue.startsWith('http://') && !websiteValue.startsWith('https://')) {
        toast.error("Website URL must start with http:// or https://");
        return;
    }
    // ---------------------------------------------------
    
    setSaving(true);
    try {
      const updateData: ProfileUpdate = {
        display_name: profile.display_name.trim(),
        handle: profile.handle.trim(),
        bio: profile.bio.trim() || null,
        location: profile.location.trim() || null, 
        website: websiteValue || null, 
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      navigate(`/${user.id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      if (error.code === '23505') { 
          toast.error('The handle is already taken. Please choose another.');
      } else {
          toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/${user?.id || ''}`); // Navigate to root if user somehow disappeared
  };


  // --- Render Logic ---

  // Display initial loading state while context checks and data fetches
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // NOTE: If execution reaches here, the user is guaranteed to be authenticated and profile data is loaded.

  return (
    <div className="min-h-screen bg-background flex justify-center p-4 md:p-8">
      <Card className="w-full max-w-4xl border-none md:border md:shadow-none bg-card/80 backdrop-blur-sm"> 
        <CardHeader className="pb-4 border-b border-border/50">
          <CardTitle className="text-3xl font-extrabold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" /> Edit Profile
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Update your personal and public-facing information.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* --- PRIMARY INFO COLUMN (Col 1-2) --- */}
            <div className="md:col-span-2 space-y-6">
              
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Basic Information</h3>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-sm font-medium text-foreground">Display Name</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={profile.display_name}
                  onChange={handleInputChange}
                  placeholder="Your display name"
                  disabled={saving}
                  className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
                />
              </div>

              {/* Handle (Username) */}
              <div className="space-y-2">
                <Label htmlFor="handle" className="text-sm font-medium text-foreground">Handle (Username)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                  <Input
                    id="handle"
                    name="handle"
                    value={profile.handle}
                    onChange={handleInputChange}
                    placeholder="unique_handle"
                    disabled={saving}
                    className="pl-7 text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Your public, unique identifier. Only lowercase letters, numbers, and underscores.
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-foreground">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself (max 150 chars)"
                  rows={4}
                  maxLength={150}
                  disabled={saving}
                  className="text-base resize-none bg-input/50 border border-border/80 focus:border-primary/50" 
                />
                <p className="text-xs text-muted-foreground flex justify-between">
                  <span>Keep it short and punchy!</span>
                  <span>{profile.bio.length}/150</span>
                </p>
              </div>
            </div>

            {/* --- SECONDARY INFO COLUMN (Col 3) --- */}
            <div className="md:col-span-1 space-y-6 md:border-l md:pl-8 border-border/50">
              <h3 className="text-lg font-semibold border-b pb-2 text-primary">Additional Details</h3>
              
              {/* Location - NOW FUNCTIONAL */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Kampala, Uganda"
                  disabled={saving}
                  className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
                />
              </div>

              {/* Website - NOW FUNCTIONAL */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Link className="h-4 w-4" /> Website/Portfolio
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={profile.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  disabled={saving}
                  className="text-base h-11 bg-input/50 border border-border/80 focus:border-primary/50" 
                />
                <p className="text-xs text-muted-foreground pt-1">
                  Must be a valid URL starting with `http://` or `https://`.
                </p>
              </div>
            </div>
            
          </div>
          
          <Separator className="my-8 bg-border/50" />
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="px-8 h-12 text-base border-border/80 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-8 h-12 text-base bg-primary hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-primary/20 transition-colors"
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
