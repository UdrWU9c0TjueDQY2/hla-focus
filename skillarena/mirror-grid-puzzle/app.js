'use strict';
const patterns=[[0,4,5,9,10],[1,2,6,8,12,15],[0,3,5,6,9,14],[2,4,7,8,9,13],[0,1,5,7,10,14,15],[1,4,6,8,11,12]];
function transform(pattern,mode){
  return pattern.map(i=>{
    const row=Math.floor(i/4),column=i%4;
    if(mode==='mirror')return row*4+3-column;
    if(mode==='vertical')return (3-row)*4+column;
    return column*4+3-row;
  }).sort((a,b)=>a-b);
}
// Version 1 challenge IDs preserve these six source patterns and the three rule names.
function readChallenge(hash){const m=/^#mg1=(mirror|vertical|rotate)-([1-6])$/.exec(hash);return m?{mode:m[1],index:Number(m[2])-1}:null;}
function challengeLink(index,mode){if(!Number.isInteger(index)||index<0||index>=patterns.length||!['mirror','vertical','rotate'].includes(mode))throw new Error('Invalid challenge');return 'https://udrwu9c0tjuedqy2.github.io/hla-focus/skillarena/mirror-grid-puzzle/#mg1='+mode+'-'+(index+1);}
if(typeof module!=='undefined')module.exports={patterns,transform,readChallenge,challengeLink};
if(typeof document!=='undefined'){
  const byId=id=>document.getElementById(id);
  let index=0,preview=false;
  const chosen=new Set();
  function draw(){
    const marked=preview?new Set(transform(patterns[index],byId('mode').value)):chosen;
    for(const tile of byId('answer').children){
      const on=marked.has(Number(tile.dataset.i));
      tile.classList.toggle('on',on);tile.setAttribute('aria-pressed',String(on));
      tile.textContent=on?'◆':'·';tile.disabled=preview;
    }
    byId('grid-title').textContent=preview?'Solution preview':'Your answer';
    byId('answer').setAttribute('aria-label',preview?'Solution preview':'Your answer');
    byId('reveal').textContent=preview?'Return to my answer':'Preview solution';
    byId('reveal').setAttribute('aria-pressed',String(preview));
    byId('check').disabled=preview;byId('clear').disabled=preview;
  }
  function load(){
    preview=false;chosen.clear();byId('status').textContent='';
    byId('round').textContent='Pattern '+(index+1)+' of '+patterns.length;
    byId('instruction').textContent=byId('mode').selectedOptions[0].textContent+'. Source stays visible while you build.';
    byId('source').replaceChildren();
    for(let i=0;i<16;i++){
      const tile=document.createElement('span'),on=patterns[index].includes(i);
      tile.className='tile'+(on?' on':'');tile.textContent=on?'◆':'·';
      tile.setAttribute('aria-label','Row '+(Math.floor(i/4)+1)+', column '+(i%4+1)+': '+(on?'filled':'empty'));
      byId('source').append(tile);
    }
    draw();updateShare();
  }
  function updateShare(){byId('challenge-link').value=challengeLink(index,byId('mode').value);byId('copy-challenge').disabled=false;byId('share-status').textContent='';}
  for(let i=0;i<16;i++){
    const tile=document.createElement('button');tile.className='tile';tile.dataset.i=i;
    tile.setAttribute('aria-label','Row '+(Math.floor(i/4)+1)+', column '+(i%4+1));
    tile.addEventListener('click',()=>{
      if(preview)return;
      if(chosen.has(i))chosen.delete(i);else chosen.add(i);
      draw();byId('status').textContent='';
    });
    byId('answer').append(tile);
  }
  byId('check').addEventListener('click',()=>{
    if(preview)return;
    const expected=new Set(transform(patterns[index],byId('mode').value));
    let different=0;
    for(let i=0;i<16;i++)if(chosen.has(i)!==expected.has(i))different++;
    byId('status').textContent=different?different+' cells differ. Check the row and column mapping.':'Pattern matches. Try a different rule or the next pattern.';
  });
  byId('reveal').addEventListener('click',()=>{
    preview=!preview;draw();
    byId('status').textContent=preview?'Showing the solution. Your own tiles are saved for this pattern.':'Your answer is back. Keep building or check it.';
  });
  byId('next').addEventListener('click',()=>{index=(index+1)%patterns.length;load();});
  byId('clear').addEventListener('click',()=>{if(preview)return;chosen.clear();draw();byId('status').textContent='Answer cleared.';});
  byId('copy-challenge').addEventListener('click',async()=>{const link=challengeLink(index,byId('mode').value);try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(link);byId('share-status').textContent=link===byId('challenge-link').value?'Challenge link copied. Share it wherever it will be useful. No delivery is tracked.':'The previous challenge was copied. Copy again for the current pattern.';}catch(error){byId('challenge-link').focus();byId('challenge-link').select();byId('share-status').textContent='The current challenge link is selected. Copy it using your device menu.';}});
  byId('mode').addEventListener('change',load);
  const initial=readChallenge(window.location.hash);if(initial){index=initial.index;byId('mode').value=initial.mode;}load();
  if(initial)byId('status').textContent='Shared challenge loaded. Build the answer; no solution or score was included.';
  else if(window.location.hash.startsWith('#mg1='))byId('status').textContent='That challenge code is not recognized. Pattern 1 is ready to play.';
  window.addEventListener('hashchange',()=>{const challenge=readChallenge(window.location.hash);if(challenge){index=challenge.index;byId('mode').value=challenge.mode;load();byId('status').textContent='Shared challenge loaded with a blank answer.';}else if(window.location.hash.startsWith('#mg1=')){byId('share-status').textContent='That challenge code is not recognized. The current attempt is unchanged.';}});
}
