// ===================================================
// Flavos IA 3.0 — Login / Signup Page
// ===================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, APP_CONFIG } from '@flavos/shared';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Estados locais dos formulários
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      // Mock de login (TODO: Integrar com Firebase de verdade)
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 20,
        background: 'var(--bg)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 450,
          background: 'var(--surface-variant)',
          padding: 40,
          borderRadius: 20,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Logo */}
        <img
          src="/Flavos_3.png"
          alt="Flavos Logo"
          style={{
            margin: '0 auto 30px',
            width: 120, // Aumentado para melhor visibilidade
            height: 'auto',
            display: 'block',
          }}
        />

        {/* Headings */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '2.2rem',
            background: 'linear-gradient(to right, #66ff4b, #ff5546)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 5,
            fontWeight: 700,
          }}
        >
          {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </h1>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '1.2rem',
            color: 'var(--text-sec)',
            marginBottom: 30,
            fontWeight: 400,
          }}
        >
          {isLogin ? 'Faça login para continuar' : 'É rápido e fácil'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-rounded"
                style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sec)' }}
              >
                person
              </span>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 55,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '0 20px 0 50px',
                  fontSize: '1rem',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-rounded"
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sec)' }}
            >
              mail
            </span>
            <input
              type="email"
              placeholder="Seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: 55,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '0 20px 0 50px',
                fontSize: '1rem',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <span
              className="material-symbols-rounded"
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sec)' }}
            >
              lock
            </span>
            <input
              type="password"
              placeholder={isLogin ? 'Sua senha' : 'Crie uma senha'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: 55,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '0 20px 0 50px',
                fontSize: '1rem',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: 55,
              border: 'none',
              borderRadius: 12,
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s ease',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.currentTarget.style.background = '#0264e3';
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'var(--primary)';
            }}
          >
            {isLoading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            margin: '25px 0',
            color: 'var(--text-sec)',
          }}
        >
          <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }} />
          <span style={{ padding: '0 15px' }}>ou</span>
          <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }} />
        </div>

        {/* Google Auth (Mocking) */}
        <button
          onClick={() => {
            // TODO: Integrar Firebase Google Auth
            navigate('/chat');
          }}
          disabled={isLoading}
          style={{
            width: '100%',
            height: 55,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 15,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 12,
            fontSize: '1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s ease',
            fontFamily: 'inherit',
            opacity: isLoading ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            if (!isLoading) e.currentTarget.style.background = 'var(--border)';
          }}
          onMouseOut={(e) => {
            if (!isLoading) e.currentTarget.style.background = 'var(--bg)';
          }}
        >
          <img
            src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s96-fcrop64=1,00000000ffffffff-rw"
            alt="Google"
            style={{ width: 24, height: 24 }}
          />
          {isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}
        </button>

        {/* Switch form */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 25,
            color: 'var(--placeholder)',
            fontSize: '0.95rem',
          }}
        >
          {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: 0,
            }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>

        {/* Version */}
        <div style={{ textAlign: 'center', marginTop: 30, opacity: 0.5, fontSize: '0.8rem' }}>
          v{APP_CONFIG.APP_VERSION} • {APP_CONFIG.APP_NAME}
        </div>
      </div>
    </div>
  );
};

export default Home;
