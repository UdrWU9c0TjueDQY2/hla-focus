(function(){
  'use strict';
  const rounds=[
    [7,29,14,32,3],
    [24,5,31,10,18]
  ];
  const $=id=>document.getElementById(id);
  const start=$('start'),restart=$('restart'),board=$('board'),between=$('between'),result=$('result');
  let attempt=-1,trial=0,misses=0,started=0,results=[];
  function labelMisses(n){return n+' '+(n===1?'miss':'misses');}
  function update(){
    $('game-title').textContent='Attempt '+(attempt===0?'A':'B')+' · trial '+(trial+1)+' of 5';
    $('trial-label').textContent='Trial '+(trial+1)+' of 5';
    $('mistake-label').textContent=labelMisses(misses);
  }
  function draw(){
    board.innerHTML='';
    const target=rounds[attempt][trial];
    for(let i=0;i<36;i++){
      const b=document.createElement('button');
      b.type='button';b.className='cell';b.textContent=i===target?'◉':'○';
      const row=Math.floor(i/6)+1,col=i%6+1,symbol=i===target?'filled circle':'outlined circle';
      b.setAttribute('aria-label','row '+row+', column '+col+', '+symbol);
      b.dataset.target=i===target?'true':'false';
      b.addEventListener('click',choose);
      board.appendChild(b);
    }
    update();
    const first=board.querySelector('.cell');if(first)first.focus();
  }
  function choose(e){
    const b=e.currentTarget;
    if(b.dataset.target==='true'){
      trial++;
      if(trial===5){finishAttempt();return;}
      draw();return;
    }
    misses++;
    b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');
    $('mistake-label').textContent=labelMisses(misses);
  }
  function begin(which){
    attempt=which;trial=0;misses=0;started=performance.now();
    start.hidden=true;restart.hidden=true;between.hidden=true;result.hidden=true;board.hidden=false;
    $('instruction').textContent='Select the one filled circle. An outlined-circle selection counts as a miss; the same trial stays on screen.';
    draw();
  }
  function finishAttempt(){
    const elapsed=Math.round((performance.now()-started)/100)/10;
    results[attempt]={seconds:elapsed,misses};
    board.hidden=true;
    if(attempt===0){
      between.hidden=false;
      $('a-summary').textContent='Five targets found in '+elapsed.toFixed(1)+' seconds with '+labelMisses(misses)+'.';
      start.hidden=false;start.textContent='Start attempt B';start.focus();
      $('game-title').textContent='Attempt A · complete';
      $('trial-label').textContent='5 of 5 found';
      return;
    }
    showResult();
  }
  function showResult(){
    result.hidden=false;restart.hidden=false;
    $('a-time').textContent=results[0].seconds.toFixed(1)+' s';
    $('b-time').textContent=results[1].seconds.toFixed(1)+' s';
    $('a-misses').textContent=labelMisses(results[0].misses);
    $('b-misses').textContent=labelMisses(results[1].misses);
    const delta=Math.round(Math.abs(results[1].seconds-results[0].seconds)*10)/10;
    const timeWord=results[1].seconds<results[0].seconds?'faster':results[1].seconds>results[0].seconds?'slower':'the same elapsed time as';
    const missDelta=results[1].misses-results[0].misses;
    const missText=missDelta===0?'the same number of misses':Math.abs(missDelta)+' '+(Math.abs(missDelta)===1?'miss':'misses')+' '+(missDelta<0?'fewer':'more');
    $('comparison-title').textContent='Attempt B was '+(delta?delta.toFixed(1)+' seconds ':'')+timeWord+' attempt A.';
    $('comparison-note').textContent='Attempt B had '+missText+'. These are descriptive totals for the two completed boards, not a normalized score.';
    $('game-title').textContent='Both attempts · complete';$('trial-label').textContent='10 of 10 found';
    restart.focus();
  }
  start.addEventListener('click',()=>begin(results.length?1:0));
  restart.addEventListener('click',()=>{results=[];attempt=-1;trial=0;misses=0;between.hidden=true;result.hidden=true;restart.hidden=true;start.hidden=false;start.textContent='Start attempt A';$('game-title').textContent='Attempt A · ready';$('trial-label').textContent='Trial 0 of 5';$('mistake-label').textContent='0 misses';$('instruction').textContent='Choose Start attempt A. On every grid, select the one item that is filled instead of outlined.';start.focus();});
})();
