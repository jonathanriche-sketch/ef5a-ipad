/* Modèle A validé : rapport institutionnel bleu, cadres et résultats colorés. */
(function(root){
'use strict';
let fontTask;
function base64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)}
async function build(c,fontData,boldData){
 const Constructor=root.jspdf?.jsPDF;if(!Constructor)throw Error('Générateur PDF indisponible. Rouvrir l’application en ligne pour terminer la mise à jour.');
 if(!fontData){fontTask??=Promise.all(['DejaVuSans.ttf','DejaVuSans-Bold.ttf'].map(name=>fetch('./vendor/'+name).then(r=>{if(!r.ok)throw Error('Police PDF indisponible');return r.arrayBuffer()}).then(b=>base64(new Uint8Array(b))))).catch(e=>{fontTask=null;throw e});[fontData,boldData]=await fontTask}
 const pdf=new Constructor({unit:'mm',format:'a4',compress:true});pdf.addFileToVFS('EF5A.ttf',fontData);pdf.addFont('EF5A.ttf','EF5A','normal');pdf.addFileToVFS('EF5A-Bold.ttf',boldData||fontData);pdf.addFont('EF5A-Bold.ttf','EF5A','bold');
 const navy='#15365B',ink='#203249',muted='#65758A',border='#DCE4EC',margin=12,width=186,bottom=277;
 const palettes={C:['#22774D','#EAF5EE','Conforme'],NC:['#AB3540','#FCEEF0','Non conforme'],SO:['#627184','#EEF1F4','Sans objet'],NV:['#936114','#FBF3DF','Non vérifié'],NONE:['#627184','#EEF1F4','Sans réponse']};
 let y=0;const f=c.template_snapshot;
 const value=x=>String(x??'').replace(/\r\n?/g,'\n').replace(/\t/g,'    ');
 function font(size=10,bold=false){pdf.setFont('EF5A',bold?'bold':'normal');pdf.setFontSize(size)}
 function text(x,top,s,size=10,color=ink,bold=false){font(size,bold);pdf.setTextColor(color);pdf.text(value(s),x,top+size*.3528)}
 function box(x,top,w,h,fill,stroke,r=2){pdf.setFillColor(fill);pdf.setDrawColor(stroke||fill);pdf.setLineWidth(.22);pdf.roundedRect(x,top,w,h,r,r,stroke?'FD':'F')}
 function wrap(s,w,size=10,bold=false){font(size,bold);return value(s).split('\n').flatMap(part=>pdf.splitTextToSize(part||' ',w))}
 function next(){pdf.addPage();pdf.setFillColor(navy);pdf.rect(0,0,210,21,'F');text(margin,6,'EF5A · RAPPORT DE VISITE',10,'#FFFFFF',true);y=29}
 function ensure(h){if(y+h>bottom)next()}
 function full(s,size=10,color=ink,bold=false,gap=2){const lh=size*.3528*1.42;for(const row of wrap(s,width,size,bold)){ensure(lh);text(margin,y,row,size,color,bold);y+=lh}y+=gap}
 // Première page : bandeau, identité de visite et bilan des réponses.
 const titleLines=wrap(f.title,186,10);const headerH=34+titleLines.length*5;pdf.setFillColor(navy);pdf.rect(0,0,210,headerH,'F');text(margin,7,'EF5A',21,'#FFFFFF',true);text(margin,19,'RAPPORT DE VISITE',16,'#FFFFFF',true);titleLines.forEach((s,i)=>text(margin,30+i*5,s,10,'#D7E4F4'));y=headerH+7;
 function metaPair(left,right){const tops=y;let max=0;for(const [idx,[label,v]] of [left,right].entries()){const x=margin+idx*99;const rows=wrap(v||'—',87,10,true);text(x,tops,label.toUpperCase(),7,muted,true);rows.forEach((s,i)=>text(x,tops+6+i*4.6,s,10,ink,true));max=Math.max(max,6+rows.length*4.6)}y+=max+6}
 const dateLabel=/^\d{4}-\d{2}-\d{2}$/.test(c.control_date||'')?new Date(c.control_date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):c.control_date;metaPair(['Site',c.site],['Date du contrôle',dateLabel]);metaPair(['Contrôleur',c.operator],['Accompagnateur(s)',c.accompanying_agents]);
 full('Collaboration : '+(c.collaboration_with||'—'),9,muted,false,5);
 const items=f.sections.flatMap(s=>s.items).filter(i=>i.type==='CONTROLE'),counts={C:0,NC:0,SO:0,NV:0};for(const i of items){const k=c.answers[i.id]?.choice;if(k in counts)counts[k]++}
 ensure(22);['C','NC','SO','NV'].forEach((k,i)=>{const [color,bg,label]=palettes[k],x=margin+i*47.5;box(x,y,43.5,16,bg);text(x+4,y+2,String(counts[k]),19,color,true);text(x+15,y+6,label,7.4,color,true)});y+=23;
 const missing=items.length-Object.values(counts).reduce((a,b)=>a+b,0);if(missing)full(missing+' point(s) sans réponse',8,muted);
 function sectionHeading(name,index){const lines=wrap(String(index).padStart(2,'0')+' / '+name.toUpperCase(),width,10,true);ensure(lines.length*5+17);for(const row of lines){text(margin,y,row,10,navy,true);y+=5}y+=4}
 let num=0;
 function card(item){num++;const a=c.answers[item.id]||{},[color,bg,label]=palettes[a.choice]||palettes.NONE;
 const title=String(num).padStart(2,'0')+'  '+item.label,titleRows=wrap(title,width-57,10,true),titleH=titleRows.length*4.7;
 let rows=[];
 function push(s,x,w,size=9,color=ink,bold=false){const lh=size*.3528*1.42;for(const row of wrap(s,w,size,bold))rows.push({s:row,x,size,color,bold,h:lh})}
 const tags=[item.modules,item.reference].filter(Boolean).join(' · ');if(tags)push(tags,margin+6,width-12,7.5,muted);
 function labelled(label,s){rows.push({s:label,x:margin+6,size:7,color:muted,bold:true,h:4.1});push(s,margin+6,width-12,9)}
 if(item.instruction)labelled('CONSIGNE',item.instruction);
 if(item.details.length)labelled('POINTS DE DÉTAIL',item.details.map((d,i)=>(a.details?.includes(i)?'[X] ':'[ ] ')+d).join('\n'));
 labelled('OBSERVATION / COMMENTAIRE',a.comment||'—');
 let first=true;
 do{let header=titleH+10,remaining=rows.reduce((t,r)=>t+r.h,0),needed=header+remaining+5;
 if(needed<=248&&y+needed>bottom)next();else if(bottom-y<header+Math.min(remaining,14)+5)next();
 const capacity=bottom-y-header-5;let n=0,bodyH=0;while(n<rows.length&&bodyH+rows[n].h<=capacity){bodyH+=rows[n].h;n++}
 if(!n&&rows.length){next();continue}
 const total=header+bodyH+5;box(margin,y,width,total,'#FFFFFF',border,2.5);pdf.setFillColor(color);pdf.roundedRect(margin,y+4,1.2,total-8,.6,.6,'F');
 titleRows.forEach((s,i)=>text(margin+6,y+4+i*4.7,s,10,navy,true));font(8,true);const pillW=pdf.getTextWidth(label)+7;box(margin+width-pillW-5,y+4,pillW,8,bg,null,4);text(margin+width-pillW-1.5,y+5.4,label,8,color,true);
 if(!first)text(margin+6,y+header-4,'Suite du point de contrôle',7,muted);
 let top=y+header;for(const r of rows.splice(0,n)){text(r.x,top,r.s,r.size,r.color,r.bold);top+=r.h}
 y+=total+4;first=false;if(rows.length)next();
 }while(rows.length);
 }
 f.sections.forEach((section,index)=>{sectionHeading(section.name,index+1);for(const item of section.items){if(item.type==='CONTROLE')card(item);else full((item.type==='NOTE'?'Note : ':'')+item.label,9,muted,item.type==='TITRE',3)}});
 // La validation est conservée même lorsque le rapport comporte plusieurs pages.
 const validation=c.status==='validated'?c.validator+' · '+new Date(c.validated).toLocaleString('fr-FR'):'Brouillon non validé';const vrows=wrap(validation,174,9.5,true),vh=13+vrows.length*4.6;ensure(vh+4);box(margin,y,width,vh,'#F1F5F8');text(margin+5,y+4,'VALIDATION DU CONTRÔLE',7.5,navy,true);vrows.forEach((s,i)=>text(margin+5,y+10+i*4.6,s,9.5,ink,true));y+=vh+3;
 full('Identifiant du contrôle : '+c.id,7,muted);
 const n=pdf.getNumberOfPages();for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setDrawColor(border);pdf.line(margin,284,198,284);text(margin,287,'EF5A · Jonathan RICHE',7,muted);font(7);pdf.setTextColor(muted);pdf.text(i+' / '+n,198,289.5,{align:'right'})}
 pdf.setProperties({title:'Contrôle EF5A — '+c.site,author:'Jonathan RICHE',subject:f.title});return new Uint8Array(pdf.output('arraybuffer'));
}
function filename(c){const safe=s=>String(s||'controle').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').slice(0,70);return 'EF5A_'+safe(c.site)+'_'+safe(c.control_date)+'.pdf'}
root.EF5APDF={build,filename};if(typeof module!=='undefined')module.exports=root.EF5APDF;
})(globalThis);
