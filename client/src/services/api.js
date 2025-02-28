import axios from 'axios';

const API_URL = 'http://localhost:3535';

export const api = axios.create({
  baseURL: API_URL
});

export const testAPI = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Error testing API:', error);
    throw error;
  }
};