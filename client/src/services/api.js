import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Optional: redirect to login if unauthorized and not already on login page
            if (window.location.pathname !== '/') {
                window.location.href = '/?error=session_expired';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
