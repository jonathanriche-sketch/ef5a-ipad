/* Import métier EF5A : mêmes colonnes et sélecteurs que Windows v1.7. */
(function(root){
'use strict';
const cols=['Fiche','Titre','SousTitre','Expert','Section','Type','Libelle','Modules','Reference','Consigne'];
const uid=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
function csvRows(text){
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++}else if(quoted)quoted=false;else if(!field)quoted=true;else throw Error('CSV : guillemet inattendu')}
 else if(!quoted&&c===';'){row.push(field);field=''}else if(!quoted&&(c==='\n'||c==='\r')){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x.trim()))rows.push(row);row=[];field=''}else field+=c}
 if(quoted)throw Error('CSV : guillemet non fermé');row.push(field);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
function fromRows(rows){
 const headers=rows[0]||[];if(!headers.includes('Fiche')||!headers.includes('Libelle'))throw Error('Colonnes Fiche et Libelle obligatoires ; séparateur point-virgule (;)');
 const fiches=new Map();
 for(let n=1;n<rows.length;n++){const r=Object.fromEntries(headers.map((k,i)=>[k,(rows[n][i]||'').trim()])),code=r.Fiche;if(!code)continue;
 if(!fiches.has(code))fiches.set(code,{code,title:'',subtitle:'',expert:'',sections:[]});const f=fiches.get(code);f.title=f.title||r.Titre||code;f.subtitle=f.subtitle||r.SousTitre||'';f.expert=f.expert||r.Expert||'';
 const typ=(r.Type||'CONTROLE').toUpperCase(),sec=r.Section||'';if(typ==='FICHE')continue;
 if(!['CONTROLE','DETAIL','TITRE','NOTE'].includes(typ))throw Error(`Ligne ${n+1} : type inconnu ${typ}`);
 const last=f.sections.at(-1),item=last?.items.at(-1);
 if(typ==='DETAIL'){if(item?.type!=='CONTROLE')throw Error(`Ligne ${n+1} : DETAIL sans CONTROLE précédent`);if(sec&&sec!==last.name)throw Error(`Ligne ${n+1} : section DETAIL incohérente`);item.details.push(r.Libelle||'');continue}
 if(!sec)throw Error(`Ligne ${n+1} : section vide`);if(!last||last.name!==sec)f.sections.push({name:sec,items:[]});
 f.sections.at(-1).items.push({id:uid(),type:typ,label:r.Libelle||'',modules:r.Modules||'',reference:r.Reference||'',instruction:r.Consigne||'',details:[]});
 }
 const result=[...fiches.values()];if(!result.length||result.some(f=>!f.sections.some(s=>s.items.some(i=>i.type==='CONTROLE'))))throw Error('Aucun point de contrôle trouvé dans une fiche');return result;
}
function clean(s){s=String(s||'').replace(/\s+/g,' ').trim();for(let i=0;i<4;i++){const old=s;s=s.replace(/\s*\/\s*/g,' — ').replace(/(?:\s*[—·]\s*){2,}/g,' — ').replace(/\s+/g,' ').replace(/^[ —·]+|[ —·]+$/g,'');if(s===old)break}return s.trim()}
function text(e){return e?Array.from(e.childNodes,n=>n.nodeType===3?n.textContent.trim():text(n)).filter(Boolean).join(' '):''}
function fromHTML(src){
 // template.innerHTML creates inert content: scripts, frames and images never enter the live page.
 const holder=document.createElement('template');holder.innerHTML=src;const doc=holder.content;
 const ph=doc.querySelector('div.printhead'),head=doc.querySelector('header');
 const title=clean(text(ph?.querySelector('h1'))||text(head?.querySelector('h1'))||text(doc.querySelector('title')));
 const subtitle=clean(text(ph?.querySelector('div.ph-sub'))||text(head?.querySelector('div.subhead')));
 const expert=clean(doc.querySelector('input[data-k="expert"]')?.getAttribute('value'));
 const key=src.match(/const\s+KEY\s*=\s*'([^']+)'/),code=key?key[1].replace(/^ef5a_/,'').replace(/_v\d+$/,'').toUpperCase():'FICHE';
 const rows=[cols];let first=true;
 for(const sec of doc.querySelectorAll('details.sec')){
 const section=clean(text(sec.querySelector('summary'))||'Vérifications').replace(/^\d+\s*[.)]\s*/,'').replace(/\s*\d+\s*\/\s*\d+.*$/,'').trim();
 function add(type,label,modules='',reference='',instruction=''){rows.push([code,first?title:'',first?subtitle:'',first?expert:'',section,type,label,modules,reference,instruction]);first=false}
 function scan(node){for(const e of node.children){if(e.classList.contains('item')){
 const label=clean(text(e.querySelector('div.it-t'))).replace(/^\d+\s*[.)]\s*/,'');const mods=[],refs=[];
 for(const t of e.querySelectorAll('span.tag'))(t.classList.contains('ref')?refs:mods).push(clean(text(t)));
 let cons=clean(text(e.querySelector('div.cons'))),ref=refs.filter(Boolean).join(' · ');
 if(!ref&&cons&&cons.length<70&&/^(IN|NG|DEI|RFN)\b.*\d/i.test(cons)){ref=cons;cons=''}
 add('CONTROLE',label,mods.filter(Boolean).join(' · '),ref,cons);
 for(const sub of e.querySelectorAll('div.sub'))for(const lab of sub.querySelectorAll('label'))if(lab.querySelector('input')?.getAttribute('type')==='checkbox'){const label=clean(text(lab.querySelector('span'))||text(lab));if(label)add('DETAIL',label)}
 }else if(e.classList.contains('subsection'))add('TITRE',clean(text(e)));else if(e.classList.contains('source-note'))add('NOTE',clean(text(e)));else if(e.tagName!=='SUMMARY')scan(e)}}scan(sec);
 }
 return fromRows(rows);
}
async function read(file){const bytes=new Uint8Array(await file.arrayBuffer());let src;try{src=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{src=new TextDecoder('windows-1252').decode(bytes)}
 if(/\.csv$/i.test(file.name))return fromRows(csvRows(src));if(/\.html?$/i.test(file.name))return fromHTML(src);throw Error('Choisir une fiche .html, .htm ou .csv');}
// Ignore random point IDs when detecting a re-import of an identical fiche.
const signature=f=>JSON.stringify({...f,sections:f.sections.map(s=>({...s,items:s.items.map(({id,...i})=>i)}))});
root.EF5AFiches={read,fromRows,fromHTML,csvRows,signature};if(typeof module!=='undefined')module.exports=root.EF5AFiches;
})(globalThis);
