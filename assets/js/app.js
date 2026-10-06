/* ===== Portofolio akademik — SPA statis (hash routing) ===== */
const $=(s,r=document)=>r.querySelector(s), app=$('#app');
/* B = awalan path ('' untuk index.html, '../' untuk /pages). H() membuat link antarhalaman */
const B=document.body.dataset.base||'', H=(p,q='')=>p=='home'?`${B}index.html`:`${B}pages/${p}.html${q}`;
let lang=localStorage.lang||'id', D={}, charts=[], live=false;
/* Teks antarmuka dwibahasa. Isi data bilingual: {"id":"..","en":".."} */
const UI={id:{home:'Beranda',profil:'Profil',penelitian:'Penelitian',pengabdian:'Pengabdian',bimbingan:'Bimbingan',kuliah:'Perkuliahan',ebook:'Ebook',proyek:'Proyek',kontak:'Kontak',cv:'Unduh CV',hubungi:'Hubungi',pub:'Publikasi',mhs:'Mahasiswa bimbingan',prj:'Proyek',search:'Cari…',all:'Semua',baca:'Baca',unduh:'Unduh PDF',fail:'Data belum bisa dimuat. Menampilkan data lokal.',upd:'Terakhir diperbarui',src:'Sumber',sheet:'Google Sheets',local:'data lokal',meet:'Pertemuan',topic:'Topik',read:'Bacaan',task:'Tugas',send:'Kirim pesan',year:'Tahun',type:'Jenis',back:'Kembali',empty:'Tidak ada data yang cocok.'},
 en:{home:'Home',profil:'Profile',penelitian:'Research',pengabdian:'Community service',bimbingan:'Supervision',kuliah:'Teaching',ebook:'Ebooks',proyek:'Projects',kontak:'Contact',cv:'Download CV',hubungi:'Contact me',pub:'Publications',mhs:'Supervised students',prj:'Projects',search:'Search…',all:'All',baca:'Read',unduh:'Download PDF',fail:'Data could not be loaded. Showing local data.',upd:'Last updated',src:'Source',sheet:'Google Sheets',local:'local data',meet:'Session',topic:'Topic',read:'Reading',task:'Assignment',send:'Send message',year:'Year',type:'Type',back:'Back',empty:'No matching data.'}};
/* Gambar: URL penuh dipakai apa adanya; path relatif (mis. assets/img/foto.jpg) otomatis diberi awalan folder */
const img=x=>/^(https?:|data:|\/\/)/i.test(x)?x:B+x;
/* DOI: terima "10.xxxx/abc" atau URL penuh */
const doiUrl=d=>!d?'':/^https?:/i.test(d)?d:'https://doi.org/'+String(d).replace(/^doi:\s*/i,'').trim();
/* Slide dari Google Slides (publish to web / link berbagi) atau PDF Google Drive -> URL embed */
const slideSrc=x=>{x=String(x||'');let m;
 if(m=x.match(/docs\.google\.com\/presentation\/d\/e\/([^/]+)/))return `https://docs.google.com/presentation/d/e/${m[1]}/embed?start=false&loop=false&delayms=60000`;
 if(m=x.match(/docs\.google\.com\/presentation\/d\/([^/]+)/))return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000`;
 if(m=x.match(/drive\.google\.com\/file\/d\/([^/?]+)/)||x.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([^&]+)/))return `https://drive.google.com/file/d/${m[1]}/preview`;
 return x};
/* Tab matakuliah = 1 baris per mata kuliah (kolom x_en = terjemahan Inggris, opsional).
   Kolom data_url = link CSV tab pertemuan milik mata kuliah itu; baru diambil saat halamannya dibuka. */
const bi=(r,k)=>({id:r[k],en:r[k+'_en']||r[k]});
function build(){D.mk=D.matakuliah.map(c=>{const e=String(c.cpmk_en||'').split(';');return {...c,nama:bi(c,'nama'),deskripsi:bi(c,'deskripsi'),
 cpmk:String(c.cpmk||'').split(';').map((x,i)=>({id:x.trim(),en:(e[i]||x).trim()})).filter(x=>x.id)}})}
async function loadMeet(c){if(c.pertemuan)return;let rows=null;
 if(c.data_url&&!String(c.data_url).includes('DUMMY')){try{const r=await fetch(c.data_url);if(r.ok)rows=csv(await r.text())}catch(e){}}
 if(!rows)rows=(D.materi||[]).filter(p=>p.mk==c.id); /* tab materi: kolom mk, no, topik, slide */
 c.pertemuan=rows.filter(p=>p.no!==''&&p.no!=null).sort((a,b)=>a.no-b.no).map(p=>({...p,topik:bi(p,'topik')}))}
const u=k=>UI[lang][k]||k, t=o=>o&&typeof o==='object'?(o[lang]||o.id):o;
const cv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---- Pemuat data: Google Sheets (CSV) -> fallback JSON lokal ---- */
function csv(txt){const rows=[];let r=[''],q=false;for(const c of txt){if(c=='"')q=!q;else if(c==','&&!q)r.push('');else if(c=='\n'&&!q){rows.push(r);r=['']}else if(c!='\r')r[r.length-1]+=c}
 if(r.join(''))rows.push(r);const h=rows.shift();return rows.map(x=>Object.fromEntries(h.map((k,i)=>[k.trim(),/^-?\d+(\.\d+)?$/.test(x[i])?+x[i]:x[i]])))}
async function load(n){const url=(D.site?.sheets||{})[n];
 if(url&&!url.includes('DUMMY')){try{const r=await fetch(url);if(r.ok){live=true;return csv(await r.text())}}catch(e){}}
 return (await fetch(`${B}data/${n}.json`)).json()}
async function init(){app.innerHTML='<div class="sk"></div>'.repeat(4);
 D.site=await (await fetch(B+'data/site.json')).json();
 for(const n of['publikasi','hibah','pengabdian','bimbingan','matakuliah','materi','ebook','proyek'])D[n]=await load(n).catch(()=>[]);
 build();chrome();route()}

/* ---- Grafik (warna mengikuti tema) ---- */
const count=(a,k)=>a.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
function chart(id,type,labels,sets,title){const c=document.getElementById(id);if(!c)return;
 const rd=type=='doughnut'||type=='pie',pal=['#F28C28','#3B82C4','#1FA8A0','#8A6FD1','#E2556B','#E2B93B','#7C8DA6'],ink=cv('--ink'),line=cv('--line');
 charts.push(new Chart(c,{type,data:{labels,datasets:sets.map((s,i)=>({label:s.label,data:s.data,backgroundColor:type=='line'?pal[i]:(rd?pal:pal[i]),borderColor:pal[i],tension:.3}))},
 options:{maintainAspectRatio:false,plugins:{title:{display:true,text:title,color:ink},legend:{labels:{color:ink}}},
 scales:rd?{}:{x:{ticks:{color:ink},grid:{color:line},stacked:sets.stacked},y:{ticks:{color:ink},grid:{color:line},stacked:sets.stacked}}}}))}
const years=a=>[...new Set(a.map(x=>x.tahun))].sort();
const perYear=(a,y)=>y.map(v=>a.filter(x=>x.tahun==v).length);
const box=(id)=>`<div class="card"><canvas id="${id}" role="img" aria-label="${id}"></canvas></div>`;

/* ---- Tampilan ---- */
const nav=['profil','penelitian','pengabdian','bimbingan','kuliah','ebook','proyek','kontak'];
const links=o=>Object.entries(o).map(([k,v])=>`<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`).join('');
const stamp=()=>`<p class="muted">${u('upd')}: ${D.site.updated} · ${u('src')}: ${live?u('sheet'):u('local')}</p>`;
const V={
 home(){const s=D.site,st=[[D.publikasi.length,'pub'],[D.bimbingan.length,'mhs'],[D.proyek.length,'prj']];
  return `<section class="hero"><div><span class="role">${t(s.jabatan)} · ${s.afiliasi}</span><h1>${s.nama}</h1><p>${t(s.ringkas)}</p>
  <a class="btn" href="${H('kontak')}">${u('hubungi')}</a></div>
  <div class="photo" role="img" aria-label="Foto ${s.nama}" style="background-image:url(${img(s.foto)})"></div>
  <svg class="seismo" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35H180l10-10 12 22 14-36 16 52 14-46 12 30 10-12H520l8-8 10 16 12-28 14 40 10-22 8 8H1000"/></svg></section>
  <div class="stats">${st.map(([n,k])=>`<div class="stat"><b data-n="${n}">0</b>${u(k)}</div>`).join('')}</div>
  <p>${(s.keahlian||[]).map(k=>`<span class="chip">${t(k)}</span>`).join('')}</p>`},
 profil(){const s=D.site;return `<h1>${u('profil')}</h1><p>${t(s.bio)}</p><h2>${lang=='id'?'Pendidikan':'Education'}</h2>${s.pendidikan.map(e=>`<div class="item"><b>${e.jenjang}</b> — ${e.kampus} <span class="muted">${e.tahun}</span></div>`).join('')}<h2>Link</h2>${links(s.links)}`},
 penelitian(){return `<h1>${u('penelitian')}</h1>${stamp()}<div class="charts">${box('c1')}${box('c2')}${box('c3')}${box('c4')}</div>
  <h2>${lang=='id'?'Kata kunci':'Keywords'}</h2><div class="cloud" id="cloud"></div><p id="sum" class="muted"></p>
  <div class="tools"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="ft" aria-label="${u('type')}"></select><select id="fp" aria-label="Peran"></select><select id="fq" aria-label="Peringkat"></select></div><div id="list"></div><h2>Hibah</h2>${D.hibah.map(h=>`<div class="item"><b>${h.judul}</b><br><span class="muted">${h.skema} · ${h.tahun} · ${h.peran}</span></div>`).join('')}`},
 pengabdian(){return `<h1>${u('pengabdian')}</h1>${stamp()}<div class="charts">${box('c1')}${box('c2')}</div>
  <div class="tools"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="fb" aria-label="Bidang"></select></div><div id="list"></div>`},
 bimbingan(){return `<h1>${u('bimbingan')}</h1>${stamp()}<div class="charts">${box('c1')}</div>
  <div class="tools"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="fs" aria-label="Status"></select><select id="fj" aria-label="Level"></select></div><div id="list"></div>`},
 kuliah(id,m){const c=D.mk.find(x=>x.id==id);
  /* daftar mata kuliah: kartu bergaya "rak buku" seperti Ebook; kolom opsional gambar = URL gambar sampul */
  if(!c)return `<h1>${u('kuliah')}</h1><div class="grid">${D.mk.map(c=>`<a class="card course" href="${H('mata-kuliah','?id='+c.id)}"><div class="cover"${c.gambar?` style="background-image:linear-gradient(rgba(15,39,71,.45),rgba(15,39,71,.9)),url('${img(c.gambar)}');background-size:cover"`:''}><span><small>${c.kode}</small><br>${t(c.nama)}</span></div><p class="muted">${c.sks} SKS · Semester ${c.semester}</p><p>${t(c.deskripsi)}</p></a>`).join('')}</div>`;
  const p=m&&c.pertemuan.find(x=>x.no==m);
  /* navigasi pertemuan/topik di kiri, isi di kanan */
  const side=`<nav class="toc" aria-label="${u('meet')}"><a href="${H('perkuliahan')}">← ${u('kuliah')}</a><h3>${t(c.nama)}</h3><a class="${p?'':'on'}" href="${H('mata-kuliah','?id='+id)}">${lang=='id'?'Ringkasan':'Overview'}</a>${c.pertemuan.map(x=>`<a class="${p&&p.no==x.no?'on':''}" href="${H('pertemuan','?id='+id+'&p='+x.no)}">${x.no}. ${t(x.topik)}</a>`).join('')}</nav>`;
  if(p)return `<div class="book">${side}<section><h1>${u('meet')} ${p.no}</h1><h2>${t(p.topik)}</h2>${p.slide?`<div class="slide"><iframe src="${slideSrc(p.slide)}" title="Slide ${p.no}" allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe></div>`:`<p class="note">${lang=='id'?'Slide belum tersedia.':'Slides not available yet.'}</p>`}</section></div>`;
  return `<div class="book">${side}<section><h1>${t(c.nama)}</h1><p class="muted">${c.kode} · ${c.sks} SKS · Semester ${c.semester}</p><p>${t(c.deskripsi)}</p><h2>CPMK</h2><ul>${c.cpmk.map(x=>`<li>${t(x)}</li>`).join('')}</ul></section></div>`},
 ebook(id){const b=D.ebook.find(x=>x.id==id);
  if(!b)return `<h1>${u('ebook')}</h1><div class="grid">${D.ebook.map(b=>`<article class="card">${b.cover?`<div class="cover img" role="img" aria-label="${t(b.judul)}" style="background-image:url('${img(b.cover)}')"></div>`:`<div class="cover">${t(b.judul)}</div>`}<p>${t(b.deskripsi)}</p>${b.tag.map(x=>`<span class="chip">${x}</span>`).join('')}<p><a class="chip" href="${H('baca','?id='+b.id)}">${u('baca')}</a> <a class="chip" href="${b.pdf}">${u('unduh')}</a></p></article>`).join('')}</div>`;
  return `<p><a href="${H('ebook')}">← ${u('ebook')}</a></p><div class="book"><nav class="toc" id="toc" aria-label="TOC"></nav><article class="md" id="md"></article></div>`},
 proyek(){return `<h1>${u('proyek')}</h1><div class="grid">${D.proyek.map(p=>`<article class="card">${p.gambar?`<img class="thumb" src="${img(p.gambar)}" alt="${p.judul}" loading="lazy">`:''}<h3>${p.judul}</h3><p>${t(p.deskripsi)}</p>${p.teknologi.map(x=>`<span class="chip">${x}</span>`).join('')}<p><a href="${p.link}">Demo / Repo</a></p></article>`).join('')}</div>`},
 kontak(){const s=D.site;return `<h1>${u('kontak')}</h1><p>${s.email}<br>${s.alamat}<br>${t(s.konsultasi)}</p>
  <form action="https://api.web3forms.com/submit" method="POST"><input type="hidden" name="access_key" value="${s.web3forms}"><p><input name="name" placeholder="Nama / Name" required aria-label="Name"> <input name="email" type="email" placeholder="Email" required aria-label="Email"></p><p><textarea name="message" rows="5" required aria-label="Message"></textarea></p><button class="btn">${u('send')}</button></form>`}};

/* ---- Perilaku per halaman ---- */
const after={
 home(){document.querySelectorAll('[data-n]').forEach(e=>{const n=+e.dataset.n;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return e.textContent=n;let i=0;const f=()=>{i+=Math.max(1,n/40);e.textContent=Math.round(Math.min(i,n));if(i<n)requestAnimationFrame(f)};f()})},
 penelitian(){const P=D.publikasi,y=years(P);
  chart('c1','bar',y,[{label:u('pub'),data:perYear(P,y)}],u('pub'));
  const ty=count(P,'jenis');chart('c2','doughnut',Object.keys(ty),[{data:Object.values(ty)}],u('type'));
  /* pie kuartil (Q1-Q4) dan indeks SINTA (S1-S6); hanya publikasi yang kolomnya terisi */
  const pie=k=>{const m=count(P.filter(x=>x[k]),k),ks=Object.keys(m).sort();return [ks,ks.map(v=>m[v])]};
  const [qk,qv]=pie('kuartil'),[sk,sv]=pie('sinta');
  chart('c3','pie',qk,[{data:qv}],lang=='id'?'Kuartil jurnal (Scopus)':'Journal quartile (Scopus)');
  chart('c4','pie',sk,[{data:sv}],lang=='id'?'Indeks SINTA':'SINTA index');
  const fy=$('#fy'),ft=$('#ft'),fp=$('#fp'),fq=$('#fq'),pr=[...new Set(P.map(x=>x.peran).filter(Boolean))];
  fy.innerHTML=`<option value="">${u('year')}</option>`+y.map(v=>`<option>${v}</option>`).join('');ft.innerHTML=`<option value="">${u('type')}</option>`+Object.keys(ty).map(v=>`<option>${v}</option>`).join('');fp.innerHTML=`<option value="">${lang=='id'?'Peran':'Role'}</option>`+pr.map(v=>`<option>${v}</option>`).join('');
  /* kuartil (Q1-Q4) dan sinta (S1-S6) bersifat opsional */
  fq.innerHTML=`<option value="">${lang=='id'?'Peringkat':'Rank'}</option>`+[...new Set(P.flatMap(x=>[x.kuartil,x.sinta]).filter(Boolean))].sort().map(v=>`<option>${v}</option>`).join('');
  $('#sum').textContent=pr.map(v=>`${v}: ${P.filter(x=>x.peran==v).length}`).join(' · ');
  /* Word cloud kata kunci: dipisah titik koma (;), ukuran huruf mengikuti frekuensi, klik untuk memfilter */
  const kws=p=>(p.kata_kunci||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean),kc={};
  P.forEach(p=>kws(p).forEach(k=>{const l=k.toLowerCase();(kc[l]=kc[l]||{k,n:0}).n++}));
  const ks=Object.values(kc).sort((a,b)=>b.n-a.n||a.k.localeCompare(b.k)),mx=ks.length?ks[0].n:1,mn=ks.length?ks[ks.length-1].n:1;let kw='';
  const cloud=()=>{$('#cloud').innerHTML=ks.map(o=>{const on=kw==o.k.toLowerCase();return `<button type="button" class="${on?'on':''}" aria-pressed="${on}" style="font-size:${(0.85+(mx==mn?.4:(o.n-mn)/(mx-mn))*1.5).toFixed(2)}rem">${o.k}<sup>${o.n}</sup></button>`}).join('')};
  const go=()=>{const q=$('#q').value.toLowerCase(),r=P.filter(p=>(!fy.value||p.tahun==fy.value)&&(!ft.value||p.jenis==ft.value)&&(!fp.value||p.peran==fp.value)&&(!fq.value||p.kuartil==fq.value||p.sinta==fq.value)&&(!kw||kws(p).some(k=>k.toLowerCase()==kw))&&(p.judul+p.kata_kunci).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(p=>`<div class="item"><b>${p.doi?`<a href="${doiUrl(p.doi)}" target="_blank" rel="noopener">${p.judul} ↗</a>`:p.judul}</b><br><span class="muted">${p.penulis} · ${p.jurnal} · ${p.tahun}</span> <span class="chip">${p.jenis}</span>${p.peran?`<span class="chip ${p.peran=='Penulis pertama'?'first':''}">${p.peran}</span>`:''}${p.kuartil?`<span class="chip rank">${p.kuartil}</span>`:''}${p.sinta?`<span class="chip rank">${p.sinta}</span>`:''}</div>`).join('')||`<p class="note">${u('empty')}</p>`};
  $('#cloud').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.firstChild.textContent.toLowerCase();kw=kw==k?'':k;cloud();go()};
  ['q','fy','ft','fp','fq'].forEach(i=>$('#'+i).oninput=go);cloud();go()},
 pengabdian(){const P=D.pengabdian,y=years(P),b=count(P,'bidang');chart('c1','bar',y,[{label:'#',data:perYear(P,y)}],u('pengabdian'));chart('c2','doughnut',Object.keys(b),[{data:Object.values(b)}],'Bidang');
  const opt=(ph,a)=>`<option value="">${ph}</option>`+a.map(v=>`<option>${v}</option>`).join('');$('#fy').innerHTML=opt(u('year'),y);$('#fb').innerHTML=opt('Bidang',Object.keys(b));
  const go=()=>{const q=$('#q').value.toLowerCase(),r=P.filter(p=>(!$('#fy').value||p.tahun==$('#fy').value)&&(!$('#fb').value||p.bidang==$('#fb').value)&&(p.judul+p.mitra+p.lokasi).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(p=>`<div class="item"><b>${p.judul}</b><br><span class="muted">${p.mitra} · ${p.lokasi} · ${p.tahun}</span> <span class="chip">${p.bidang}</span></div>`).join('')||`<p class="note">${u('empty')}</p>`};
  ['q','fy','fb'].forEach(i=>$('#'+i).oninput=go);go()},
 bimbingan(){const M=D.bimbingan,y=years(M),st=[...new Set(M.map(x=>x.status))],js=[...new Set(M.map(x=>x.jenjang))].sort();
  const sets=st.map(v=>({label:v,data:y.map(a=>M.filter(x=>x.tahun==a&&x.status==v).length)}));sets.stacked=true;chart('c1','bar',y,sets,'Status / '+u('year'));
  const opt=(ph,a)=>`<option value="">${ph}</option>`+a.map(v=>`<option>${v}</option>`).join('');
  $('#fy').innerHTML=opt(u('year'),y);$('#fs').innerHTML=opt('Status',st);$('#fj').innerHTML=opt(lang=='id'?'Jenjang':'Level',js);
  /* tandem1_* dan tandem2_* = pembimbing pendamping (maks. 2, institusi boleh berbeda) */
  const tandem=b=>[1,2].filter(n=>b['tandem'+n+'_nama']).map(n=>`${b['tandem'+n+'_nama']}${b['tandem'+n+'_institusi']?' ('+b['tandem'+n+'_institusi']+')':''}`).join('; ');
  const go=()=>{const q=$('#q').value.toLowerCase(),r=M.filter(b=>(!$('#fy').value||b.tahun==$('#fy').value)&&(!$('#fs').value||b.status==$('#fs').value)&&(!$('#fj').value||b.jenjang==$('#fj').value)&&(b.nama+b.topik).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(b=>{const t2=tandem(b);return `<div class="item"><b>${b.jenjang} · ${b.nama} · ${b.jenis} · ${b.tahun}</b> <span class="chip">${b.status}</span><br>${b.topik}${t2?`<br><span class="muted">${lang=='id'?'Pembimbing tandem':'Co-supervisors'}: ${t2}</span>`:''}</div>`}).join('')||`<p class="note">${u('empty')}</p>`};
  ['q','fy','fs','fj'].forEach(i=>$('#'+i).oninput=go);go()},
 async ebook(id){const b=D.ebook.find(x=>x.id==id);if(!b)return;
  const md=window.markdownit({html:false,highlight:(c,l)=>l&&hljs.getLanguage(l)?hljs.highlight(c,{language:l}).value:''});
  const el=$('#md');el.innerHTML=md.render(await (await fetch(B+b.file)).text());
  const toc=$('#toc');el.querySelectorAll('h2,h3').forEach((h,i)=>{h.id='b'+i;toc.insertAdjacentHTML('beforeend',`<a href="javascript:document.getElementById('b${i}').scrollIntoView()">${h.textContent}</a>`)});
  renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]})}};

/* ---- Router, tema, bahasa ---- */
function chrome(){$('#menu').innerHTML=nav.map(k=>`<li><a data-k="${k}" href="${H(k=='kuliah'?'perkuliahan':k)}">${u(k)}</a></li>`).join('');
 $('#lang').textContent=lang=='id'?'EN':'ID';document.documentElement.lang=lang;$('#foot').textContent=`© ${new Date().getFullYear()} ${D.site.nama} · ${D.site.afiliasi}`}
/* Setiap file HTML punya <body data-page="..."> yang menentukan tampilan; parameter ?id= dan ?p= dibaca dari URL */
async function route(){charts.forEach(c=>c.destroy());charts=[];const q=new URLSearchParams(location.search),pg=document.body.dataset.page||'home',
 k={perkuliahan:'kuliah','mata-kuliah':'kuliah',pertemuan:'kuliah',baca:'ebook'}[pg]||pg,a=q.get('id'),b=q.get('p');
 if(k=='kuliah'&&a){const c=D.mk.find(x=>x.id==a);if(c){app.innerHTML='<div class="sk"></div>'.repeat(3);await loadMeet(c)}}
 app.innerHTML=V[k](a,b);document.querySelectorAll('#menu a').forEach(l=>l.classList.toggle('on',l.dataset.k==k));
 $('#menu').classList.remove('open');if(after[k])await after[k](a)}

$('#theme').onclick=()=>{const n=document.documentElement.dataset.theme=='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.theme=n;route()};
$('#lang').onclick=()=>{lang=lang=='id'?'en':'id';localStorage.lang=lang;chrome();route()};
$('#burger').onclick=e=>{const o=$('#menu').classList.toggle('open');e.target.setAttribute('aria-expanded',o)};
init().catch(()=>app.innerHTML=`<p class="note">${u('fail')}</p>`);
