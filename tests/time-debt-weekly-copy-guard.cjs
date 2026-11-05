const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const html=fs.readFileSync(process.argv[2]||path.join(__dirname,'../src/time-debt/weekly-screen-time-budget-calculator/index.html'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('const kind="budget"'));
assert.ok(script,'budget script exists');
const defaults={oldWeek:'90',oldEnd:'120',newWeek:'60',newEnd:'90'},ids=['inputs','restore','copy','result','detail','visual','status','equal-week-example',...Object.keys(defaults)],nodes={};
for(const id of ids)nodes[id]={value:defaults[id]||'',textContent:'',innerHTML:'',innerText:'',disabled:false,events:{},addEventListener(n,f){this.events[n]=f},setAttribute(){},focus(){},checkValidity(){return this.value!==''&&Number.isInteger(+this.value)&&+this.value>=0&&+this.value<=1440}};
const copies=[];let reject=false,resolvePending=null,pending=false;
const context={document:{title:'Weekly budget',getElementById:id=>nodes[id],querySelectorAll:()=>Object.keys(defaults).map(id=>nodes[id])},location:{href:'https://example.test/#tool'},HTMLFormElement:{prototype:{reset(){for(const id in defaults)nodes[id].value=defaults[id]}}},navigator:{clipboard:{writeText(s){copies.push(s);if(reject)return Promise.reject(Error());if(pending)return new Promise(r=>resolvePending=r);return Promise.resolve()}}}};
vm.runInNewContext(script,context);
const click=id=>nodes[id].events.click();const edit=(id,v)=>{nodes[id].value=v;nodes.inputs.events.input()};
(async()=>{
assert.equal(nodes.copy.disabled,false);assert.match(nodes.result.textContent,/3 hours 30 minutes less/);
await click('copy');assert.equal(copies.length,1);assert.match(copies[0],/690 min/);assert.match(nodes.status.textContent,/Copied/);
for(const bad of ['', '-1', '1441', '1.5']){edit('oldWeek',bad);assert.equal(nodes.copy.disabled,true);assert.equal(nodes.status.textContent,'');await click('copy');assert.equal(copies.length,1);assert.match(nodes.result.textContent,/Check your inputs/);}
edit('oldWeek','90');assert.equal(nodes.copy.disabled,false);reject=true;await click('copy');assert.match(nodes.status.textContent,/Copy unavailable/);reject=false;
pending=true;const promise=click('copy');edit('newWeek','');resolvePending();await promise;assert.equal(nodes.status.textContent,'');assert.equal(nodes.copy.disabled,true);pending=false;
click('equal-week-example');assert.equal(nodes.copy.disabled,false);assert.equal(nodes.result.textContent,'Same weekly allowance');await click('copy');assert.match(copies.at(-1),/420 min/);
click('restore');assert.match(nodes.result.textContent,/3 hours 30 minutes less/);assert.equal(nodes.status.textContent,'');
console.log('10 Time Debt validity/copy lifecycle cases passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
