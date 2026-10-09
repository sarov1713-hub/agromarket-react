import { useState } from 'react';
import { apiFetch } from '../api.js';

export default function LoginForm({ onLogin }) {
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        setError('');
        setLoading(true);
        try {
            const result = await apiFetch(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(data) });
            onLogin(result.user, result.token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="contact auth-panel" aria-labelledby="auth-title">
            <h2 id="auth-title">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
            <form key={mode} className="contact-form" onSubmit={handleSubmit}>
                {mode === 'register' && <>
                    <label htmlFor="auth-name">Имя</label>
                    <input id="auth-name" name="name" autoComplete="name" required />
                </>}
                <label htmlFor="auth-email">Email</label>
                <input id="auth-email" name="email" type="email" autoComplete="username" required />
                <label htmlFor="auth-password">Пароль</label>
                <input id="auth-password" name="password" type="password" minLength={8}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                </button>
                <button type="button" className="secondary-button" disabled={loading}
                    onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
                    {mode === 'login' ? 'Создать аккаунт' : 'Уже есть аккаунт'}
                </button>
            </form>
        </section>
    );
}
