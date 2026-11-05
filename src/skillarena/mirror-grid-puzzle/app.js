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
if(typeof module!=='undefined')module.exports={patterns,transform};
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
    draw();
  }
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
  byId('mode').addEventListener('change',load);load();
}
