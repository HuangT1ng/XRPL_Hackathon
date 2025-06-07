export function decodeHexCurrency(hex: string): string {
  try {
    const hexBuffer = Buffer.from(hex, 'hex');
    return hexBuffer.toString('utf8').replace(/\0/g, ''); // Remove null bytes
  } catch {
    return hex;
  }
} 