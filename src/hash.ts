import crypto from 'crypto';

export function hashContent(content: string) {
  return crypto.createHash('sha256').update(content).digest('hex');
}
