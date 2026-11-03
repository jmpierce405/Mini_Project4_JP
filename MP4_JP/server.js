const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine','ejs'); app.set('views',path.join(__dirname,'views'));
app.use(express.urlencoded({extended:false, limit:'100kb'})); app.use(express.json({limit:'100kb'})); app.use(express.static(path.join(__dirname,'public')));
app.use(session({secret:process.env.SESSION_SECRET || 'change-this-local-demo-secret',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',maxAge:1000*60*60*8}}));
app.use((req,res,next)=>{res.locals.user=req.session.user||null;res.locals.notice=req.session.notice||null;delete req.session.notice;next();});
function requireLogin(req,res,next){if(!req.session.user){req.session.notice='Please sign in to continue.';return res.redirect('/signin');}next();}
function notice(req,msg){req.session.notice=msg;}

function apiError(res, status, error) { return res.status(status).json({ error }); }
function requireApiLogin(req, res, next) { if (!req.session.user) return apiError(res, 401, 'Please sign in to continue.'); next(); }
const clientDist = path.join(__dirname, 'client', 'dist');

// JSON API consumed by the React frontend.
app.get('/api/auth/session', (req, res) => res.json({ user: req.session.user || null }));
app.post('/api/auth/signup', async (req, res, next) => {
  try {
    const user_id = String(req.body.user_id || '').trim();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    if (!user_id || !name || !password) return apiError(res, 400, 'Please fill in every field.');
    if (user_id.length > 255 || name.length > 255 || password.length < 6) return apiError(res, 400, 'User ID and name must be 255 characters or fewer; password must be at least 6 characters.');
    if (await db.one('SELECT user_id FROM users WHERE user_id = ?', [user_id])) return apiError(res, 409, 'That user ID is already taken. Please choose another.');
    await db.run('INSERT INTO users(user_id,password,name) VALUES(?,?,?)', [user_id, await bcrypt.hash(password, 10), name]);
    return res.status(201).json({ message: 'Account created. Please sign in.' });
  } catch (e) { next(e); }
});
app.post('/api/auth/signin', async (req, res, next) => {
  try {
    const user_id = String(req.body.user_id || '').trim(); const password = String(req.body.password || '');
    const user = await db.one('SELECT user_id,password,name FROM users WHERE user_id = ?', [user_id]);
    if (!user || !await bcrypt.compare(password, user.password)) return apiError(res, 401, 'Incorrect user ID or password.');
    req.session.user = { user_id: user.user_id, name: user.name };
    return res.json({ user: req.session.user });
  } catch (e) { next(e); }
});
app.post('/api/auth/signout', (req, res) => req.session.destroy(err => err ? apiError(res, 500, 'Could not sign out. Please try again.') : res.json({ message: 'Signed out.' })));
app.get('/api/blogs', async (req, res, next) => {
  try { const posts = await db.all('SELECT * FROM blogs ORDER BY date_created DESC, blog_id DESC'); res.json({ posts }); } catch (e) { next(e); }
});
app.post('/api/blogs', requireApiLogin, async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim(), body = String(req.body.body || '').trim();
    if (!title || !body) return apiError(res, 400, 'A title and post body are required.');
    if (title.length > 255) return apiError(res, 400, 'The title must be 255 characters or fewer.');
    const result = await db.run('INSERT INTO blogs(title,body,creator_user_id,creator_name) VALUES(?,?,?,?)', [title, body, req.session.user.user_id, req.session.user.name]);
    const post = await db.one('SELECT * FROM blogs WHERE blog_id = ?', [result.lastID]);
    return res.status(201).json({ post });
  } catch (e) { next(e); }
});
app.put('/api/blogs/:id', requireApiLogin, async (req, res, next) => {
  try {
    const post = await db.one('SELECT * FROM blogs WHERE blog_id = ?', [req.params.id]);
    if (!post) return apiError(res, 404, 'That post could not be found.');
    if (post.creator_user_id !== req.session.user.user_id) return apiError(res, 403, 'You can only edit your own posts.');
    const title = String(req.body.title || '').trim(), body = String(req.body.body || '').trim();
    if (!title || !body || title.length > 255) return apiError(res, 400, 'Enter a title (255 characters max) and body.');
    await db.run('UPDATE blogs SET title = ?, body = ? WHERE blog_id = ? AND creator_user_id = ?', [title, body, req.params.id, req.session.user.user_id]);
    return res.json({ post: await db.one('SELECT * FROM blogs WHERE blog_id = ?', [req.params.id]) });
  } catch (e) { next(e); }
});
app.delete('/api/blogs/:id', requireApiLogin, async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM blogs WHERE blog_id = ? AND creator_user_id = ?', [req.params.id, req.session.user.user_id]);
    if (!result.changes) return apiError(res, 404, 'Post not found or you do not have permission to delete it.');
    return res.json({ message: 'Post deleted.' });
  } catch (e) { next(e); }
});

// When the React app has been built, serve it for all frontend routes.
// The original EJS pages remain available as a fallback before the first build.
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}
app.get('/',async(req,res,next)=>{try{const posts=await db.all('SELECT * FROM blogs ORDER BY date_created DESC, blog_id DESC');res.render('index',{posts});}catch(e){next(e);}});
app.get('/signup',(req,res)=>res.render('signup',{error:null,values:{}}));
app.post('/signup',async(req,res,next)=>{try{const user_id=(req.body.user_id||'').trim();const name=(req.body.name||'').trim();const password=req.body.password||'';if(!user_id||!name||!password)return res.status(400).render('signup',{error:'Please fill in every field.',values:{user_id,name}});if(user_id.length>255||name.length>255||password.length<6)return res.status(400).render('signup',{error:'User ID and name must be 255 characters or fewer; password must be at least 6 characters.',values:{user_id,name}});if(await db.one('SELECT user_id FROM users WHERE user_id = ?',[user_id]))return res.status(409).render('signup',{error:'That user ID is already taken. Please choose another.',values:{user_id,name}});await db.run('INSERT INTO users(user_id,password,name) VALUES(?,?,?)',[user_id,await bcrypt.hash(password,10),name]);notice(req,'Account created. Please sign in.');res.redirect('/signin');}catch(e){next(e);}});
app.get('/signin',(req,res)=>res.render('signin',{error:null,values:{}}));
app.post('/signin',async(req,res,next)=>{try{const user_id=(req.body.user_id||'').trim();const password=req.body.password||'';const user=await db.one('SELECT user_id,password,name FROM users WHERE user_id = ?',[user_id]);if(!user||!await bcrypt.compare(password,user.password))return res.status(401).render('signin',{error:'Incorrect user ID or password.',values:{user_id}});req.session.user={user_id:user.user_id,name:user.name};res.redirect('/');}catch(e){next(e);}});
app.post('/signout',(req,res)=>req.session.destroy(()=>res.redirect('/')));
app.post('/blogs',requireLogin,async(req,res,next)=>{try{const title=(req.body.title||'').trim(),body=(req.body.body||'').trim();if(!title||!body){notice(req,'A title and post body are required.');return res.redirect('/');}if(title.length>255){notice(req,'The title must be 255 characters or fewer.');return res.redirect('/');}await db.run('INSERT INTO blogs(title,body,creator_user_id,creator_name) VALUES(?,?,?,?)',[title,body,req.session.user.user_id,req.session.user.name]);notice(req,'Your post was published.');res.redirect('/');}catch(e){next(e);}});
app.get('/blogs/:id/edit',requireLogin,async(req,res,next)=>{try{const post=await db.one('SELECT * FROM blogs WHERE blog_id = ?',[req.params.id]);if(!post)return res.status(404).render('error',{message:'That post could not be found.'});if(post.creator_user_id!==req.session.user.user_id){notice(req,'You can only edit your own posts.');return res.redirect('/');}res.render('edit',{post,error:null});}catch(e){next(e);}});
app.post('/blogs/:id/edit',requireLogin,async(req,res,next)=>{try{const post=await db.one('SELECT * FROM blogs WHERE blog_id = ?',[req.params.id]);if(!post)return res.status(404).render('error',{message:'That post could not be found.'});if(post.creator_user_id!==req.session.user.user_id){notice(req,'You can only edit your own posts.');return res.redirect('/');}const title=(req.body.title||'').trim(),body=(req.body.body||'').trim();if(!title||!body||title.length>255)return res.status(400).render('edit',{post:{...post,title,body},error:'Enter a title (255 characters max) and body.'});await db.run('UPDATE blogs SET title = ?, body = ? WHERE blog_id = ? AND creator_user_id = ?',[title,body,req.params.id,req.session.user.user_id]);notice(req,'Your changes were saved.');res.redirect('/');}catch(e){next(e);}});
app.post('/blogs/:id/delete',requireLogin,async(req,res,next)=>{try{const result=await db.run('DELETE FROM blogs WHERE blog_id = ? AND creator_user_id = ?',[req.params.id,req.session.user.user_id]);notice(req,result.changes?'Post deleted.':'Post not found or you do not have permission to delete it.');res.redirect('/');}catch(e){next(e);}});
app.use((err,req,res,next)=>{console.error(err);if(req.path.startsWith('/api/'))return res.status(500).json({error:'Something went wrong. Please try again.'});res.status(500).render('error',{message:'Something went wrong. Please try again.'});});
db.init().then(()=>app.listen(PORT,()=>console.log(`\nBlog app is running at http://localhost:${PORT}\nPress Ctrl+C to stop the server.\n`))).catch(err=>{console.error('Could not start the app:',err);process.exit(1);});
