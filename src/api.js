export const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api';

export async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(API_URL + path, { ...options, headers });
    if (res.status === 401 && token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:expired'));
        throw new Error('Сессия истекла. Войдите заново.');
    }
    const data = res.status === 204 ? null : await res.json();
    if (!res.ok) throw new Error(data?.error || `Ошибка ${res.status}`);
    return data;
}
