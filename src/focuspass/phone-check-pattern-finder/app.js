'use strict';
function parseChecks(raw){const tokens=raw.trim().split(/[\s,;]+/).filter(Boolean);if(!tokens.length)throw Error('Enter at least one time, such as 08:15.');if(tokens.length>100)throw Error('Use at most 100 check times from one day.');
return tokens.map(t=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(t))throw Error('Use 24-hour HH:MM times. Check: '+t.slice(0,24));return Number(t.slice(0,2))*60+Number(t.slice(3));}).sort((a,b)=>a-b);}
function analyzeChecks(times){const hours=Array(24).fill(0);times.forEach(t=>hours[Math.floor(t/60)]++);let start=0,count=-1;
[...new Set(times.map(t=>Math.min(t,1380)))].sort((a,b)=>a-b).forEach(s=>{const c=times.filter(t=>t>=s&&t<s+60).length;if(c>count){start=s;count=c;}});
return {hours,start,count,total:times.length};}
function clock(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');}
const $=id=>document.getElementById(id);
function clear(){ $('result').hidden=true;$('error').textContent='';$('bars').replaceChildren();$('summary').textContent='';}
function run(e){e.preventDefault();clear();try{const a=analyzeChecks(parseChecks($('times').value));
$('summary').textContent=a.total+' logged checks. The busiest observed-start window is '+clock(a.start)+'–'+clock(a.start+60)+', with '+a.count+' checks ('+Math.round(a.count/a.total*100)+'% of this log).';
const max=Math.max(...a.hours);a.hours.forEach((c,h)=>{const row=document.createElement('div');row.className='bar-row';const label=document.createElement('span');label.textContent=String(h).padStart(2,'0')+':00';const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';fill.style.width=(c/max*100)+'%';track.appendChild(fill);const value=document.createElement('span');value.textContent=String(c);row.appendChild(label);row.appendChild(track);row.appendChild(value);$('bars').appendChild(row);});
$('action').textContent='For a small experiment, choose one distracting app to protect around '+clock(a.start)+'. Keep essential apps reachable. Decide what would justify a deliberate timed Pass. Compare another day before treating this as a routine.';
$('result').hidden=false;$('summary').focus();}catch(error){$('error').textContent=error.message;$('times').focus();}}
$('check-form').addEventListener('submit',run);$('times').addEventListener('input',clear);
$('example').addEventListener('click',()=>{$('times').value='08:15, 12:05, 17:30, 20:50, 21:02, 21:08, 21:12, 21:20, 21:40, 22:15';clear();});
$('reset').addEventListener('click',()=>{$('times').value='';clear();$('times').focus();});
