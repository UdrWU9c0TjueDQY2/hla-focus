function calculateDay(phoneMinutes,sleepMinutes,requestedReduction){
 if(![phoneMinutes,sleepMinutes,requestedReduction].every(Number.isFinite)||phoneMinutes<0||sleepMinutes<0||sleepMinutes>=1440||requestedReduction<0) throw new Error('Enter a valid 24-hour day.');
 const awake=1440-sleepMinutes;
 if(phoneMinutes>awake) throw new Error('Phone time is longer than waking time. Check your device filter and the two daily totals.');
 const reduction=Math.min(requestedReduction,phoneMinutes),target=phoneMinutes-reduction;
 return {awake,phone:phoneMinutes,share:phoneMinutes/awake*100,target,targetShare:target/awake*100,reduction,weekly:reduction*7};
}
function duration(m){const h=Math.floor(m/60),r=m%60;return h&&r?`${h}h ${r}m`:h?`${h}h`:`${r}m`;}
function percent(n){return `${Number(n.toFixed(1))}%`;}
if(typeof module!=='undefined') module.exports={calculateDay,duration,percent};
if(typeof document!=='undefined'){
 const get=id=>document.getElementById(id),form=get('calcform');let current=null;
 function read(id,max){const raw=get(id).value,n=Number(raw);if(raw.trim()===''||!Number.isInteger(n)||n<0||n>max)throw new Error('Use whole hours and minutes. Minutes must be between 0 and 59.');return n;}
 function render(){get('status').textContent='';try{current=calculateDay(read('phoneH',24)*60+read('phoneM',59),read('sleepH',23)*60+read('sleepM',59),Number(get('trim').value));get('error').textContent='';get('share').textContent=percent(current.share);get('dial').style.setProperty('--share',percent(current.share));get('dial').setAttribute('aria-label',`${percent(current.share)} of waking time on your phone`);get('dayline').textContent=`${duration(current.phone)} on your phone · ${duration(current.awake)} awake`;get('newshare').textContent=percent(current.targetShare);get('newtime').textContent=`${duration(current.target)} phone time per day`;get('weekgain').textContent=duration(current.weekly);get('copy').disabled=false;}catch(e){current=null;get('error').textContent=e.message;get('share').textContent='—';get('dial').style.setProperty('--share','0%');get('dial').setAttribute('aria-label','Enter valid values to calculate');get('dayline').textContent='Check the inputs below';get('newshare').textContent='—';get('newtime').textContent='Waiting for valid inputs';get('weekgain').textContent='—';get('copy').disabled=true;}}
 form.addEventListener('input',render);form.addEventListener('change',render);form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('reset',()=>setTimeout(render,0));
 get('copy').addEventListener('click',async()=>{if(!current)return;const note=`My screen-time comparison: ${duration(current.phone)} phone use out of ${duration(current.awake)} awake = ${percent(current.share)}. Trying ${duration(current.reduction)} less per day would mean ${duration(current.target)} phone use (${percent(current.targetShare)}). Repeated for seven days: ${duration(current.weekly)} less phone use. A planning scenario, not a prediction. https://udrwu9c0tjuedqy2.github.io/hla-focus/time-debt/waking-hours-calculator/`;try{await navigator.clipboard.writeText(note);get('status').textContent='Comparison copied.';}catch{get('status').textContent='Copy is unavailable in this browser. Your comparison remains visible above.';}});render();
}
