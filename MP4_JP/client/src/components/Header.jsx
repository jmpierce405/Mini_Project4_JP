import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
export default function Header({ user, onMessage, onAuthChange }) {
  const navigate = useNavigate();
  async function signout() { try { await api.signout(); onAuthChange(null); onMessage('You have signed out.'); navigate('/'); } catch (e) { onMessage(e.message, true); } }
  return <header className="topbar"><Link className="brand" to="/">Everyday<span>Notes</span></Link><nav><Link to="/">Home</Link>{user ? <><span className="welcome">Hi, {user.name}</span><button className="nav-button" onClick={signout}>Sign out</button></> : <><Link to="/signin">Sign in</Link><Link className="nav-cta" to="/signup">Create account</Link></>}</nav></header>;
}
