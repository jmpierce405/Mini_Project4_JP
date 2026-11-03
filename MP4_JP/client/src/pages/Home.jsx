import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import BlogPostForm from '../components/BlogPostForm';
import PostList from '../components/PostList';
export default function Home({ user, message, setMessage, posts, setPosts }) {
  const [busy, setBusy] = useState(false); const navigate = useNavigate();
  useEffect(() => { api.posts().then(setPosts).catch(e => setMessage(e.message, true)); }, [setPosts, setMessage]);
  async function create(values) { setBusy(true); try { const result = await api.createPost(values); setPosts(current => [result.post, ...current]); setMessage('Your post was published.'); } catch (e) { setMessage(e.message, true); } finally { setBusy(false); } }
  async function remove(post) { if (!window.confirm('Permanently delete this post?')) return; try { await api.deletePost(post.blog_id); setPosts(current => current.filter(item => item.blog_id !== post.blog_id)); setMessage('Post deleted.'); } catch (e) { setMessage(e.message, true); } }
  return <main className="container"><section className="hero"><p className="eyebrow">A LITTLE SPACE FOR BIG IDEAS</p><h1>Stories worth <em>sharing.</em></h1><p className="subhead">Notes on learning, everyday life, and the things that inspire us.</p></section>
    {message && <div className={message.error ? 'error' : 'notice'} role="status">{message.text}</div>}
    {user ? <section className="panel compose"><div><p className="eyebrow">YOUR NEXT STORY</p><h2>Write a post</h2><p className="muted">Share something you have learned or something on your mind.</p></div><BlogPostForm onSubmit={create} busy={busy} /></section> : <section className="signin-prompt"><div><strong>Have a story to share?</strong><p>Sign in to publish, edit, and manage your own posts.</p></div><button className="button" onClick={() => navigate('/signin')}>Sign in to write ↗</button></section>}
    <section className="feed-heading"><div><p className="eyebrow">THE LATEST</p><h2>From the community</h2></div><span className="post-count">{posts.length} posts</span></section><PostList posts={posts} user={user} onDelete={remove}/>
  </main>;
}
