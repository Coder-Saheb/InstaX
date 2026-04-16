function animateTitle(){
  const el = document.getElementById('pageTitle');
  const words = ['Instagram','Downloader'];
  el.innerHTML = '';
  words.forEach((w,wi)=>{
    const span = document.createElement('span');
    span.style.cssText='display:inline-block;overflow:hidden;vertical-align:top';
    const inner = document.createElement('span');
    inner.style.cssText=`display:inline-block;transform:translateY(110%);transition:transform 0.7s cubic-bezier(0.16,1,0.3,1);transition-delay:${0.2+wi*0.12}s`;
    inner.textContent=w;
    span.appendChild(inner);
    if(wi<words.length-1){const s=document.createTextNode(' ');el.appendChild(s)}
    el.appendChild(span);
    setTimeout(()=>{inner.style.transform='translateY(0)'},50);
  });
}
animateTitle();

// ---- MODAL ----
const overlay=document.getElementById('modalOverlay');
const menuBtn=document.getElementById('menuBtn');
const modalClose=document.getElementById('modalClose');
menuBtn.addEventListener('click',()=>overlay.classList.add('open'));
modalClose.addEventListener('click',()=>overlay.classList.remove('open'));
overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.remove('open')});

// ---- FETCH ----
const urlInput=document.getElementById('urlInput');
const fetchBtn=document.getElementById('fetchBtn');
const fetchBtnText=document.getElementById('fetchBtnText');
const loader=document.getElementById('loader');
const errorBox=document.getElementById('errorBox');
const errorMsg=document.getElementById('errorMsg');
const resultSection=document.getElementById('resultSection');
const mediaWrap=document.getElementById('mediaWrap');
const dlBtn=document.getElementById('dlBtn');
const resultMeta=document.getElementById('resultMeta');

let currentMediaUrl='';

function showError(msg){
  errorBox.classList.add('show');
  errorMsg.textContent=msg;
  resultSection.classList.remove('show');
  loader.classList.remove('show');
  fetchBtn.disabled=false;
  fetchBtnText.textContent='Fetch';
}

function hideError(){
  errorBox.classList.remove('show');
}

function showLoader(){
  loader.classList.add('show');
  resultSection.classList.remove('show');
  hideError();
  fetchBtn.disabled=true;
  fetchBtnText.textContent='Fetching...';
}

function hideLoader(){
  loader.classList.remove('show');
  fetchBtn.disabled=false;
  fetchBtnText.textContent='Fetch';
}

function extractMediaUrl(data){
  if(!data)return null;
  const checks=[
    ()=>data.url,
    ()=>data.video_url,
    ()=>data.media,
    ()=>data.download_url,
    ()=>data.data&&data.data.url,
    ()=>data.data&&data.data.video_url,
    ()=>data.data&&Array.isArray(data.data)&&data.data[0]&&data.data[0].url,
    ()=>data.data&&Array.isArray(data.data)&&data.data[0]&&data.data[0].video_url,
    ()=>data.urls&&data.urls[0],
    ()=>data.result&&data.result.url,
    ()=>data.result&&data.result.video_url,
    ()=>data.medias&&data.medias[0]&&data.medias[0].url,
    ()=>data.items&&data.items[0]&&data.items[0].video_url,
    ()=>data.items&&data.items[0]&&data.items[0].image_url,
  ];
  for(const fn of checks){
    try{const v=fn();if(v&&typeof v==='string'&&v.startsWith('http'))return v;}catch(e){}
  }
  // deep search for any URL in response
  const str=JSON.stringify(data);
  const match=str.match(/https?:\/\/[^"]+\.(mp4|jpg|jpeg|png|webp|gif)[^"]*/i);
  if(match)return match[0].replace(/\\u0026/g,'&');
  return null;
}

function extractThumb(data){
  const checks=[
    ()=>data.thumbnail,
    ()=>data.thumbnail_url,
    ()=>data.thumb,
    ()=>data.data&&data.data.thumbnail,
    ()=>data.data&&Array.isArray(data.data)&&data.data[0]&&data.data[0].thumbnail,
    ()=>data.result&&data.result.thumbnail,
  ];
  for(const fn of checks){
    try{const v=fn();if(v&&typeof v==='string'&&v.startsWith('http'))return v;}catch(e){}
  }
  return null;
}

function isVideo(url,data){
  if(!url)return false;
  if(/\.mp4|\.mov|\.webm/i.test(url))return true;
  if(data&&(data.type==='video'||data.media_type==='video'))return true;
  if(data&&data.data&&(data.data.type==='video'||data.data.media_type==='video'))return true;
  return false;
}

function renderMedia(mediaUrl,thumb,isVid){
  mediaWrap.innerHTML='';
  if(isVid){
    const v=document.createElement('video');
    v.controls=true;
    v.src=mediaUrl;
    if(thumb)v.poster=thumb;
    v.style.cssText='width:100%;height:auto;max-height:500px;object-fit:contain;display:block;border-radius:0';
    v.preload='metadata';
    mediaWrap.appendChild(v);
    resultMeta.textContent='Video detected — preview above';
  } else {
    const img=document.createElement('img');
    img.src=mediaUrl;
    img.alt='Downloaded media';
    img.style.cssText='width:100%;height:auto;max-height:500px;object-fit:contain;display:block';
    img.loading='lazy';
    img.onerror=()=>{
      mediaWrap.innerHTML='<div style="padding:24px;text-align:center;color:var(--text3);font-size:0.85rem">Preview not available. Download anyway.</div>';
    };
    mediaWrap.appendChild(img);
    resultMeta.textContent='Image detected — preview above';
  }
}

async function tryBlobDownload(url,filename){
  try{
    const res=await fetch(url,{mode:'cors'});
    if(!res.ok)throw new Error('fetch failed');
    const blob=await res.blob();
    const bUrl=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=bUrl;
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(bUrl),5000);
    return true;
  }catch{return false;}
}

dlBtn.addEventListener('click',async e=>{
  e.preventDefault();
  if(!currentMediaUrl)return;
  const ts=Date.now();
  const ext=currentMediaUrl.match(/\.(mp4|mov|jpg|jpeg|png|webp|gif)/i);
  const filename=`InstaX_${ts}${ext?ext[0]:'.mp4'}`;
  const ok=await tryBlobDownload(currentMediaUrl,filename);
  if(!ok){
    // fallback
    const a=document.createElement('a');
    a.href=currentMediaUrl;
    a.download=filename;
    a.target='_self';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
});

async function doFetch(){
  const raw=urlInput.value.trim();
  if(!raw){showError('Please enter an Instagram URL.');return;}
  if(!raw.includes('instagram.com')&&!raw.includes('instagr.am')){
    showError('That doesn\'t look like an Instagram link. Please check the URL.');return;
  }
  hideError();
  showLoader();
  currentMediaUrl='';
  mediaWrap.innerHTML='';
  resultSection.classList.remove('show');

  const apiUrl=`https://mixy-ox-enjoy.vercel.app/?url=${encodeURIComponent(raw)}`;
  let data=null;
  try{
    const res=await fetch(apiUrl,{signal:AbortSignal.timeout(20000)});
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    data=await res.json();
  }catch(err){
    showError('Failed to reach the server. Check your connection and try again.');
    return;
  }

  hideLoader();

  const mediaUrl=extractMediaUrl(data);
  if(!mediaUrl){
    showError('No downloadable media found. Make sure the post is public.');
    return;
  }

  currentMediaUrl=mediaUrl;
  const thumb=extractThumb(data);
  const vid=isVideo(mediaUrl,data);
  renderMedia(mediaUrl,thumb,vid);
  dlBtn.href=mediaUrl;
  resultSection.classList.add('show');
}

fetchBtn.addEventListener('click',doFetch);
urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')doFetch()});
urlInput.addEventListener('input',()=>{if(urlInput.value)hideError()});

// MAGNETIC FETCH BTN
fetchBtn.addEventListener('mousemove',e=>{
  const r=fetchBtn.getBoundingClientRect();
  const x=e.clientX-r.left-r.width/2;
  const y=e.clientY-r.top-r.height/2;
  fetchBtn.style.transform=`translateY(-2px) translate(${x*0.1}px,${y*0.1}px)`;
});
fetchBtn.addEventListener('mouseleave',()=>{fetchBtn.style.transform='';});
