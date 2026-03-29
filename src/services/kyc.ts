import { api } from './api';
import { KycStatus } from '../types/api';

export const kycService = {
  getStatus: () => api.get<KycStatus>('/me/kyc/status'),

  /**
   * Upload KYC verification documents.
   * Accepts either an array of URIs (string[]) or an array of {uri, name} objects.
   */
  upload: (files: string[] | Array<{ uri: string; name: string }>) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      const isString = typeof file === 'string';
      const uri = isString ? file : file.uri;
      const name = isString ? `kyc_${index}.jpg` : file.name;
      formData.append('files', {
        uri,
        name,
        type: 'image/jpeg',
      } as unknown as Blob);
    });
    return api.upload<Record<string, unknown>>('/me/kyc/upload', formData);
  },

  cancel: () => api.delete<void>('/me/kyc/cancel'),
};
