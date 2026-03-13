import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendQuery, getConversations, getConversation, deleteConversation, testConnection } from '../services/api';

export default function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Veritabanı bağlantı bilgileri
    const [dbConfig, setDbConfig] = useState({
        host: 'localhost', port: 5432, dbname: '', user: 'postgres', password: ''
    });
    const [connected, setConnected] = useState(false);
    const [connectError, setConnectError] = useState('');
    const [connectLoading, setConnectLoading] = useState(false);

    // Sohbet
    const [messages, setMessages] = useState([]);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState(null);

    // Sohbet geçmişi
    const [conversations, setConversations] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const messagesEndRef = useRef(null);

    // Sayfa açılınca sohbet geçmişini yükle
    useEffect(() => {
        loadConversations();
    }, []);

    // Yeni mesaj gelince aşağı kaydır
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function loadConversations() {
        setHistoryLoading(true);
        try {
            const res = await getConversations();
            setConversations(res.data);
        } catch (err) {
            console.error('Geçmiş yüklenemedi:', err);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function loadConversation(id) {
        try {
            const res = await getConversation(id);
            const msgs = res.data.messages.map(m => ({
                type: 'exchange',
                question: m.question,
                sql: m.sql,
                result: m.result
            }));
            setMessages(msgs);
            setConversationId(id);

            // O sohbetin DB bilgisini göster
            setDbConfig(prev => ({ ...prev, dbname: res.data.db_name }));
        } catch (err) {
            console.error('Sohbet yüklenemedi:', err);
        }
    }

    async function handleDeleteConversation(e, id) {
        e.stopPropagation();
        try {
            await deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (conversationId === id) {
                setMessages([]);
                setConversationId(null);
            }
        } catch (err) {
            console.error('Sohbet silinemedi:', err);
        }
    }

    async function handleConnect() {
        setConnectError('');
        setConnectLoading(true);
        try {
            await testConnection(dbConfig);
            setConnected(true);
        } catch (err) {
            setConnectError(err.response?.data?.detail || 'Bağlantı hatası');
            setConnected(false);
        } finally {
            setConnectLoading(false);
        }
    }

    async function handleSend() {
        if (!question.trim() || !connected || loading) return;

        const q = question;
        setQuestion('');
        setLoading(true);

        // Kullanıcı mesajını hemen ekle
        setMessages(prev => [...prev, { type: 'user', question: q }]);

        try {
            const res = await sendQuery(q, dbConfig, conversationId);
            const data = res.data;

            // Cevabı ekle
            setMessages(prev => [
                ...prev.slice(0, -1), // Son user mesajını kaldır
                { type: 'exchange', question: q, sql: data.sql, result: data.result }
            ]);

            setConversationId(data.conversation_id);
            loadConversations(); // Geçmişi güncelle
        } catch (err) {
    const errMsg = err.response?.data?.detail 
        ? (typeof err.response.data.detail === 'string' 
            ? err.response.data.detail 
            : JSON.stringify(err.response.data.detail))
        : 'Hata oluştu';
    
    setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'exchange', question: q, sql: null, result: { error: errMsg } }
    ]);
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }

    function newChat() {
        setMessages([]);
        setConversationId(null);
    }

    return (
        <div style={s.root}>
            {/* SOL SIDEBAR */}
            <div style={s.sidebar}>
                <div style={s.sidebarTop}>
                    <div style={s.logo}>🗄️ ChatDB</div>

                    {/* VERİTABANI BAĞLANTISI */}
                    <div style={s.section}>
                        <div style={s.sectionTitle}>VERİTABANI BAĞLANTISI</div>
                        {['host', 'dbname', 'user', 'password'].map(field => (
                            <input
                                key={field}
                                type={field === 'password' ? 'password' : 'text'}
                                placeholder={field}
                                value={dbConfig[field]}
                                onChange={e => setDbConfig(prev => ({ ...prev, [field]: e.target.value }))}
                                style={s.input}
                            />
                        ))}
                        <button onClick={handleConnect} style={s.connectBtn} disabled={connectLoading}>
                            {connectLoading ? 'Bağlanıyor...' : connected ? '✓ Bağlandı' : 'Bağlan'}
                        </button>
                        {connectError && <div style={s.errorMsg}>{connectError}</div>}
                        {connected && <div style={s.successMsg}>● Bağlantı başarılı</div>}
                    </div>

                    {/* SOHBET GEÇMİŞİ */}
                    <div style={s.section}>
                        <div style={{ ...s.sectionTitle, display: 'flex', justifyContent: 'space-between' }}>
                            <span>SOHBET GEÇMİŞİ</span>
                            <span style={s.newChat} onClick={newChat}>+ Yeni</span>
                        </div>
                        {historyLoading && <div style={s.muted}>Yükleniyor...</div>}
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => loadConversation(conv.id)}
                                style={{ ...s.convItem, ...(conv.id === conversationId ? s.convItemActive : {}) }}
                            >
                                <div style={s.convTitle}>{conv.title}</div>
                                <div style={s.convMeta}>{conv.db_name}</div>
                                <button
                                    onClick={e => handleDeleteConversation(e, conv.id)}
                                    style={s.deleteBtn}
                                >×</button>
                            </div>
                        ))}
                        {conversations.length === 0 && !historyLoading && (
                            <div style={s.muted}>Henüz sohbet yok</div>
                        )}
                    </div>
                </div>

                {/* KULLANICI */}
                <div style={s.userArea} onClick={() => setIsMenuOpen(!isMenuOpen)}>
         <div style={s.userName}>👤 {user.username}</div>
    
            {isMenuOpen && (
        <div style={s.dropdownMenu}>
            <div style={s.dropdownItem} onClick={() => navigate('/profile')}>Profil</div>
            <div style={s.dropdownItem} onClick={() => console.log("Ayarlar tıklandı")}>Ayarlar</div>
            <hr style={s.divider} />
            <button onClick={handleLogout} style={s.logoutBtnInline}>Çıkış Yap</button>
        </div>
    )}
</div>
            </div>

            {/* ANA ALAN */}
            <div style={s.main}>
                {/* MESAJLAR */}
                <div style={s.messages}>
                    {messages.length === 0 && (
                        <div style={s.welcome}>
                            <div style={s.welcomeIcon}>💬</div>
                            <h2 style={s.welcomeTitle}>Veritabanınıza sorun</h2>
                            <p style={s.welcomeText}>Sol taraftan bağlantı yapın ve soru sormaya başlayın.</p>
                            <div style={s.examples}>
                                {['Kaç kayıt var?', 'En yüksek değer nedir?', 'Tüm tabloları listele'].map(ex => (
                                    <div key={ex} style={s.exampleChip} onClick={() => setQuestion(ex)}>{ex}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} style={s.messageWrapper}>
                            {/* SORU */}
                            <div style={s.userBubble}>{msg.question}</div>

                            {/* CEVAP */}
                            {msg.sql && (
                                <div style={s.botBubble}>
                                    {/* SQL */}
                                    <div style={s.sqlBlock}>
                                        <div style={s.sqlHeader}>
                                            <span style={s.sqlLabel}>SQL</span>
                                            <button style={s.copyBtn} onClick={() => navigator.clipboard.writeText(msg.sql)}>kopyala</button>
                                        </div>
                                        <div style={s.sqlCode}>{msg.sql}</div>
                                    </div>

                                    {/* SONUÇ */}
                                    {msg.result?.error && (
                                        <div style={s.errorBlock}>⚠ {msg.result.error}</div>
                                    )}
                                    {msg.result?.rows && (
                                        <div style={s.resultBlock}>
                                            <div style={s.resultHeader}>✓ {msg.result.rows.length} satır döndü</div>
                                            <table style={s.table}>
                                                <thead>
                                                    <tr>{msg.result.columns.map(c => <th key={c} style={s.th}>{c}</th>)}</tr>
                                                </thead>
                                                <tbody>
                                                    {msg.result.rows.map((row, ri) => (
                                                        <tr key={ri}>
                                                            {row.map((cell, ci) => <td key={ci} style={s.td}>{String(cell ?? '')}</td>)}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SADECE HATA */}
                            {!msg.sql && msg.result?.error && (
                                <div style={s.botBubble}>
                                    <div style={s.errorBlock}>⚠ {msg.result.error}</div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* LOADING */}
                    {loading && (
                        <div style={s.loadingBubble}>
                            <span style={s.dot}></span>
                            <span style={s.dot}></span>
                            <span style={s.dot}></span>
                            <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '8px' }}>SQL üretiliyor...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* INPUT ALANI */}
                <div style={s.inputArea}>
                    <textarea
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={connected ? 'Sorunuzu yazın...' : 'Önce veritabanına bağlanın'}
                        style={s.textarea}
                        disabled={!connected}
                        rows={1}
                    />
                    <button onClick={handleSend} style={s.sendBtn} disabled={!connected || loading}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}


const s = {
    
    root: { display: 'flex', height: '100vh', background: '#0a0a0f', fontFamily: 'sans-serif', overflow: 'hidden' },
    sidebar: { width: '280px', minWidth: '280px', background: '#111118', borderRight: '1px solid #2a2a3a', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    sidebarTop: { flex: 1, overflowY: 'auto', padding: '20px 16px' },
    logo: { fontSize: '22px', fontWeight: '800', color: '#818cf8', marginBottom: '20px' },
    section: { marginBottom: '24px' },
    sectionTitle: { fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', color: '#64748b', marginBottom: '10px', fontFamily: 'monospace' },
    input: { width: '100%', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '6px', padding: '8px 10px', color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', outline: 'none', marginBottom: '6px', boxSizing: 'border-box' },
    connectBtn: { width: '100%', padding: '10px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
    errorMsg: { color: '#f87171', fontSize: '12px', marginTop: '6px' },
    successMsg: { color: '#34d399', fontSize: '12px', marginTop: '6px' },
    newChat: { color: '#818cf8', cursor: 'pointer', fontSize: '12px' },
    convItem: { padding: '10px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', position: 'relative', border: '1px solid transparent' },
    convItemActive: { background: '#1a1a24', border: '1px solid #2a2a3a' },
    convTitle: { fontSize: '13px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '20px' },
    convMeta: { fontSize: '11px', color: '#64748b', marginTop: '2px' },
    deleteBtn: { position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px', padding: '0' },
    muted: { color: '#64748b', fontSize: '12px' },
    userArea: { padding: '16px', borderTop: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    userName: { color: '#e2e8f0', fontSize: '13px' },
    logoutBtn: { background: 'none', border: '1px solid #2a2a3a', color: '#64748b', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    messages: { flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' },
    welcome: { textAlign: 'center', padding: '60px 20px' },
    welcomeIcon: { fontSize: '48px', marginBottom: '16px' },
    welcomeTitle: { color: '#e2e8f0', fontSize: '28px', fontWeight: '700', marginBottom: '8px' },
    welcomeText: { color: '#64748b', fontSize: '15px' },
    examples: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' },
    exampleChip: { background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '20px', padding: '8px 16px', fontSize: '13px', color: '#94a3b8', cursor: 'pointer' },
    messageWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
    userBubble: { alignSelf: 'flex-end', background: '#6366f1', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', maxWidth: '70%', fontSize: '14px', lineHeight: '1.5' },
    botBubble: { background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px 16px 16px 4px', padding: '16px', maxWidth: '100%' },
    sqlBlock: { background: '#0d1117', border: '1px solid #2a2a3a', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' },
    sqlHeader: { display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #2a2a3a', background: 'rgba(255,255,255,0.02)' },
    sqlLabel: { fontSize: '10px', fontWeight: '600', letterSpacing: '1px', color: '#818cf8', fontFamily: 'monospace' },
    copyBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '11px', fontFamily: 'monospace' },
    sqlCode: { padding: '12px', fontFamily: 'monospace', fontSize: '13px', color: '#a5b4fc', whiteSpace: 'pre-wrap' },
    resultBlock: { border: '1px solid #2a2a3a', borderRadius: '8px', overflow: 'hidden' },
    resultHeader: { padding: '6px 12px', background: 'rgba(52,211,153,0.05)', color: '#34d399', fontSize: '11px', fontWeight: '600', fontFamily: 'monospace', borderBottom: '1px solid #2a2a3a' },
    table: { width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '13px' },
    th: { padding: '8px 12px', textAlign: 'left', color: '#64748b', borderBottom: '1px solid #2a2a3a', background: 'rgba(255,255,255,0.02)' },
    td: { padding: '8px 12px', color: '#e2e8f0', borderBottom: '1px solid rgba(42,42,58,0.5)' },
    errorBlock: { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '10px 12px', color: '#f87171', fontSize: '12px', fontFamily: 'monospace' },
    loadingBubble: { display: 'flex', alignItems: 'center', padding: '12px 16px', background: '#111118', border: '1px solid #2a2a3a', borderRadius: '16px', width: 'fit-content' },
    dot: { width: '6px', height: '6px', background: '#6366f1', borderRadius: '50%', display: 'inline-block', margin: '0 2px', animation: 'bounce 1s infinite' },
    inputArea: { padding: '16px 32px', borderTop: '1px solid #2a2a3a', background: '#111118', display: 'flex', gap: '12px' },
    textarea: { flex: 1, background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '12px 16px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'sans-serif', outline: 'none', resize: 'none' },
    sendBtn: { width: '48px', height: '48px', background: '#6366f1', border: 'none', borderRadius: '10px', color: 'white', fontSize: '18px', cursor: 'pointer' },
    userArea: { padding: '16px', borderTop: '1px solid #2a2a3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    userName: { color: '#e2e8f0', fontSize: '13px' },
    dropdownMenu: { position: 'absolute', bottom: '60px', left: '16px', background: '#111118', border: '1px solid #2a2a3a', borderRadius: '8px', overflow: 'hidden', zIndex: 100 },
    dropdownItem: { padding: '10px 16px', color: '#e2e8f0', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' },
    divider: { margin: '0', border: 'none', borderTop: '1px solid #2a2a3a' },
    logoutBtnInline: { width: '100%', background: 'none', border: '1px solid #2a2a3a', color: '#64748b', borderRadius: '6px', padding: '8px 0', cursor: 'pointer', fontSize: '13px' },
};
