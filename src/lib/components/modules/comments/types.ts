// Comment system types

import type { Id } from '$convex/_generated/dataModel';

export interface CommentEngagement {
	likeCount: number;
	replyCount: number;
}

export interface CommentData {
	_id: Id<'feedComments'>;
	feedId: Id<'feed'>;
	userId: string; // BetterAuth user ID
	content: string;
	createdAt: number;
	updatedAt?: number;
	parentCommentId?: Id<'feedComments'>;
	engagement: CommentEngagement;
	userInfo: {
		name: string | null;
		image: string | null;
	};
}

export interface CommentProps {
	comment: CommentData;
	feedId: Id<'feed'>;
	depth?: number;
}