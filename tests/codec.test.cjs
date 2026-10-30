const assert=require('node:assert/strict');const fs=require('node:fs');const E=require('../core.js');
const input=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const t=E.parse(input.template);assert.equal(t.type,'template');assert.deepEqual(E.packTemplate(t.record),input.template);
const c=E.parse(input.inspection).record;assert.deepEqual(E.pack(c),input.inspection);
assert.equal(c.control_date,'2026-10-30');assert.equal(c.accompanying_agents,'Agent A, Agent B');assert.equal(c.collaboration_with,'Équipe sécurité');
assert.equal(E.complete(c),false);c.answers={};for(const [n,p] of c.template_snapshot.sections.flatMap(s=>s.items).filter(i=>i.type==='CONTROLE').entries())c.answers[p.id]={choice:['C','NC','SO','NV'][n%4],details:[0],comment:'Observation électricité — iPad\nSuite'};
assert.equal(E.complete(c),true);E.answers(c.answers,c.template_snapshot);
for(const mutate of [x=>x.answers={inconnu:{choice:'C'}},x=>x.answers[Object.keys(x.answers)[0]].choice='INVALID',x=>x.answers[Object.keys(x.answers)[0]].details=[99],x=>x.id="x');alert(1)//"]){const bad=E.clone(c);mutate(bad);assert.throws(()=>E.inspection(bad))}
const missing=E.clone(c);missing.status='validated';missing.validator='';assert.throws(()=>E.inspection(missing));
assert.throws(()=>E.parse({kind:'EF5A_TEMPLATE_DELETED_V1',id:'a'}));assert.equal(E.parse({format:'CONTROLE_EF5A_V1',id:c.id,updated:c.updated,answers:c.answers}).type,'backup');
c.status='validated';c.validator='Validateur iPad';c.validated=c.updated='2026-10-30T19:00:00.000Z';
assert.equal(E.parse(E.pack(c)).record.status,'validated');
const fresh=E.clone(c);fresh.id='0123456789abcdef0123456789abcdef';fresh.status='in_progress';fresh.validated=null;fresh.validator=null;
fs.writeFileSync(process.argv[3],JSON.stringify([E.pack(c),E.pack(fresh)]));console.log('Codec : 14 assertions / groupes de contrôles OK');
