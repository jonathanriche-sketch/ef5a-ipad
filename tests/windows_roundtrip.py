"""Usage: python3 tests/windows_roundtrip.py /chemin/windows/server.py
Exécute les vraies fonctions Windows sur une base et un dossier temporaires.
N'accède à aucune bibliothèque OneDrive réelle.
"""
from pathlib import Path
import importlib.util,tempfile,json,subprocess,sys,shutil,hashlib
source=Path(sys.argv[1]).resolve(); app=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as folder:
 p=Path(folder);shutil.copy(source,p/'server.py')
 spec=importlib.util.spec_from_file_location('ef5a_windows_test',p/'server.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w);w.init()
 shared=p/'EF5A';shared.mkdir();w.save_config({'path':str(shared)})
 # shared_root uses the actual configuration key; checked against the supplied source.
 f={'code':'TEST-IPAD','title':'Fiche essai compatibilité','subtitle':'Essai sans données réelles','expert':'Test','sections':[{'name':'Rubrique sécurité','items':[{'id':f'point{n}','type':'CONTROLE','label':f'Point {n}','modules':'Module A','reference':'Réf. 1','instruction':'Vérifier','details':['Détail A','Détail B']} for n in range(4)]+[{'id':'note','type':'NOTE','label':'Note de visite','modules':'','reference':'','instruction':'','details':[]}]}]}
 with w.conn() as c:
  tid=w.insert_template(c,f);date=w.now();ident='abcdef0123456789abcdef0123456789'
  c.execute('INSERT INTO inspections (id,template_id,template_snapshot,site,operator,status,created,updated,validated,validator,answers,control_date,accompanying_agents,collaboration_with) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(ident,tid,json.dumps(f,ensure_ascii=False),'Site test','Contrôleur test','in_progress',date,date,None,None,'{}','2026-10-30','Agent A, Agent B','Équipe sécurité'))
 stats=w.sync_all();assert not stats['errors'],stats
 template=json.loads((shared/'Fiches_types'/f'{tid}.json').read_text());inspection=json.loads((shared/'Controles_en_cours'/f'{ident}.json').read_text())
 incoming=p/'input.json';incoming.write_text(json.dumps({'template':template,'inspection':inspection}));out=p/'output.json'
 subprocess.run(['node',str(app/'tests/codec.test.cjs'),str(incoming),str(out)],check=True)
 for obj in json.loads(out.read_text()):
  r=obj['record'];dest=shared/('Controles_valides' if r['status']=='validated' else 'Controles_en_cours')/(r['id']+'.json');dest.write_text(json.dumps(obj,ensure_ascii=False))
 (shared/'Controles_en_cours'/f'{ident}.json').unlink()
 result=w.sync_all();assert not result['errors'] and not result['conflicts'],result
 with w.conn() as c:
  rows=c.execute('SELECT * FROM inspections ORDER BY id').fetchall();assert len(rows)==2
  for r in rows:
   assert r['control_date']=='2026-10-30' and r['accompanying_agents']=='Agent A, Agent B' and r['collaboration_with']=='Équipe sécurité'
   a=json.loads(r['answers']);assert [a[f'point{n}']['choice'] for n in range(4)]==['C','NC','SO','NV'];assert a['point0']['details']==[0];assert 'électricité' in a['point0']['comment'];assert json.loads(r['template_snapshot'])==f
  assert next(r for r in rows if r['id']==ident)['status']=='validated'
 print('Windows réel → PWA → Windows : fiche, contrôle existant validé et nouveau contrôle OK ; aucun conflit.')
 print('SHA-256 server.py :',hashlib.sha256(source.read_bytes()).hexdigest())
