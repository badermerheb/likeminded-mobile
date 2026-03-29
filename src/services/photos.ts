import { api } from './api';
import { UploadResult } from '../types/api';

export const photosService = {
  getMyPhotos: () => api.get<(string | null)[]>('/me/photos'),

  // Accepts (uri, position) or (uri, fileName, position)
  uploadGalleryPhoto: (fileUri: string, fileNameOrPosition: string | number, positionArg?: number) => {
    const position = positionArg !== undefined ? positionArg : (fileNameOrPosition as number);
    const fileName = positionArg !== undefined ? (fileNameOrPosition as string) : `photo_${position}.jpg`;

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob);
    formData.append('position', String(position));
    return api.upload<UploadResult>('/me/photos/gallery', formData);
  },

  deleteGalleryPhoto: (position: number) =>
    api.delete<void>(`/me/photos/gallery/${position}`),

  getConversationPhotos: (cid: string) =>
    api.get<string[]>(`/conversations/${cid}/photos`),

  uploadVerificationPhoto: (fileUri: string, fileName: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as unknown as Blob);
    return api.upload<UploadResult>('/me/photos/verification', formData);
  },
};
