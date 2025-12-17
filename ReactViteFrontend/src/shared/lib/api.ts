import axios from 'axios';

export const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to unwrap response data (response.data.data)
apiClient.interceptors.response.use(
    (response) => {
        return response.data.data;
    },
    (error) => {
        return Promise.reject(error);
    }
);
