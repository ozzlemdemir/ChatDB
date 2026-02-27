import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await register(username, email, password);
            localStorage.setItem('token', res.data.access_token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Kayıt başarısız');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>🗄️ ChatDB</div>
                <h2 style={styles.title}>Kayıt Ol</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Kullanıcı Adı</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            style={styles.input}
                            placeholder="kullanici_adi"
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                            placeholder="email@ornek.com"
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Şifre</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={styles.input}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <p style={styles.link}>
                    Zaten hesabın var mı? <Link to="/login" style={styles.a}>Giriş Yap</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        background: '#111118',
        border: '1px solid #2a2a3a',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
    },
    logo: {
        fontSize: '28px',
        fontWeight: '800',
        color: '#818cf8',
        textAlign: 'center',
        marginBottom: '8px',
        fontFamily: 'sans-serif',
    },
    title: {
        color: '#e2e8f0',
        textAlign: 'center',
        marginBottom: '24px',
        fontFamily: 'sans-serif',
        fontWeight: '600',
    },
    error: {
        background: 'rgba(248,113,113,0.1)',
        border: '1px solid rgba(248,113,113,0.3)',
        color: '#f87171',
        padding: '10px 14px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px',
        fontFamily: 'sans-serif',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    label: {
        color: '#64748b',
        fontSize: '12px',
        fontFamily: 'monospace',
    },
    input: {
        background: '#1a1a24',
        border: '1px solid #2a2a3a',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#e2e8f0',
        fontSize: '14px',
        fontFamily: 'monospace',
        outline: 'none',
    },
    button: {
        background: '#6366f1',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '8px',
        fontFamily: 'sans-serif',
    },
    link: {
        textAlign: 'center',
        marginTop: '20px',
        color: '#64748b',
        fontSize: '14px',
        fontFamily: 'sans-serif',
    },
    a: {
        color: '#818cf8',
        textDecoration: 'none',
    }
};