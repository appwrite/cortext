import { Storage, ID, ImageGravity, ImageFormat, Permission } from 'appwrite';
import { getAppwriteClient } from './index';

// Bucket ID is always this per project convention
const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

if (!BUCKET_ID) {
    throw new Error('VITE_APPWRITE_BUCKET_ID is not set');
}

const client = getAppwriteClient();
const storage = new Storage(client);

export const files = {
    // Create/upload a file
    upload: (file: File | Blob, name = 'upload', permissions?: Permission[]) => {
        const f =
            file instanceof File
                ? file
                : new File([file], name, { type: (file as Blob).type || 'application/octet-stream' });
        return storage.createFile({
            bucketId: BUCKET_ID,
            fileId: ID.unique(),
            file: f,
            ...(permissions ? { permissions: (permissions || []).map((permission) => permission.toString()) } : {})
        });
    },

    // Get file metadata
    get: (id: string) =>
        storage.getFile({
            bucketId: BUCKET_ID,
            fileId: id
        }),

    // Delete a file
    delete: (id: string) =>
        storage.deleteFile({
            bucketId: BUCKET_ID,
            fileId: id
        }),

    // List files (queries are optional)
    list: (queries?: string[]) =>
        storage.listFiles({
            bucketId: BUCKET_ID,
            ...(queries ? { queries: queries.map((query) => query.toString()) } : {})
        }),

    // Download URL (Resource URL)
    getDownload: (id: string) =>
        storage.getFileDownload({
            bucketId: BUCKET_ID,
            fileId: id
        }),

    // View URL
    getView: (id: string) =>
        storage.getFileView({
            bucketId: BUCKET_ID,
            fileId: id
        }),

    // Image preview URL
    getPreview: (
        id: string,
        width?: number,
        height?: number,
        gravity?: ImageGravity,
        quality?: number,
        borderWidth?: number,
        borderColor?: string,
        borderRadius?: number,
        opacity?: number,
        rotation?: number,
        background?: string,
        output?: ImageFormat
    ) =>
        storage.getFilePreview({
            bucketId: BUCKET_ID,
            fileId: id,
            width,
            height,
            gravity,
            quality,
            borderWidth,
            borderColor,
            borderRadius,
            opacity,
            rotation,
            background,
            output
        })
};

export { client, storage };
