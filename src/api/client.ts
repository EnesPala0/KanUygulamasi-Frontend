import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { logoutAndRedirect } from '../navigation/navigationRef';

const BASE_URL = 'http://192.168.1.6:8080/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
});

apiClient.interceptors.request.use(
  async (config) => {
    // 1. İstek yola çıkmadan hemen önce cüzdana (hafızaya) bak
    const token = await SecureStore.getItemAsync('userToken');
    
    // 2. Eğer cüzdanda bilet (token) varsa, bunu Go'nun istediği formatta başlığa ekle
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Eğer istek atılırken bir hata olursa iptal et
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // 401 Unauthorized: Token süresi dolmuş veya geçersiz
      await logoutAndRedirect();
    }
    return Promise.reject(error);
  }
);

export default apiClient;