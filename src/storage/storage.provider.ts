/** Provider-neutral file representation accepted by object storage. */
export type StorageUpload = {
  buffer: Buffer;
  contentType: string;
  key: string;
};

/** The only contract application code needs from a storage implementation. */
export interface StorageProvider {
  upload(file: StorageUpload): Promise<string>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
