const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('src/now/task-time-estimate-calculator/index.html','utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('function calculate()'));
function setup(){
 const defaults={est0:'10',act0:'15',est1:'20',act1:'25',est2:'30',act2:'45',nextestimate:'20'},handlers={},els={};
 for(const id of [...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]))els[id]={value:defaults[id]||'',textContent:'',hidden:false,style:{},addEventListener(event,fn){handlers[id+':'+event]=fn;}};
 let resolve,reject,payload;const pending=new Promise((a,b)=>{resolve=a;reject=b});
 vm.runInNewContext(script,{document:{getElementById:id=>els[id]},navigator:{clipboard:{writeText(t){payload=t;return pending;}}},HTMLFormElement:{prototype:{reset:{call(){for(const [id,v]of Object.entries(defaults))els[id].value=v;}}}}});
 return {els,handlers,resolve,reject,payload:()=>payload};
}
(async()=>{
 let a=setup(),promise=a.handlers['copy:click']();a.els.nextestimate.value='40';a.handlers['nextestimate:input']();const changed=a.els.message.textContent;a.resolve();await promise;assert.equal(a.els.message.textContent,changed,'old copy success replaced newer edit message');assert.equal(a.els.result.hidden,true);assert.match(a.payload(),/New estimate: 20 min/);
 a=setup();promise=a.handlers['copy:click']();a.handlers['restore:click']();const reset=a.els.message.textContent;a.reject(Error('denied'));await promise;assert.equal(a.els.message.textContent,reset,'old copy failure replaced reset message');
 a=setup();promise=a.handlers['copy:click']();a.els.nextestimate.value='';a.handlers['form:submit']({preventDefault(){}});const invalid=a.els.message.textContent;a.resolve();await promise;assert.equal(a.els.message.textContent,invalid,'old copy success replaced invalid input message');
 a=setup();promise=a.handlers['copy:click']();a.els.nextestimate.value='40';a.handlers['form:submit']({preventDefault(){}});const rebuilt=a.els.message.textContent;a.resolve();await promise;assert.equal(a.els.message.textContent,rebuilt,'old copy success replaced rebuilt review message');assert.equal(a.els.scenario.textContent,'60 min');
 a=setup();promise=a.handlers['copy:click']();a.resolve();await promise;assert.equal(a.els.message.textContent,'Review copied.');
 a=setup();promise=a.handlers['copy:click']();a.reject(Error('denied'));await promise;assert.match(a.els.message.textContent,/Copy is unavailable/);
 console.log('PASS: actual-script pending copy edit/reset/invalid/rebuild guards and ordinary success/failure');
})().catch(e=>{console.error(e);process.exitCode=1;});
