import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User, ArrowLeft, MessageSquare, UserPlus, Pencil, Calendar, Lock, LogOut, Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import AdminDashboard from '@/pages/AdminDashboard';

interface Profile {
	id: string;
	display_name: string;
	handle: string;
	bio?: string;
	is_verified?: boolean;
	is_organization_verified?: boolean;
	is_private?: boolean;
	created_at?: string;
}

interface Post {
	id: string;
	content: string;
	created_at: string;
	acknowledgment_count: number;
	reply_count: number;
}

const isUUID = (str: string): boolean => {
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
};

const GoldVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
	<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 text-[#FFD43B] fill-[#FFD43B]`}>
		<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
	</svg>
);

const TwitterVerifiedBadge = ({ size = 'w-5 h-5' }: { size?: string }) => (
	<svg viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" className={`${size} ml-1 text-[#1d9bf0] fill-[#1d9bf0]`}>
		<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
	</svg>
);

const VerifiedBadgeIcon = ({ isVerified, isOrgVerified }: { isVerified?: boolean; isOrgVerified?: boolean }) => {
	if (isOrgVerified) return <GoldVerifiedBadge />;
	if (isVerified) return <TwitterVerifiedBadge />;
	return null;
};

const MENTION_REGEX = /@(\w+)/g;

const ContentParser: React.FC<{ content: string, isBio?: boolean }> = ({ content, isBio = false }) => {
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let match;
	while ((match = MENTION_REGEX.exec(content)) !== null) {
		const mentionText = match[0];
		const handle = match[1];
		if (match.index > lastIndex) parts.push(content.substring(lastIndex, match.index));
		parts.push(
			<Link
				key={`mention-${match.index}-${handle}`}
				to={`/profile/${handle}`}
				className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
				onClick={(e) => e.stopPropagation()}
			>{mentionText}</Link>
		);
		lastIndex = match.index + mentionText.length;
	}
	if (lastIndex < content.length) parts.push(content.substring(lastIndex));
	const className = isBio ? "mt-3 text-sm whitespace-pre-wrap leading-relaxed" : "text-foreground whitespace-pre-wrap leading-relaxed";
	return <p className={className}>{parts}</p>;
};

const Profile = () => {
	const { userId: urlParam } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [posts, setPosts] = useState<Post[]>([]);
	const [isFollowing, setIsFollowing] = useState(false);
	const [followCount, setFollowCount] = useState({ followers: 0, following: 0 });
	const [loading, setLoading] = useState(true);
	const [profileId, setProfileId] = useState<string | null>(null);
	const [isAdmin, setIsAdmin] = useState(false);

	const fetchFollowCounts = useCallback(async (id: string) => {
		if (!id) return;
		const { count: followers } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', id);
		const { count: following } = await supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', id);
		setFollowCount({ followers: followers || 0, following: following || 0 });
	}, []);

	const fetchAdminStatus = useCallback(async (userId: string) => {
		if (!userId) return setIsAdmin(false);
		const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).limit(1).single();
		setIsAdmin(data?.role === 'admin');
	}, []);

	const fetchProfile = useCallback(async () => {
		setLoading(true);
		setProfile(null);
		setProfileId(null);
		if (!urlParam) { navigate('/'); setLoading(false); return; }
		const isParamUUID = isUUID(urlParam);
		let query = supabase.from('profiles').select('*, created_at').limit(1);
		query = isParamUUID ? query.eq('id', urlParam) : query.ilike('handle', urlParam);
		const { data, error } = await query.maybeSingle();
		if (error && error.code !== 'PGRST116') { toast.error('Failed to load profile'); setLoading(false); return; }
		if (!data) { toast.error('Profile not found'); setLoading(false); return; }
		setProfile(data as Profile);
		setProfileId(data.id);
		setLoading(false);
	}, [urlParam, navigate]);

	const checkFollowStatus = useCallback(async (id: string) => {
		if (!user || !id) return;
		const { data } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', id).limit(1).single();
		setIsFollowing(!!data);
	}, [user]);

	const fetchUserPosts = useCallback(async (id: string) => {
		if (!id) return;
		if (profile?.is_private && user?.id !== id) { setPosts([]); return; }
		const { data, error } = await supabase.from('posts').select('id, content, created_at').eq('author_id', id).order('created_at', { ascending: false }).limit(20);
		if (!error && data) setPosts(data.map(p => ({ ...p, acknowledgment_count: Math.floor(Math.random()*100), reply_count: Math.floor(Math.random()*10) } as Post)));
		else setPosts([]);
	}, [profile, user]);

	useEffect(() => { fetchProfile(); }, [fetchProfile]);
	useEffect(() => {
		if (profileId) {
			fetchFollowCounts(profileId);
			fetchUserPosts(profileId);
			if (user && user.id !== profileId) checkFollowStatus(profileId);
		}
	}, [profileId, user, fetchFollowCounts, fetchUserPosts, checkFollowStatus]);

	useEffect(() => { if (user) fetchAdminStatus(user.id); }, [user, fetchAdminStatus]);

	const handleFollow = async () => {
		if (!user || !profileId) { navigate('/auth'); return; }
		const current = isFollowing;
		setIsFollowing(!current);
		setFollowCount(prev => ({ ...prev, followers: prev.followers + (current ? -1 : 1) }));
		if (current) {
			const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId);
			if (error) { setIsFollowing(true); setFollowCount(prev => ({ ...prev, followers: prev.followers + 1 })); toast.error('Failed to unfollow'); }
			else toast.success('Unfollowed');
		} else {
			const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
			if (error) { setIsFollowing(false); setFollowCount(prev => ({ ...prev, followers: prev.followers - 1 })); toast.error('Failed to follow'); }
			else toast.success('Following');
		}
	};

	const handleStartChat = async () => {
		if (!user || !profileId) { navigate('/auth'); return; }
		const { data: existingChats } = await supabase.from('chat_members').select('chat_id, chats!inner(is_group)').eq('user_id', user.id);
		if (existingChats) {
			for (const chat of existingChats) {
				if (chat.chats?.is_group === false) {
					const { data: members } = await supabase.from('chat_members').select('user_id').eq('chat_id', chat.chat_id);
					if (members && members.length === 2 && members.some(m => m.user_id === profileId)) {
						navigate(`/chat/${chat.chat_id}`);
						return;
					}
				}
			}
		}
		const { data: newChat, error: chatError } = await supabase.from('chats').insert({ is_group: false, created_by: user.id }).select().single();
		if (chatError) { toast.error('Failed to create chat'); return; }
		const { error: membersError } = await supabase.from('chat_members').insert([{ chat_id: newChat.id, user_id: user.id }, { chat_id: newChat.id, user_id: profileId }]);
		if (membersError) { toast.error('Failed to add members'); return; }
		navigate(`/chat/${newChat.id}`);
	};

	const handleLogout = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) toast.error('Failed to log out');
		else { toast.success('Logged out successfully'); navigate('/'); }
	};

	const handleAdminDashboard = () => navigate('/admin');
	const formatCount = (count: number) => (count >= 1000 ? (count/1000).toFixed(1)+'K' : count);

	if (loading) return (
		<div className="h-full flex flex-col">
			<div className="p-4 border-b border-border">
				<Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
				<Skeleton className="h-4 w-1/4 mb-4" />
			</div>
			<div className="p-4">
				<div className="flex items-center justify-between">
					<Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full -mt-10 border-4 border-background" />
					<Skeleton className="h-10 w-32 rounded-full" />
				</div>
				<Skeleton className="h-6 w-1/2 mt-4" />
				<Skeleton className="h-4 w-1/4 mt-1" />
				<Skeleton className="h-4 w-3/4 mt-3" />
				<div className="flex gap-4 mt-3">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<div className="mt-4 border-b border-border">
				<Skeleton className="h-10 w-full" />
			</div>
			<div className="p-4 space-y-4">
				<Skeleton className="h-20 w-full" />
				<Skeleton className="h-20 w-full" />
			</div>
		</div>
	);

	if (!profile) return <div className="flex items-center justify-center h-full"><div className="text-muted-foreground">Profile not found</div></div>;

	return (
		<div className="h-full flex flex-col">
			<div className="p-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b border-border">
				<div className="flex items-center justify-between">
					<div className="flex items-center">
						<Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full mr-4"><ArrowLeft className="h-5 w-5" /></Button>
						<div>
							<h1 className="text-xl font-bold">{profile.display_name}</h1>
							<p className="text-xs text-muted-foreground">{posts.length} Posts</p>
						</div>
					</div>
					{user?.id === profile.id ? (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-1" />Settings</Button>
							</PopoverTrigger>
							<PopoverContent align="end" className="w-40">
								<Button variant="ghost" className="w-full justify-start" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
								<Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/edit-profile')}><Pencil className="mr-2 h-4 w-4" />Edit Profile</Button>
							</PopoverContent>
						</Popover>
					) : (
						<div className="flex gap-2">
							<Button size="sm" variant={isFollowing ? 'outline' : 'default'} onClick={handleFollow}>
								{isFollowing ? 'Following' : 'Follow'} {isFollowing ? <UserPlus className="ml-1 h-4 w-4" /> : null}
							</Button>
							<Button size="sm" variant="secondary" onClick={handleStartChat}><MessageSquare className="h-4 w-4 mr-1" />Message</Button>
						</div>
					)}
				</div>
				<div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-semibold">{profile.display_name}</h2>
						<VerifiedBadgeIcon isVerified={profile.is_verified} isOrgVerified={profile.is_organization_verified} />
					</div>
					<p className="text-muted-foreground">@{profile.handle}</p>
				</div>
				{profile.bio && <ContentParser content={profile.bio} isBio />}
				<div className="flex gap-4 mt-2 text-sm">
					<span><strong>{formatCount(followCount.followers)}</strong> Followers</span>
					<span><strong>{formatCount(followCount.following)}</strong> Following</span>
				</div>
			</div>

			{isAdmin && <AdminDashboard />}

			<Tabs defaultValue="posts" className="flex-1">
				<TabsList className="border-b border-border">
					<TabsTrigger value="posts">Posts</TabsTrigger>
					<TabsTrigger value="replies">Replies</TabsTrigger>
				</TabsList>
				<TabsContent value="posts" className="p-4 space-y-4">
					{posts.length === 0 ? <p className="text-muted-foreground">No posts yet.</p> : posts.map(post => (
						<Card key={post.id} className="p-4">
							<ContentParser content={post.content} />
							<div className="flex gap-4 mt-2 text-sm text-muted-foreground">
								<span>{post.acknowledgment_count} Likes</span>
								<span>{post.reply_count} Replies</span>
							</div>
						</Card>
					))}
				</TabsContent>
				<TabsContent value="replies" className="p-4 space-y-4">
					<p className="text-muted-foreground">Replies section coming soon.</p>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default Profile;
