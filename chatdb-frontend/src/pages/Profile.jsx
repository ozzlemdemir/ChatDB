import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, updateProfile } from '../services/api';

export default function Profile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await getMe();
            setFormData(prev => ({
                ...prev,
                username: res.data.username,
                email: res.data.email
            }));
        } catch (err) {
            console.error('Profil yüklenemedi:', err);
            setMessage({ type: 'error', text: 'Profil bilgileri yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const updateData = {
                username: formData.username,
                email: formData.email
            };
            if (formData.password) {
                updateData.password = formData.password;
            }

            const res = await updateProfile(updateData);
            
            // Update local storage
            const updatedUser = {
                id: res.data.id,
                username: res.data.username,
                email: res.data.email
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setMessage({ type: 'success', text: 'Profil başarıyla güncellendi!' });
            setFormData(prev => ({ ...prev, password: '' })); // Clear password field
            
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Profil güncellenirken bir hata oluştu.';
            setMessage({ type: 'error', text: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={s.root}>
                <div style={s.loadingText}>Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div style={s.root}>
            <div style={s.container}>
                <div style={s.header}>
                    <button style={s.backBtn} onClick={() => navigate('/dashboard')}>
                        ← Geri
                    </button>
                    <h1 style={s.title}>Profil Ayarları</h1>
                </div>

                {message.text && (
                    <div style={message.type === 'error' ? s.errorBanner : s.successBanner}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.inputGroup}>
                        <label style={s.label}>Kullanıcı Adı</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            style={s.input}
                            required
                        />
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>E-posta</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={s.input}
                            required
                        />
                    </div>

                    <div style={s.inputGroup}>
                        <label style={s.label}>Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={s.input}
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" style={s.submitBtn} disabled={saving}>
                        {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                </form>
            </div>
        </div>
    );
}

const s = {
    root: { display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#0a0a0f', fontFamily: 'sans-serif', padding: '40px 20px' },
    container: { width: '100%', maxWidth: '500px', background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    loadingText: { color: '#818cf8', fontSize: '18px', marginTop: '100px' },
    header: { display: 'flex', flexDirection: 'column', marginBottom: '32px' },
    backBtn: { alignSelf: 'flex-start', background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', marginBottom: '16px', padding: 0 },
    title: { color: '#e2e8f0', fontSize: '24px', fontWeight: '700', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { color: '#94a3b8', fontSize: '13px', fontWeight: '500' },
    input: { background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '12px 16px', color: '#e2e8f0', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    submitBtn: { marginTop: '12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
    errorBanner: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' },
    successBanner: { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }
};
