import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import BlogPostForm from '../components/BlogPostForm';
export default function EditPost({ posts, setPosts, user, setMessage }) {
  const { id } = useParams(); const navigate = useNavigate(); const [post, setPost] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const cached = posts.find(p => String(p.blog_id) === id);
    if (cached) { setPost(cached); return () => { active = false; }; }
    api.posts().then(items => {
      if (!active) return;
      setPosts(items);
      const item = items.find(p => String(p.blog_id) === id);
      if (item) setPost(item); else setError('That post could not be found.');
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
    // Fetch only when the route ID changes; post list state is updated by this fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    if (post && user && user.user_id !== post.creator_user_id) setError('You can only edit your own posts.');
    else if (post && user && user.user_id === post.creator_user_id && error === 'You can only edit your own posts.') setError('');
  }, [post, user, error]);
  async function save(values) { setBusy(true); setError(''); try { const result = await api.updatePost(id, values); setPosts(current => current.map(p => p.blog_id === result.post.blog_id ? result.post : p)); setMessage({ text: 'Your changes were saved.' }); navigate('/'); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  if (!user) return <main className="auth-wrap"><section className="auth-card"><h1>Sign in required</h1><p className="muted">Please sign in to edit a post.</p><Link className="button" to="/signin">Sign in ↗</Link></section></main>;
  return <main className="auth-wrap edit-wrap"><Link className="back-link" to="/">← Back to blog</Link><section className="auth-card edit-card"><p className="eyebrow">MAKE IT YOUR BEST</p><h1>Edit your post.</h1><p className="muted">Update your title or make changes to your story.</p>{error && <div className="error" role="alert">{error}</div>}{post && !error && <BlogPostForm initialPost={post} onSubmit={save} onCancel={() => navigate('/')} busy={busy} />}</section></main>;
}
