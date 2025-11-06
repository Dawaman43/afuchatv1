import { OwlAvatar } from '@/components/avatar/OwlAvatar';
import { useUserAvatar } from '@/hooks/useUserAvatar';

interface AvatarProps {
  name: string;
  userId: string;
  size?: number;
}

export const Avatar = ({ name, userId, size = 32 }: AvatarProps) => {
  const { avatarConfig, loading } = useUserAvatar(userId);

  if (loading) {
    return (
      <div 
        className="rounded-full bg-muted animate-pulse flex-shrink-0" 
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <OwlAvatar 
      config={avatarConfig} 
      size={size}
      className="flex-shrink-0"
    />
  );
};
