'use strict';
(() => {
 const button=document.getElementById('uno-music-toggle'),volume=document.getElementById('uno-music-volume'),status=document.getElementById('uno-music-status');
 if(!button)return;
 const audio=new Audio('assets/uno-cafe-loop.wav');audio.loop=true;audio.preload='none';audio.volume=.3;
 let pending=false;
 const sync=()=>{const playing=!audio.paused;button.textContent=playing?'Pause music':'Play music';button.setAttribute('aria-pressed',String(playing));};
 button.addEventListener('click',async()=>{if(pending)return;if(!audio.paused){audio.pause();sync();return;}pending=true;button.disabled=true;status.textContent='';try{await audio.play();}catch{status.textContent='Could not start audio. Tap Play music to try again.';}finally{pending=false;button.disabled=false;sync();}});
 volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;volume.setAttribute('aria-valuetext',volume.value+' percent');});
 audio.addEventListener('pause',sync);audio.addEventListener('play',sync);audio.addEventListener('error',()=>{status.textContent='Music could not load. Please refresh and try again.';sync();});
 // Pause when leaving the page or switching apps, without resuming unexpectedly.
 document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});window.addEventListener('pagehide',()=>audio.pause());
})();
