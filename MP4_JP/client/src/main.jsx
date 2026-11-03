import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { api } from './api';
import Header from './components/Header';
import Home from './pages/Home';
import Auth from './pages/Auth';
import EditPost from './pages/EditPost';
import './styles.css';
function App() {
  const [user, setUser] = useState(null); const [posts, setPosts] = useState([]); const [messageState, setMessageState] = useState(null);
  const setMessage = useCallback((value, isError = false) => setMessageState(typeof value === 'string' ? { text: value, error: isError } : value ? { error: false, ...value } : null), []);
  useEffect(() => { api.session().then(data => setUser(data.user)).catch(() => {}); }, []);
  return <><Header user={user} onMessage={setMessage} onAuthChange={setUser}/><Routes>
    <Route path="/" element={<Home user={user} message={messageState} setMessage={setMessage} posts={posts} setPosts={setPosts}/>}/>
    <Route path="/signin" element={<Auth mode="signin" onAuthChange={setUser} setMessage={setMessage}/>}/>
    <Route path="/signup" element={<Auth mode="signup" onAuthChange={setUser} setMessage={setMessage}/>}/>
    <Route path="/blogs/:id/edit" element={<EditPost posts={posts} setPosts={setPosts} user={user} setMessage={setMessage}/>}/>
    <Route path="*" element={<main className="auth-wrap"><section className="auth-card"><h1>Page not found.</h1><a className="button" href="/">Return to blog ↗</a></section></main>}/>
  </Routes><footer>Made for sharing ideas, one post at a time.</footer></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
