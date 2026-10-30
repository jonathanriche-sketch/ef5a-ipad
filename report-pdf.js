/* Rapport PDF autonome : jsPDF et police fournis localement pour le mode hors connexion. */
(function(root){
'use strict';
let fontTask;
function base64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)}
async function build(c,fontData){
 const Constructor=root.jspdf?.jsPDF;if(!Constructor)throw Error('Générateur PDF indisponible. Rouvrir l’application en ligne pour terminer la mise à jour.');
 if(!fontData){fontTask??=fetch('./vendor/DejaVuSans.ttf').then(r=>{if(!r.ok)throw Error('Police PDF indisponible');return r.arrayBuffer()}).then(b=>base64(new Uint8Array(b))).catch(e=>{fontTask=null;throw e});fontData=await fontTask}
 const pdf=new Constructor({unit:'mm',format:'a4',compress:true});pdf.addFileToVFS('EF5A.ttf',fontData);pdf.addFont('EF5A.ttf','EF5A','normal');pdf.setFont('EF5A');
 const width=178,margin=16,bottom=275;let y=18;
 const value=x=>String(x??'').replace(/\r\n?/g,'\n').replace(/\t/g,'    ');
 function next(){pdf.addPage();y=18}
 function line(text,size=10,color=[28,43,65],gap=2){pdf.setFontSize(size);pdf.setTextColor(...color);const height=size*.3528*1.42;
 for(const part of value(text).split('\n')){const rows=pdf.splitTextToSize(part||' ',width);for(const row of rows){if(y+height>bottom)next();pdf.text(row,margin,y);y+=height}}
 y+=gap;
 }
 function heading(text){if(y>252)next();y+=3;line(text,13,[16,46,100],3)}
 const f=c.template_snapshot;
 line('GESTION DES CONTROLES',16,[16,46,100],3);line('Visite de sécurité EF5A',11,[16,46,100],4);line(f.title,13,[16,46,100],4);
 for(const [label,v] of [['Site',c.site],['Contrôleur',c.operator],['Date du contrôle',c.control_date],['Agent(s) accompagnateur(s)',c.accompanying_agents],['Traité en collaboration avec',c.collaboration_with],['Statut',c.status==='validated'?'Validé':'Brouillon non validé'],['Validation',c.status==='validated'?c.validator+' — '+new Date(c.validated).toLocaleString('fr-FR'):'Non validé'],['Identifiant',c.id]])line(label+' : '+(v||'—'));
 for(const section of f.sections){heading(section.name);for(const item of section.items){if(item.type!=='CONTROLE'){line((item.type==='NOTE'?'Note : ':'')+item.label,10,[72,83,100]);continue}
 if(y>247)next();const a=c.answers[item.id]||{};line(item.label,11,[16,46,100],1);const tags=[item.modules,item.reference].filter(Boolean).join(' · ');if(tags)line(tags,9,[85,95,110],1);if(item.instruction)line('Consigne : '+item.instruction,9,[60,70,85],1);
 line('Réponse : '+({C:'Conforme',NC:'Non conforme',SO:'Sans objet',NV:'Non vérifié'}[a.choice]||'Sans réponse'),10,[28,43,65],1);
 for(const [i,d] of item.details.entries())line((a.details?.includes(i)?'[X] ':'[ ] ')+d,9,[60,70,85],1);
 line('Observation / commentaire : '+(a.comment||'—'),10,[28,43,65],4);
 }}
 const n=pdf.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(95,105,120);pdf.text('EF5A · Jonathan RICHE',margin,287);pdf.text(i+' / '+n,194,287,{align:'right'})}
 pdf.setProperties({title:'Contrôle EF5A — '+c.site,author:'Jonathan RICHE',subject:f.title});return new Uint8Array(pdf.output('arraybuffer'));
}
function filename(c){const safe=s=>String(s||'controle').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,70);return 'EF5A_'+safe(c.site)+'_'+safe(c.control_date)+'.pdf'}
root.EF5APDF={build,filename};if(typeof module!=='undefined')module.exports=root.EF5APDF;
})(globalThis);
