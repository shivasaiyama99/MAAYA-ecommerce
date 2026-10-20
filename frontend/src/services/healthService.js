import apiClient from './api';

export const healthService = {
  getHealth: async () => {
    return await apiClient.get('/health');
  },
};

export default healthService;
