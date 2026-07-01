(function(){
var PASS_HASH='d04d7f12d8c2cc4a1146c7bcc5d8e4d7b03e5dbe4c0f3e7341a2955d02dfe334';
var SK='_mzi_auth';
var NK='_mzi_name';
var LK='_mzi_logins';

// People who can log in (alphabetical)
var NAMES=['Balamir Nazlıca','Banu Nazlıca','Burçin Karaca','Ceren Acar','Hilal Kaban','Özlem Taner','Yaman Erturan','Zeynep Uzel'];

// ===== Shared store config =====
// Leave BIN empty for per-device history (localStorage). To make "last logins"
// shared across everyone, create a free jsonbin.io bin and set BIN + KEY below.
var STORE={ BIN:'', KEY:'' };
var JB='https://api.jsonbin.io/v3/b/';

function sha256(s){
  return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){
    return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
  });
}
function isAuthed(){return sessionStorage.getItem(SK)==='1';}
function getName(){return sessionStorage.getItem(NK)||localStorage.getItem(NK)||'';}

function localLoad(){ try{return JSON.parse(localStorage.getItem(LK)||'[]');}catch(e){return [];} }
function loadLogins(){
  if(STORE.BIN){
    var h={}; if(STORE.KEY)h['X-Access-Key']=STORE.KEY;
    return fetch(JB+STORE.BIN+'/latest',{headers:h}).then(function(r){return r.json();})
      .then(function(j){return Array.isArray(j.record)?j.record:[];}).catch(localLoad);
  }
  return Promise.resolve(localLoad());
}
function saveLogins(arr){
  try{localStorage.setItem(LK,JSON.stringify(arr));}catch(e){}
  if(STORE.BIN){
    var h={'Content-Type':'application/json'}; if(STORE.KEY)h['X-Access-Key']=STORE.KEY;
    return fetch(JB+STORE.BIN,{method:'PUT',headers:h,body:JSON.stringify(arr)}).catch(function(){});
  }
  return Promise.resolve();
}
function recordLogin(name){
  return loadLogins().then(function(arr){
    arr.unshift({n:name,t:Date.now()});
    arr=arr.slice(0,20);
    return saveLogins(arr).then(function(){return arr;});
  });
}
function ago(ts){
  var s=Math.floor((Date.now()-ts)/1000);
  if(s<60)return 'az önce';
  var m=Math.floor(s/60); if(m<60)return m+' dk önce';
  var h=Math.floor(m/60); if(h<24)return h+' sa önce';
  var d=Math.floor(h/24); if(d<7)return d+' gün önce';
  try{return new Date(ts).toLocaleDateString('tr-TR');}catch(e){return d+' gün önce';}
}

// ===== bottom-right badge =====
function renderBadge(arr){
  arr=arr||[];
  var existing=document.getElementById('mzi-badge'); if(existing)existing.remove();
  var last=arr[0];
  var wrap=document.createElement('div'); wrap.id='mzi-badge';
  wrap.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99998;font-family:Inter,system-ui,-apple-system,sans-serif';
  var btn=document.createElement('button');
  btn.style.cssText='display:flex;align-items:center;gap:8px;background:rgba(19,27,46,.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);color:#cbd5e1;border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:500;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.35);max-width:78vw';
  var dot='<span style="width:7px;height:7px;border-radius:50%;background:#34d399;flex:none;box-shadow:0 0 8px #34d399"></span>';
  var label=last?('Son giriş: <b style="color:#fff;font-weight:600">'+esc(first(last.n))+'</b> · '+ago(last.t)):'Giriş kaydı yok';
  btn.innerHTML=dot+'<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+label+'</span>';
  wrap.appendChild(btn);

  var pop=document.createElement('div'); pop.id='mzi-pop';
  pop.style.cssText='display:none;position:absolute;right:0;bottom:48px;width:248px;max-width:80vw;background:#131b2e;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.5)';
  var rows='<div style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;margin:0 0 10px;font-weight:600">Son girişler</div>';
  if(!arr.length){ rows+='<div style="color:#64748b;font-size:13px">Henüz kayıt yok</div>'; }
  arr.slice(0,5).forEach(function(e){
    rows+='<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06)">'
      +'<span style="color:#e2e8f0;font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(e.n)+'</span>'
      +'<span style="color:#64748b;font-size:12px;flex:none">'+ago(e.t)+'</span></div>';
  });
  if(!STORE.BIN){ rows+='<div style="color:#475569;font-size:10.5px;margin-top:10px;line-height:1.4">Bu cihazda tutuluyor</div>'; }
  pop.innerHTML=rows;
  wrap.appendChild(pop);

  btn.addEventListener('click',function(e){ e.stopPropagation(); pop.style.display=pop.style.display==='none'?'block':'none'; });
  document.addEventListener('click',function(){ pop.style.display='none'; });

  document.body.appendChild(wrap);
}
function first(n){ return (n||'').split(' ')[0]; }
function esc(s){ var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function showBadge(){ loadLogins().then(renderBadge); }

// ===== gate (password -> name) =====
function showGate(){
  document.documentElement.style.overflow='hidden';
  var d=document.createElement('div');d.id='auth-gate';
  d.innerHTML='<div style="position:fixed;inset:0;z-index:99999;background:#0b1220;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;padding:16px">'
  +'<div style="background:#131b2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px 36px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);box-sizing:border-box">'
  +'<div style="width:56px;height:56px;background:linear-gradient(135deg,#a855f7,#6366f1);border-radius:14px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;font-weight:700">MZ</div>'
  +'<h1 style="color:#fff;font-size:22px;margin:0 0 6px;font-weight:600">Mozaik Insights</h1>'
  +'<p id="auth-sub" style="color:#94a3b8;font-size:14px;margin:0 0 28px">Devam etmek için erişim şifresini girin</p>'
  // step 1: password
  +'<div id="auth-step1">'
  +'<input id="auth-pw" type="password" placeholder="Şifre" autocomplete="current-password" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#0b1220;color:#fff;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:12px" />'
  +'<button id="auth-btn" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;font-size:15px;font-weight:600;cursor:pointer">Kilidi Aç</button>'
  +'<p id="auth-err" style="color:#ef4444;font-size:13px;margin:12px 0 0;display:none">Hatalı şifre</p>'
  +'</div>'
  // step 2: name
  +'<div id="auth-step2" style="display:none">'
  +'<select id="auth-name" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#0b1220;color:#fff;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:12px"><option value="">İsminizi seçin…</option></select>'
  +'<button id="auth-go" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;font-size:15px;font-weight:600;cursor:pointer">Devam</button>'
  +'</div>'
  +'</div></div>';
  document.body.appendChild(d);
  var inp=document.getElementById('auth-pw');
  var btn=document.getElementById('auth-btn');
  var err=document.getElementById('auth-err');
  function tryAuth(){
    sha256(inp.value).then(function(h){
      if(h===PASS_HASH){ goNameStep(); }
      else{err.style.display='block';inp.value='';inp.focus();}
    });
  }
  btn.addEventListener('click',tryAuth);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')tryAuth();});
  setTimeout(function(){inp.focus();},100);

  function goNameStep(){
    document.getElementById('auth-step1').style.display='none';
    document.getElementById('auth-step2').style.display='block';
    document.getElementById('auth-sub').textContent='Kim giriş yapıyor?';
    var sel=document.getElementById('auth-name');
    NAMES.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;sel.appendChild(o);});
    var pre=getName(); if(pre)sel.value=pre;
    sel.focus();
    function finish(){
      var name=sel.value; if(!name){sel.focus();return;}
      sessionStorage.setItem(SK,'1');
      sessionStorage.setItem(NK,name);
      try{localStorage.setItem(NK,name);}catch(e){}
      recordLogin(name).then(function(arr){ renderBadge(arr); });
      d.remove(); document.documentElement.style.overflow='';
    }
    document.getElementById('auth-go').addEventListener('click',finish);
    sel.addEventListener('keydown',function(e){if(e.key==='Enter')finish();});
  }
}

function onReady(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);}else{fn();} }

if(!isAuthed()){
  onReady(showGate);
}else{
  onReady(showBadge);
}
})();

/* load responsive nav hamburger */
(function(){var s=document.createElement('script');s.src='/assets/nav.js';s.defer=true;(document.head||document.documentElement).appendChild(s);})();

/* page-view logger -> Mozaik Insights usage analytics */
(function(){
  var EP='https://script.google.com/macros/s/AKfycbzAJtBbhp3lBQ8MfcsqMt7AVM_5DiUIzj_y7BuMJDYnF6Rw7pUS85s4m2usyXkUNxeF/exec';
  function nm(){try{return sessionStorage.getItem('_mzi_name')||localStorage.getItem('_mzi_name')||'';}catch(e){return '';}}
  function logView(){
    var name=nm(); if(!name)return;
    try{
      var body=JSON.stringify({name:name,page:location.pathname,title:document.title,event:'pageview',site:'insights',ref:document.referrer||'',ua:navigator.userAgent});
      navigator.sendBeacon(EP,new Blob([body],{type:'text/plain;charset=UTF-8'}));
    }catch(e){}
  }
  if(document.readyState==='complete')setTimeout(logView,400);
  else window.addEventListener('load',function(){setTimeout(logView,400);});
})();
