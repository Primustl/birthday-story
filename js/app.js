document.querySelector('#waLink').href = `https://wa.me/${WA_CONFIG.number}?text=${encodeURIComponent(WA_CONFIG.message)}`;

const rooms=[...document.querySelectorAll('.room')];let current=0;let stream=null;let pendingPhoto=null;const progress=document.querySelector('#progress');
const roomNav=document.querySelector('#roomNav');
const modalImg=document.querySelector('#modalImg');
const modalVideo=document.querySelector('#modalVideo');
const bgMusic=document.querySelector('#bgMusic');
const musicBtn=document.querySelector('#musicBtn');
const wishCircle=document.querySelector('#wishCircle');
const wishVideo=document.querySelector('#wishVideo');
const wishHint=document.querySelector('#wishHint');
const cameraVideoEl=document.querySelector('#video');
const cameraFlipBtn=document.querySelector('#cameraFlip');
const storyVideos=new Set();
let musicEnabledByUser=false;
let pausedByVideo=false;
let pausedByPhoto=false;
let isSwitchingVideo=false;
let wishModalMode=false;
let wishVideoUnlocked=false;
let bgMusicWasPlayingBeforeWishVideo=false;
let restartedFromEnd=false;
let cameraFacing='user';

wishVideo.src=MEDIA_PATHS.wishVideo;
wishVideo.muted=true;
wishVideo.loop=true;

let audioCtx;
function getAudioCtx(){
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
  return audioCtx;
}

function playMusic(showMsg=false,markUser=true){
  if(markUser)musicEnabledByUser=true;
  pausedByVideo=false;
  pausedByPhoto=false;
  bgMusic.play().then(()=>{
    musicBtn.classList.add('playing');
    if(showMsg)toast('Musik diputar');
  }).catch(()=>{
    if(showMsg){
      try{
        const ctx=getAudioCtx();
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.frequency.value=523.25;g.gain.value=.025;
        o.connect(g);g.connect(ctx.destination);
        o.start();o.stop(ctx.currentTime+.35);
        toast('Letakkan musik.mp3 di assets/audio/');
      }catch{
        toast('Musik tidak tersedia di browser ini');
      }
    }
  });
}

function pauseMusic(showMsg=false,reason='manual'){
  if(!bgMusic.paused){
    bgMusic.pause();
  }
  musicBtn.classList.remove('playing');
  if(reason==='video')pausedByVideo=true;
  if(reason==='photo')pausedByPhoto=true;
  if(showMsg)toast('Musik dijeda');
}

function stopMusicAndReset(){
  restartedFromEnd=true;
  musicEnabledByUser=false;
  pausedByVideo=false;
  pausedByPhoto=false;
  bgMusicWasPlayingBeforeWishVideo=false;
  pauseMusic(false,'manual');
  try{bgMusic.currentTime=0;}catch{}
}

function stopMusicAndGoHome(){
  stopMusicAndReset();
  showRoom(0);
}

function stopAllVideos(resetTime=false){
  isSwitchingVideo=true;
  storyVideos.forEach(v=>{
    if(!v.paused)v.pause();
    if(resetTime){
      try{v.currentTime=0;}catch{}
    }
  });
  if(!modalVideo.paused)modalVideo.pause();
  if(resetTime){
    try{modalVideo.currentTime=0;}catch{}
  }
  setTimeout(()=>{isSwitchingVideo=false;},40);
}

function showWishVideo(keepTime=false){
  wishVideoUnlocked=true;
  document.querySelector('.flame').textContent='◇';
  wishVideo.muted=true;
  wishVideo.loop=true;
  wishVideo.controls=false;
  wishCircle.classList.add('video-active');
  wishHint.textContent='Tekan video di lingkaran untuk tampil penuh (terjeda)';
  if(!keepTime){
    try{wishVideo.currentTime=0;}catch{}
  }
  wishVideo.play().catch(()=>{});
}

function hideWishVideo(){
  wishVideo.pause();
  wishVideo.muted=true;
  wishVideo.loop=true;
  wishCircle.classList.remove('video-active');
  wishHint.textContent='';
}

function bindVideoMusicSync(videoEl){
  if(videoEl!==modalVideo)storyVideos.add(videoEl);

  videoEl.addEventListener('play',()=>{
    if(videoEl===modalVideo && wishModalMode){
      if(!bgMusic.paused){
        bgMusicWasPlayingBeforeWishVideo=true;
        musicEnabledByUser=true;
        pauseMusic(false,'video');
      }else if(musicEnabledByUser){
        bgMusicWasPlayingBeforeWishVideo=true;
      }
      return;
    }
    isSwitchingVideo=true;
    if(videoEl!==modalVideo && !modalVideo.paused)modalVideo.pause();
    storyVideos.forEach(other=>{
      if(other!==videoEl && !other.paused){
        other.pause();
        try{other.currentTime=0;}catch{}
      }
    });
    if(!bgMusic.paused || musicEnabledByUser){
      pauseMusic(false,'video');
    }
    setTimeout(()=>{isSwitchingVideo=false;},40);
  });

  const resumeIfNeeded=()=>{
    if(isSwitchingVideo)return;
    if(videoEl===modalVideo && wishModalMode){
      if(bgMusicWasPlayingBeforeWishVideo && musicEnabledByUser && current!==2){
        bgMusicWasPlayingBeforeWishVideo=false;
        playMusic(false,false);
      }
      return;
    }
    const anyPlaying=[...storyVideos].some(v=>!v.paused) || (!wishModalMode && !modalVideo.paused);
    if(!anyPlaying && pausedByVideo && musicEnabledByUser && current!==2){
      playMusic(false,false);
    }
  };

  videoEl.addEventListener('pause',resumeIfNeeded);
  videoEl.addEventListener('ended',resumeIfNeeded);
}
bindVideoMusicSync(modalVideo);

function openFullModal(src,alt='Tampilan penuh'){
  wishModalMode=false;
  modalVideo.controls=true;
  modalVideo.loop=false;
  modalVideo.muted=false;
  stopAllVideos(false);
  modalVideo.removeAttribute('src');
  modalVideo.style.display='none';
  modalImg.src=src;
  modalImg.alt=alt;
  modalImg.style.display='block';
  document.querySelector('#modal').classList.add('show');
}

function openVideoModal(src){
  wishModalMode=false;
  modalVideo.controls=true;
  modalVideo.loop=false;
  modalVideo.muted=false;
  stopAllVideos(true);
  modalImg.removeAttribute('src');
  modalImg.style.display='none';
  modalVideo.src=src;
  modalVideo.style.display='block';
  document.querySelector('#modal').classList.add('show');
  modalVideo.play().catch(()=>{});
}

function openWishVideoModal(){
  wishModalMode=true;
  bgMusicWasPlayingBeforeWishVideo=!bgMusic.paused || musicEnabledByUser;
  wishVideo.pause();
  wishVideo.muted=true;
  wishVideo.loop=true;
  modalImg.removeAttribute('src');
  modalImg.style.display='none';
  modalVideo.controls=false;
  modalVideo.loop=true;
  modalVideo.muted=false;
  modalVideo.src=wishVideo.getAttribute('src')||MEDIA_PATHS.wishVideo;
  try{modalVideo.currentTime=wishVideo.currentTime||0;}catch{}
  modalVideo.pause();
  modalVideo.style.display='block';
  document.querySelector('#modal').classList.add('show');
}

modalVideo.onclick=(e)=>{
  if(!wishModalMode)return;
  e.stopPropagation();
  if(modalVideo.paused){
    modalVideo.muted=false;
    modalVideo.play().catch(()=>{});
  }else{
    modalVideo.muted=true;
    modalVideo.pause();
  }
};

function closeModal(goingBackRoom=false){
  const wasWish=wishModalMode;
  const wasPlayingVideo=!wasWish && !modalVideo.paused && modalVideo.style.display!=='none';
  const resumeTime=modalVideo.currentTime||0;
  modalVideo.muted=true;
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.controls=true;
  modalVideo.loop=false;
  modalVideo.muted=false;
  wishModalMode=false;
  document.querySelector('#modal').classList.remove('show');
  if(wasWish && current===1 && wishVideoUnlocked){
    try{wishVideo.currentTime=resumeTime;}catch{}
    showWishVideo(true);
    if((bgMusicWasPlayingBeforeWishVideo || goingBackRoom) && musicEnabledByUser && current!==2){
      bgMusicWasPlayingBeforeWishVideo=false;
      playMusic(false,false);
    }
  }else if(wasPlayingVideo && pausedByVideo && musicEnabledByUser && current!==2){
    playMusic(false,false);
  }
}

wishVideo.onclick=(e)=>{
  e.stopPropagation();
  if(!wishCircle.classList.contains('video-active'))return;
  openWishVideoModal();
};

document.querySelector('#profileImg').onclick=()=>{
  const src=document.querySelector('#profileImg').src;
  if(src)openFullModal(src,'Foto profil Sayank');
};

function clearPendingPortrait(){
  pendingPhoto=null;
  const imgEl=document.querySelector('#previewImg');
  const canvasEl=document.querySelector('#canvas');
  imgEl.removeAttribute('src');
  imgEl.src='';
  canvasEl.getContext('2d').clearRect(0,0,canvasEl.width,canvasEl.height);
  document.querySelector('#preview').style.display='none';
}

function stopCamera(){
  if(stream){
    stream.getTracks().forEach(t=>t.stop());
    stream=null;
    if(cameraVideoEl)cameraVideoEl.srcObject=null;
    document.querySelector('#cameraToggle').textContent='Aktifkan Kamera';
  }
}

function syncCameraMirror(){
  if(!cameraVideoEl)return;
  cameraVideoEl.classList.toggle('is-front',cameraFacing==='user');
}

async function startCamera(){
  if(stream)return;
  syncCameraMirror();
  try{
    stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:{ideal:cameraFacing}},
      audio:false
    });
    if(cameraVideoEl)cameraVideoEl.srcObject=stream;
    document.querySelector('#cameraToggle').textContent='Matikan Kamera';
  }catch(e){
    toast('Kamera belum dapat diakses. Izinkan kamera di browser.');
  }
}

if(cameraFlipBtn){
  cameraFlipBtn.onclick=async()=>{
    cameraFacing=cameraFacing==='user'?'environment':'user';
    syncCameraMirror();
    stopCamera();
    await startCamera();
    toast(cameraFacing==='user'?'Kamera depan aktif':'Kamera belakang aktif');
  };
}

function showRoom(i){
  const prevRoom=current;
  const modalIsOpen=document.querySelector('#modal').classList.contains('show');
  if(modalIsOpen){
    closeModal(true);
  }
  stopAllVideos(true);
  if(current!==1 || i!==1){
    hideWishVideo();
  }
  current=Math.max(0,Math.min(rooms.length-1,i));

  if(current===1 && wishVideoUnlocked){
    showWishVideo(true);
  }

  if(current!==2){
    stopCamera();
    clearPendingPortrait();
  }

  const isEndingRoom=current===rooms.length-1;
  rooms.forEach((r,n)=>r.classList.toggle('active',n===current));
  roomNav.classList.toggle('hidden',current===0);
  progress.style.width=((current+1)/rooms.length*100)+'%';
  document.querySelector('#prev').disabled=current===0;
  document.querySelector('#next').textContent=isEndingRoom?'Selesai':'Lanjut →';

  if(current===2){
    if(!bgMusic.paused){
      musicEnabledByUser=true;
      pauseMusic(false,'photo');
    }else if(musicEnabledByUser){
      pausedByPhoto=true;
    }
    clearPendingPortrait();
    startCamera();
  }else if((prevRoom===2 && pausedByPhoto && musicEnabledByUser) || (pausedByVideo && musicEnabledByUser) || (bgMusicWasPlayingBeforeWishVideo && musicEnabledByUser)){
    bgMusicWasPlayingBeforeWishVideo=false;
    playMusic(false,false);
  }

  if(current===3)renderGallery();
  if(current===4)renderMemories();
  if(current===5)typeLetter();
  window.scrollTo({top:0,behavior:'smooth'});
}

function toast(t){const el=document.querySelector('#toast');el.textContent=t;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2200)}
document.querySelectorAll('[data-next]').forEach(b=>b.onclick=()=>{
  const nextIndex=current+1;
  if(current===0 || (restartedFromEnd && nextIndex===1)){
    restartedFromEnd=false;
    try{bgMusic.currentTime=0;}catch{}
    playMusic(false,true);
  }
  showRoom(nextIndex);
});
document.querySelector('#next').onclick=()=>{
  if(current===rooms.length-1){
    stopMusicAndGoHome();
    return;
  }
  showRoom(current+1);
};
document.querySelector('#prev').onclick=()=>{
  if(wishModalMode && document.querySelector('#modal').classList.contains('show')){
    closeModal(true);
    return;
  }
  showRoom(current-1);
};
document.querySelector('#restart').onclick=()=>stopMusicAndGoHome();
document.querySelector('#waLink').addEventListener('click',()=>stopMusicAndReset());
const target=new Date();target.setDate(target.getDate()+7);function tick(){let d=Math.max(0,target-Date.now());let vals=[Math.floor(d/864e5),Math.floor(d/36e5)%24,Math.floor(d/6e4)%60,Math.floor(d/1e3)%60];document.querySelectorAll('#countdown .time b').forEach((e,i)=>e.textContent=String(vals[i]).padStart(2,'0'))}tick();setInterval(tick,1000);
document.querySelector('#wishBtn').onclick=()=>{
  showWishVideo(false);
  toast('Harapanmu sudah dinyalakan ◇');
};
document.querySelector('#wishDone').onclick=()=>showRoom(2);
document.querySelector('#cameraToggle').onclick=async()=>{if(stream)stopCamera();else await startCamera()};

function playShutterSound(){
  try{
    const ctx=getAudioCtx();
    const now=ctx.currentTime;

    const triggerClick=(offset,freq,duration,amp)=>{
      const len=Math.max(1,Math.floor(ctx.sampleRate*duration));
      const buf=ctx.createBuffer(1,len,ctx.sampleRate);
      const ch=buf.getChannelData(0);
      for(let i=0;i<len;i++){
        ch[i]=(Math.random()*2-1)*Math.exp(-i/(len*0.28));
      }
      const src=ctx.createBufferSource();
      src.buffer=buf;

      const bp=ctx.createBiquadFilter();
      bp.type='bandpass';
      bp.frequency.setValueAtTime(freq,now+offset);
      bp.Q.setValueAtTime(2.2,now+offset);

      const g=ctx.createGain();
      g.gain.setValueAtTime(amp,now+offset);
      g.gain.exponentialRampToValueAtTime(0.001,now+offset+duration);

      src.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      src.start(now+offset);
    };

    triggerClick(0,2200,0.035,0.55);
    triggerClick(0.055,1650,0.045,0.45);
  }catch{}
}

document.querySelector('#capture').onclick=()=>{
  if(!stream){toast('Aktifkan kamera terlebih dahulu');return}
  clearPendingPortrait();
  playShutterSound();
  const v=cameraVideoEl,c=document.querySelector('#canvas');
  const ctx=c.getContext('2d');
  c.width=v.videoWidth||720;c.height=v.videoHeight||960;
  ctx.save();
  if(cameraFacing==='user'){
    ctx.translate(c.width,0);
    ctx.scale(-1,1);
  }
  ctx.drawImage(v,0,0,c.width,c.height);
  ctx.restore();
  pendingPhoto=c.toDataURL('image/jpeg',.86);
  document.querySelector('#previewImg').src=pendingPhoto;
  document.querySelector('#preview').style.display='block';
  toast('Potret muncul di bawah');
};
document.querySelector('#previewImg').onclick=()=>{if(pendingPhoto)openFullModal(pendingPhoto,'Hasil potret penuh')};
document.querySelector('#viewFullPortrait').onclick=()=>{if(pendingPhoto)openFullModal(pendingPhoto,'Hasil potret penuh')};
document.querySelector('#retake').onclick=()=>{clearPendingPortrait();toast('Potret dikosongkan')};

function getPhotos(){try{return JSON.parse(localStorage.getItem('birthdaySelfies')||'[]')}catch{return[]}}
function savePhotos(a){localStorage.setItem('birthdaySelfies',JSON.stringify(a))}
function formatTime(ts){try{return new Date(ts).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}catch{return''}}
function downloadPhoto(src,id){const a=document.createElement('a');a.href=src;a.download=`potret-ulang-tahun-${id}.jpg`;document.body.appendChild(a);a.click();a.remove();toast('Mengunduh potret...')}

document.querySelector('#saveSelfie').onclick=()=>{
  if(!pendingPhoto)return;
  const a=getPhotos();
  a.unshift({id:Date.now(),src:pendingPhoto});
  savePhotos(a);
  clearPendingPortrait();
  toast('Potret disimpan & hasil di sesi potret dikosongkan');
};

function renderGallery(){
  const g=document.querySelector('#gallery');
  const a=getPhotos();
  g.innerHTML='';
  if(!a.length){
    g.innerHTML='<p style="text-align:center;color:var(--muted);font-size:12.5px">Belum ada potret tersimpan. Ambil dan simpan potret di sesi potret.</p>';
    return;
  }
  a.forEach((p,idx)=>{
    const card=document.createElement('article');
    card.className='story-slice';

    const head=document.createElement('div');
    head.className='story-slice-head';
    head.innerHTML=`<span>Potongan #${a.length - idx}</span><span>${formatTime(p.id)}</span>`;

    const im=document.createElement('img');
    im.src=p.src;
    im.alt=`Potret tersimpan ${a.length - idx}`;
    im.onclick=()=>openFullModal(im.src,`Potret tersimpan ${a.length - idx}`);

    const foot=document.createElement('div');
    foot.className='story-slice-foot';

    const cap=document.createElement('p');
    cap.className='story-slice-caption';
    cap.textContent='Senyum yang ingin terus disimpan di hari istimewa ini.';

    const actions=document.createElement('div');
    actions.className='story-slice-actions';

    const dlBtn=document.createElement('button');
    dlBtn.type='button';
    dlBtn.className='btn btn-primary';
    dlBtn.textContent='Simpan / Download';
    dlBtn.onclick=()=>downloadPhoto(p.src,p.id);

    const delBtn=document.createElement('button');
    delBtn.type='button';
    delBtn.className='btn btn-danger';
    delBtn.textContent='Hapus';
    delBtn.onclick=()=>{
      savePhotos(getPhotos().filter(x=>x.id!==p.id));
      renderGallery();
      toast('Potret dihapus');
    };

    actions.append(dlBtn,delBtn);
    foot.append(cap,actions);
    card.append(head,im,foot);
    g.append(card);
  });
}

document.querySelector('#clearSelfies').onclick=()=>{if(confirm('Hapus semua potret tersimpan?')){savePhotos([]);renderGallery();toast('Semua potret dihapus')}};

function renderMemories(){
  const g=document.querySelector('#memories');
  g.innerHTML='';

  const photoItems=(STORY_MEDIA?.photos||[])
    .map((item,idx)=>{
      const src=resolveMediaPath(MEDIA_PATHS.photoFolder,item);
      const caption=typeof item==='object'&&item?.caption?String(item.caption).trim():`Our memory #${idx+1}`;
      return {src,caption};
    })
    .filter(item=>item.src);

  let loadedPhotos=0;
  let settledPhotos=0;

  photoItems.forEach((item)=>{
    const d=document.createElement('div');
    d.className='memory';
    const im=document.createElement('img');
    im.src=item.src;
    im.alt=item.caption;
    im.loading='lazy';
    im.onload=()=>{
      loadedPhotos++;
      settledPhotos++;
      const emptyEl=g.querySelector('.media-empty');
      if(emptyEl)emptyEl.remove();
    };
    im.onerror=()=>{
      settledPhotos++;
      d.remove();
      if(settledPhotos===photoItems.length && loadedPhotos===0 && !g.children.length){
        g.innerHTML=`<div class="media-empty">Letakkan foto di <b>${MEDIA_PATHS.photoFolder}</b> lalu daftarkan namanya di <b>js/media-config.js</b>.</div>`;
      }
    };
    im.onclick=()=>openFullModal(im.src,item.caption);
    const p=document.createElement('p');
    p.textContent=item.caption;
    d.append(im,p);
    g.append(d);
  });

  if(!photoItems.length){
    g.innerHTML=`<div class="media-empty">Letakkan foto di <b>${MEDIA_PATHS.photoFolder}</b> lalu daftarkan namanya di <b>js/media-config.js</b>.</div>`;
  }

  const vg=document.querySelector('#videos');
  vg.innerHTML='';
  storyVideos.clear();

  const videoItems=(STORY_MEDIA?.videos||[])
    .map((item,idx)=>{
      const src=resolveMediaPath(MEDIA_PATHS.videoFolder,item);
      const label=typeof item==='object'&&item?.label?String(item.label).trim():`Video cerita #${idx+1}`;
      return {src,label};
    })
    .filter(item=>item.src);

  let loadedVideos=0;
  let settledVideos=0;

  videoItems.forEach((item)=>{
    const card=document.createElement('article');
    card.className='video-card';
    const vid=document.createElement('video');
    vid.src=item.src;
    vid.controls=true;
    vid.preload='metadata';
    vid.playsInline=true;
    bindVideoMusicSync(vid);

    vid.onloadedmetadata=()=>{
      loadedVideos++;
      settledVideos++;
      const emptyEl=vg.querySelector('.media-empty');
      if(emptyEl)emptyEl.remove();
    };

    vid.onerror=()=>{
      settledVideos++;
      storyVideos.delete(vid);
      card.remove();
      if(settledVideos===videoItems.length && loadedVideos===0 && !vg.querySelector('.video-card') && !vg.querySelector('.media-empty')){
        vg.innerHTML=`<div class="media-empty">Letakkan video di <b>${MEDIA_PATHS.videoFolder}</b> lalu daftarkan namanya di <b>js/media-config.js</b>.</div>`;
      }
    };

    const foot=document.createElement('div');
    foot.className='video-card-foot';
    const lbl=document.createElement('p');
    lbl.textContent=item.label;
    const expandBtn=document.createElement('button');
    expandBtn.type='button';
    expandBtn.className='btn btn-secondary';
    expandBtn.textContent='Lihat Luas';
    expandBtn.onclick=()=>{vid.pause();openVideoModal(item.src)};

    foot.append(lbl,expandBtn);
    card.append(vid,foot);
    vg.append(card);
  });

  if(!videoItems.length){
    vg.innerHTML=`<div class="media-empty">Letakkan video di <b>${MEDIA_PATHS.videoFolder}</b> lalu daftarkan namanya di <b>js/media-config.js</b>.</div>`;
  }
}

document.querySelector('#closeModal').onclick=()=>closeModal(false);
document.querySelector('#modal').onclick=e=>{if(e.target.id==='modal')closeModal(false)};
let typed=false;const letterText=`Terima kasih karena sudah hadir dan membawa begitu banyak warna dalam perjalanan ini.\n\nAku mungkin tidak selalu pandai mengungkapkan semuanya, tetapi satu hal yang ingin kamu tahu: kehadiranmu berarti. Semoga di usia yang baru ini, kamu semakin dekat dengan semua hal baik yang Tuhan siapkan untukmu.\n\nSelamat ulang tahun. Tetaplah menjadi dirimu yang indah.`;function typeLetter(){if(typed)return;typed=true;const el=document.querySelector('#letter');let i=0;const go=()=>{el.textContent=letterText.slice(0,i++);if(i<=letterText.length)setTimeout(go,22)};go()}

musicBtn.onclick=()=>{
  if(!bgMusic.paused){
    musicEnabledByUser=false;
    pausedByVideo=false;
    pausedByPhoto=false;
    bgMusicWasPlayingBeforeWishVideo=false;
    pauseMusic(true,'manual');
    return;
  }
  playMusic(true,true);
};

showRoom(0);