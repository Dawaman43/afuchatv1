import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "./VerifiedBadge";
import { BusinessBadge } from "./BusinessBadge";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_organization_verified: boolean;
  is_business_mode: boolean;
  bio?: string;
}

interface FollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
}

export function FollowersDialog({
  open,
  onOpenChange,
  userId,
  type,
}: FollowersDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchUsers();
      if (user) {
        fetchFollowingStatus();
      }
    }
  }, [open, userId, type, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query;
      
      if (type === "followers") {
        // Get users who follow this profile
        query = supabase
          .from("follows")
          .select(`
            follower_id,
            profiles!follows_follower_id_fkey (
              id,
              display_name,
              handle,
              avatar_url,
              is_verified,
              is_organization_verified,
              is_business_mode,
              bio
            )
          `)
          .eq("following_id", userId);
      } else {
        // Get users this profile follows
        query = supabase
          .from("follows")
          .select(`
            following_id,
            profiles!follows_following_id_fkey (
              id,
              display_name,
              handle,
              avatar_url,
              is_verified,
              is_organization_verified,
              is_business_mode,
              bio
            )
          `)
          .eq("follower_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const profiles = data
        ?.map((item: any) => {
          const profile = type === "followers" ? item.profiles : item.profiles;
          return profile;
        })
        .filter((p: any) => p !== null) as UserProfile[];

      setUsers(profiles || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;

      const ids = new Set(data?.map((f) => f.following_id) || []);
      setFollowingIds(ids);
    } catch (error) {
      console.error("Error fetching following status:", error);
    }
  };

  const handleFollowToggle = async (targetUserId: string) => {
    if (!user) {
      toast.error("Please sign in to follow users");
      navigate("/auth");
      return;
    }

    const isCurrentlyFollowing = followingIds.has(targetUserId);

    // Optimistic update
    setFollowingIds((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyFollowing) {
        newSet.delete(targetUserId);
      } else {
        newSet.add(targetUserId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
      
      // Revert on error
      setFollowingIds((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(targetUserId);
        } else {
          newSet.delete(targetUserId);
        }
        return newSet;
      });
    }
  };

  const handleUserClick = (userHandle: string) => {
    onOpenChange(false);
    navigate(`/${userHandle}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {type === "followers" ? "Followers" : "Following"}
          </DialogTitle>
          <DialogDescription>
            {type === "followers"
              ? "People who follow this account"
              : "People this account follows"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar
                    className="h-12 w-12 cursor-pointer"
                    onClick={() => handleUserClick(profile.handle)}
                  >
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleUserClick(profile.handle)}
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-sm">
                        {profile.display_name}
                      </span>
                      {profile.is_verified && <VerifiedBadge size="sm" />}
                      {profile.is_organization_verified && (
                        <BusinessBadge size="sm" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      @{profile.handle}
                    </span>
                    {profile.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {profile.bio}
                      </p>
                    )}
                  </div>

                  {user && user.id !== profile.id && (
                    <Button
                      size="sm"
                      variant={followingIds.has(profile.id) ? "outline" : "default"}
                      onClick={() => handleFollowToggle(profile.id)}
                    >
                      {followingIds.has(profile.id) ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
