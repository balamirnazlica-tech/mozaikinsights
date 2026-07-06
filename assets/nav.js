/* Mozaik Insights — responsive nav hamburger. Self-contained:
   injects its own CSS + a toggle button into .nav / .site-nav.
   No-ops on pages without a site nav. */
(function(){
  var css=
  ".nav .nav-toggle,.site-nav .nav-toggle{display:none;background:transparent;border:0;cursor:pointer;padding:9px;flex-direction:column;justify-content:center;gap:5px;width:44px;height:40px;border-radius:10px}"+
  ".nav .nav-toggle:hover{background:var(--surface-2)}.site-nav .nav-toggle:hover{background:#16223d}"+
  ".nav .nav-toggle span{background:var(--text)}.site-nav .nav-toggle span{background:#e8ecf5}"+
  ".nav .nav-toggle span,.site-nav .nav-toggle span{display:block;height:2px;width:22px;border-radius:2px;transition:transform .2s,opacity .2s}"+
  ".nav.nav-open .nav-toggle span:nth-child(1),.site-nav.nav-open .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}"+
  ".nav.nav-open .nav-toggle span:nth-child(2),.site-nav.nav-open .nav-toggle span:nth-child(2){opacity:0}"+
  ".nav.nav-open .nav-toggle span:nth-child(3),.site-nav.nav-open .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}"+
  "@media(max-width:760px){"+
  ".nav-inner,.site-nav-inner{flex-direction:row;align-items:center;flex-wrap:wrap;justify-content:space-between}"+
  ".nav .nav-toggle,.site-nav .nav-toggle{display:flex}"+
  ".nav ul,.site-nav ul{display:none;flex-direction:column;width:100%;flex-basis:100%;order:3;gap:2px;padding-top:8px}"+
  ".nav.nav-open ul,.site-nav.nav-open ul{display:flex}"+
  ".nav a.link,.site-nav a.link{padding:10px 12px}"+
  "}";
  var st=document.createElement('style');st.setAttribute('data-mzi-nav','');st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
  function init(){
    var nav=document.querySelector('nav.nav,nav.site-nav');if(!nav)return;
    var list=nav.querySelector('ul');if(!list||nav.querySelector('.nav-toggle'))return;
    var btn=document.createElement('button');btn.className='nav-toggle';btn.type='button';
    btn.setAttribute('aria-label','Menu');btn.setAttribute('aria-expanded','false');
    btn.innerHTML='<span></span><span></span><span></span>';
    list.parentNode.insertBefore(btn,list);
    if(!list.querySelector('a[href="/analytics/"]')){var _li=document.createElement("li");var _a=document.createElement("a");_a.className="link"+(location.pathname.indexOf("/analytics")===0?" active":"");_a.href="/analytics/";_a.textContent="Analytics";_li.appendChild(_a);list.appendChild(_li);}
    btn.addEventListener('click',function(e){e.stopPropagation();var o=nav.classList.toggle('nav-open');btn.setAttribute('aria-expanded',o?'true':'false');});
    list.addEventListener('click',function(e){if(e.target.closest('a'))nav.classList.remove('nav-open');});
    document.addEventListener('click',function(e){if(!nav.contains(e.target))nav.classList.remove('nav-open');});
    window.addEventListener('keydown',function(e){if(e.key==='Escape')nav.classList.remove('nav-open');});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Mozaik Insights — click-and-drag horizontal scrolling for .tabbar rows
   (Sales/Marketing/Projects sub-nav tabs). Native touch/trackpad swipe
   already works via CSS overflow-x; this adds mouse click-drag on desktop. */
(function(){
  var css = ".tabbar{cursor:grab}.tabbar.mzi-dragging{cursor:grabbing;user-select:none}";
  var st=document.createElement('style');st.setAttribute('data-mzi-tabbar-drag','');st.textContent=css;
  (document.head||document.documentElement).appendChild(st);
  function initBar(bar){
    if(bar.dataset.mziDrag)return;bar.dataset.mziDrag='1';
    var isDown=false,startX=0,scrollLeft=0,moved=false;
    bar.addEventListener('mousedown',function(e){
      isDown=true;moved=false;bar.classList.add('mzi-dragging');
      startX=e.pageX;scrollLeft=bar.scrollLeft;
    });
    window.addEventListener('mouseup',function(){isDown=false;bar.classList.remove('mzi-dragging');});
    bar.addEventListener('mouseleave',function(){isDown=false;bar.classList.remove('mzi-dragging');});
    bar.addEventListener('mousemove',function(e){
      if(!isDown)return;
      var walk=e.pageX-startX;
      if(Math.abs(walk)>5)moved=true;
      if(moved)e.preventDefault();
      bar.scrollLeft=scrollLeft-walk;
    });
    bar.addEventListener('click',function(e){
      if(moved){e.stopPropagation();e.preventDefault();moved=false;}
    },true);
  }
  function init(){document.querySelectorAll('.tabbar').forEach(initBar);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Mozaik Insights — drag-to-reorder tabs inside .tabbar rows.
   Order persists per page (localStorage), independent from the
   click-and-drag horizontal SCROLL feature above. */
(function(){
  var css = ".tabbar>*{cursor:grab}.tabbar>*.mzi-tab-dragging{opacity:.35;cursor:grabbing}";
  var st=document.createElement('style');st.setAttribute('data-mzi-tab-reorder','');st.textContent=css;
  (document.head||document.documentElement).appendChild(st);

  function keyFor(bar){ return 'mzi-taborder:'+location.pathname+(bar.id?(':'+bar.id):''); }
  function tabKey(el){ return el.dataset.id || el.getAttribute('href') || el.textContent.trim(); }

  function applyOrder(bar){
    var raw; try{ raw = localStorage.getItem(keyFor(bar)); }catch(e){ return; }
    if(!raw) return;
    var order; try{ order = JSON.parse(raw); }catch(e){ return; }
    var items = Array.prototype.slice.call(bar.children);
    if(!items.length) return;
    var map = {}; items.forEach(function(el){ map[tabKey(el)] = el; });
    order.forEach(function(k){ if(map[k]) bar.appendChild(map[k]); });
  }
  function saveOrder(bar){
    var order = Array.prototype.slice.call(bar.children).map(tabKey);
    try{ localStorage.setItem(keyFor(bar), JSON.stringify(order)); }catch(e){}
  }

  var dragEl=null, barBeingDragged=null;
  function wire(el, bar){
    if(el.dataset.mziDragWired) return; el.dataset.mziDragWired='1';
    el.draggable = true;
    el.addEventListener('dragstart', function(e){
      dragEl = el; barBeingDragged = bar;
      el.classList.add('mzi-tab-dragging');
      bar.classList.remove('mzi-dragging');
      window.dispatchEvent(new MouseEvent('mouseup'));
      e.dataTransfer.effectAllowed = 'move';
      try{ e.dataTransfer.setData('text/plain', tabKey(el)); }catch(err){}
    });
    el.addEventListener('dragend', function(){
      el.classList.remove('mzi-tab-dragging');
      if(barBeingDragged===bar) saveOrder(bar);
      dragEl=null; barBeingDragged=null;
    });
    el.addEventListener('dragover', function(e){
      if(!dragEl || barBeingDragged!==bar) return;
      e.preventDefault();
      if(dragEl===el) return;
      var rect = el.getBoundingClientRect();
      var before = (e.clientX - rect.left) < rect.width/2;
      bar.insertBefore(dragEl, before ? el : el.nextSibling);
    });
    el.addEventListener('drop', function(e){ e.preventDefault(); });
  }
  function wireAll(bar){
    Array.prototype.forEach.call(bar.children, function(el){ wire(el, bar); });
  }

  function initBar(bar){
    if(bar.dataset.mziReorder) return; bar.dataset.mziReorder='1';
    var populated = bar.children.length>0;
    if(populated){ applyOrder(bar); wireAll(bar); }
    var mo = new MutationObserver(function(){
      wireAll(bar);
      if(!populated && bar.children.length>0){
        populated = true;
        applyOrder(bar);
      }
    });
    mo.observe(bar,{childList:true});
  }
  function init(){ document.querySelectorAll('.tabbar').forEach(initBar); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
