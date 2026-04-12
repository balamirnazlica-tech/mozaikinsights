(function(){
var PASS_HASH='d04d7f12d8c2cc4a1146c7bcc5d8e4d7b03e5dbe4c0f3e7341a2955d02dfe334';
var SK='_mzi_auth';
function sha256(s){
  return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){
    return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('');
  });
}
function isAuthed(){return sessionStorage.getItem(SK)==='1';}
function showGate(){
  document.documentElement.style.overflow='hidden';
  var d=document.createElement('div');d.id='auth-gate';
  d.innerHTML='<div style="position:fixed;inset:0;z-index:99999;background:#0b1220;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif">'
  +'<div style="background:#131b2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:48px;max-width:400px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5)">'
  +'<div style="width:56px;height:56px;background:linear-gradient(135deg,#a855f7,#6366f1);border-radius:14px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;font-weight:700">MZ</div>'
  +'<h1 style="color:#fff;font-size:22px;margin:0 0 6px;font-weight:600">Mozaik Insights</h1>'
  +'<p style="color:#94a3b8;font-size:14px;margin:0 0 28px">Enter the access password to continue</p>'
  +'<input id="auth-pw" type="password" placeholder="Password" style="width:100%;padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);background:#0b1220;color:#fff;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:12px" />'
  +'<button id="auth-btn" style="width:100%;padding:12px;border-radius:8px;border:none;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;font-size:15px;font-weight:600;cursor:pointer">Unlock</button>'
  +'<p id="auth-err" style="color:#ef4444;font-size:13px;margin:12px 0 0;display:none">Incorrect password</p>'
  +'</div></div>';
  document.body.appendChild(d);
  var inp=document.getElementById('auth-pw');
  var btn=document.getElementById('auth-btn');
  var err=document.getElementById('auth-err');
  function tryAuth(){
    sha256(inp.value).then(function(h){
      if(h===PASS_HASH){sessionStorage.setItem(SK,'1');d.remove();document.documentElement.style.overflow='';}
      else{err.style.display='block';inp.value='';inp.focus();}
    });
  }
  btn.addEventListener('click',tryAuth);
  inp.addEventListener('keydown',function(e){if(e.key==='Enter')tryAuth();});
  setTimeout(function(){inp.focus();},100);
}
if(!isAuthed()){
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',showGate);}
  else{showGate();}
}
})();