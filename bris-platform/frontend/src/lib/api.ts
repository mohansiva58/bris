import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (email: string, password: string, full_name: string) =>
        api.post('/auth/register', { email, password, full_name }),
    getProfile: () => api.get('/auth/me'),
}

// Risk API
export const riskAPI = {
    getUserRiskScores: (userId: number, params?: any) =>
        api.get(`/risk/${userId}`, { params }),
    getRecentRiskScores: (params?: any) => api.get('/risk/recent', { params }),
    getAlerts: (params?: any) => api.get('/risk/alerts/list', { params }),
    getDashboardMetrics: () => api.get('/risk/dashboard/metrics'),
    updateAlertStatus: (alertId: number, status: string, notes?: string) =>
        api.patch(`/risk/alerts/${alertId}/status`, { status, resolution_notes: notes }),
    getAIDNA: (userId: number, features: any) =>
        api.post('/risk/ai/dna', { userId, features }),
    getAIRconstruction: (sessionId: string, features: any) =>
        api.post('/risk/ai/reconstruction', { sessionId, features }),
    getAIGPTQuery: (query: string, contextData?: any[]) =>
        api.post('/risk/ai/query', { query, contextData }),
    getAIForensicReport: (sessionId: string, userId: number, features: any, eventsSummary?: any[]) =>
        api.post('/risk/ai/forensic-report', { sessionId, userId, features, eventsSummary }),
}

// Events API
export const eventsAPI = {
    getUserEvents: (userId: number, params?: any) =>
        api.get(`/events/${userId}`, { params }),
}

// Users API
export const usersAPI = {
    getAllUsers: (params?: any) => api.get('/users', { params }),
    updateUserStatus: (userId: number, status: string) =>
        api.patch(`/users/${userId}/status`, { status }),
}

export default api
