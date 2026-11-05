const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert');
const html=fs.readFileSync('src/attention-age/visual-search-comparison/index.html','utf8');
const js=fs.readFileSync('src/attention-age/visual-search-comparison/app.js','utf8');
assert(html.includes('id="board"')&&html.includes('id="result"'));
assert(html.includes('not a validated attention score'));
assert(html.includes('Honest Little Apps publishes Attention Age'));
assert(html.includes('id6795311726'));
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(ids.length,new Set(ids).size,'duplicate ids');
const targetSets=[...js.matchAll(/\[(\d+(?:,\d+){4})\]/g)].map(m=>m[1].split(',').map(Number)).slice(0,2);
assert.equal(targetSets.length,2);
for(const set of targetSets){assert.equal(set.length,5);assert.equal(new Set(set).size,5);assert(set.every(n=>n>=0&&n<36));}
assert.equal(new Set(targetSets.flat()).size,10,'attempts must use fresh target positions');
function node(tag){return {tag,textContent:'',hidden:false,innerHTML:'',dataset:{},className:'',attrs:{},children:[],focus(){},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this['on'+k]=f},appendChild(c){this.children.push(c)},querySelector(){return this.children[0]||null},classList:{add(){},remove(){}}};}
const els={};for(const id of ['start','restart','board','between','result','game-title','trial-label','mistake-label','instruction','a-summary','a-time','b-time','a-misses','b-misses','comparison-title','comparison-note'])els[id]=node('div');
els.start=node('button');els.restart=node('button');els.board=node('div');
let now=0;
const ctx={document:{getElementById:id=>els[id],createElement:tag=>node(tag)},performance:{now:()=>now}};
vm.runInNewContext(js,ctx);
els.start.onclick();assert.equal(els.board.children.length,36);assert.equal(els.board.hidden,false);
for(let t=0;t<5;t++){const target=els.board.children.find(x=>x.dataset.target==='true');now+=1000;target.onclick({currentTarget:target});}
assert.equal(els.between.hidden,false);assert(els['a-summary'].textContent.includes('5.0 seconds'));
els.start.onclick();for(let t=0;t<5;t++){const wrong=els.board.children.find(x=>x.dataset.target==='false');wrong.onclick({currentTarget:wrong});const target=els.board.children.find(x=>x.dataset.target==='true');now+=800;target.onclick({currentTarget:target});}
assert.equal(els.result.hidden,false);assert.equal(els['a-time'].textContent,'5.0 s');assert.equal(els['b-time'].textContent,'4.0 s');assert.equal(els['b-misses'].textContent,'5 misses');assert(els['comparison-note'].textContent.includes('5 misses more'));
console.log('visual-search-comparison: 18 checks passed');
