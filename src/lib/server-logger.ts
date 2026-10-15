import 'server-only';
import { randomUUID } from 'node:crypto';

type ServerEvent =
  | 'auth.callback'
  | 'auth.confirm'
  | 'profile.export'
  | 'profile.delete';

type ServerEventOutcome = 'success' | 'failure' | 'rejected';

export function createRequestId(): string {
  return randomUUID();
}

export function logServerEvent(
  event: ServerEvent,
  outcome: ServerEventOutcome,
  requestId: string,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    outcome,
    requestId,
  };
  const serializedEntry = JSON.stringify(entry);

  if (outcome === 'success') {
    console.info(serializedEntry);
    return;
  }

  console.error(serializedEntry);
}
