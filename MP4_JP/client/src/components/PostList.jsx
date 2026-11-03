import { Link } from 'react-router-dom';
export default function PostList({ posts, user, onDelete }) {
  if (!posts.length) return <div className="empty">No posts yet. Be the first to share a story.</div>;
  return <div className="post-grid">{posts.map((post, index) => <article className="post-card" key={post.blog_id}>
    <div className="card-top"><span className="post-number">{String(index + 1).padStart(2, '0')}</span><span className="post-date">{new Date(post.date_created).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
    <h3>{post.title}</h3><p className="post-body">{post.body}</p>
    <div className="card-footer"><div className="avatar">{(post.creator_name || '?').charAt(0).toUpperCase()}</div><div className="author"><strong>{post.creator_name}</strong><span>@{post.creator_user_id}</span></div>
      {user?.user_id === post.creator_user_id && <div className="post-actions"><Link className="edit-link" to={`/blogs/${post.blog_id}/edit`}>Edit</Link><button className="delete-link" onClick={() => onDelete(post)} type="button">Delete</button></div>}
    </div></article>)}</div>;
}
