// ===================================================
// Flavos IA 3.0 — Login / Signup Page (Redesigned)
// ===================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, APP_CONFIG } from '@flavos/shared';
import { useTheme } from '@flavos/shared';

const inputStyle = (focused: boolean): React.CSSProperties => ({
  width: '100%',
  height: 52,
  background: 'var(--bg)',
  border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
  borderRadius: 16,
  padding: '0 18px 0 48px',
  fontSize: '0.97rem',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxShadow: focused ? '0 0 0 3px rgba(29,126,253,0.15)' : 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
});

const iconStyle: React.CSSProperties = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--text-sec)',
  fontSize: 20,
  pointerEvents: 'none',
};

interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: string;
  required?: boolean;
  autoComplete?: string;
}

const InputField: React.FC<InputFieldProps> = ({ type, placeholder, value, onChange, icon, required, autoComplete }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <span className="material-symbols-rounded" style={iconStyle}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        style={inputStyle(focused)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { mode } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [btnHover, setBtnHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    try {
      await login(email, password);
      navigate('/chat');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px 16px',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'var(--surface-variant)',
        padding: '40px 40px 32px',
        borderRadius: 28,
        border: '1px solid var(--border)',
        boxShadow: mode === 'dark'
          ? '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
          : '0 24px 60px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.6)',
        transition: 'box-shadow 0.3s ease',
      }}>
        {/* Logo */}
        <img
          src="/Flavos_3.png"
          alt="Flavos Logo"
          style={{ margin: '0 auto 24px', width: 100, height: 'auto', display: 'block' }}
        />

        {/* Gradient Headline */}
        <h1 style={{
          textAlign: 'center',
          fontSize: '2rem',
          background: 'linear-gradient(90deg, #66ff4b 0%, #ff5546 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 6,
          fontWeight: 700,
          lineHeight: 1.2,
        }}>
          {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1rem',
          color: 'var(--text-sec)',
          marginBottom: 28,
        }}>
          {isLogin ? 'Faça login para continuar' : 'É rápido e fácil'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!isLogin && (
            <InputField type="text" placeholder="Seu nome" value={name} onChange={setName} icon="person" required autoComplete="name" />
          )}
          <InputField type="email" placeholder="Seu email" value={email} onChange={setEmail} icon="mail" required autoComplete="email" />
          <InputField type="password" placeholder={isLogin ? 'Sua senha' : 'Crie uma senha'} value={password} onChange={setPassword} icon="lock" required autoComplete={isLogin ? 'current-password' : 'new-password'} />

          <button
            type="submit"
            disabled={isLoading}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            style={{
              width: '100%',
              height: 52,
              border: 'none',
              borderRadius: 16,
              background: btnHover && !isLoading
                ? '#0264e3'
                : 'var(--primary)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s ease, transform 0.15s ease',
              fontFamily: 'inherit',
              opacity: isLoading ? 0.7 : 1,
              transform: btnHover && !isLoading ? 'translateY(-1px)' : 'none',
              marginTop: 4,
            }}
          >
            {isLoading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', color: 'var(--text-sec)' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ padding: '0 14px', fontSize: '0.9rem' }}>ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Google Button */}
        <button
          onClick={() => navigate('/chat')}
          disabled={isLoading}
          onMouseEnter={() => setGoogleHover(true)}
          onMouseLeave={() => setGoogleHover(false)}
          style={{
            width: '100%',
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: googleHover && !isLoading ? 'var(--border)' : 'var(--bg)',
            border: '1.5px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 16,
            fontSize: '0.97rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease, transform 0.15s ease',
            fontFamily: 'inherit',
            opacity: isLoading ? 0.7 : 1,
            transform: googleHover && !isLoading ? 'translateY(-1px)' : 'none',
          }}
        >
          <img
            src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s96-fcrop64=1,00000000ffffffff-rw"
            alt="Google"
            style={{ width: 22, height: 22 }}
          />
          {isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}
        </button>

        {/* Switch */}
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--placeholder)', fontSize: '0.93rem' }}>
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
              textDecoration: 'underline',
              textUnderlineOffset: 2,
              fontSize: 'inherit',
            }}
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>

        {/* Version */}
        <div style={{ textAlign: 'center', marginTop: 20, opacity: 0.4, fontSize: '0.78rem', color: 'var(--text-sec)' }}>
          v{APP_CONFIG.APP_VERSION} • {APP_CONFIG.APP_NAME}
        </div>
      </div>
    </div>
  );
};

export default Home;
