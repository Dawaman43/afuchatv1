import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Helper to get initials
const getInitials = (name: string) => {
  const words = name.split(' ');
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Helper to get a consistent color based on user ID
const
 
getColor = (id: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'
  ];
  const hash = id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
};

const avatarVariants = cva(
  "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-xs",
  {
    variants: {
      color: {
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        yellow: 'bg-yellow-500',
        indigo: 'bg-indigo-500',
        purple: 'bg-purple-500',
        pink: 'bg-pink-500',
        orange: 'bg-orange-500',
      }
    }
  }
);

interface AvatarProps {
  name: string;
  userId: string;
}

export const Avatar = ({ name, userId }: AvatarProps) => {
  return (
    <div className={cn(avatarVariants({ color: getColor(userId) as any }))}>
      {getInitials(name)}
    </div>
  );
};

// You'll need to install class-variance-authority and cn
// npm install class-variance-authority clsx tailwind-merge
// and create a `lib/utils.ts` file with:
/*
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
*/
