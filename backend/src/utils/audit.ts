import prisma from "./prisma";

/**
 * Creates an audit log entry for a task event.
 * Centralises the repetitive prisma.auditLog.create(...) calls in services.
 */
export async function logAudit(
    taskId: string,
    userId: string,
    action: string,
    oldValue?: string | null,
    newValue?: string | null
): Promise<void> {
    await prisma.auditLog.create({
        data: { 
            action, 
            oldValue: oldValue ?? null, 
            newValue: newValue ?? null, 
            taskId, 
            userId 
        },
    });
}
