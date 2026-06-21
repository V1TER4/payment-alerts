import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { login, register } from '../../services/auth';
import { useAuth } from '../../lib/auth-context';

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = LoginValues & {
  name: string;
};

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const { register: bind, handleSubmit, formState, setError: setFormError } = useForm<LoginValues & Partial<RegisterValues>>({
    defaultValues: {
      name: '',
      email: 'admin@contas.local',
      password: 'admin123',
    },
  });

  async function onSubmit(values: LoginValues & Partial<RegisterValues>) {
    setError(null);
    
    // Validação de senha no registro
    if (mode === 'register') {
      if (!values.password || values.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    try {
      const result =
        mode === 'login'
          ? await login({ email: values.email, password: values.password })
          : await register({
              name: values.name ?? 'Usuário',
              email: values.email,
              password: values.password,
            });

      setSession(result.accessToken, result.user);
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao processar requisição';
      
      if (mode === 'login') {
        if (message.includes('credentials') || message.includes('Invalid')) {
          setError('E-mail ou senha incorretos');
        } else {
          setError(message);
        }
      } else {
        if (message.includes('Email already registered')) {
          setError('E-mail já cadastrado');
        } else {
          setError(message);
        }
      }
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-card panel">
        <div className="eyebrow">Payment Alerts</div>
        <h1>Gerencie notificações e vencimentos sem esforço.</h1>
        <p>
          Entre para ver o painel, ajustar canais de aviso e controlar os lembretes de pagamento.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '0.75rem', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          {mode === 'register' ? (
            <label>
              <span>Nome</span>
              <input {...bind('name', { required: 'Nome é obrigatório' })} placeholder="Seu nome" />
              {formState.errors.name && (
                <span className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                  {formState.errors.name.message}
                </span>
              )}
            </label>
          ) : null}

          <label>
            <span>E-mail</span>
            <input type="email" {...bind('email', { required: 'E-mail é obrigatório' })} placeholder="voce@exemplo.com" />
            {formState.errors.email && (
              <span className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                {formState.errors.email.message}
              </span>
            )}
          </label>

          <label>
            <span>Senha</span>
            <input 
              type="password" 
              {...bind('password', { 
                required: 'Senha é obrigatória',
                minLength: mode === 'register' ? { value: 6, message: 'Mínimo de 6 caracteres' } : undefined
              })} 
              placeholder="••••••••" 
            />
            {formState.errors.password && (
              <span className="error-message" style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                {formState.errors.password.message}
              </span>
            )}
          </label>

          {mode === 'register' && (
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '-0.5rem' }}>
              A senha deve ter pelo menos 6 caracteres
            </p>
          )}

          <button className="primary-button" type="submit">
            {formState.isSubmitting ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          className="link-button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}
        </button>
      </section>
    </div>
  );
}
