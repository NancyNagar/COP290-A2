export const allowedTransitions: Record<string, string[]> = {

  todo: ["inprogress"],

  inprogress: ["review"],

  review: ["done"],

  done: []

};
export function isValidTransition(currentStatus: string, newStatus: string): boolean {

  const allowedNextStatuses = allowedTransitions[currentStatus];
  if (!allowedNextStatuses) {
    return false; // Invalid current status
  }
  return allowedNextStatuses.includes(newStatus);   
}