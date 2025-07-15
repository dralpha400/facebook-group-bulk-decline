// === FB Group Moderator PRO v3.1 (Console Edition) ===
// === join to our group: https://t.me/craftdeal ===
// follow me in facebook: https://www.facebook.com/islambnahmed/

(() => {
  if (window.__FB_MOD_31__) { console.warn('Panel already active'); return; }
  window.__FB_MOD_31__ = true;

  /* -------- الإعدادات الافتراضية -------- */
  const cfg = { action:'decline', delay:1000, jitter:400, random:true, batch:20, max:0, dry:false };

  /* -------- إنشاء الواجهة -------- */
  const CSS = `
   #fbBox{position:fixed;bottom:15px;right:15px;z-index:2147483647;width:260px;
     background:#24262b;color:#f1f1f1;font:12px Arial;border-radius:8px;
     box-shadow:0 4px 14px rgba(0,0,0,.6);user-select:none}
   #fbBar{display:flex;align-items:center;justify-content:space-between;
     padding:6px 10px;background:#3b4047;border-radius:8px 8px 0 0;cursor:grab}
   #fbBar span{font-weight:bold}f
   #fbBody{padding:10px}
   #fbBody label{display:block;margin:4px 0}
   #fbBody input[type=number]{width:72px;margin-left:3px;background:#1f2125;color:#fff;
     border:1px solid #555;border-radius:4px;padding:2px}
   #fbBody input[type=checkbox]{margin-right:4px;vertical-align:middle}
   #fbBody select{background:#1f2125;color:#fff;border:1px solid #555;border-radius:4px;padding:2px}
   #fbBody button{width:100%;margin-top:6px;padding:4px 0;border:none;border-radius:4px;font-weight:bold;cursor:pointer}
   #fbStart{background:#27ae60} #fbStop{background:#c0392b}
   #fbStatus{margin-top:6px;font-size:11px}
  `;
  document.head.appendChild(Object.assign(document.createElement('style'),{textContent:CSS}));

  const box = document.createElement('div'); box.id='fbBox';
  const pos = JSON.parse(localStorage.getItem('fbModPos')||'{}');
  if(pos.x!=null){ box.style.left=pos.x+'px'; box.style.top=pos.y+'px';
                   box.style.bottom='auto'; box.style.right='auto'; }
  box.innerHTML = `
    <div id="fbBar"><span>FB Mod PRO By islam Ahmed</span><div style="cursor:move">☰</div></div>
    <div id="fbBody">
      <label>Action:
        <select id="act"><option value="decline">Decline / Reject</option>
          <option value="accept">Accept / Approve</option></select></label>
      <label>Base delay (ms): <input id="delay" type="number" value="${cfg.delay}"></label>
      <label>Jitter ± (ms): <input id="jit" type="number" value="${cfg.jitter}"></label>
      <label><input id="rnd" type="checkbox" checked>Random delay</label>
      <label>Batch pause every <input id="bat" type="number" value="${cfg.batch}"> actions</label>
      <label>Max posts (0 = ∞): <input id="max" type="number" value="0"></label>
      <label><input id="dry" type="checkbox">Dry‑Run (no click)</label>
      <div style="display:flex;justify-content:space-between;margin-top:6px">
        <div>Time: <span id="timer">00:00</span></div>
        <div>Done: <span id="done">0</span></div>
      </div>
      <div style="display:flex;justify-content:space-between">
        <div>Accepted: <span id="accCnt">0</span></div>
        <div>Declined: <span id="decCnt">0</span></div>
      </div>
      <button id="fbStart">▶ Start</button>
      <button id="fbStop" disabled>■ Stop</button>
      <div id="fbStatus">Idle</div>
    </div>`;
  document.body.appendChild(box);

  /* -------- سحب اللوحة -------- */
  (()=>{let drag=false,ox=0,oy=0;
    const bar=box.querySelector('#fbBar');
    const md=e=>{drag=true;ox=e.clientX-box.offsetLeft;oy=e.clientY-box.offsetTop;bar.style.cursor='grabbing';};
    const mm=e=>{if(!drag) return;box.style.left=(e.clientX-ox)+'px';box.style.top=(e.clientY-oy)+'px';
                 box.style.bottom='auto';box.style.right='auto';};
    const mu=()=>{if(drag){drag=false;bar.style.cursor='grab';
      localStorage.setItem('fbModPos',JSON.stringify({x:box.offsetLeft,y:box.offsetTop}));}};
    bar.addEventListener('mousedown',md); document.addEventListener('mousemove',mm); document.addEventListener('mouseup',mu);
    /* دعم اللمس */
    bar.addEventListener('touchstart',e=>{const t=e.touches[0];md(t);},{passive:true});
    document.addEventListener('touchmove',e=>{const t=e.touches[0];mm(t);},{passive:true});
    document.addEventListener('touchend',mu);
  })();

  /* -------- أدوات -------- */
  const $=s=>document.querySelector(s), sleep=m=>new Promise(r=>setTimeout(r,m));
  const rand=(b,j)=> b + (Math.random()*j*2 - j);
  const LABELS = {
    accept : ["Approve","Accept","قبول","قبول الطلب"],
    decline: ["Decline","Reject","رفض","رفض الطلب"]
  };
  const getButtons=act=>{
    const mSig = act==='accept'?'approve':'decline';   // m.facebook
    if(location.hostname.startsWith('m.')){
      return [...document.querySelectorAll(`button[data-sigil*="${mSig}"]`)];
    }
    const sel = LABELS[act].map(t=>`div[aria-label="${t}"]`).join(",");
    return [...document.querySelectorAll(sel)];
  };

  /* -------- مؤقّت -------- */
  let tId,startT;
  const startTimer=()=>{
    startT=Date.now();
    tId=setInterval(()=>{const s=((Date.now()-startT)/1000)|0;
      $('#timer').textContent = `${String(s/60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},1000);
  };
  const stopTimer=()=>{clearInterval(tId);$('#timer').textContent='00:00';};

  /* -------- مراقب DOM وطابور -------- */
  const Q=[], obs=new MutationObserver(muts=>muts.forEach(m=>m.addedNodes.forEach(n=>{
    if(n.nodeType!==1) return;
    getButtons(cfg.action).filter(b=>!b.dataset.q).forEach(b=>{b.dataset.q=1;Q.push(b);});
  })));

  /* -------- الحلقة الرئيسية -------- */
  let running=false, total=0, acc=0, dec=0;
  async function loop(){
    const st=$('#fbStatus');
    obs.observe(document.body,{childList:true,subtree:true});
    getButtons(cfg.action).forEach(b=>{if(!b.dataset.q){b.dataset.q=1;Q.push(b);}});
    startTimer();
    while(running){
      if(Q.length===0){window.scrollBy(0,1200);st.textContent=`Scrolling…`;await sleep(500);continue;}
      const btn=Q.shift(); if(!document.body.contains(btn)) continue;
      if(cfg.dry){btn.style.outline='2px solid orange';}
      else{btn.click();}
      total++; if(cfg.action==='accept') acc++; else dec++;
      $('#done').textContent=total; $('#accCnt').textContent=acc; $('#decCnt').textContent=dec;
      st.textContent=`Running…`;
      if(cfg.max && total>=cfg.max){running=false;break;}
      const d = cfg.random?rand(cfg.delay,cfg.jitter):cfg.delay;
      await sleep(Math.max(200,d));
      if(cfg.batch && total%cfg.batch===0) await sleep(Math.max(200,d*2));
    }
    obs.disconnect(); stopTimer();
    $('#fbStart').disabled=false; $('#fbStop').disabled=true;
    st.textContent=`Stopped.`;
  }

  /* -------- أزرار -------- */
  $('#fbStart').onclick=()=>{
    cfg.action=$('#act').value;
    cfg.delay =+$('#delay').value||800;
    cfg.jitter=+$('#jit').value||0;
    cfg.random=$('#rnd').checked;
    cfg.batch =+$('#bat').value||0;
    cfg.max   =+$('#max').value||0;
    cfg.dry   =$('#dry').checked;
    running=true; total=acc=dec=0;
    $('#done').textContent=acc=dec=0;
    $('#accCnt').textContent='0'; $('#decCnt').textContent='0';
    $('#fbStart').disabled=true; $('#fbStop').disabled=false; $('#fbStatus').textContent='Running…';
    loop();
  };
  $('#fbStop').onclick=()=> running=false;
})();
