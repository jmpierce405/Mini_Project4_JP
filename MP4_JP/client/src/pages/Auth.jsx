import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
export default function Auth({ mode, onAuthChange, setMessage }) {
  const signup = mode === 'signup'; const [name, setName] = useState(''); const [user_id, setUserId] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  async function submit(e) { e.preventDefault(); setError(''); setBusy(true); try { if (signup) await api.signup({ name, user_id, password }); const result = signup ? null : await api.signin({ user_id, password }); if (result?.user) { onAuthChange(result.user); setMessage({ text: 'Welcome back!' }); navigate('/'); } else { setMessage({ text: 'Account created. Please sign in.' }); navigate('/signin'); } } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <main className="auth-wrap"><Link className="back-link" to="/">← Back to blog</Link><section className="auth-card"><div className="auth-icon">✳</div><p className="eyebrow">{signup ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}</p><h1>{signup ? 'Your story starts here.' : 'Good to see you.'}</h1><p className="muted">{signup ? 'Create an account to publish and manage your posts.' : 'Sign in to continue to your corner of the community.'}</p>{error && <div className="error" role="alert">{error}</div>}
  <form className="post-form" onSubmit={submit}>{signup && <><label htmlFor="name">Display name</label><input id="name" name="name" maxLength="255" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></>}
  <label htmlFor="user_id">User ID</label><input id="user_id" name="user_id" maxLength="255" autoComplete="username" value={user_id} onChange={e => setUserId(e.target.value)} required />
  <label htmlFor="password">Password</label><input id="password" name="password" type="password" minLength={signup ? 6 : undefined} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required />{signup && <small className="field-help">Use at least 6 characters.</small>}
  <button className="button full" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} <span>↗</span></button></form>
  <p className="auth-switch">{signup ? 'Already have an account?' : 'New around here?'} <Link to={signup ? '/signin' : '/signup'}>{signup ? 'Sign in' : 'Create an account'}</Link></p></section></main>;
}
