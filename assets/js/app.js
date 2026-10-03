/* ===== Portofolio akademik — SPA statis (hash routing) ===== */
const $=(s,r=document)=>r.querySelector(s), app=$('#app');
/* B = awalan path ('' untuk index.html, '../' untuk /pages). H() membuat link antarhalaman */
const B=document.body.dataset.base||'', H=(p,q='')=>p=='home'?`${B}index.html`:`${B}pages/${p}.html${q}`;
let lang=localStorage.lang||'id', D={}, charts=[], live=false;
/* Teks antarmuka dwibahasa. Isi data bilingual: {"id":"..","en":".."} */
const UI={id:{home:'Beranda',profil:'Profil',penelitian:'Penelitian',pengabdian:'Pengabdian',bimbingan:'Bimbingan',kuliah:'Perkuliahan',ebook:'Ebook',proyek:'Proyek',kontak:'Kontak',cv:'Unduh CV',hubungi:'Hubungi',pub:'Publikasi',cit:'Sitasi',h:'h-index',mhs:'Mahasiswa bimbingan',prj:'Proyek',search:'Cari…',all:'Semua',baca:'Baca',unduh:'Unduh PDF',fail:'Data belum bisa dimuat. Menampilkan data lokal.',upd:'Terakhir diperbarui',src:'Sumber',sheet:'Google Sheets',local:'data lokal',meet:'Pertemuan',topic:'Topik',read:'Bacaan',task:'Tugas',send:'Kirim pesan',year:'Tahun',type:'Jenis',back:'Kembali',empty:'Tidak ada data yang cocok.'},
 en:{home:'Home',profil:'Profile',penelitian:'Research',pengabdian:'Community service',bimbingan:'Supervision',kuliah:'Teaching',ebook:'Ebooks',proyek:'Projects',kontak:'Contact',cv:'Download CV',hubungi:'Contact me',pub:'Publications',cit:'Citations',h:'h-index',mhs:'Supervised students',prj:'Projects',search:'Search…',all:'All',baca:'Read',unduh:'Download PDF',fail:'Data could not be loaded. Showing local data.',upd:'Last updated',src:'Source',sheet:'Google Sheets',local:'local data',meet:'Session',topic:'Topic',read:'Reading',task:'Assignment',send:'Send message',year:'Year',type:'Type',back:'Back',empty:'No matching data.'}};
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
 for(const n of['publikasi','hibah','pengabdian','bimbingan','matakuliah','ebook','proyek'])D[n]=await load(n).catch(()=>[]);
 chrome();route()}

/* ---- Grafik (warna mengikuti tema) ---- */
const count=(a,k)=>a.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
function chart(id,type,labels,sets,title){const c=document.getElementById(id);if(!c)return;
 const pal=['#F28C28','#3B82C4','#1FA8A0','#8A6FD1','#E2556B'],ink=cv('--ink'),line=cv('--line');
 charts.push(new Chart(c,{type,data:{labels,datasets:sets.map((s,i)=>({label:s.label,data:s.data,backgroundColor:type=='line'?pal[i]:(type=='doughnut'?pal:pal[i]),borderColor:pal[i],tension:.3}))},
 options:{maintainAspectRatio:false,plugins:{title:{display:true,text:title,color:ink},legend:{labels:{color:ink}}},
 scales:type=='doughnut'?{}:{x:{ticks:{color:ink},grid:{color:line},stacked:sets.stacked},y:{ticks:{color:ink},grid:{color:line},stacked:sets.stacked}}}}))}
const years=a=>[...new Set(a.map(x=>x.tahun))].sort();
const perYear=(a,y)=>y.map(v=>a.filter(x=>x.tahun==v).length);
const box=(id)=>`<div class="card"><canvas id="${id}" role="img" aria-label="${id}"></canvas></div>`;

/* ---- Tampilan ---- */
const nav=['profil','penelitian','pengabdian','bimbingan','kuliah','ebook','proyek','kontak'];
const links=o=>Object.entries(o).map(([k,v])=>`<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`).join('');
const stamp=()=>`<p class="muted">${u('upd')}: ${D.site.updated} · ${u('src')}: ${live?u('sheet'):u('local')}</p>`;
const V={
 home(){const s=D.site,st=[[D.publikasi.length,'pub'],[s.stats.sitasi,'cit'],[s.stats.hindex,'h'],[D.bimbingan.length,'mhs'],[D.proyek.length,'prj']];
  return `<section class="hero"><div><span class="role">${t(s.jabatan)} · ${s.afiliasi}</span><h1>${s.nama}</h1><p>${t(s.ringkas)}</p>
  <a class="btn" href="${s.cv}">${u('cv')}</a><a class="btn alt" href="${H('kontak')}">${u('hubungi')}</a></div>
  <div class="photo" role="img" aria-label="Foto ${s.nama}" style="background-image:url(${s.foto})"></div>
  <svg class="seismo" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35H180l10-10 12 22 14-36 16 52 14-46 12 30 10-12H520l8-8 10 16 12-28 14 40 10-22 8 8H1000"/></svg></section>
  <div class="stats">${st.map(([n,k])=>`<div class="stat"><b data-n="${n}">0</b>${u(k)}</div>`).join('')}</div>
  <p>${(s.keahlian||[]).map(k=>`<span class="chip">${t(k)}</span>`).join('')}</p>`},
 profil(){const s=D.site;return `<h1>${u('profil')}</h1><p>${t(s.bio)}</p><h2>${lang=='id'?'Pendidikan':'Education'}</h2>${s.pendidikan.map(e=>`<div class="item"><b>${e.jenjang}</b> — ${e.kampus} <span class="muted">${e.tahun}</span></div>`).join('')}<h2>Link</h2>${links(s.links)}`},
 penelitian(){return `<h1>${u('penelitian')}</h1>${stamp()}<div class="charts">${box('c1')}${box('c2')}${box('c3')}${box('c4')}</div>
  <div class="tools"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="ft" aria-label="${u('type')}"></select></div><div id="list"></div><h2>Hibah</h2>${D.hibah.map(h=>`<div class="item"><b>${h.judul}</b><br><span class="muted">${h.skema} · ${h.tahun} · Rp ${(+h.dana).toLocaleString('id-ID')}</span></div>`).join('')}`},
 pengabdian(){return `<h1>${u('pengabdian')}</h1>${stamp()}<div class="charts">${box('c1')}${box('c2')}</div><div class="grid">${D.pengabdian.map(p=>`<article class="card"><h3>${p.judul}</h3><p class="muted">${p.mitra} · ${p.lokasi} · ${p.tahun}</p><span class="chip">${p.bidang}</span></article>`).join('')}</div>`},
 bimbingan(){return `<h1>${u('bimbingan')}</h1>${stamp()}<div class="charts">${box('c1')}${box('c2')}</div>${D.bimbingan.map(b=>`<div class="item"><b>${b.topik}</b><br><span class="muted">${b.nama} · ${b.jenjang} · ${b.tahun}</span> <span class="chip">${b.status}</span></div>`).join('')}`},
 kuliah(id,m){const c=D.matakuliah.find(x=>x.id==id);
  if(!c)return `<h1>${u('kuliah')}</h1><div class="grid">${D.matakuliah.map(c=>`<a class="card" href="${H('mata-kuliah','?id='+c.id)}"><h3>${t(c.nama)}</h3><p class="muted">${c.kode} · ${c.sks} SKS · ${lang=='id'?'Semester':'Semester'} ${c.semester}</p><p>${t(c.deskripsi)}</p></a>`).join('')}</div>`;
  const p=c.pertemuan[m-1];if(p)return `<p><a href="${H('mata-kuliah','?id='+id)}">← ${t(c.nama)}</a></p><h1>${u('meet')} ${m}</h1><h2>${t(p.topik)}</h2>${p.slide?`<p><a href="${p.slide}">Slide</a>${p.video?` · <a href="${p.video}">Video</a>`:''}</p>`:''}<p><b>${u('read')}:</b> ${t(p.bacaan)}</p><p><b>${u('task')}:</b> ${t(p.tugas)}</p>`;
  return `<p><a href="${H('perkuliahan')}">← ${u('kuliah')}</a></p><h1>${t(c.nama)}</h1><p class="muted">${c.kode} · ${c.sks} SKS</p><p>${t(c.deskripsi)}</p><h2>CPMK</h2><ul>${c.cpmk.map(x=>`<li>${t(x)}</li>`).join('')}</ul><h2>${u('meet')}</h2>${c.pertemuan.map((p,i)=>`<div class="item"><a href="${H('pertemuan','?id='+id+'&p='+(i+1))}">${i+1}. ${t(p.topik)}</a></div>`).join('')}`},
 ebook(id){const b=D.ebook.find(x=>x.id==id);
  if(!b)return `<h1>${u('ebook')}</h1><div class="grid">${D.ebook.map(b=>`<article class="card"><div class="cover">${t(b.judul)}</div><p>${t(b.deskripsi)}</p>${b.tag.map(x=>`<span class="chip">${x}</span>`).join('')}<p><a class="chip" href="${H('baca','?id='+b.id)}">${u('baca')}</a> <a class="chip" href="${b.pdf}">${u('unduh')}</a></p></article>`).join('')}</div>`;
  return `<p><a href="${H('ebook')}">← ${u('ebook')}</a></p><div class="book"><nav class="toc" id="toc" aria-label="TOC"></nav><article class="md" id="md"></article></div>`},
 proyek(){return `<h1>${u('proyek')}</h1><div class="grid">${D.proyek.map(p=>`<article class="card"><h3>${p.judul}</h3><p>${t(p.deskripsi)}</p>${p.teknologi.map(x=>`<span class="chip">${x}</span>`).join('')}<p><a href="${p.link}">Demo / Repo</a></p></article>`).join('')}</div>`},
 kontak(){const s=D.site;return `<h1>${u('kontak')}</h1><p>${s.email}<br>${s.alamat}<br>${t(s.konsultasi)}</p>
  <form action="https://api.web3forms.com/submit" method="POST"><input type="hidden" name="access_key" value="${s.web3forms}"><p><input name="name" placeholder="Nama / Name" required aria-label="Name"> <input name="email" type="email" placeholder="Email" required aria-label="Email"></p><p><textarea name="message" rows="5" required aria-label="Message"></textarea></p><button class="btn">${u('send')}</button></form>`}};

/* ---- Perilaku per halaman ---- */
const after={
 home(){document.querySelectorAll('[data-n]').forEach(e=>{const n=+e.dataset.n;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return e.textContent=n;let i=0;const f=()=>{i+=Math.max(1,n/40);e.textContent=Math.round(Math.min(i,n));if(i<n)requestAnimationFrame(f)};f()})},
 penelitian(){const P=D.publikasi,y=years(P);
  chart('c1','bar',y,[{label:u('pub'),data:perYear(P,y)}],u('pub'));
  const ty=count(P,'jenis');chart('c2','doughnut',Object.keys(ty),[{data:Object.values(ty)}],u('type'));
  const cy=years(D.publikasi);chart('c3','line',cy,[{label:u('cit'),data:cy.map(v=>P.filter(x=>x.tahun==v).reduce((a,x)=>a+(+x.sitasi||0),0))}],u('cit'));
  const hy=years(D.hibah);chart('c4','bar',hy,[{label:'Rp (juta)',data:hy.map(v=>D.hibah.filter(x=>x.tahun==v).reduce((a,x)=>a+x.dana/1e6,0))}],'Hibah');
  const fy=$('#fy'),ft=$('#ft');fy.innerHTML=`<option value="">${u('year')}</option>`+y.map(v=>`<option>${v}</option>`).join('');ft.innerHTML=`<option value="">${u('type')}</option>`+Object.keys(ty).map(v=>`<option>${v}</option>`).join('');
  const go=()=>{const q=$('#q').value.toLowerCase(),r=P.filter(p=>(!fy.value||p.tahun==fy.value)&&(!ft.value||p.jenis==ft.value)&&(p.judul+p.kata_kunci).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(p=>`<div class="item"><b>${p.judul}</b><br><span class="muted">${p.penulis} · ${p.jurnal} · ${p.tahun}</span> <span class="chip">${p.jenis}</span></div>`).join('')||`<p class="note">${u('empty')}</p>`};
  ['q','fy','ft'].forEach(i=>$('#'+i).oninput=go);go()},
 pengabdian(){const P=D.pengabdian,y=years(P),b=count(P,'bidang');chart('c1','bar',y,[{label:'#',data:perYear(P,y)}],u('pengabdian'));chart('c2','doughnut',Object.keys(b),[{data:Object.values(b)}],'Bidang')},
 bimbingan(){const B=D.bimbingan,y=years(B),st=[...new Set(B.map(x=>x.status))],s=st.map(v=>({label:v,data:y.map(a=>B.filter(x=>x.tahun==a&&x.status==v).length)}));s.stacked=true;
  chart('c1','bar',y,s,'Status / '+u('year'));const j=count(B,'jenjang');chart('c2','doughnut',Object.keys(j),[{data:Object.values(j)}],'Jenjang')},
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
 app.innerHTML=V[k](a,b);document.querySelectorAll('#menu a').forEach(l=>l.classList.toggle('on',l.dataset.k==k));
 $('#menu').classList.remove('open');if(after[k])await after[k](a)}

$('#theme').onclick=()=>{const n=document.documentElement.dataset.theme=='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.theme=n;route()};
$('#lang').onclick=()=>{lang=lang=='id'?'en':'id';localStorage.lang=lang;chrome();route()};
$('#burger').onclick=e=>{const o=$('#menu').classList.toggle('open');e.target.setAttribute('aria-expanded',o)};
init().catch(()=>app.innerHTML=`<p class="note">${u('fail')}</p>`);
