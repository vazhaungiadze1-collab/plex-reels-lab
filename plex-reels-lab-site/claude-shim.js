/* Runs the page outside claude.ai: shared data in Firebase Firestore, owner sign-in with Google,
   normal browser downloads. Timeline: everyone edits. Reels (scripts + status): owner only. */
(function(){
  var cfg=window.FIREBASE_CONFIG, OWNER=(window.PLEX_OWNER_EMAIL||'').toLowerCase(), fs=null, isOwner=false, who=null;
  if(cfg && cfg.projectId && window.firebase){
    try{ firebase.initializeApp(cfg); fs=firebase.firestore(); }catch(e){ console.error('Firebase init failed',e); }
  }
  function wrapDoc(s){return {id:s.id,exists:s.exists,data:function(){return s.data()},metadata:{fromCache:s.metadata.fromCache,hasPendingWrites:s.metadata.hasPendingWrites}}}
  function wrapQuery(q){
    return {
      where:function(f,op,v){return wrapQuery(q.where(f,op,v))},
      orderBy:function(f,d){return wrapQuery(q.orderBy(f,d||'asc'))},
      limit:function(n){return wrapQuery(q.limit(n))},
      get:function(){return q.get().then(function(s){return {docs:s.docs.map(wrapDoc),size:s.size,empty:s.empty}})},
      onSnapshot:function(next,err){return q.onSnapshot(function(s){next({docs:s.docs.map(wrapDoc),size:s.size,empty:s.empty,docChanges:function(){return []}})},function(e){err&&err({code:'unavailable',message:String(e)})})}
    };
  }
  function failFor(path){return function(e){
    var denied=e&&e.code==='permission-denied';
    // Reel edits by non-owners must not lock the timeline, so they report a soft error.
    if(denied && /^reels\//.test(path)) throw {code:'unavailable',message:'owner only'};
    throw {code:denied?'invalid_argument':'unavailable',message:String(e)};
  }}
  function wrapRef(r){
    var p=r.path;
    return {id:r.id,path:p,
      get:function(){return r.get().then(wrapDoc)},
      set:function(d){ if(/^reels\//.test(p)&&!isOwner) return Promise.reject({code:'unavailable',message:'owner only'}); return r.set(d).catch(failFor(p))},
      update:function(d){return r.update(d).catch(failFor(p))},
      delete:function(){return r.delete().catch(failFor(p))},
      onSnapshot:function(next,err){return r.onSnapshot(function(s){next(wrapDoc(s))},function(e){err&&err({code:'unavailable',message:String(e)})})},
      collection:function(c){return wrapColl(r.collection(c))}};
  }
  function wrapColl(c){var q=wrapQuery(c);q.path=c.path;q.doc=function(id){return wrapRef(id?c.doc(id):c.doc())};q.add=function(d){var r=c.doc();return r.set(d).then(function(){return wrapRef(r)})};return q}
  var db=fs?{doc:function(p){return wrapRef(fs.doc(p))},collection:function(p){return wrapColl(fs.collection(p))}}:null;

  var downloads={save:function(o){return new Promise(function(res){
    var blob=o.data instanceof Blob?o.data:new Blob([o.data]);var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=o.filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},4000);res({status:'saved'});})}};
  var user={can:function(){return Promise.resolve(true)},canEdit:function(){return Promise.resolve(isOwner)},isOwner:function(){return Promise.resolve(isOwner)}};
  window.claude={use:function(n){return Promise.resolve(n==='db'?db:n==='downloads'?downloads:n==='user'?user:null)}};

  /* ---------- owner sign-in + read-only reels for everyone else ---------- */
  var css=document.createElement('style');
  css.textContent='.adm{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}'+
    '.adm button{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer;font:inherit;font-size:12px}'+
    '.adm button:hover{border-color:var(--muted)}.adm .on{color:var(--lime-ink);font-weight:600}'+
    'body:not(.plex-owner) #drawer .bf textarea{background:transparent;border-color:transparent;resize:none}'+
    'body:not(.plex-owner) #drawer [data-st]{opacity:.55;cursor:not-allowed}'+
    '.ro-note{font-size:12px;color:var(--muted);border:1px dashed var(--line);border-radius:10px;padding:8px 12px}';
  document.head.appendChild(css);
  var box=document.createElement('div');box.className='adm';
  function paint(){
    document.body.classList.toggle('plex-owner',isOwner);
    if(!fs){box.innerHTML='';return}
    if(isOwner) box.innerHTML='<span class="on">● Admin</span><button type="button" data-out>Sign out</button>';
    else if(who) box.innerHTML='<span>'+who+' — view only</span><button type="button" data-out>Sign out</button>';
    else box.innerHTML='<button type="button" data-in>Admin sign in</button>';
    lockDrawer();
  }
  function lockDrawer(){
    var d=document.getElementById('drawer');if(!d)return;
    d.querySelectorAll('.bf textarea').forEach(function(t){t.readOnly=!isOwner});
    d.querySelectorAll('[data-st]').forEach(function(b){b.disabled=!isOwner});
    var n=d.querySelector('.ro-note'), row=d.querySelector('.statusrow');
    if(!isOwner&&row&&!n){n=document.createElement('div');n.className='ro-note';n.textContent='სცენარისა და სტატუსის რედაქტირება მხოლოდ ადმინისტრატორს შეუძლია. ტექსტის კოპირება ყველას შეუძლია.';row.parentNode.insertBefore(n,row)}
    if(isOwner&&n)n.remove();
  }
  box.addEventListener('click',function(e){
    if(e.target.closest('[data-in]')){var p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
      firebase.auth().signInWithPopup(p).catch(function(err){if(err&&err.code!=='auth/popup-closed-by-user')alert('Sign-in failed: '+(err.message||err))})}
    if(e.target.closest('[data-out]'))firebase.auth().signOut();
  });
  function mount(){
    var top=document.querySelector('header.top');if(top)top.appendChild(box);else document.body.prepend(box);
    var d=document.getElementById('drawer');if(d)new MutationObserver(lockDrawer).observe(d,{childList:true,subtree:true});
    paint();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();

  if(fs){
    var s=document.createElement('script');s.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js';
    s.onload=function(){firebase.auth().onAuthStateChanged(function(u){
      who=u?(u.email||'signed in'):null;
      isOwner=!!(u&&u.email&&u.emailVerified&&u.email.toLowerCase()===OWNER);
      paint();
    })};
    document.head.appendChild(s);
  }
})();
