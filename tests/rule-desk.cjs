const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=fs.existsSync(__dirname+'/index.html')?__dirname:path.resolve(__dirname,'../src/skillarena/rule-switching-game');
const html=fs.readFileSync(dir+'/index.html','utf8'),script=html.match(/<script id="rule-desk-script">([\s\S]*?)<\/script>/)[1];
const ctx={module:{exports:{}}};vm.runInNewContext(script,ctx);const api=ctx.module.exports;
const expected=[['A','C'],['C','E'],['A','C','D'],['C'],['A','B','D','F'],['A','D']];
let suites=0;function test(name,fn){fn();suites++;console.log('PASS '+name);}
function harness(){
 const e={};function node(){return {textContent:'',hidden:false,disabled:false,attrs:{},children:[],listeners:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},focus(){this.focused=true;},append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}};}
 for(const m of html.matchAll(/\bid="([^"]+)"/g))e[m[1]]=node();
 const context={module:{exports:{}},document:{getElementById(id){assert.ok(e[id],'Missing '+id);return e[id];},createElement(){return node();}}};vm.runInNewContext(script,context);
 return {e,click(id){e[id].listeners.click();},picked(){return api.cards.filter(c=>e['card-'+c.id].attrs['aria-pressed']==='true').map(c=>c.id);}};
}
test('Six hand-audited answer sets and all 384 selections agree',()=>{
 for(let r=0;r<6;r++)for(let mask=0;mask<64;mask++){
  const picks=api.cards.filter((c,i)=>mask&(1<<i)).map(c=>c.id),out=api.evaluate(r,picks);
  assert.deepEqual(Array.from(out.answers),expected[r]);
  const wanted=api.cards.filter(c=>picks.includes(c.id)===expected[r].includes(c.id)).length;
  assert.equal(out.correctCount,wanted);assert.equal(out.solved,wanted===6);assert.equal(out.rows.length,6);
  out.rows.forEach(row=>{assert.equal(row.expected,expected[r].includes(row.id));assert.ok(row.reason.length>10);assert.doesNotMatch(row.reason,/undefined|NaN/);});
 }
});
test('OR includes both; AND and NOT have explicit boundary explanations',()=>{
 assert.match(api.evaluate(2,[]).rows[0].reason,/both blue and a circle/);
 assert.match(api.evaluate(3,[]).rows[0].reason,/not above 3/);
 assert.match(api.evaluate(4,[]).rows[2].reason,/excludes/);
 assert.match(api.evaluate(5,[]).rows[4].reason,/fails the color group/);
 assert.match(api.evaluate(5,[]).rows[5].reason,/odd/);
});
test('Invalid rule, unknown card and duplicate selections are rejected',()=>{
 for(const rule of [-1,6,1.5,NaN,'0'])assert.throws(()=>api.evaluate(rule,[]));
 for(const values of [['G'],['A','A'],null,'AC'])assert.throws(()=>api.evaluate(0,values));
});
test('Controller keeps selections across rules and clears stale feedback',()=>{
 const h=harness();assert.equal(h.e.previous.disabled,true);assert.equal(h.e.next.disabled,false);assert.equal(h.e['card-A'].disabled,false);
 h.click('check');assert.match(h.e['feedback-title'].textContent,/4 of 6/);assert.equal(h.e['feedback-list'].children.length,6);assert.equal(h.e['feedback-title'].focused,true);
 h.click('card-A');assert.equal(h.e.feedback.hidden,true);assert.equal(h.e['feedback-list'].children.length,0);h.click('card-C');h.click('check');assert.match(h.e.progress.textContent,/1 rule solved/);
 h.click('next');assert.deepEqual(Array.from(h.picked()),['A','C']);assert.match(h.e['rule-title'].textContent,/triangle/);assert.equal(h.e.feedback.hidden,true);assert.equal(h.e['rule-title'].focused,true);
 h.click('check');assert.match(h.e['feedback-title'].textContent,/4 of 6/);h.click('card-A');h.click('card-E');h.click('check');assert.match(h.e.progress.textContent,/2 rules solved/);
 h.click('previous');assert.deepEqual(Array.from(h.picked()),['C','E']);assert.equal(h.e.previous.disabled,true);
});
test('All rules can be solved once, revisit does not inflate count, reset clears state',()=>{
 const h=harness();
 for(let r=0;r<6;r++){for(const c of api.cards)if(h.picked().includes(c.id)!==expected[r].includes(c.id))h.click('card-'+c.id);h.click('check');assert.match(h.e['feedback-title'].textContent,/That set matches/);h.click('check');assert.match(h.e.progress.textContent,new RegExp((r+1)+' rule'));if(r<5)h.click('next');}
 assert.equal(h.e.complete.hidden,false);assert.equal(h.e.next.disabled,true);h.click('next');assert.match(h.e.progress.textContent,/Rule 6 of 6/);
 h.click('reset');assert.deepEqual(Array.from(h.picked()),[]);assert.match(h.e.progress.textContent,/0 rules solved/);assert.equal(h.e.complete.hidden,true);assert.equal(h.e.feedback.hidden,true);assert.equal(h.e.previous.disabled,true);
});
test('SEO, asset paths, honest boundaries and no-JS controls are intact',()=>{
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);assert.equal((html.match(/<h1>/g)||[]).length,1);
 const urls=[...html.matchAll(/href="(https:\/\/apps\.apple\.com[^\"]+)"/g)].map(x=>x[1]);assert.deepEqual(urls,['https://apps.apple.com/ca/app/skillarena-focus-training/id6795713307']);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.url,html.match(/rel="canonical" href="([^"]+)"/)[1]);
 assert.equal(JSON.parse(fs.readFileSync(dir+'/meta.json','utf8')).draft,false);assert.match(html,/Publisher disclosure: Honest Little Apps/);assert.match(html,/separate original browser activity/);assert.doesNotMatch(html,/James Gray/);
 for(const c of api.cards){const tag=html.match(new RegExp('<button[^>]+id="card-'+c.id+'"[^>]*>'))[0];assert.match(tag,/disabled/);assert.match(tag,/aria-label=/);assert.match(tag,/aria-pressed="false"/);}
 assert.match(html,/<noscript>/);assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|setTimeout|setInterval|innerHTML/);
});
test('Responsive and keyboard semantics pass static checks; key text colors meet contrast',()=>{
 assert.match(html,/@media\(max-width:560px\)/);assert.match(html,/width:calc\(100% - 32px\)/);assert.match(html,/min-height:46px/);assert.match(html,/role="status"/);assert.match(html,/prefers-reduced-motion/);
 const lum=h=>{const v=h.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
 for(const [fg,bg] of [['211d20','f7eee3'],['62564f','f7eee3'],['263faa','fffbf5'],['ffffff','263faa'],['ffffff','b54026'],['ffffff','9a6c16'],['23523a','eee8dd'],['912918','eee8dd']]){const v=[lum(fg),lum(bg)].sort((a,b)=>b-a);assert.ok((v[0]+.05)/(v[1]+.05)>=4.5,fg+' on '+bg);}
});
console.log(JSON.stringify({suites,modelSelections:384,limitations:['DOM stub; no rendering engine','Mobile visual layout, live keyboard and assistive technology pending']},null,2));