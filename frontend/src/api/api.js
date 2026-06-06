// Pure helper functions declared outside component scope to satisfy React 19 compiler purity
export function generateId(prefix) {
    return `${prefix}-${Date.now()}`;
}

export function getFormattedDate() {
    return new Date().toISOString().split('T')[0];
}

// ==========================================================================
// API CLIENT IMPLEMENTATION
// ==========================================================================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('juristrail_token');
        const headers = {
            ...(!options.isMultipart && { 'Content-Type': 'application/json' }),
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        if (options.body && !options.isMultipart) {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
        }
        return await response.json();
    },

    auth: {
        login: (email, password) => api.request('/auth/login', { method: 'POST', body: { email, password } }),
        register: (username, email, password, confirmPassword, barId) => api.request('/auth/signup', {
            method: 'POST',
            body: { name: username, email, password, confirmPassword, firmName: barId }
        }),
    },
    cases: {
        list: () => api.request('/cases', { method: 'GET' }),
        create: (data) => api.request('/cases', { method: 'POST', body: data }),
        update: (caseId, data) => api.request(`/cases/${caseId}`, { method: 'PUT', body: data }),
        delete: (caseId) => api.request(`/cases/${caseId}`, { method: 'DELETE' }),
        getDocuments: (caseId) => api.request(`/cases/${caseId}/documents`, { method: 'GET' }),
        getTimeline: (caseId) => api.request(`/cases/${caseId}/timeline`, { method: 'GET' }),
        getInsights: (caseId) => api.request(`/cases/${caseId}/investigations`, { method: 'GET' }),
        uploadDocument: (caseId, formData) => {
            return api.request(`/cases/${caseId}/documents`, {
                method: 'POST',
                body: formData,
                isMultipart: true
            });
        },
        sendChatMessage: (caseId, message) => api.request(`/cases/${caseId}/chat`, { method: 'POST', body: { message } }),
        deleteDocument: (caseId, docId) => api.request(`/cases/${caseId}/documents/${docId}`, { method: 'DELETE' }),
        getDocumentStatus: (caseId, docId) => api.request(`/cases/${caseId}/documents/${docId}/status`, { method: 'GET' }),
        reprocessDocument: (caseId, docId) => api.request(`/cases/${caseId}/documents/${docId}/reprocess`, { method: 'POST' }),
    }
};
