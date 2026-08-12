// Type definitions for Node.js globals
declare const process: {
  env: Record<string, string | undefined>;
  cwd: () => string;
};

declare const Buffer: {
  from(data: ArrayBuffer | Uint8Array): Buffer;
  prototype: Buffer;
};

declare class Buffer {
  constructor(data: ArrayBuffer | Uint8Array);
  length: number;
  toString(): string;
  toString(encoding: 'utf8' | 'base64' | 'hex'): string;
}

interface File {
  name: string;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
}
