import prisma from "../utils/prisma";
import { createNotification } from "./notificationService";
import type { Comment } from "@prisma/client";

// Extracts @username mentions from comment content
function extractMentions(content: string): string[] {
    const matches = content.match(/@(\w+)/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1)))]; // strip '@', deduplicate
}

export async function createComment(
    content: string,
    taskId: string,
    userId: string
) {
    if (!content || content.trim().length === 0) {
        throw new Error("Comment content cannot be empty");
    }

    const comment = await prisma.comment.create({
        data: {
            content,
            taskId,
            userId,
        },
    });

    await prisma.auditLog.create({
        //timestamps gets automatically added by prisma
        data: {
            action: "COMMENT_CREATED",
            newValue: content,
            taskId,
            userId,
        },
    });

    // Notify the task's assignee and reporter about the new comment
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { assigneeId: true, reporterId: true },
    });

    const stakeholders = new Set([task?.assigneeId, task?.reporterId]);
    stakeholders.delete(userId);   // don't notify the person who just commented
    stakeholders.delete(null);
    stakeholders.delete(undefined);

    await Promise.all(
        [...stakeholders].map((id) =>
            createNotification(id as string, "New comment on your task")
        )
    )

    // Notify any @mentioned users
    const mentionedUsernames = extractMentions(content);
    if (mentionedUsernames.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
            where: { name: { in: mentionedUsernames } },
            select: { id: true },
        });

        await Promise.all(
            mentionedUsers
                .filter((u) => u.id !== userId)
                .map((u) =>
                    createNotification(u.id, "You were mentioned in a comment")
                )
        );
    }

    return comment;
}

export async function getComments(taskId: string) {
    const comments = await prisma.comment.findMany({
        where: { taskId },
        include: { user: true },
        orderBy: { createdAt: "asc" },
    });
    return comments;
}

export async function deleteComment(
    commentId: string,
    requestingUserId: string
): Promise<void> {
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    });

    if (!comment) {
        throw new Error("NOT_FOUND: Comment not found");
    }

    if (comment.userId !== requestingUserId) {
        throw new Error("FORBIDDEN: You can only delete your own comments");
    }

    await prisma.$transaction([
        prisma.comment.delete({ where: { id: commentId } }),
        prisma.auditLog.create({
            data: {
                action: "COMMENT_DELETED",
                oldValue: comment.content,
                taskId: comment.taskId,
                userId: requestingUserId,
            },
        }),
    ]);
}

export async function updateComment(
    commentId: string,
    newContent: string,
    requestingUserId: string
) {
    if (!newContent || newContent.trim().length === 0) {
        throw new Error("Comment content cannot be empty");
    }

    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    });

    if (!comment) {
        throw new Error("NOT_FOUND: Comment not found");
    }

    if (comment.userId !== requestingUserId) {
        throw new Error("FORBIDDEN: You can only edit your own comments");
    }

    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content: newContent },
    });

    await prisma.auditLog.create({
        data: {
            action: "COMMENT_UPDATED",
            oldValue: comment.content,
            newValue: newContent,
            taskId: comment.taskId,
            userId: requestingUserId,
        },
    });

    // Notify @mentioned users in the updated content
    const mentionedUsernames = extractMentions(newContent);
    if (mentionedUsernames.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
            where: { name: { in: mentionedUsernames } },
            select: { id: true },
        });

        await Promise.all(
            mentionedUsers
                .filter((u) => u.id !== requestingUserId)
                .map((u) =>
                    createNotification(u.id, "You were mentioned in a comment")
                )
        );
    }

    return updatedComment;
}