/* אופק: fictional agency CRM for the WrapUp demo. All data lives in this browser (localStorage). */
(function () {
  const SEED = window.WRAPUP_SEED;
  const DB_KEY = 'ofek-db-v1';
  const SESSION_KEY = 'ofek-agent';
  const TODAY = SEED.today;
  const REL = { spouse: 'בן זוג', son: 'בן', daughter: 'בת', parent: 'הורה' };
  const DOC_ST = { received: 'התקבל', missing: 'חסר' };
  const RET = { normal: 'רגיל', risk: 'סיכון נטישה', saving: 'בשימור' };
  const STATUS = { active: 'פעילה', cancelled: 'מבוטלת', frozen: 'מוקפאת' };

  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = iso => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };
  const parse = s => { const m = String(s || '').trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
  const nis = n => (n || 0).toLocaleString('he-IL') + ' ₪';
  const digits = s => String(s || '').replace(/\D/g, '');
  const age = iso => { const b = new Date(iso), t = new Date(TODAY); let a = t.getFullYear() - b.getFullYear(); if (t < new Date(t.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
  const daysTo = iso => Math.round((new Date(iso) - new Date(TODAY)) / 864e5);

  // ---------- Store ----------
  function seedDb() {
    const db = JSON.parse(JSON.stringify(SEED));
    db.clients.forEach(c => c.family.forEach(f => { f.rel = REL[f.rel] || f.rel; }));
    return db;
  }
  let db;
  try { db = JSON.parse(localStorage.getItem(DB_KEY)) || seedDb(); } catch (e) { db = seedDb(); }
  const save = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* demo still works in memory */ } };
  let agentId = null;
  try { agentId = localStorage.getItem(SESSION_KEY); } catch (e) { /* ignore */ }
  const me = () => db.agents.find(a => a.id === agentId);
  const myClients = () => db.clients.filter(c => c.agent === agentId);
  const client = id => myClients().find(c => c.id === id);
  const typeName = t => (SEED.TYPES[t] || { name: t }).name;
  const total = c => c.policies.filter(p => p.status === 'active').reduce((a, p) => a + p.premium, 0);
  const log = (c, text, source) => c.history.unshift({ date: TODAY, text, by: me().name, source: source || '' });

  // ---------- Router ----------
  const app = document.getElementById('app');
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = new URLSearchParams(qs || '');
    return { parts, q };
  }

  function shell(active, inner) {
    const a = me();
    return `<header class="top">
      <a class="logo" href="#/dashboard">אופק<small>ניהול סוכנות</small></a>
      <nav class="nav" aria-label="ניווט ראשי">
        ${[['dashboard', 'לוח בקרה'], ['clients', 'לקוחות'], ['leads', 'לידים'], ['tasks', 'משימות'], ['reports', 'דוחות']].map(([k, l]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}">${l}</a>`).join('')}
      </nav>
      <div class="end"><a class="agent-chip" href="#/profile" title="תיק סוכן">${h(a.name)} · רישיון ${h(a.license)}</a><button type="button" data-act="logout">יציאה</button><button type="button" data-act="reset" title="מחזיר את כל הנתונים למצב ההתחלתי">איפוס נתוני דמו</button></div>
    </header><main>${inner}</main>`;
  }

  // ---------- Views ----------
  function vLogin() {
    return `<div class="login">
      <div><h1>כניסה למערכת אופק</h1><p class="sub">מערכת דמה לצורך הדגמה. בחרו סוכן כדי להיכנס. אין סיסמאות ואין מידע אמיתי.</p></div>
      <div class="agents">${db.agents.map(a => `<button class="agent-card" data-login="${a.id}"><b>${h(a.name)}</b><span class="sub">${h(a.role)}</span><span class="sub num">רישיון ${h(a.license)} · ${db.clients.filter(c => c.agent === a.id).length} לקוחות</span></button>`).join('')}</div>
    </div>`;
  }

  function vDashboard() {
    const cs = myClients();
    const tasks = cs.flatMap(c => c.tasks.filter(t => !t.done).map(t => ({ ...t, c }))).sort((a, b) => a.due.localeCompare(b.due));
    const renew = cs.flatMap(c => c.policies.filter(p => p.status === 'active' && daysTo(p.renew) >= 0 && daysTo(p.renew) <= 75).map(p => ({ p, c }))).sort((a, b) => a.p.renew.localeCompare(b.p.renew));
    const acts = cs.flatMap(c => c.history.map(x => ({ ...x, c }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
    return shell('dashboard', `
      <div><h1>בוקר טוב, ${h(me().name.split(' ')[0])}</h1><div class="sub num">יום חמישי, ${fmt(TODAY)}</div></div>
      <div class="kpis">
        <div class="kpi"><b class="num">${cs.length}</b><span>לקוחות בתיק שלי</span></div>
        <div class="kpi"><b class="num">${nis(cs.reduce((a, c) => a + total(c), 0))}</b><span>פרמיה חודשית בתיק</span></div>
        <div class="kpi"><b class="num">${tasks.length}</b><span>משימות פתוחות</span></div>
        <div class="kpi"><b class="num">${renew.length}</b><span>חידושים ב-75 הימים הקרובים</span></div>
      </div>
      <div class="grid">
        <section class="panel"><h2>משימות קרובות <a href="#/tasks" class="sub">לכל המשימות</a></h2>
          ${tasks.length ? `<ul class="list">${tasks.slice(0, 6).map(t => `<li><span>${h(t.text)}<br><a class="sub" href="#/clients/${t.c.id}/tasks">${h(t.c.first + ' ' + t.c.last)}</a></span><span class="sub num">${fmt(t.due)}</span></li>`).join('')}</ul>` : '<div class="empty">אין משימות פתוחות.</div>'}</section>
        <section class="panel"><h2>חידושים קרובים</h2>
          ${renew.length ? `<ul class="list">${renew.map(({ p, c }) => `<li><span>${h(typeName(p.type))} · <a href="#/clients/${c.id}/policies">${h(c.first + ' ' + c.last)}</a></span><span class="sub num">${fmt(p.renew)}</span></li>`).join('')}</ul>` : '<div class="empty">אין חידושים קרובים.</div>'}</section>
      </div>
      <section class="panel"><h2>פעילות אחרונה בתיק</h2><ul class="list">${acts.map(x => `<li><span>${h(x.text)}${x.source ? `<span class="src">${h(x.source)}</span>` : ''}<br><a class="sub" href="#/clients/${x.c.id}/history">${h(x.c.first + ' ' + x.c.last)}</a></span><span class="sub num">${fmt(x.date)}</span></li>`).join('')}</ul></section>`);
  }

  function vClients(q) {
    const term = (q.get('q') || '').trim();
    const prod = q.get('product') || '';
    const d = digits(term);
    const list = myClients().filter(c => {
      const okTerm = !term || (c.first + ' ' + c.last).includes(term) || (d.length >= 3 && digits(c.phone).includes(d)) || c.city.includes(term);
      const okProd = !prod || c.policies.some(p => p.type === prod);
      return okTerm && okProd;
    });
    return shell('clients', `
      <div class="row"><h1>לקוחות</h1><span class="sub">${list.length} מתוך ${myClients().length}</span></div>
      <form class="search" data-form="client-search" role="search">
        <input id="client-search" name="q" value="${h(term)}" placeholder="חיפוש לפי שם, טלפון או עיר" aria-label="חיפוש לקוח">
        <select name="product" aria-label="סינון לפי מוצר"><option value="">כל המוצרים</option>${Object.entries(SEED.TYPES).map(([k, t]) => `<option value="${k}" ${prod === k ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
        <button class="btn" type="submit">חיפוש</button>
      </form>
      <section class="panel"><div class="tbl"><table>
        <thead><tr><th>שם</th><th>טלפון</th><th>עיר</th><th>מוצרים</th><th>פרמיה חודשית</th><th>חידוש קרוב</th></tr></thead>
        <tbody>${list.map(c => { const next = c.policies.map(p => p.renew).sort()[0]; return `<tr class="click" data-client-row="${c.id}" data-href="#/clients/${c.id}"><td><a href="#/clients/${c.id}">${h(c.first + ' ' + c.last)}</a></td><td class="num">${h(c.phone)}</td><td>${h(c.city)}</td><td>${c.policies.length}</td><td class="num">${nis(total(c))}</td><td class="num">${fmt(next)}</td></tr>`; }).join('') || '<tr><td colspan="6" class="empty">לא נמצאו לקוחות.</td></tr>'}</tbody>
      </table></div></section>`);
  }

  const TABS = [['overview', 'סקירה'], ['personal', 'פרטים אישיים'], ['family', 'בני משפחה'], ['policies', 'פוליסות'], ['docs', 'מסמכים'], ['notes', 'הערות'], ['tasks', 'משימות'], ['history', 'היסטוריה']];
  function clientHead(c, tab) {
    const counts = { family: c.family.length, policies: c.policies.length, docs: c.docs.length, notes: c.notes.length, tasks: c.tasks.filter(t => !t.done).length };
    return `<div class="crumbs"><a href="#/clients">לקוחות</a> / ${h(c.first + ' ' + c.last)}</div>
      <section class="client-head">
        <div class="avatar" aria-hidden="true">${h(c.first[0] + c.last[0])}</div>
        <div><h1 data-field="name">${h(c.first + ' ' + c.last)}</h1>
          <div class="meta"><span>ת״ז ${h(c.idNo)}</span><span class="num" data-field="phone">${h(c.phone)}</span><span>סוכן מטפל: ${h(db.agents.find(a => a.id === c.agent).name)}</span><span>לקוח מאז ${h(c.since)}</span></div></div>
        <div class="total"><b class="num">${nis(total(c))}</b><span class="sub">סה״כ פרמיה חודשית</span></div>
      </section>
      <nav class="tabs" aria-label="לשוניות תיק לקוח">${TABS.map(([k, l]) => `<a href="#/clients/${c.id}/${k}" class="${tab === k ? 'on' : ''}">${l}${counts[k] ? `<span class="c num">${counts[k]}</span>` : ''}</a>`).join('')}</nav>`;
  }
  const familyTable = c => c.family.length ? `<div class="tbl"><table><thead><tr><th>שם</th><th>קרבה</th><th>תאריך לידה</th><th>מבוטח ב-</th></tr></thead><tbody>${c.family.map(f => `<tr data-family-name="${h(f.name)}"><td>${h(f.name)}</td><td>${h(f.rel)}</td><td class="num">${fmt(f.birth)}</td><td>${h(f.insured || '')}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">לא רשומים בני משפחה.</div>';
  const retPill = p => p.retention === 'risk' ? '<span class="pill bad">סיכון נטישה</span>' : p.retention === 'saving' ? '<span class="pill warn">בשימור</span>' : '';
  const policyTable = (c, edit) => `<div class="tbl"><table><thead><tr><th>סוג</th><th>מבטח</th><th>מס׳ פוליסה</th><th>סכום ביטוח</th><th>פרמיה חודשית</th><th>חידוש</th><th>סטטוס</th>${edit ? '<th></th>' : ''}</tr></thead><tbody>
    ${c.policies.map(p => `<tr data-policy-no="${p.no}"><td>${h(typeName(p.type))}${p.note ? `<br><span class="sub">${h(p.note)}</span>` : ''}</td><td>${h(p.insurer)}</td><td class="mono">${p.no}</td><td class="num" data-field="policy:${p.no}:sum">${p.sum ? nis(p.sum) : '—'}</td><td class="num" data-field="policy:${p.no}:premium">${nis(p.premium)}</td><td class="num">${fmt(p.renew)}</td><td><span class="pill ${p.status === 'active' ? 'ok' : ''}">${STATUS[p.status]}</span> <span data-field="policy:${p.no}:retention" data-value="${p.retention}">${retPill(p)}</span></td>${edit ? `<td><a class="btn ghost sm" href="#/clients/${c.id}/policies/${p.no}/edit">עריכה</a></td>` : ''}</tr>`).join('')}
    </tbody></table></div>`;
  const docPill = s => `<span class="pill ${s === 'missing' ? 'warn' : 'ok'}">${DOC_ST[s]}</span>`;

  function vClient(c, tab) {
    let body = '';
    if (tab === 'overview') {
      const open = c.tasks.filter(t => !t.done);
      body = `<div class="grid">
        <section class="panel"><h2>פרטים עיקריים <a class="btn ghost sm" href="#/clients/${c.id}/edit">עריכה</a></h2><dl class="kv">
          <dt>כתובת</dt><dd><span data-field="street">${h(c.street)}</span>, <span data-field="city">${h(c.city)}</span></dd>
          <dt>גיל</dt><dd class="num">${age(c.birth)}</dd>
          <dt>מצב משפחתי</dt><dd data-field="marital">${h(c.marital)}</dd>
          <dt>מעשן</dt><dd data-field="smoker" data-value="${c.smoker}">${c.smoker ? 'כן' : 'לא'}</dd>
          <dt>דוא״ל</dt><dd data-field="email">${h(c.email)}</dd></dl></section>
        <section class="panel"><h2>בני משפחה <small>${c.family.length}</small></h2>${familyTable(c)}</section>
      </div>
      <section class="panel"><h2>פוליסות <small>${c.policies.length}</small></h2>${policyTable(c, false)}</section>
      <div class="grid">
        <section class="panel"><h2>משימות פתוחות <small>${open.length}</small></h2>${open.length ? `<ul class="list">${open.map(t => `<li><span>${h(t.text)}</span><span class="sub num">${fmt(t.due)}</span></li>`).join('')}</ul>` : '<div class="empty">אין משימות פתוחות.</div>'}</section>
        <section class="panel"><h2>פעילות אחרונה</h2><ul class="list">${c.history.slice(0, 4).map(x => `<li><span>${h(x.text)}${x.source ? `<span class="src">${h(x.source)}</span>` : ''}</span><span class="sub num">${fmt(x.date)}</span></li>`).join('')}</ul></section>
      </div>`;
    } else if (tab === 'personal') {
      body = `<section class="panel"><h2>פרטים אישיים <a class="btn sm" href="#/clients/${c.id}/edit">עריכת פרטים</a></h2><dl class="kv">
        <dt>שם פרטי</dt><dd>${h(c.first)}</dd><dt>שם משפחה</dt><dd>${h(c.last)}</dd><dt>תעודת זהות</dt><dd>${h(c.idNo)}</dd>
        <dt>תאריך לידה</dt><dd class="num">${fmt(c.birth)} (${age(c.birth)})</dd><dt>טלפון נייד</dt><dd class="num">${h(c.phone)}</dd><dt>דוא״ל</dt><dd>${h(c.email)}</dd>
        <dt>רחוב ומספר</dt><dd>${h(c.street)}</dd><dt>עיר</dt><dd>${h(c.city)}</dd><dt>מצב משפחתי</dt><dd>${h(c.marital)}</dd>
        <dt>עיסוק</dt><dd>${h(c.job)}</dd><dt>מעשן</dt><dd>${c.smoker ? 'כן' : 'לא'}</dd></dl></section>`;
    } else if (tab === 'family') {
      body = `<section class="panel"><h2>בני משפחה <a class="btn sm" href="#/clients/${c.id}/family/new">הוספת בן משפחה</a></h2>${familyTable(c)}</section>`;
    } else if (tab === 'policies') {
      body = `<section class="panel"><h2>פוליסות <small>לחצו ״עריכה״ כדי לעדכן פרמיה, כיסוי או סטטוס שימור</small></h2>${policyTable(c, true)}</section>`;
    } else if (tab === 'docs') {
      body = `<section class="panel"><h2>מסמכים <a class="btn sm" href="#/clients/${c.id}/docs/new">בקשת מסמך</a></h2><ul class="list">${c.docs.map(x => `<li><span>${h(x.name)}<br><span class="sub num">${fmt(x.date)}</span></span>${docPill(x.status)}</li>`).join('')}</ul></section>`;
    } else if (tab === 'notes') {
      body = `<section class="panel"><h2>הערות <a class="btn sm" href="#/clients/${c.id}/notes/new">הערה חדשה</a></h2>${c.notes.length ? `<ul class="list">${c.notes.map(n => `<li><span>${h(n.text)}<br><span class="sub">${h(n.by)} · <span class="num">${fmt(n.date)}</span></span>${n.source ? `<span class="src">${h(n.source)}</span>` : ''}</span></li>`).join('')}</ul>` : '<div class="empty">אין הערות.</div>'}</section>`;
    } else if (tab === 'tasks') {
      body = `<section class="panel"><h2>משימות <a class="btn sm" href="#/clients/${c.id}/tasks/new">משימה חדשה</a></h2>${c.tasks.length ? `<ul class="list">${c.tasks.map((t, i) => `<li><label><input type="checkbox" data-toggle-task="${c.id}:${i}" ${t.done ? 'checked' : ''}> ${h(t.text)}${t.policyNo ? ` <span class="sub mono">${t.policyNo}</span>` : ''}${t.source ? `<span class="src">${h(t.source)}</span>` : ''}</label><span class="sub num">${fmt(t.due)}</span></li>`).join('')}</ul>` : '<div class="empty">אין משימות.</div>'}</section>`;
    } else {
      body = `<section class="panel"><h2>היסטוריית שינויים ופעילות</h2><ul class="list">${c.history.map(x => `<li><span>${h(x.text)}${x.source ? `<span class="src">${h(x.source)}</span>` : ''}<br><span class="sub">${h(x.by)}</span></span><span class="sub num">${fmt(x.date)}</span></li>`).join('')}</ul></section>`;
    }
    return shell('clients', `<div data-client-file="${c.id}" style="display:grid;gap:16px">${clientHead(c, tab)}${body}</div>`);
  }

  const field = (name, label, value, opts = {}) => {
    const id = 'f-' + name;
    if (opts.options) return `<div class="field${opts.wide ? ' wide' : ''}"><label for="${id}">${label}</label><select id="${id}" name="${name}">${opts.options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${h(v)}" ${String(v) === String(value) ? 'selected' : ''}>${h(l)}</option>`; }).join('')}</select></div>`;
    if (opts.area) return `<div class="field wide"><label for="${id}">${label}</label><textarea id="${id}" name="${name}" ${opts.required ? 'required' : ''}>${h(value)}</textarea></div>`;
    return `<div class="field${opts.wide ? ' wide' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${name}" value="${h(value)}" ${opts.ph ? `placeholder="${opts.ph}"` : ''} ${opts.type ? `type="${opts.type}"` : ''} ${opts.required ? 'required' : ''}></div>`;
  };
  const formShell = (c, title, formName, inner, back, extra = '') => shell('clients', `
    <div class="crumbs"><a href="#/clients">לקוחות</a> / <a href="#/clients/${c.id}">${h(c.first + ' ' + c.last)}</a> / ${title}</div>
    <form class="card" data-form="${formName}" data-client="${c.id}" ${extra}><h1>${title}</h1><div class="fields">${inner}</div>
      <input type="hidden" name="source" value="">
      <div class="actions"><button class="btn" type="submit" data-save>שמירה</button><a class="btn ghost" href="${back}">ביטול</a></div></form>`);

  function vEdit(c) {
    return formShell(c, 'עריכת פרטים אישיים', 'client-edit', [
      field('first_name', 'שם פרטי', c.first), field('last_name', 'שם משפחה', c.last), field('birth', 'תאריך לידה', fmt(c.birth), { ph: 'dd.mm.yyyy' }),
      field('phone', 'טלפון נייד', c.phone), field('email', 'דוא״ל', c.email), field('job', 'עיסוק', c.job),
      field('street', 'רחוב ומספר', c.street), field('city', 'עיר', c.city),
      field('marital', 'מצב משפחתי', c.marital, { options: ['רווק', 'רווקה', 'נשוי', 'נשואה', 'גרוש', 'גרושה', 'אלמן', 'אלמנה'] }),
      field('smoker', 'מעשן', c.smoker ? 'כן' : 'לא', { options: ['כן', 'לא'] })
    ].join(''), `#/clients/${c.id}/personal`);
  }
  function vFamilyNew(c) {
    return formShell(c, 'הוספת בן משפחה', 'family-new', [
      field('fm_name', 'שם מלא', '', { required: true }), field('fm_rel', 'קרבה', 'בן', { options: ['בן זוג', 'בת זוג', 'בן', 'בת', 'הורה'] }),
      field('fm_birth', 'תאריך לידה', '', { ph: 'dd.mm.yyyy' }), field('fm_insured', 'מבוטח ב-', '', { ph: 'למשל: בריאות' })
    ].join(''), `#/clients/${c.id}/family`);
  }
  function vPolicyEdit(c, p) {
    return formShell(c, `עריכת פוליסה ${p.no}`, 'policy-edit', [
      `<div class="field wide"><span class="sub">${h(typeName(p.type))} · ${h(p.insurer)}</span></div>`,
      field('premium', 'פרמיה חודשית (₪)', p.premium, { type: 'number' }), field('sum', 'סכום ביטוח (₪)', p.sum || '', { type: 'number' }),
      field('renew', 'תאריך חידוש', fmt(p.renew), { ph: 'dd.mm.yyyy' }),
      field('status', 'סטטוס', p.status, { options: Object.entries(STATUS) }),
      field('retention', 'סטטוס שימור', p.retention, { options: Object.entries(RET) }),
      field('policy_note', 'הערת פוליסה', p.note, { area: true })
    ].join(''), `#/clients/${c.id}/policies`, `data-policy="${p.no}"`);
  }
  function vDocNew(c) {
    return formShell(c, 'בקשת מסמך', 'doc-new', [field('doc_name', 'שם המסמך', '', { required: true, wide: true }), field('doc_status', 'סטטוס', 'missing', { options: Object.entries(DOC_ST) })].join(''), `#/clients/${c.id}/docs`);
  }
  function vNoteNew(c) { return formShell(c, 'הערה חדשה', 'note-new', field('note_text', 'תוכן ההערה', '', { area: true, required: true }), `#/clients/${c.id}/notes`); }
  function vTaskNew(c) {
    return formShell(c, 'משימה חדשה', 'task-new', [
      field('task_text', 'תיאור המשימה', '', { required: true, wide: true }), field('task_due', 'תאריך יעד', '', { ph: 'dd.mm.yyyy' }),
      field('task_policy', 'קשור לפוליסה', '', { options: [['', 'ללא']].concat(c.policies.map(p => [p.no, p.no + ' · ' + typeName(p.type)])) })
    ].join(''), `#/clients/${c.id}/tasks`);
  }

  function vLeads() {
    const ls = db.leads.filter(l => l.agent === agentId);
    return shell('leads', `<h1>לידים</h1><section class="panel"><div class="tbl"><table><thead><tr><th>שם</th><th>טלפון</th><th>מתעניין ב-</th><th>מקור</th><th>שלב</th><th>תאריך</th></tr></thead><tbody>
      ${ls.map(l => `<tr><td>${h(l.name)}</td><td class="num">${h(l.phone)}</td><td>${h(l.interest)}</td><td>${h(l.source)}</td><td><span class="pill">${h(l.stage)}</span></td><td class="num">${fmt(l.date)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">אין לידים.</td></tr>'}</tbody></table></div></section>`);
  }
  function vTasks() {
    const all = myClients().flatMap(c => c.tasks.map((t, i) => ({ t, i, c }))).sort((a, b) => (a.t.done - b.t.done) || a.t.due.localeCompare(b.t.due));
    return shell('tasks', `<h1>המשימות שלי</h1><section class="panel"><ul class="list">${all.map(({ t, i, c }) => `<li><label><input type="checkbox" data-toggle-task="${c.id}:${i}" ${t.done ? 'checked' : ''}> ${h(t.text)} · <a href="#/clients/${c.id}/tasks">${h(c.first + ' ' + c.last)}</a>${t.source ? `<span class="src">${h(t.source)}</span>` : ''}</label><span class="sub num">${fmt(t.due)}</span></li>`).join('') || '<li class="empty">אין משימות.</li>'}</ul></section>`);
  }
  function vReports() {
    const by = {};
    myClients().forEach(c => c.policies.forEach(p => { by[p.type] = (by[p.type] || 0) + p.premium; }));
    const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...rows.map(r => r[1]));
    return shell('reports', `<h1>דוחות</h1><section class="panel"><h2>פרמיה חודשית לפי מוצר <small>התיק שלי</small></h2><div class="bars">
      ${rows.map(([t, v]) => `<div class="bar"><span>${typeName(t)}</span><span class="track"><span class="fill" style="display:block;width:${v / max * 100}%"></span></span><span class="num">${nis(v)}</span></div>`).join('')}</div></section>`);
  }
  function vProfile() {
    const a = me(); const cs = myClients();
    return shell('', `<h1>תיק סוכן: ${h(a.name)}</h1><div class="grid">
      <section class="panel"><h2>פרטי הסוכן</h2><dl class="kv"><dt>תפקיד</dt><dd>${h(a.role)}</dd><dt>מספר רישיון</dt><dd class="num">${h(a.license)} (בדיוני)</dd><dt>טלפון</dt><dd class="num">${h(a.phone)}</dd><dt>דוא״ל</dt><dd>${h(a.email)}</dd><dt>בסוכנות מאז</dt><dd>${h(a.since)}</dd></dl></section>
      <section class="panel"><h2>הלקוחות שלי <small>${cs.length}</small></h2><ul class="list">${cs.map(c => `<li><a href="#/clients/${c.id}">${h(c.first + ' ' + c.last)}</a><span class="sub num">${nis(total(c))}</span></li>`).join('')}</ul></section></div>`);
  }

  // ---------- Render ----------
  function render() {
    const { parts, q } = route();
    document.body.dataset.agent = me() ? me().name : '';
    delete document.body.dataset.clientId;
    if (!me()) { app.innerHTML = vLogin(); return; }
    const [top, id, sub, pno, act] = parts;
    let html;
    if (!top || top === 'login' || top === 'dashboard') html = vDashboard();
    else if (top === 'clients' && id) {
      const c = client(id);
      if (!c) html = shell('clients', '<div class="empty">הלקוח לא נמצא בתיקים של הסוכן המחובר.</div>');
      else {
        document.body.dataset.clientId = c.id;
        if (sub === 'edit') html = vEdit(c);
        else if (sub === 'family' && pno === 'new') html = vFamilyNew(c);
        else if (sub === 'policies' && pno && act === 'edit') { const p = c.policies.find(x => x.no === pno); html = p ? vPolicyEdit(c, p) : vClient(c, 'policies'); }
        else if (sub === 'docs' && pno === 'new') html = vDocNew(c);
        else if (sub === 'notes' && pno === 'new') html = vNoteNew(c);
        else if (sub === 'tasks' && pno === 'new') html = vTaskNew(c);
        else html = vClient(c, TABS.some(t => t[0] === sub) ? sub : 'overview');
      }
    }
    else if (top === 'clients') html = vClients(q);
    else if (top === 'leads') html = vLeads();
    else if (top === 'tasks') html = vTasks();
    else if (top === 'reports') html = vReports();
    else if (top === 'profile') html = vProfile();
    else html = vDashboard();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = text;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }

  // ---------- Events ----------
  app.addEventListener('click', e => {
    const login = e.target.closest('[data-login]');
    if (login) { agentId = login.dataset.login; try { localStorage.setItem(SESSION_KEY, agentId); } catch (err) { /* ignore */ } location.hash = '#/dashboard'; render(); return; }
    const act = e.target.closest('[data-act]');
    if (act && act.dataset.act === 'logout') { agentId = null; try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* ignore */ } location.hash = '#/login'; render(); return; }
    if (act && act.dataset.act === 'reset') { db = seedDb(); save(); toast('נתוני הדמו אופסו'); render(); return; }
    const row = e.target.closest('tr[data-href]');
    if (row && !e.target.closest('a')) location.hash = row.dataset.href;
  });
  app.addEventListener('change', e => {
    const t = e.target.closest('[data-toggle-task]');
    if (!t) return;
    const [cid, i] = t.dataset.toggleTask.split(':');
    const c = client(cid); c.tasks[+i].done = t.checked;
    if (t.checked) log(c, 'משימה הושלמה: ' + c.tasks[+i].text);
    save(); render();
  });
  app.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    const v = n => (f.elements[n] ? f.elements[n].value.trim() : '');
    if (f.dataset.form === 'client-search') {
      const qs = new URLSearchParams(); if (v('q')) qs.set('q', v('q')); if (v('product')) qs.set('product', v('product'));
      location.hash = '#/clients' + (qs.toString() ? '?' + qs : ''); return;
    }
    const c = client(f.dataset.client); if (!c) return;
    const src = v('source');
    switch (f.dataset.form) {
      case 'client-edit': {
        const next = { first: v('first_name'), last: v('last_name'), birth: parse(v('birth')) || c.birth, phone: v('phone'), email: v('email'), job: v('job'), street: v('street'), city: v('city'), marital: v('marital'), smoker: v('smoker') === 'כן' };
        const labels = { first: 'שם פרטי', last: 'שם משפחה', birth: 'תאריך לידה', phone: 'טלפון', email: 'דוא״ל', job: 'עיסוק', street: 'רחוב', city: 'עיר', marital: 'מצב משפחתי', smoker: 'מעשן' };
        const changed = Object.keys(next).filter(k => next[k] !== c[k]);
        Object.assign(c, next);
        if (changed.length) log(c, 'עודכנו פרטים אישיים: ' + changed.map(k => labels[k]).join(', '), src);
        save(); toast('הפרטים נשמרו'); location.hash = `#/clients/${c.id}/personal`; break;
      }
      case 'family-new':
        c.family.push({ name: v('fm_name'), rel: v('fm_rel'), birth: parse(v('fm_birth')), insured: v('fm_insured') });
        log(c, 'נוסף בן משפחה: ' + v('fm_name'), src); save(); toast('בן המשפחה נוסף'); location.hash = `#/clients/${c.id}/family`; break;
      case 'policy-edit': {
        const p = c.policies.find(x => x.no === f.dataset.policy);
        const before = JSON.stringify(p);
        Object.assign(p, { premium: +v('premium') || 0, sum: +v('sum') || 0, renew: parse(v('renew')) || p.renew, status: v('status'), retention: v('retention'), note: v('policy_note') });
        if (JSON.stringify(p) !== before) log(c, `פוליסה ${p.no} עודכנה` + (p.retention === 'risk' ? ' (סומן סיכון נטישה)' : ''), src);
        save(); toast('הפוליסה נשמרה'); location.hash = `#/clients/${c.id}/policies`; break;
      }
      case 'doc-new':
        c.docs.push({ name: v('doc_name'), date: TODAY, status: v('doc_status') });
        log(c, 'נוספה בקשת מסמך: ' + v('doc_name'), src); save(); toast('המסמך נוסף'); location.hash = `#/clients/${c.id}/docs`; break;
      case 'note-new':
        c.notes.unshift({ date: TODAY, by: me().name, text: v('note_text'), source: src });
        log(c, 'נוספה הערה', src); save(); toast('ההערה נשמרה'); location.hash = `#/clients/${c.id}/notes`; break;
      case 'task-new':
        c.tasks.push({ text: v('task_text'), due: parse(v('task_due')) || TODAY, done: false, policyNo: v('task_policy'), source: src });
        log(c, 'נוספה משימה: ' + v('task_text'), src); save(); toast('המשימה נוספה'); location.hash = `#/clients/${c.id}/tasks`; break;
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('storage', e => { if (e.key === DB_KEY) { try { db = JSON.parse(e.newValue) || seedDb(); } catch (err) { db = seedDb(); } render(); } });
  render();
})();
