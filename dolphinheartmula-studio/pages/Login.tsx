import React, { useState } from 'react';
import { Music, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const { login, error, clearError } = useAuth();
  const { t } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      if (isRegistering) {
        // Register API call
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, display_name: displayName || username }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || 'Registration failed');
        }
        const data = await response.json();
        // Store token and set user via AuthContext
        await login(username, password);
      } else {
        // Login
        await login(username, password);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background-dark via-[#1a1f2e] to-[#0d1117] text-slate-200 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-500 mb-4 shadow-lg shadow-purple-900/30">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-2">
            DolphinHeartMula
          </h1>
          <p className="text-slate-400 text-sm">
            {isRegistering ? '创建新账号' : '登录到工作区'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-surface-dark/70 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="输入用户名"
              />
            </div>

            {/* Display Name (register only) */}
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  显示名称 (可选)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  placeholder="输入显示名称"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="输入密码"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary-hover hover:to-purple-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/30 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegistering ? '注册中...' : '登录中...'}
                </>
              ) : (
                <>
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? '注册' : '登录'}
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                clearError();
              }}
              className="text-sm text-slate-400 hover:text-primary transition-colors"
            >
              {isRegistering ? (
                <>已有账号？ <span className="font-semibold">立即登录</span></>
              ) : (
                <>还没有账号？ <span className="font-semibold">立即注册</span></>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Powered by <span className="text-primary">DolphinHeartMula</span> AI Music Generation
        </p>
      </div>
    </div>
  );
};

export default Login;
