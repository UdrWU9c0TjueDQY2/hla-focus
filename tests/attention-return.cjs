const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const sourceDir=fs.existsSync(__dirname+'/index.html')?__dirname:path.resolve(__dirname,'../src/attention-age/refocus-after-notification');
const html=fs.readFileSync(sourceDir+'/index.html','utf8');
const script=html.match(/<script id="return-signal-script">([\s\S]*?)<\/script>/)[1];
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
function harness(clipboard){
  const elements={};
  for(const m of html.matchAll(/\bid="([^"]+)"/g))elements[m[1]]={value:'',textContent:'',hidden:false,disabled:false,open:false,listeners:{},focus(){this.focused=true;},select(){this.selected=true;},addEventListener(type,fn){this.listeners[type]=fn;}};
  for(const m of html.matchAll(/<select id="([^"]+)"[\s\S]*?<option value="([^"]+)"/g))elements[m[1]].value=m[2];
  elements.result.hidden=true;
  let prints=0;
  const context={module:{exports:{}},document:{getElementById(id){assert.ok(elements[id],'Missing element '+id);return elements[id];}},navigator:{clipboard},window:{print(){prints++;}}};
  vm.runInNewContext(script,context);
  return {e:elements,api:context.module.exports,prints:()=>prints,emit:(id,type)=>elements[id].listeners[type]({preventDefault(){}})};
}
const baseline={task:'reading',lost:'place',priority:'later',workspace:'screen',room:'brief',anchor:''};
const bare={module:{exports:{}}};vm.runInNewContext(script,bare);const api=bare.module.exports;
(async()=>{
await test('HTML has unique IDs, connected labels, one H1 and one exact App Store path',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/<label for="([^"]+)"/g))assert.ok(ids.includes(m[1]));
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 const appLinks=[...html.matchAll(/href="(https:\/\/apps\.apple\.com[^\"]+)"/g)].map(m=>m[1]);assert.deepEqual(appLinks,['https://apps.apple.com/ca/app/attention-age-focus-test/id6795311726']);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.url,html.match(/rel="canonical" href="([^"]+)"/)[1]);assert.equal(schema.publisher.name,'Honest Little Apps');
 const meta=JSON.parse(fs.readFileSync(sourceDir+'/meta.json','utf8'));assert.equal(meta.draft,false);assert.equal(meta.appSlug,'attention-age');
 assert.match(html,/An original worksheet, not an app screen/);assert.match(html,/Publisher disclosure: Honest Little Apps/);assert.doesNotMatch(html,/James Gray|fake urgency|guaranteed/i);
});
await test('All 144 selection combinations generate complete bounded plans',()=>{
 let count=0;const outputs=new Set();
 for(const task of api.choices.task)for(const lost of api.choices.lost)for(const priority of api.choices.priority)for(const workspace of api.choices.workspace)for(const room of api.choices.room){
   const p=api.makePlan({task,lost,priority,workspace,room});
   assert.equal(p.steps.length,3);assert.equal(p.labels.length,3);assert.ok(p.text.length>500&&p.text.length<1800);assert.doesNotMatch(p.text,/undefined|NaN|\[object Object\]/);outputs.add(p.text);count++;
 }
 assert.equal(count,144);assert.equal(outputs.size,144);
});
await test('Concrete fixtures distinguish reading, writing, number work and planning',()=>{
 assert.match(api.makePlan(baseline).steps[2],/last paragraph/);
 assert.match(api.makePlan({...baseline,task:'writing',lost:'action'}).steps[2],/one rough sentence/);
 assert.match(api.makePlan({...baseline,task:'numbers',lost:'context'}).steps[2],/column heading and units/);
 assert.match(api.makePlan({...baseline,task:'planning',lost:'action'}).steps[2],/Compare two options/);
 assert.match(api.makePlan({...baseline,workspace:'paper'}).steps[1],/margin or on a separate slip/);
});
await test('Time-sensitive path never tells the visitor to postpone the responsibility',()=>{
 const p=api.makePlan({...baseline,priority:'now'});assert.match(p.intro,/will not delay anything urgent/);assert.match(p.steps[1],/Do not let this worksheet delay it/);assert.doesNotMatch(p.steps.join(' '),/next planned break|Choose a specific point to check it/);assert.match(p.labels[2],/When you are available again/);
});
await test('Input validation rejects unknown selections and bounds note length',()=>{
 for(const key of Object.keys(api.choices))assert.throws(()=>api.makePlan({...baseline,[key]:'__proto__'}));
 assert.equal(api.makePlan({...baseline,anchor:'x'.repeat(200)}).anchor.length,120);
 assert.equal(api.makePlan({...baseline,anchor:'   row 18   '}).anchor,'row 18');
});
await test('Submit renders through text properties, exposes result and moves focus',()=>{
 const h=harness();h.e.task.value='numbers';h.e.lost.value='context';h.e.anchor.value='<img src=x onerror=alert(1)>';h.emit('return-form','submit');
 assert.equal(h.e.result.hidden,false);assert.equal(h.e.placeholder.hidden,true);assert.equal(h.e['result-title'].focused,true);assert.match(h.e['step-three'].textContent,/units/);assert.equal(h.e['anchor-output'].textContent,'My anchor: <img src=x onerror=alert(1)>');assert.match(h.e['plan-text'].value,/My anchor:/);assert.doesNotMatch(script,/innerHTML|insertAdjacentHTML/);
});
await test('Changing answers invalidates output; reset clears private result text',()=>{
 const h=harness();h.e.anchor.value='private test cue';h.emit('return-form','submit');h.emit('return-form','change');assert.equal(h.e.result.hidden,true);assert.equal(h.e['plan-text'].value,'');assert.equal(h.e['anchor-output'].textContent,'');assert.match(h.e['form-status'].textContent,/Answers changed/);
 h.emit('return-form','submit');h.emit('return-form','reset');assert.equal(h.e.result.hidden,true);assert.equal(h.e['plan-text'].value,'');assert.equal(h.e.task.focused,true);
});
await test('Copy writes the current plan only after explicit activation',async()=>{
 let captured='';const h=harness({async writeText(text){captured=text;}});await h.emit('copy','click');assert.equal(captured,'');h.emit('return-form','submit');await h.emit('copy','click');assert.equal(captured,h.e['plan-text'].value);assert.match(h.e['copy-status'].textContent,/Copied/);assert.equal(h.e.copy.disabled,false);
});
await test('Clipboard failure reveals and selects a manual-copy fallback',async()=>{
 const h=harness();h.emit('return-form','submit');await h.emit('copy','click');assert.equal(h.e['manual-copy'].open,true);assert.equal(h.e['plan-text'].focused,true);assert.equal(h.e['plan-text'].selected,true);assert.match(h.e['copy-status'].textContent,/Automatic copy is unavailable/);
});
await test('Late clipboard responses cannot overwrite newer or reset UI state',async()=>{
 let resolve,reject;let h=harness({writeText(){return new Promise(r=>{resolve=r;});}});h.emit('return-form','submit');const pending=h.emit('copy','click');h.emit('return-form','reset');resolve();await pending;assert.equal(h.e['copy-status'].textContent,'');assert.equal(h.e.result.hidden,true);
 h=harness({writeText(){return new Promise((r,j)=>{reject=j;});}});h.emit('return-form','submit');const pending2=h.emit('copy','click');h.e.task.value='writing';h.emit('return-form','change');h.emit('return-form','submit');reject(new Error('blocked'));await pending2;assert.equal(h.e['copy-status'].textContent,'');assert.equal(h.e['manual-copy'].open,false);assert.match(h.e['plan-text'].value,/Writing/);
});
await test('Printing requires a result; privacy and no-script fallbacks are present',()=>{
 const h=harness();h.emit('print','click');assert.equal(h.prints(),0);h.emit('return-form','submit');h.emit('print','click');assert.equal(h.prints(),1);h.emit('return-form','change');h.emit('print','click');assert.equal(h.prints(),1);
 assert.doesNotMatch(script,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon/);assert.match(html,/<noscript>/);assert.match(html,/@media print/);assert.match(html,/prefers-reduced-motion/);
});
await test('Responsive rules and primary text contrast pass static checks',()=>{
 assert.match(html,/@media\(max-width:660px\)/);assert.match(html,/width:calc\(100% - 32px\)/);assert.match(html,/grid-template-columns:1fr/);assert.match(html,/min-height:48px/);assert.match(html,/font-size:1rem;padding:11px 12px/);
 function lum(hex){const v=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];}
 for(const [fg,bg] of [['102b35','f5f3e9'],['486069','fffefa'],['05675f','e9f0e9'],['b8f2da','102b35'],['c8d9db','102b35'],['5b6d72','fffefa']]){const values=[lum(fg),lum(bg)].sort((a,b)=>b-a);assert.ok((values[0]+.05)/(values[1]+.05)>=4.5,fg+' on '+bg);}
});
console.log(JSON.stringify({suites:passed,selectionCombinations:144,limitations:['VM DOM stub, not a rendering engine','No live mobile layout, clipboard permission, print pagination, Safari or assistive-technology verification']},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});