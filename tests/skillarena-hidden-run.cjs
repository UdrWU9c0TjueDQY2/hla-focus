const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'../src/skillarena/free-focus-test-go-no-go-winter-slump/index.html'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('var N=24'));
function game(){
 const nodes={},events={},timers=new Map();let id=0,now=0;
 for(const name of ['stim','msg','tap','start','reset','res','hits','fa','miss','rt'])nodes[name]={style:{},hidden:false,disabled:false,textContent:'',innerHTML:'',events:{},classList:{values:new Set(),add(x){this.values.add(x)},remove(x){this.values.delete(x)}},addEventListener(k,fn){this.events[k]=fn},click(){if(!this.disabled)this.events.click()}};
 const document={hidden:false,getElementById:id=>nodes[id],addEventListener(k,fn){events[k]=fn}};
 const context={document,performance:{now:()=>now},Math:Object.assign(Object.create(Math),{random:()=>0.8}),setTimeout(fn){timers.set(++id,fn);return id},clearTimeout(i){timers.delete(i)}};
 vm.runInNewContext(script,context);
 return {nodes,document,timers,events,start(){nodes.start.click()},tick(){const first=timers.entries().next().value;if(!first)return false;timers.delete(first[0]);now+=900;first[1]();return true},hide(){document.hidden=true;if(events.visibilitychange)events.visibilitychange()},show(){document.hidden=false;if(events.visibilitychange)events.visibilitychange()}};
}
for(const stage of ['ready','stimulus','gap']){
 const g=game();g.start();if(stage!=='ready')g.tick();if(stage==='gap')g.tick();
 const queued=[...g.timers.values()];g.hide();assert.equal(g.timers.size,0,stage+' clears scheduled callback');
 queued.forEach(fn=>fn());assert.equal(g.nodes.stim.style.display,'none');assert.equal(g.nodes.tap.disabled,true);assert.equal(g.nodes.start.hidden,false);assert.equal(g.nodes.res.classList.values.has('on'),false);assert.equal(g.nodes.miss.textContent,0);assert.match(g.nodes.msg.textContent,/No result was recorded/);
 g.show();assert.equal(g.timers.size,0,'returning does not resume');g.start();assert.equal(g.timers.size,1,'fresh start is possible');g.tick();assert.equal(g.nodes.stim.style.display,'flex');
}
const g=game();g.document.hidden=true;g.start();assert.equal(g.timers.size,0);g.show();g.start();for(let i=0;i<60&&g.tick();i++);assert.equal(g.nodes.res.classList.values.has('on'),true,'visible full run still finishes');assert.equal(g.nodes.tap.disabled,true);assert.match(g.nodes.res.innerHTML,/not available; no blue taps recorded/);assert.doesNotMatch(g.nodes.res.innerHTML,/slump signature|brake is working|usually means tired|400 ms/);g.hide();assert.equal(g.nodes.res.classList.values.has('on'),true,'completed result retained');
assert.doesNotMatch(html,/classic slump signature|usually means tired|Accurate enough to notice a slump/);assert.match(html,/22 correct responses out of 24/);
console.log('SkillArena hidden-run checks passed: ready, stimulus, inter-trial cancellation; no auto-resume; fresh start; hidden start blocked; visible completion retained.');
