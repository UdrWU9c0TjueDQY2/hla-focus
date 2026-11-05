const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/attention-age/what-do-attention-test-scores-mean/index.html','utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
const inputs=Array.from({length:5},()=>({value:'300',addEventListener(_,fn){this.input=fn}}));
const output=Object.fromEntries(['mean','sd','cv','verdict'].map(k=>[k,{textContent:''}]));
vm.runInNewContext(inline,{document:{querySelectorAll:()=>inputs,getElementById:id=>output[id]}});
function enter(values){values.forEach((v,i)=>inputs[i].value=String(v));inputs[0].input();return output;}
let out=enter([100,200,300,400,500]);assert.equal(out.mean.textContent,'300.0');assert.equal(out.sd.textContent,'158.1');assert.equal(out.cv.textContent,'0.527');
out=enter([300,300,300,300,300]);assert.equal(out.sd.textContent,'0.0');assert.equal(out.cv.textContent,'0.000');
for(const value of ['',0,-1,'Infinity','1e309',3600001]){out=enter([300,300,value,300,300]);for(const id of ['mean','sd','cv'])assert.equal(out[id].textContent,'–');assert.match(out.verdict.textContent,/all five/);}
out=enter([300.5,300.5,300.5,300.5,300.5]);assert.equal(out.mean.textContent,'300.5');
out=enter([3600000,3600000,3600000,3600000,3600000]);assert.equal(out.mean.textContent,'3600000.0');
out=enter([1,1,1,1,10000]);assert.match(out.verdict.textContent,/Longest entered time: 10000 ms/);assert.doesNotMatch(out.verdict.textContent,/looks like a lapse|Typical spread|scores high/);
assert.match(html,/no validated/);assert.match(html,/NIST defines/);assert.doesNotMatch(html,/Nothing about her brain changed|writes these pages by hand|cv<0\.1/);
console.log('12 meaningful summary, validation and claim-boundary checks passed.');
