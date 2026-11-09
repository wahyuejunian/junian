/* ===== Portofolio akademik — SPA statis (hash routing) ===== */
const $=(s,r=document)=>r.querySelector(s), app=$('#app');
/* B = awalan path ('' untuk index.html, '../' untuk /pages). H() membuat link antarhalaman */
const B=document.body.dataset.base||'', H=(p,q='')=>p=='home'?`${B}index.html`:`${B}pages/${p}.html${q}`;
let lang=localStorage.lang||'id', D={}, charts=[], live=false;
/* Teks antarmuka dwibahasa. Isi data bilingual: {"id":"..","en":".."} */
const UI={id:{home:'Beranda',profil:'Profil',penelitian:'Penelitian',pengabdian:'Pengabdian',bimbingan:'Bimbingan',kuliah:'Perkuliahan',ebook:'Catatan',proyek:'Pengalaman',kontak:'Kontak',cv:'Unduh CV',hubungi:'Hubungi',pub:'Publikasi',mhs:'Mahasiswa bimbingan',prj:'Pengalaman',search:'Cari…',all:'Semua',baca:'Baca',unduh:'Unduh PDF',fail:'Data belum bisa dimuat. Menampilkan data lokal.',upd:'Terakhir diperbarui',src:'Sumber',sheet:'Google Sheets',local:'data lokal',meet:'Pertemuan',topic:'Topik',read:'Bacaan',task:'Tugas',send:'Kirim pesan',year:'Tahun',type:'Jenis',back:'Kembali',empty:'Tidak ada data yang cocok.',doc:'Buka dokumen pendukung'},
 en:{home:'Home',profil:'Profile',penelitian:'Research',pengabdian:'Community service',bimbingan:'Supervision',kuliah:'Teaching',ebook:'Notes',proyek:'Experience',kontak:'Contact',cv:'Download CV',hubungi:'Contact me',pub:'Publications',mhs:'Supervised students',prj:'Experience',search:'Search…',all:'All',baca:'Read',unduh:'Download PDF',fail:'Data could not be loaded. Showing local data.',upd:'Last updated',src:'Source',sheet:'Google Sheets',local:'local data',meet:'Session',topic:'Topic',read:'Reading',task:'Assignment',send:'Send message',year:'Year',type:'Type',back:'Back',empty:'No matching data.',doc:'Open supporting document'}};
/* Gambar: URL penuh dipakai apa adanya; path relatif (mis. assets/img/foto.jpg) otomatis diberi awalan folder */
const img=x=>/^(https?:|data:|\/\/)/i.test(x)?x:B+x;
/* Slide dari Google Slides (publish to web / link berbagi) atau PDF Google Drive -> URL embed */
const slideSrc=x=>{x=String(x||'');let m;
 if(m=x.match(/docs\.google\.com\/presentation\/d\/e\/([^/]+)/))return `https://docs.google.com/presentation/d/e/${m[1]}/embed?start=false&loop=false&delayms=60000`;
 if(m=x.match(/docs\.google\.com\/presentation\/d\/([^/]+)/))return `https://docs.google.com/presentation/d/${m[1]}/embed?start=false&loop=false&delayms=60000`;
 if(m=x.match(/drive\.google\.com\/file\/d\/([^/?]+)/)||x.match(/drive\.google\.com\/(?:open|uc)\?(?:[^#]*&)?id=([^&]+)/))return `https://drive.google.com/file/d/${m[1]}/preview`;
 return x};
/* Tab matakuliah = 1 baris per mata kuliah (kolom x_en = terjemahan Inggris, opsional).
   Kolom data_url = link CSV tab pertemuan milik mata kuliah itu; baru diambil saat halamannya dibuka. */
/* Galat dari Sheets (#VALUE!, #N/A, ...) dianggap kosong supaya tidak tampil di halaman */
const okv=x=>x!=null&&x!==''&&!/^#(VALUE|N\/A|REF|NAME|ERROR|DIV)/i.test(String(x));
const bi=(r,k)=>({id:r[k],en:okv(r[k+'_en'])?r[k+'_en']:r[k]});
/* L = teks sesuai bahasa (kolom x dan x_en; x_en kosong -> pakai x). K = label pendek dari tab kamus (kategori, nilai).
   ext = judul yang menjadi tautan bila kolom tautan terisi (hanya http/https). pubRef = DOI atau URL artikel publikasi */
const L=(r,k,l=lang)=>(l=='en'&&okv(r[k+'_en'])?r[k+'_en']:r[k])??'';
const K=(c,v,l=lang)=>{const m=(D.kmap||{})[c+'|'+v];return m?(m[l]||m.id||v):v};
const safeUrl=x=>/^https?:\/\//i.test(String(x||'').trim())?String(x).trim():'';
const ext=(txt,url,arrow=1)=>{url=safeUrl(url);return url?`<a class="record-title" href="${esc(url)}" target="_blank" rel="noopener" title="${u('doc')}">${txt}${arrow?' <span aria-hidden="true">↗</span>':''}</a>`:txt};
const pubRef=p=>{const d=p.doi?String(p.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'').trim():'';return /^10\.\d{4,}\//.test(d)?{doi:d,url:'https://doi.org/'+d}:{doi:'',url:safeUrl(p.doi)||safeUrl(p.tautan)}};
function build(){D.mk=D.matakuliah.map(c=>{const e=String(okv(c.cpmk_en)?c.cpmk_en:'').split(';');return {...c,nama:bi(c,'nama'),deskripsi:bi(c,'deskripsi'),
 cpmk:String(c.cpmk||'').split(';').map((x,i)=>({id:x.trim(),en:(e[i]||x).trim()})).filter(x=>x.id)}});
 /* struktur lama tab pengalaman (status/instansi, atau peran sebagai kategori + kegiatan) tetap terbaca bila Sheets belum diperbarui */
 D.pengalaman=(D.pengalaman||[]).map(x=>x.kategori===undefined?{...x,kategori:x.peran??x.status,peran:'',judul:x.judul??x.kegiatan??x.instansi}:{...x,judul:x.judul??x.kegiatan});
 D.ebook=(D.ebook||[]).map(b=>({...b,judul:typeof b.judul=='object'?b.judul:bi(b,'judul'),deskripsi:typeof b.deskripsi=='object'?b.deskripsi:bi(b,'deskripsi')}))}
async function loadMeet(c){if(c.pertemuan)return;let rows=null;
 if(c.data_url&&!String(c.data_url).includes('DUMMY')){try{const r=await fetch(c.data_url);if(r.ok)rows=csv(await r.text())}catch(e){}}
 if(!rows)rows=(D.materi||[]).filter(p=>p.mk==c.id); /* tab materi: kolom mk, no, topik, slide */
 c.pertemuan=rows.filter(p=>p.no!==''&&p.no!=null).sort((a,b)=>a.no-b.no).map(p=>({...p,topik:bi(p,'topik')}))}
const u=k=>UI[lang][k]||k, t=o=>o&&typeof o==='object'?(o[lang]||o.id):o;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---- Pemuat data: Google Sheets (CSV) -> fallback JSON lokal ---- */
function csv(txt){const rows=[];let r=[''],q=false;for(const c of txt){if(c=='"')q=!q;else if(c==','&&!q)r.push('');else if(c=='\n'&&!q){rows.push(r);r=['']}else if(c!='\r')r[r.length-1]+=c}
 if(r.join(''))rows.push(r);const h=rows.shift();return rows.map(x=>Object.fromEntries(h.map((k,i)=>[k.trim(),/^-?\d+(\.\d+)?$/.test(x[i])?+x[i]:x[i]])))}
async function load(n){const url=(D.site?.sheets||{})[n];
 if(url&&!url.includes('DUMMY')){try{const r=await fetch(url);if(r.ok){live=true;return csv(await r.text())}}catch(e){}}
 return (await fetch(`${B}data/${n}.json`)).json()}
async function init(){app.innerHTML='<div class="sk"></div>'.repeat(4);
 D.site=await (await fetch(B+'data/site.json')).json();
 for(const n of['publikasi','hibah','pengabdian','bimbingan','matakuliah','materi','ebook','pengalaman','kamus'])D[n]=await load(n).catch(()=>[]);
 D.kmap=Object.fromEntries((D.kamus||[]).map(x=>[x.kategori+'|'+x.nilai,x]));
 /* Waktu edit terakhir: tab "info" di Sheets (kolom kunci, nilai; baris updated) diisi otomatis oleh Apps Script.
    Bila tab belum dipublikasikan atau gagal dimuat, dipakai tanggal manual "updated" di site.json */
 const inf=(D.site.sheets||{}).info;
 if(inf&&!String(inf).includes('DUMMY')){try{const r=await fetch(inf);if(r.ok){const w=csv(await r.text()).find(x=>x.kunci=='updated');if(w&&w.nilai)D.site.updated=String(w.nilai)}}catch(e){}}
 build();chrome();route()}

/* ---- Grafik (warna mengikuti tema) ---- */
const count=(a,k)=>a.reduce((m,x)=>(m[x[k]]=(m[x[k]]||0)+1,m),{});
function chart(id,type,labels,sets,title){const c=document.getElementById(id);if(!c)return;
 c.setAttribute('aria-label',title);
 const rd=type=='doughnut'||type=='pie',pal=['#F28C28','#3B82C4','#1FA8A0','#8A6FD1','#E2556B','#E2B93B','#7C8DA6'],ink=cv('--ink'),line=cv('--line');
 charts.push(new Chart(c,{type,data:{labels,datasets:sets.map((s,i)=>({label:s.label,data:s.data,backgroundColor:type=='line'?pal[i]:(rd?pal:pal[i]),borderColor:rd?cv('--card'):pal[i],borderWidth:rd?3:1,borderRadius:type=='bar'?7:0,borderSkipped:false,tension:.35,hoverOffset:rd?7:0}))},
 options:{maintainAspectRatio:false,interaction:{intersect:false,mode:'index'},plugins:{title:{display:true,text:title,color:ink,padding:{bottom:18},font:{family:'Bricolage Grotesque',size:15,weight:'700'}},legend:{display:rd||sets.length>1,position:'bottom',labels:{color:ink,usePointStyle:true,pointStyle:'circle',padding:16}},tooltip:{backgroundColor:'#0F2747',titleFont:{family:'Bricolage Grotesque'},bodyFont:{family:'Bricolage Grotesque'},padding:12,cornerRadius:9}},
 scales:rd?{}:{x:{ticks:{color:ink},grid:{display:false},stacked:sets.stacked},y:{beginAtZero:true,ticks:{color:ink,precision:0},grid:{color:line},stacked:sets.stacked}}}}))}
const years=a=>[...new Set(a.map(x=>x.tahun))].sort();
const perYear=(a,y)=>y.map(v=>a.filter(x=>x.tahun==v).length);
const box=(id)=>`<div class="card chart-card"><canvas id="${id}" role="img" aria-label="${id}"></canvas></div>`;

/* ---- Tampilan ---- */
const nav=['profil','penelitian','pengabdian','bimbingan','kuliah','ebook','proyek','kontak'];
const links=o=>Object.entries(o).map(([k,v])=>`<a class="chip" href="${v}" target="_blank" rel="noopener">${k}</a>`).join('');
/* Pengalaman: kategori Job = riwayat pekerjaan; kategori lain (Reviewer, Speaker, Committee, ...) = kegiatan akademik */
const JOB='Job',PJ={id:{job:'Riwayat pekerjaan',akad:'Kegiatan akademik',now:'sekarang',other:'Lainnya'},en:{job:'Employment history',akad:'Academic activities',now:'present',other:'Other'}};
const Kc=(v,l=lang)=>!v?PJ[l].other:(D.kmap||{})['kategori_pengalaman|'+v]?K('kategori_pengalaman',v,l):K('peran_pengalaman',v,l);
const period=(x,l=lang)=>{const a=x.tahun,b=x.selesai;return b&&String(b)!=String(a)?`${a} – ${b}`:x.kategori==JOB&&!b?`${a} – ${PJ[l].now}`:String(a)};
const jobCmp=(a,b)=>(b.selesai||9999)-(a.selesai||9999)||b.tahun-a.tahun;          /* yang masih berjalan dulu, lalu terbaru */
const actCmp=(a,b)=>(b.selesai||b.tahun)-(a.selesai||a.tahun)||b.tahun-a.tahun;
const catOrder=()=>Object.keys(D.kmap||{}).filter(k=>k.startsWith('kategori_pengalaman|')).map(k=>k.split('|')[1]);
const actCats=rows=>{const o=catOrder();return [...new Set(rows.filter(r=>r.kategori!=JOB).map(r=>r.kategori||''))].sort((a,b)=>(o.indexOf(a)+1||99)-(o.indexOf(b)+1||99))};
/* "2026-11-08" -> tanggal saja; "2026-11-08T14:30:12+07:00" -> tanggal + jam WIB */
const fmtUpd=x=>{x=String(x||'');const d=new Date(x);if(isNaN(d))return x;const loc=lang=='id'?'id-ID':'en-GB';
 return /^\d{4}-\d{2}-\d{2}$/.test(x)?d.toLocaleDateString(loc,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})
  :d.toLocaleString(loc,{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'})+' WIB'};
const stamp=()=>`<p class="muted">${u('upd')}: ${esc(fmtUpd(D.site.updated))} · ${u('src')}: ${live?u('sheet'):u('local')}</p>`;
const V={
home(){const s=D.site;
 return `<section class="hero"><div class="hero-copy"><span class="role">${esc(t(s.jabatan))} · ${esc(s.afiliasi)}</span><h1>${esc(s.nama)}</h1><p>${esc(t(s.ringkas))}</p>
 <div class="hero-actions"><a class="btn" href="${H('kontak')}">${u('hubungi')}</a><a class="btn alt" href="${H('profil')}">${u('profil')} <span aria-hidden="true">→</span></a><a class="btn alt" href="${H('cv')}">${u('cv')}</a></div></div>
 <div class="photo" role="img" aria-label="Foto ${esc(s.nama)}" style="background-image:url('${esc(img(s.foto))}')"><span>${lang=='id'?'Teknik Geofisika':'Geophysical Engineering'}</span></div>
 <svg class="seismo" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35H180l10-10 12 22 14-36 16 52 14-46 12 30 10-12H520l8-8 10 16 12-28 14 40 10-22 8 8H1000"/></svg></section>
 <section class="home-focus"><div><p class="eyebrow">${lang=='id'?'FOKUS KEAHLIAN':'AREAS OF FOCUS'}</p><div class="focus-strip">${(s.keahlian||[]).map(k=>`<span class="chip">${esc(t(k))}</span>`).join('')}</div></div><p>${esc(t(s.bio))}</p></section>`},
 profil(){const s=D.site;return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'TENTANG SAYA':'ABOUT ME'}</p><h1>${u('profil')}</h1></div><a class="btn" href="${H('cv')}">${u('cv')}</a></header><div class="profile-layout"><section class="profile-bio"><h2>${lang=='id'?'Profil akademik':'Academic profile'}</h2><p>${esc(t(s.bio))}</p><div class="profile-details"><div><span class="eyebrow">${lang=='id'?'AFILIASI':'AFFILIATION'}</span><b>${esc(s.afiliasi)}</b></div><div><span class="eyebrow">${lang=='id'?'LOKASI':'LOCATION'}</span><b>${esc(s.alamat)}</b></div><div><span class="eyebrow">EMAIL</span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></div></section><section class="profile-education"><h2>${lang=='id'?'Pendidikan':'Education'}</h2><ol class="education-list">${s.pendidikan.map(e=>`<li><span class="education-year">${esc(e.tahun)}</span><div><b>${esc(e.jenjang)}</b><p>${esc(e.kampus)}</p></div></li>`).join('')}</ol></section></div><section class="section-block"><h2 class="section-title">${lang=='id'?'Profil akademik & jejaring':'Academic profiles & networks'}</h2><div class="profile-links">${Object.entries(s.links).map(([k,v])=>`<a class="profile-link" href="${esc(v)}" target="_blank" rel="noopener"><span>${esc(k)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></section>`},
 penelitian(){return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'RISET & PUBLIKASI':'RESEARCH & PUBLICATIONS'}</p><h1>${u('penelitian')}</h1></div>${stamp()}</header><section class="section-block"><h2 class="section-title">${lang=='id'?'Ringkasan publikasi':'Publication overview'}</h2><div class="charts">${box('c1')}${box('c2')}${box('c3')}${box('c4')}</div></section>
  <section class="section-block"><h2 class="section-title">${lang=='id'?'Topik penelitian':'Research topics'}</h2><div class="cloud" id="cloud"></div><p id="sum" class="muted"></p></section>
  <section class="section-block"><h2 class="section-title">${lang=='id'?'Daftar publikasi':'Publications'}</h2><div class="tools filter-panel"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="ft" aria-label="${u('type')}"></select><select id="fp" aria-label="Peran"></select><select id="fq" aria-label="Peringkat"></select></div><div class="record-list" id="list"></div></section><section class="section-block"><h2 class="section-title">${lang=='id'?'Hibah penelitian':'Research grants'}</h2><div class="record-list">${D.hibah.map(h=>`<article class="record-card"><span class="record-year">${esc(h.tahun)}</span><div><h3>${ext(esc(L(h,'judul')),h.tautan)}</h3><p class="record-meta">${esc(K('skema_hibah',h.skema))} · ${esc(K('peran_hibah',h.peran))}</p></div></article>`).join('')}</div></section>`},
 pengabdian(){return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'DAMPAK & KOLABORASI':'IMPACT & COLLABORATION'}</p><h1>${u('pengabdian')}</h1></div>${stamp()}</header><section class="section-block"><h2 class="section-title">${lang=='id'?'Ringkasan kegiatan':'Activity overview'}</h2><div class="charts">${box('c1')}${box('c2')}</div></section>
  <section class="section-block"><h2 class="section-title">${lang=='id'?'Daftar kegiatan':'Activities'}</h2><div class="tools filter-panel"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="fb" aria-label="Bidang"></select></div><div class="record-list" id="list"></div></section>`},
 bimbingan(){return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'PENDIDIKAN & BIMBINGAN':'TEACHING & SUPERVISION'}</p><h1>${u('bimbingan')}</h1></div>${stamp()}</header><section class="section-block"><h2 class="section-title">${lang=='id'?'Perkembangan bimbingan':'Supervision overview'}</h2><div class="charts">${box('c1')}</div></section>
  <section class="section-block"><h2 class="section-title">${lang=='id'?'Daftar mahasiswa':'Students'}</h2><div class="tools filter-panel"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="fs" aria-label="Status"></select><select id="fj" aria-label="Level"></select></div><div class="record-list" id="list"></div></section>`},
 kuliah(id,m){const c=D.mk.find(x=>x.id==id);
  if(!c)return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'PENGAJARAN':'TEACHING'}</p><h1>${u('kuliah')}</h1><p class="page-intro">${lang=='id'?'Mata kuliah dan sumber belajar Teknik Geofisika.':'Courses and learning resources in Geophysical Engineering.'}</p></div></header><div class="course-grid">${D.mk.map(c=>`<a class="course-card" href="${H('mata-kuliah','?id='+encodeURIComponent(c.id))}"><div class="course-cover"${c.gambar?` style="background-image:linear-gradient(180deg,rgba(15,39,71,.08),rgba(15,39,71,.8)),url('${esc(img(c.gambar))}')"`:''}><span class="course-code">${esc(c.kode)}</span><span class="course-cover-title">${esc(t(c.nama))}</span></div><div class="course-body"><div class="course-meta"><span>${esc(c.sks)} SKS</span><span>${lang=='id'?'Semester':'Semester'} ${esc(c.semester)}</span></div><p>${esc(t(c.deskripsi)||'')}</p><span class="course-more">${lang=='id'?'Lihat mata kuliah':'View course'} <span aria-hidden="true">→</span></span></div></a>`).join('')}</div>`;
  const p=m&&c.pertemuan.find(x=>x.no==m);
  /* navigasi pertemuan/topik di kiri, isi di kanan */
  const side=`<nav class="toc course-toc" aria-label="${u('meet')}"><a class="toc-back" href="${H('perkuliahan')}">← ${u('kuliah')}</a><h3>${esc(t(c.nama))}</h3><a class="${p?'':'on'}" href="${H('mata-kuliah','?id='+encodeURIComponent(id))}">${lang=='id'?'Ringkasan':'Overview'}</a>${c.pertemuan.map(x=>`<a class="${p&&p.no==x.no?'on':''}" href="${H('pertemuan','?id='+encodeURIComponent(id)+'&p='+encodeURIComponent(x.no))}">${esc(x.no)}. ${esc(t(x.topik))}</a>`).join('')}</nav>`;
  if(p)return `<div class="book">${side}<section class="course-detail"><p class="eyebrow">${esc(c.kode)} · ${esc(u('meet'))} ${esc(p.no)}</p><h1>${esc(t(p.topik))}</h1>${p.slide?`<div class="slide"><iframe src="${esc(slideSrc(p.slide))}" title="Slide ${esc(p.no)}" allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe></div>`:`<p class="note">${lang=='id'?'Slide belum tersedia.':'Slides not available yet.'}</p>`}</section></div>`;
  return `<div class="book">${side}<section class="course-detail"><p class="eyebrow">${esc(c.kode)} · ${esc(c.sks)} SKS · ${lang=='id'?'Semester':'Semester'} ${esc(c.semester)}</p><h1>${esc(t(c.nama))}</h1><p class="course-description">${esc(t(c.deskripsi))}</p><h2>${lang=='id'?'Capaian pembelajaran':'Learning outcomes'}</h2><ol class="outcome-list">${c.cpmk.map(x=>`<li>${esc(t(x))}</li>`).join('')}</ol></section></div>`},
 ebook(id){const b=D.ebook.find(x=>x.id==id);
  if(!b)return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'MATERI & PEMBELAJARAN':'LEARNING RESOURCES'}</p><h1>${u('ebook')}</h1><p class="page-intro">${lang=='id'?'Catatan, modul, dan simulasi pembelajaran.':'Notes, modules, and learning simulations.'}</p></div></header><div class="tools filter-panel"><input id="note-q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"></div><div class="grid notes-grid" id="note-list">${D.ebook.map(b=>{const title=t(b.judul)||'',tags=Array.isArray(b.tag)?b.tag:String(b.tag||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean),cover=b.gambar||b.cover||'';return `<article class="card note-card" data-search="${esc([title,t(b.deskripsi),...tags].join(' ').toLowerCase())}">${cover?`<img class="note-cover" src="${esc(img(cover))}" alt="" loading="lazy">`:`<div class="note-cover note-cover-empty"><span>${esc(lang=='id'?'Catatan':'Notes')}</span></div>`}<div class="note-card-body"><div class="note-tags">${tags.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div><h2>${esc(title)}</h2><p>${esc(t(b.deskripsi)||'')}</p><a class="note-link" href="${H('baca','?id='+encodeURIComponent(b.id))}">${u('baca')} <span aria-hidden="true">→</span></a></div></article>`}).join('')}</div><p class="note" id="note-empty" hidden>${u('empty')}</p>`;
  const tags=Array.isArray(b.tag)?b.tag:String(b.tag||'').split(/[;,]/).map(x=>x.trim()).filter(Boolean),cover=b.gambar||b.cover||'';
  const heading=`<header class="note-detail-heading"><a class="back-link" href="${H('ebook')}">← ${lang=='id'?'Semua catatan':'All notes'}</a>${cover?`<img class="note-detail-cover" src="${esc(img(cover))}" alt="">`:''}<div class="note-detail-copy"><div class="note-tags">${tags.map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div><h1>${esc(t(b.judul))}</h1><p>${esc(t(b.deskripsi)||'')}</p>${b.pdf&&b.pdf!='#'?`<a class="btn" href="${esc(b.pdf)}" target="_blank" rel="noopener">${u('unduh')}</a>`:''}</div></header>`;
  if(b.tipe=='html')return `${heading}<div class="note-open-link"><a href="${esc(B+b.file)}" target="_blank" rel="noopener">${lang=='id'?'Buka layar penuh':'Open full screen'} ↗</a></div><iframe id="ebf" class="embed" src="${esc(B+b.file)}" title="${esc(t(b.judul))}"></iframe>`;
  return `${heading}<div class="book note-book"><nav class="toc" id="toc" aria-label="TOC"></nav><article class="md" id="md"></article></div>`},
 proyek(){return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'PERAN & KONTRIBUSI':'ROLES & CONTRIBUTIONS'}</p><h1>${u('proyek')}</h1></div>${stamp()}</header><section class="section-block"><h2 class="section-title">${lang=='id'?'Pekerjaan & kegiatan akademik':'Employment & academic activities'}</h2><div class="tools filter-panel"><input id="q" type="search" placeholder="${u('search')}" aria-label="${u('search')}"><select id="fy" aria-label="${u('year')}"></select><select id="fs" aria-label="${lang=='id'?'Peran':'Role'}"></select></div><div id="list"></div></section>`},
 kontak(){const s=D.site;return `<header class="page-heading"><div><p class="eyebrow">${lang=='id'?'MARI TERHUBUNG':'GET IN TOUCH'}</p><h1>${u('kontak')}</h1><p class="page-intro">${lang=='id'?'Silakan hubungi saya untuk diskusi akademik, kolaborasi, atau pertanyaan.':'Contact me for academic discussions, collaboration, or inquiries.'}</p></div></header><div class="contact-layout"><section class="contact-card"><h2>${lang=='id'?'Informasi kontak':'Contact information'}</h2><a class="contact-row" href="mailto:${esc(s.email)}"><span class="contact-icon">@</span><span><small>Email</small><b>${esc(s.email)}</b></span></a><div class="contact-row"><span class="contact-icon">⌖</span><span><small>${lang=='id'?'Lokasi':'Location'}</small><b>${esc(s.alamat)}</b></span></div><div class="contact-row"><span class="contact-icon">◷</span><span><small>${lang=='id'?'Jam konsultasi':'Office hours'}</small><b>${esc(t(s.konsultasi))}</b></span></div></section>
  <form class="contact-form" action="https://api.web3forms.com/submit" method="POST"><h2>${lang=='id'?'Kirim pesan':'Send a message'}</h2><input type="hidden" name="access_key" value="${esc(s.web3forms)}"><label>${lang=='id'?'Nama':'Name'}<input name="name" placeholder="${lang=='id'?'Nama lengkap':'Full name'}" required></label><label>Email<input name="email" type="email" placeholder="nama@email.com" required></label><label>${lang=='id'?'Pesan':'Message'}<textarea name="message" rows="5" required placeholder="${lang=='id'?'Tulis pesan Anda di sini…':'Write your message here…'}"></textarea></label><button class="btn">${u('send')} <span aria-hidden="true">→</span></button></form></div>`}};

/* ---- Perilaku per halaman ---- */
const after={
 home(){document.querySelectorAll('[data-n]').forEach(e=>{const n=+e.dataset.n;if(matchMedia('(prefers-reduced-motion:reduce)').matches)return e.textContent=n;let i=0;const f=()=>{i+=Math.max(1,n/40);e.textContent=Math.round(Math.min(i,n));if(i<n)requestAnimationFrame(f)};f()})},
 penelitian(){const P=D.publikasi.map(p=>({...p,first:/first|pertama/i.test(p.peran),ref:pubRef(p),jenis:K('jenis_publikasi',p.jenis),peran:K('peran_publikasi',p.peran)})),y=years(P);
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
   $('#list').innerHTML=r.map(p=>`<article class="record-card publication-card"><span class="record-year">${esc(p.tahun)}</span><div class="record-content"><h3>${ext(esc(p.judul),p.ref.url)}</h3><p class="record-meta">${esc(p.penulis)} <span>·</span> ${esc(p.jurnal)}</p><div class="record-tags"><span class="chip">${esc(p.jenis)}</span>${p.peran?`<span class="chip ${p.first?'first':''}">${esc(p.peran)}</span>`:''}${p.kuartil?`<span class="chip rank">${esc(p.kuartil)}</span>`:''}${p.sinta?`<span class="chip rank">${esc(p.sinta)}</span>`:''}</div></div></article>`).join('')||`<p class="note">${u('empty')}</p>`};
  $('#cloud').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.firstChild.textContent.toLowerCase();kw=kw==k?'':k;cloud();go()};
  ['q','fy','ft','fp','fq'].forEach(i=>$('#'+i).oninput=go);cloud();go()},
 pengabdian(){const P=D.pengabdian.map(p=>({...p,judul:L(p,'judul'),bidang:K('bidang_pengabdian',p.bidang)})),y=years(P),b=count(P,'bidang');chart('c1','bar',y,[{label:u('pengabdian'),data:perYear(P,y)}],lang=='id'?'Kegiatan per tahun':'Activities per year');chart('c2','doughnut',Object.keys(b),[{data:Object.values(b)}],lang=='id'?'Bidang kegiatan':'Activity areas');
  const opt=(ph,a)=>`<option value="">${ph}</option>`+a.map(v=>`<option>${v}</option>`).join('');$('#fy').innerHTML=opt(u('year'),y);$('#fb').innerHTML=opt('Bidang',Object.keys(b));
  const go=()=>{const q=$('#q').value.toLowerCase(),r=P.filter(p=>(!$('#fy').value||p.tahun==$('#fy').value)&&(!$('#fb').value||p.bidang==$('#fb').value)&&(p.judul+p.mitra+p.lokasi).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(p=>`<article class="record-card"><span class="record-year">${esc(p.tahun)}</span><div class="record-content"><h3>${ext(esc(p.judul),p.tautan)}</h3><p class="record-meta">${esc(p.mitra)} <span>·</span> ${esc(p.lokasi)}</p><div class="record-tags"><span class="chip">${esc(p.bidang)}</span></div></div></article>`).join('')||`<p class="note">${u('empty')}</p>`};
  ['q','fy','fb'].forEach(i=>$('#'+i).oninput=go);go()},
 bimbingan(){const M=D.bimbingan.map(b=>({...b,topik:L(b,'topik'),status:K('status_bimbingan',b.status),jenis:K('jenis_bimbingan',b.jenis)})),y=years(M),st=[...new Set(M.map(x=>x.status))],js=[...new Set(M.map(x=>x.jenjang))].sort();
  const sets=st.map(v=>({label:v,data:y.map(a=>M.filter(x=>x.tahun==a&&x.status==v).length)}));sets.stacked=true;chart('c1','bar',y,sets,'Status / '+u('year'));
  const opt=(ph,a)=>`<option value="">${ph}</option>`+a.map(v=>`<option>${v}</option>`).join('');
  $('#fy').innerHTML=opt(u('year'),y);$('#fs').innerHTML=opt('Status',st);$('#fj').innerHTML=opt(lang=='id'?'Jenjang':'Level',js);
  /* tandem1_* dan tandem2_* = pembimbing pendamping (maks. 2, institusi boleh berbeda) */
  const tandem=b=>[1,2].filter(n=>b['tandem'+n+'_nama']).map(n=>`${b['tandem'+n+'_nama']}${b['tandem'+n+'_institusi']?' ('+b['tandem'+n+'_institusi']+')':''}`).join('; ');
  const go=()=>{const q=$('#q').value.toLowerCase(),r=M.filter(b=>(!$('#fy').value||b.tahun==$('#fy').value)&&(!$('#fs').value||b.status==$('#fs').value)&&(!$('#fj').value||b.jenjang==$('#fj').value)&&(b.nama+b.topik).toLowerCase().includes(q));
   $('#list').innerHTML=r.map(b=>{const t2=tandem(b);return `<article class="record-card supervision-card"><span class="record-year">${esc(b.tahun)}</span><div class="record-content"><div class="record-tags"><span class="chip">${esc(b.jenjang)} · ${esc(b.jenis)}</span><span class="chip">${esc(b.status)}</span></div><h3>${esc(b.nama)}</h3><p>${esc(b.topik)}</p>${t2?`<p class="record-meta">${lang=='id'?'Pembimbing tandem':'Co-supervisors'}: ${esc(t2)}</p>`:''}</div></article>`}).join('')||`<p class="note">${u('empty')}</p>`};
  ['q','fy','fs','fj'].forEach(i=>$('#'+i).oninput=go);go()},
 proyek(){const M=D.pengalaman||[],y=years(M).sort((a,b)=>b-a),cats=[...(M.some(x=>x.kategori==JOB)?[JOB]:[]),...actCats(M)],COMPACT=['Reviewer'],now=new Date().getFullYear();
  const opt=(ph,a)=>`<option value="">${ph}</option>`+a.map(([v,t])=>`<option value="${esc(v)}">${esc(t)}</option>`).join('');
  $('#fy').innerHTML=opt(u('year'),y.map(v=>[v,v]));$('#fs').innerHTML=opt(lang=='id'?'Semua kategori':'All categories',cats.map(c=>[c,Kc(c)]));
  const rng=x=>esc(period(x)).replace(' – ',' –<br>'),sub=x=>`${x.lembaga?`<p class="record-meta">${esc(x.lembaga)}</p>`:''}${L(x,'keterangan')?`<p>${esc(L(x,'keterangan'))}</p>`:''}`;
  const card=x=>`<article class="item experience-item"><div class="experience-year${String(period(x)).length>4?' range':''}">${rng(x)}</div><div>${L(x,'peran')?`<span class="chip experience-status">${esc(L(x,'peran'))}</span>`:''}<h3>${ext(esc(L(x,'judul')),x.tautan)}</h3>${sub(x)}</div></article>`;
  const line=x=>`<li><span class="exp-yr">${esc(period(x))}</span><span>${ext(esc(L(x,'judul')),x.tautan)}${x.lembaga?` <span class="muted">· ${esc(x.lembaga)}</span>`:''}${L(x,'keterangan')?` <span class="chip">${esc(L(x,'keterangan'))}</span>`:''}</span></li>`;
  const go=()=>{const q=$('#q').value.trim().toLowerCase(),year=$('#fy').value,cat=$('#fs').value;
   const rows=M.filter(x=>(!year||(+year>=+x.tahun&&+year<=+(x.selesai||(x.kategori==JOB?now:x.tahun))))&&(!cat||(x.kategori||'')==cat)&&[x.tahun,x.selesai,Kc(x.kategori),L(x,'judul'),L(x,'peran'),x.lembaga,L(x,'keterangan')].join(' ').toLowerCase().includes(q));
   const jobs=rows.filter(x=>x.kategori==JOB).sort(jobCmp),grp=actCats(rows).map(c=>[c,rows.filter(x=>(x.kategori||'')==c).sort(actCmp)]);
   const head=(t,n,c)=>`<h3 class="exp-group">${t}${n!=null?` <span class="muted">(${n})</span>`:''}</h3>`;
   $('#list').innerHTML=(jobs.length?head(PJ[lang].job,jobs.length)+`<div class="experience-list">${jobs.map(card).join('')}</div>`:'')
    +(grp.length?head(PJ[lang].akad)+grp.map(([c,r])=>`<h4 class="exp-cat">${esc(Kc(c))} <span class="muted">(${r.length})</span></h4>`+(COMPACT.includes(c)?`<ul class="exp-compact">${r.map(line).join('')}</ul>`:`<div class="experience-list">${r.map(card).join('')}</div>`)).join(''):'')
    ||`<p class="note">${u('empty')}</p>`};
  ['q','fy','fs'].forEach(i=>$('#'+i).oninput=go);go()},
 async ebook(id){const b=D.ebook.find(x=>x.id==id);if(!b){const input=$('#note-q');if(input)input.oninput=()=>{const q=input.value.trim().toLowerCase();let visible=0;$('#note-list').querySelectorAll('.note-card').forEach(card=>{const show=card.dataset.search.includes(q);card.hidden=!show;if(show)visible++});$('#note-empty').hidden=visible>0};return}
  if(b.tipe=='html'){const f=$('#ebf'),fit=()=>{try{f.style.height=Math.max(640,f.contentDocument.documentElement.scrollHeight)+'px'}catch(e){}};
   f.onload=()=>{fit();try{new ResizeObserver(fit).observe(f.contentDocument.body)}catch(e){}};return}
  const md=window.markdownit({html:false,highlight:(c,l)=>l&&hljs.getLanguage(l)?hljs.highlight(c,{language:l}).value:''});
  const el=$('#md');el.innerHTML=md.render(await (await fetch(B+b.file)).text());
  const toc=$('#toc');el.querySelectorAll('h2,h3').forEach((h,i)=>{h.id='b'+i;toc.insertAdjacentHTML('beforeend',`<a href="javascript:document.getElementById('b${i}').scrollIntoView()">${h.textContent}</a>`)});
  renderMathInElement(el,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]})}};

/* ---- CV: pilih bagian & butir, pratinjau, lalu simpan sebagai PDF lewat dialog cetak ---- */
const tl=(o,cl)=>o&&typeof o==='object'?(o[cl]||o.id):o;
const shortUrl=x=>{x=String(x).replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,'');return x.length>56?x.slice(0,55)+'…':x};
/* Daftar bagian CV (urutan = urutan di kertas). rows = butir, key = id stabil butir (disimpan saat dikecualikan),
   lab = teks di daftar pilihan, html = tampilan di kertas, pick = boleh memilih butir satu per satu */
const cvSecs=(cl,names)=>{const s=D.site,tt=o=>tl(o,cl),desc=(a,k)=>[...(a||[])].sort((x,y)=>(+y[k]||0)-(+x[k]||0)),
 li=(yr,body)=>`<li class="cv-item"><span class="cv-yr">${esc(yr)}</span><div>${body}</div></li>`,
 meta=(a,...h)=>`<span class="cv-meta">${[...a.filter(Boolean).map(esc),...h.filter(Boolean)].join(' · ')}</span>`;
const px=D.pengalaman||[],pxKey=x=>x.tahun+'|'+x.judul,pxLab=x=>`${period(x,cl)} · ${L(x,'judul',cl)}`,PJ_L=k=>({id:PJ.id[k],en:PJ.en[k]}),
 pxHtml=x=>li(period(x,cl),`<b>${ext(esc(L(x,'judul',cl)),x.tautan,0)}</b>${L(x,'peran',cl)?` ${meta([`(${L(x,'peran',cl)})`])}`:''}${x.lembaga?`<br>${esc(x.lembaga)}`:''}${L(x,'keterangan',cl)?`<br>${meta([L(x,'keterangan',cl)])}`:''}`),
 kg=actCats(px).map(c=>({k:'kg-'+c,l:{id:Kc(c,'id'),en:Kc(c,'en')},grp:PJ_L('akad'),pick:1,rows:px.filter(x=>x.kategori!=JOB&&(x.kategori||'')==c).sort(actCmp),key:pxKey,lab:pxLab,html:pxHtml}));
 return [
 {k:'bio',l:{id:'Profil singkat',en:'Summary'},rows:[s],key:()=>'bio',html:()=>`<p>${esc(tt(s.bio))}</p>`,wrap:h=>h.join('')},
 {k:'keahlian',l:{id:'Keahlian',en:'Expertise'},pick:1,rows:s.keahlian||[],key:x=>x.id||x,lab:x=>tt(x),html:x=>esc(tt(x)),wrap:h=>`<p>${h.join(' · ')}</p>`},
 {k:'pendidikan',l:{id:'Pendidikan',en:'Education'},pick:1,rows:s.pendidikan||[],key:e=>e.jenjang+'|'+e.kampus,lab:e=>`${e.jenjang} · ${e.kampus}`,
  html:e=>li(e.tahun,`<b>${esc(e.jenjang)}</b> — ${esc(e.kampus)}`)},
 {k:'pekerjaan',l:PJ_L('job'),pick:1,rows:px.filter(x=>x.kategori==JOB).sort(jobCmp),key:pxKey,lab:pxLab,html:pxHtml,wrap:h=>`<ul class="cv-list mid">${h.join('')}</ul>`},
 {k:'publikasi',l:{id:'Publikasi',en:'Publications'},pick:1,rows:desc(D.publikasi,'tahun'),key:p=>p.judul,lab:p=>`${p.tahun} · ${p.judul}`,
  html:p=>{const r=pubRef(p);return li(p.tahun,`<b>${esc(p.judul)}</b><br>${esc(p.penulis)} · <i>${esc(p.jurnal)}</i><br>${meta([K('jenis_publikasi',p.jenis,cl),K('peran_publikasi',p.peran,cl),p.kuartil,p.sinta&&String(p.sinta).replace(/^S/i,'SINTA ')],r.doi?`<a href="${esc(r.url)}">doi:${esc(r.doi)}</a>`:r.url?`<a href="${esc(r.url)}">${cl=='id'?'tautan':'link'}</a>`:'')}`)}},
 {k:'hibah',l:{id:'Hibah penelitian',en:'Research grants'},pick:1,rows:desc(D.hibah,'tahun'),key:h=>h.judul,lab:h=>`${h.tahun} · ${L(h,'judul',cl)}`,
  html:h=>li(h.tahun,`<b>${ext(esc(L(h,'judul',cl)),h.tautan,0)}</b><br>${meta([K('skema_hibah',h.skema,cl),K('peran_hibah',h.peran,cl)])}`)},
 {k:'pengabdian',l:{id:'Pengabdian kepada masyarakat',en:'Community service'},pick:1,rows:desc(D.pengabdian,'tahun'),key:p=>p.judul,lab:p=>`${p.tahun} · ${L(p,'judul',cl)}`,
  html:p=>li(p.tahun,`<b>${ext(esc(L(p,'judul',cl)),p.tautan,0)}</b><br>${meta([p.mitra,p.lokasi,K('bidang_pengabdian',p.bidang,cl)])}`)},
 {k:'mengajar',l:{id:'Pengajaran',en:'Teaching'},pick:1,rows:D.mk||[],key:c=>c.id,lab:c=>`${c.kode} ${tt(c.nama)}`,
  html:c=>li(c.kode,`<b>${esc(tt(c.nama))}</b> ${meta([`${c.sks} SKS`,`Semester ${c.semester}`])}`)},
 {k:'bimbingan',l:{id:'Bimbingan mahasiswa',en:'Student supervision'},pick:1,rows:desc(D.bimbingan,'tahun'),key:b=>b.nama+'|'+b.topik,lab:b=>`${b.tahun} · ${b.nama} — ${L(b,'topik',cl)}`,
  html:b=>li(b.tahun,`${names?`<b>${esc(b.nama)}</b> — ${esc(L(b,'topik',cl))}`:`<b>${esc(L(b,'topik',cl))}</b>`}<br>${meta([`${b.jenjang} ${K('jenis_bimbingan',b.jenis,cl)}`,K('status_bimbingan',b.status,cl)])}`)},
 ...kg,
 {k:'tautan',l:{id:'Profil & tautan',en:'Profiles & links'},pick:1,rows:Object.entries(s.links||{}),key:e=>e[0],lab:e=>e[0],
  html:e=>li(e[0],`<a href="${esc(e[1])}">${esc(shortUrl(e[1]))}</a>`),wrap:h=>`<ul class="cv-list wide">${h.join('')}</ul>`}]};
/* Pilihan cepat: on = bagian yang aktif (null = semua) */
const PRE={full:{l:{id:'Lengkap',en:'Full'},on:null},
 ak:{l:{id:'Akademik',en:'Academic'},on:['bio','keahlian','pendidikan','pekerjaan','kegiatan','publikasi','hibah','pengabdian','mengajar','tautan']},
 short:{l:{id:'Ringkas',en:'Short'},on:['bio','pendidikan','pekerjaan','publikasi']}};
V.cv=()=>`<header class="page-heading"><div><p class="eyebrow">CURRICULUM VITAE</p><h1>CV</h1><p class="page-intro">${lang=='id'?'Pilih bagian dan butir yang ingin dimasukkan, periksa pratinjau, lalu unduh sebagai PDF.':'Choose the sections and items to include, check the preview, then download it as a PDF.'}</p></div></header>
 <div class="cv-layout"><aside class="cv-controls" id="cvc" aria-label="${lang=='id'?'Pengaturan CV':'CV settings'}"></aside><div class="cv-stage"><article class="cv-paper" id="cvp" aria-label="${lang=='id'?'Pratinjau CV':'CV preview'}"></article></div></div>`;
after.cv=()=>{
 const ui=(a,b)=>lang=='id'?a:b,def={hdr:{foto:0,email:1,alamat:1,stats:0,names:0}};let cfg={};
 try{cfg=JSON.parse(localStorage.cvcfg||'{}')||{}}catch(e){}
 cfg={on:cfg.on||{},off:cfg.off||{},hdr:{...def.hdr,...(cfg.hdr||{})}};
 let cl=lang;const op=new Set(),S0=()=>cvSecs(cl,!!cfg.hdr.names),offs=k=>new Set(cfg.off[k]||[]),sel=x=>x.rows.filter(r=>!offs(x.k).has(x.key(r))),
  save=()=>{try{localStorage.cvcfg=JSON.stringify(cfg)}catch(e){}},cnt=x=>`(${sel(x).length}/${x.rows.length})`;
 const panel=()=>{let lg='';const S=S0(),hd=[['foto',ui('Foto','Photo')],['email','Email'],['alamat',ui('Lokasi','Location')],['stats',ui('Sitasi & h-index','Citations & h-index')]];
  $('#cvc').innerHTML=`<button type="button" class="btn cv-print" data-act="print">⬇ ${ui('Unduh PDF','Download PDF')}</button>
  <p class="muted cv-tip">${ui('Di dialog cetak pilih “Simpan sebagai PDF”, lalu matikan opsi “Header dan footer”.','In the print dialog choose “Save as PDF”, then turn off “Headers and footers”.')}</p>
  <h2>${ui('Bahasa CV','CV language')}</h2><select id="cvlang" aria-label="${ui('Bahasa CV','CV language')}"><option value="id">Bahasa Indonesia</option><option value="en">English</option></select>
  <h2>${ui('Pilihan cepat','Presets')}</h2><div class="cv-presets">${Object.entries(PRE).map(([k,p])=>`<button type="button" class="cv-mini" data-act="pre" data-v="${k}">${p.l[lang]}</button>`).join('')}</div>
  <h2>${ui('Kepala CV','Header')}</h2>${hd.map(([k,l])=>`<div class="cv-row"><label><input type="checkbox" data-hdr="${k}"${cfg.hdr[k]?' checked':''}> ${l}</label></div>`).join('')}
  <h2>${ui('Bagian','Sections')}</h2>${S.map(x=>{const n=x.rows.length,o=offs(x.k);
   const gh=x.grp&&x.grp.id!==lg?`<div class="cv-grp">${esc(x.grp[lang])}</div>`:'';if(x.grp)lg=x.grp.id;
   return `${gh}<div class="cv-row"><label><input type="checkbox" data-sec="${x.k}"${cfg.on[x.k]!==false&&n?' checked':''}${n?'':' disabled'}> <span>${esc(x.l[lang])}</span> <span class="muted cv-n" data-n="${x.k}">${n?cnt(x):ui('(kosong)','(empty)')}</span></label>
   ${x.k=='bimbingan'?`<label class="cv-sub"><input type="checkbox" data-hdr="names"${cfg.hdr.names?' checked':''}> ${ui('Tampilkan nama mahasiswa','Show student names')}</label>`:''}
   ${x.pick&&n>1?`<details data-d="${x.k}"${op.has(x.k)?' open':''}><summary>${ui('Pilih butir','Choose items')}</summary><div class="cv-bulk"><button type="button" class="cv-mini" data-act="all" data-v="${x.k}">${ui('Semua','All')}</button><button type="button" class="cv-mini" data-act="none" data-v="${x.k}">${ui('Kosongkan','None')}</button></div><div class="cv-items">${x.rows.map(r=>`<label><input type="checkbox" data-item="${x.k}" data-key="${esc(x.key(r))}"${o.has(x.key(r))?'':' checked'}> <span>${esc(x.lab(r))}</span></label>`).join('')}</div></details>`:''}</div>`}).join('')}`;
  $('#cvlang').value=cl};
 const paper=()=>{const s=D.site,h=cfg.hdr,tt=o=>tl(o,cl),
  contact=[h.email&&s.email&&`<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`,h.alamat&&s.alamat&&esc(s.alamat),h.stats&&s.stats&&`${cl=='id'?'Sitasi':'Citations'} ${esc(s.stats.sitasi)} · h-index ${esc(s.stats.hindex)}`].filter(Boolean).join(' · ');
  let lg='';const body=S0().filter(x=>cfg.on[x.k]!==false).map(x=>{const r=sel(x);if(!r.length)return '';const g=x.grp&&x.grp.id!==lg;if(x.grp)lg=x.grp.id;
   const list=(x.wrap||(a=>`<ul class="cv-list">${a.join('')}</ul>`))(r.map(i=>x.html(i)));
   return `<section class="cv-sec">${x.grp?`${g?`<h2>${esc(x.grp[cl])}</h2>`:''}<h3>${esc(x.l[cl])}</h3>`:`<h2>${esc(x.l[cl])}</h2>`}${list}</section>`}).join('');
  $('#cvp').innerHTML=`<header class="cv-head"><div><h1>${esc(s.nama)}</h1><p class="cv-role">${esc(tt(s.jabatan))} · ${esc(s.afiliasi)}</p>${contact?`<p class="cv-contact">${contact}</p>`:''}</div>${h.foto&&s.foto?`<img class="cv-photo" src="${esc(img(s.foto))}" alt="">`:''}</header>${body||`<p class="cv-meta">${cl=='id'?'Belum ada bagian yang dipilih.':'No sections selected.'}</p>`}`};
 const box=$('#cvc');
 box.onchange=e=>{const g=e.target,d=g.dataset;
  if(g.id=='cvlang'){cl=g.value;panel();return paper()}
  if(d.sec)cfg.on[d.sec]=g.checked;
  else if(d.hdr)cfg.hdr[d.hdr]=g.checked?1:0;
  else if(d.item){const a=offs(d.item);g.checked?a.delete(d.key):a.add(d.key);cfg.off[d.item]=[...a];const x=S0().find(y=>y.k==d.item),n=box.querySelector(`.cv-n[data-n="${d.item}"]`);if(n)n.textContent=cnt(x)}
  save();paper()};
 box.onclick=e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a=='print')return window.print();
  if(a=='pre'){const p=PRE[v];S0().forEach(x=>cfg.on[x.k]=!p.on||p.on.includes(x.k)||(!!x.grp&&p.on.includes('kegiatan')))}
  else{const x=S0().find(y=>y.k==v);cfg.off[v]=a=='all'?[]:x.rows.map(r=>x.key(r))}
  save();panel();paper()};
 box.addEventListener('toggle',e=>{const k=e.target.dataset&&e.target.dataset.d;if(k)e.target.open?op.add(k):op.delete(k)},true);
 /* nama berkas PDF mengikuti judul halaman saat dicetak */
 const old=document.title;window.onbeforeprint=()=>{document.title=`CV - ${D.site.nama}`};window.onafterprint=()=>{document.title=old};
 panel();paper()};

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
