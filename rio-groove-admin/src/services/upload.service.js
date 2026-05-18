import api from './api';

export const uploadImage = async (file, bucket, path = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  if (path) {
    formData.append('path', path);
  }

  const response = await api.post('/upload', formData);

  return response.data.url;
};
