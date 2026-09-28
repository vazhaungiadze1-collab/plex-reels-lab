/* Makes the page's claude.use('db' | 'downloads' | 'user') calls work outside claude.ai,
   backed by Firebase Firestore (shared data) and normal browser downloads. */
(function(){
  var cfg=window.FIREBASE_CONFIG, fs=null;
  if(cfg && cfg.projectId && cfg.projectId!=='PASTE_HERE' && window.firebase){
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
  function wrapRef(r){
    return {id:r.id,path:r.path,
      get:function(){return r.get().then(wrapDoc)},
      set:function(d){return r.set(d).catch(fail)},
      update:function(d){return r.update(d).catch(fail)},
      delete:function(){return r.delete().catch(fail)},
      onSnapshot:function(next,err){return r.onSnapshot(function(s){next(wrapDoc(s))},function(e){err&&err({code:'unavailable',message:String(e)})})},
      collection:function(p){return wrapColl(r.collection(p))}};
  }
  function wrapColl(c){var q=wrapQuery(c);q.path=c.path;q.doc=function(id){return wrapRef(id?c.doc(id):c.doc())};q.add=function(d){var r=c.doc();return r.set(d).then(function(){return wrapRef(r)})};return q}
  function fail(e){throw {code:(e&&e.code==='permission-denied')?'invalid_argument':'unavailable',message:String(e)}}
  var db=fs?{doc:function(p){return wrapRef(fs.doc(p))},collection:function(p){return wrapColl(fs.collection(p))}}:null;

  // One-time seed from seed.json when the database is empty
  if(fs){fs.doc('settings/_seeded').get().then(function(s){ if(s.exists) return;
    return fetch('seed.json').then(function(r){return r.json()}).then(function(seed){
      var b=fs.batch();
      Object.keys(seed).forEach(function(col){Object.keys(seed[col]).forEach(function(id){b.set(fs.doc(col+'/'+id),seed[col][id])})});
      b.set(fs.doc('settings/_seeded'),{at:Date.now()});return b.commit();});
  }).catch(function(e){console.warn('seed skipped',e)});}

  var downloads={save:function(o){return new Promise(function(res){
    var blob=o.data instanceof Blob?o.data:new Blob([o.data]);var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download=o.filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},4000);res({status:'saved'});})}};
  var user={can:function(){return Promise.resolve(true)},canEdit:function(){return Promise.resolve(true)},isOwner:function(){return Promise.resolve(false)}};
  window.claude={use:function(n){return Promise.resolve(n==='db'?db:n==='downloads'?downloads:n==='user'?user:null)}};
})();
