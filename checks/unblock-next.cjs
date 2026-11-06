const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const html = fs.readFileSync(process.argv[2], 'utf8');
const nodes = new Map();
function element() {
 return {hidden:false,textContent:'',children:[],listeners:{},addEventListener(name, fn){this.listeners[name]=fn;},append(item){this.children.push(item);},replaceChildren(){this.children=[];},focus(){this.focused=true;},click(){this.listeners.click?.();},remove(){}};
}
const context = { document: {getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,body:element()},window:{print(){}},URL:{createObjectURL(){return 'blob:test';},revokeObjectURL(){}},Blob,setTimeout(){}};
vm.createContext(context);
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
const choice = i => nodes.get('choices').children[i].click();
const paths = [[0,0],[0,1,0],[0,1,1],[1,0],[1,1],[2],[3]];
const titles = ['Make the missing input explicit','Separate the waiting part from the working part','Park it with a check-back cue','Check one specific place','Find the route to the missing input','Name a visible first action','Take one available step'];
paths.forEach((path,i)=>{
 nodes.get('restart').click();
 path.forEach(choice);
 assert.equal(nodes.get('resultTitle').textContent,titles[i]);
 assert.equal(nodes.get('result').hidden,false);
 assert.equal(nodes.get('resultTitle').focused,true);
 assert.equal(nodes.get('trail').children.length,path.length);
 const output=vm.runInContext('cardText()',context);
 assert(output.includes(titles[i]));
 assert(!output.includes('undefined'));
 nodes.get('download').click();
 assert(nodes.get('feedback').textContent.includes('my-next-action.txt'));
});
nodes.get('back').click();
assert.equal(nodes.get('question').textContent,'What stops the very next action?');
choice(0);choice(1);choice(1);nodes.get('back').click();choice(0);
assert.equal(nodes.get('resultTitle').textContent,titles[1]);
assert.equal(nodes.get('trail').children.length,3);
assert(!vm.runInContext('cardText()',context).includes('No, the remaining work'));
nodes.get('restart').click();
assert.equal(nodes.get('back').hidden,true);
console.log('PASS all 7 outcomes, answer-specific export, back-and-rebranch, restart, focus, download flow');
