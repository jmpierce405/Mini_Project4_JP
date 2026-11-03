import { useEffect, useState } from 'react';
export default function BlogPostForm({ initialPost, onSubmit, onCancel, busy }) {
  const [title, setTitle] = useState(initialPost?.title || '');
  const [body, setBody] = useState(initialPost?.body || '');
  useEffect(() => { setTitle(initialPost?.title || ''); setBody(initialPost?.body || ''); }, [initialPost]);
  async function submit(event) { event.preventDefault(); await onSubmit({ title: title.trim(), body: body.trim() }); }
  return <form className="post-form" onSubmit={submit}>
    <label htmlFor="title">Title</label><input id="title" name="title" maxLength="255" placeholder="Give your post a title" value={title} onChange={e => setTitle(e.target.value)} required />
    <label htmlFor="body">Your post</label><textarea id="body" name="body" rows="5" placeholder="Start writing here..." value={body} onChange={e => setBody(e.target.value)} required />
    <button className="button" type="submit" disabled={busy}>{busy ? 'Saving…' : initialPost ? 'Save changes' : 'Publish post'} <span>↗</span></button>
    {onCancel && <button className="cancel-link cancel-button" type="button" onClick={onCancel}>Cancel and return</button>}
  </form>;
}
