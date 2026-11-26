/* Nova CRM: fictional second CRM for the WrapUp demo. Different screens, field names and formats than אופק, on purpose. */
(function () {
  const SEED = window.WRAPUP_SEED;
  const DB_KEY = 'nova-db-v1';
  const SESSION_KEY = 'nova-user';
  const TODAY = SEED.today;
  const MARITAL = { single: 'רווק/ה', married: 'נשוי/אה', divorced: 'גרוש/ה', widowed: 'אלמן/ה' };
  const M_FROM_HE = { 'רווק': 'single', 'רווקה': 'single', 'נשוי': 'married', 'נשואה': 'married', 'גרוש': 'divorced', 'גרושה': 'divorced', 'אלמן': 'widowed', 'אלמנה': 'widowed' };
  const ROLE = { spouse: 'בן/בת זוג', child: 'ילד/ה', parent: 'הורה' };
  const STAGE = { new: 'חדש', quoted: 'הצעה נשלחה', won: 'נסגר' };
  const ATT = { pending: 'ממתין ללקוח', received: 'התקבל' };
  const KIND = { note: 'הערה', task: 'משימה', call: 'שיחה', system: 'מערכת' };

  const h = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const d8 = iso => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const money = n => '₪' + (n || 0).toLocaleString('he-IL');
  const digits = s => String(s || '').replace(/\D/g, '');
  const typeName = t => (SEED.TYPES[t] || { name: t }).name;

  function seedDb() {
    const s = JSON.parse(JSON.stringify(SEED));
    s.clients.forEach(c => {
      c.marital = M_FROM_HE[c.marital] || 'single';
      c.family = c.family.map(f => ({ name: f.name, role: f.rel === 'son' || f.rel === 'daughter' ? 'child' : f.rel, dob: f.birth }));
      c.policies.forEach(p => { p.risk = false; });
      c.attachments = c.docs.map(x => ({ title: x.name, date: x.date, state: x.status === 'missing' ? 'pending' : 'received' }));
      c.opps = [];
      c.activities = [
        ...c.notes.map(n => ({ kind: 'note', subject: n.text, date: n.date, by: n.by })),
        ...c.tasks.map(t => ({ kind: 'task', subject: t.text, date: t.due, due: t.due, by: '', done: t.done })),
        ...c.history.map(x => ({ kind: 'system', subject: x.text, date: x.date, by: x.by }))
      ].sort((a, b) => b.date.localeCompare(a.date));
      delete c.docs; delete c.notes; delete c.tasks; delete c.history;
    });
    return s;
  }
  let db;
  try { db = JSON.parse(localStorage.getItem(DB_KEY)) || seedDb(); } catch (e) { db = seedDb(); }
  const save = () => { try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e) { /* in memory */ } };
  let uid = null;
  try { uid = localStorage.getItem(SESSION_KEY); } catch (e) { /* ignore */ }
  const me = () => db.agents.find(a => a.id === uid);
  const mine = () => db.clients.filter(c => c.agent === uid);
  const contact = id => mine().find(c => c.id === id);
  const monthly = c => c.policies.reduce((a, p) => a + p.premium, 0);
  const sys = (c, subject, source) => c.activities.unshift({ kind: 'system', subject, date: TODAY, by: me().name, source: source || '' });

  const app = document.getElementById('app');
  const route = () => { const raw = location.hash.replace(/^#\/?/, ''); const [p, qs] = raw.split('?'); return { parts: p.split('/').filter(Boolean), q: new URLSearchParams(qs || '') }; };

  function frame(active, title, inner) {
    const a = me();
    const nav = [['home', 'היום'], ['contacts', 'אנשי קשר'], ['pipeline', 'הזדמנויות'], ['activities', 'פעילויות'], ['insights', 'תובנות']];
    return `<div class="layout"><nav class="rail" aria-label="ניווט ראשי"><div class="logo">NOVA</div>
      ${nav.map(([k, l]) => `<a href="#/${k}" class="${active === k ? 'on' : ''}">${l}</a>`).join('')}<span class="spacer"></span><a href="#/me" class="${active === 'me' ? 'on' : ''}">הפרופיל שלי</a></nav>
      <div class="page"><div class="bar"><b>${title}</b><div class="who"><a class="me" href="#/me">${h(a.name)}</a><button type="button" data-act="signout">התנתקות</button><button type="button" data-act="reset">איפוס נתוני דמו</button></div></div>
      <div class="content">${inner}</div></div></div>`;
  }

  function vSignin() {
    return `<div class="signin"><div><h1>Nova CRM</h1><p class="muted">מערכת דמה לצורך הדגמה. בחרו משתמש. אין סיסמאות ואין מידע אמיתי.</p></div>
      <div class="cards">${db.agents.map(a => `<button class="ccard" data-signin="${a.id}" style="text-align:start"><div class="top"><span class="dot">${h(a.name[0])}</span><b>${h(a.name)}</b></div><span class="muted">${h(a.role)}</span></button>`).join('')}</div></div>`;
  }

  function vHome() {
    const cs = mine();
    const due = cs.flatMap(c => c.activities.filter(x => x.kind === 'task' && !x.done).map(x => ({ x, c }))).sort((a, b) => a.x.due.localeCompare(b.x.due));
    const opps = cs.flatMap(c => c.opps);
    return frame('home', 'היום', `<h1>שלום ${h(me().name.split(' ')[0])}</h1>
      <div class="stats"><div class="stat"><b class="num">${cs.length}</b><span class="muted">אנשי קשר</span></div><div class="stat"><b class="num">${money(cs.reduce((a, c) => a + monthly(c), 0))}</b><span class="muted">הכנסה חודשית מכיסויים</span></div>
      <div class="stat"><b class="num">${opps.length}</b><span class="muted">הזדמנויות פתוחות</span></div><div class="stat"><b class="num">${due.length}</b><span class="muted">משימות פתוחות</span></div></div>
      <section class="box"><header><h2>משימות פתוחות</h2><a href="#/activities" class="muted">הכול</a></header>${due.length ? `<ul class="feed">${due.slice(0, 8).map(({ x, c }) => `<li><span class="kind task">משימה</span><span>${h(x.subject)}<br><a class="muted" href="#/contacts/${c.id}">${h(c.first + ' ' + c.last)}</a> · <span class="muted num">${d8(x.due)}</span></span></li>`).join('')}</ul>` : '<div class="empty">אין משימות פתוחות.</div>'}</section>`);
  }

  function vContacts(q) {
    const term = (q.get('search') || '').trim(); const d = digits(term);
    const list = mine().filter(c => !term || (c.first + ' ' + c.last).includes(term) || (d.length >= 3 && digits(c.phone).includes(d)));
    return frame('contacts', 'אנשי קשר', `<form class="searchbar" data-form="search" role="search"><input id="contact-search" name="search" value="${h(term)}" placeholder="חיפוש איש קשר לפי שם או מספר נייד" aria-label="חיפוש איש קשר"><button class="btn" type="submit">חיפוש</button></form>
      <div class="cards">${list.map(c => `<a class="ccard" href="#/contacts/${c.id}" data-contact-card="${c.id}"><div class="top"><span class="dot">${h(c.first[0])}</span><span><b>${h(c.first + ' ' + c.last)}</b><br><span class="muted num">${h(c.phone)}</span></span></div>
        <div class="chips"><span class="chip">${c.policies.length} כיסויים</span><span class="chip num">${money(monthly(c))}/חודש</span>${c.policies.some(p => p.risk) ? '<span class="chip bad">סיכון נטישה</span>' : ''}</div></a>`).join('') || '<div class="empty">לא נמצאו אנשי קשר.</div>'}</div>`);
  }

  function vContact(c) {
    const acts = c.activities;
    return frame('contacts', 'איש קשר', `<div data-contact-page="${c.id}" style="display:grid;gap:16px">
      <div class="muted"><a href="#/contacts">אנשי קשר</a> / ${h(c.first + ' ' + c.last)}</div>
      <div class="hero"><span class="dot">${h(c.first[0])}</span><div><h1>${h(c.first + ' ' + c.last)}</h1><div class="chips"><span class="chip">איש קשר ראשי</span><span class="chip num">${money(monthly(c))} לחודש</span><span class="chip">${c.policies.length} כיסויים</span></div></div></div>
      <div class="cols">
        <div class="stack">
          <section class="box"><header><h2>פרטי קשר</h2><a class="btn ghost sm" href="#/contacts/${c.id}/edit-contact">עריכה</a></header><div class="props">
            <div class="prop"><span>נייד</span><span class="num">${h(c.phone)}</span></div>
            <div class="prop"><span>אימייל</span><span data-nova="email_address">${h(c.email)}</span></div>
            <div class="prop"><span>כתובת מגורים</span><span><span data-nova="residence_street">${h(c.street)}</span>, <span data-nova="residence_city">${h(c.city)}</span></span></div>
            <div class="prop"><span>תאריך לידה</span><span class="num">${d8(c.birth)}</span></div>
            <div class="prop"><span>מצב משפחתי</span><span data-nova="family_status" data-value="${c.marital}">${MARITAL[c.marital]}</span></div>
            <div class="prop"><span>טבק</span><span data-nova="tobacco" data-value="${c.smoker}">${c.smoker ? 'משתמש/ת בטבק' : 'לא משתמש/ת'}</span></div>
            <div class="prop"><span>מקצוע</span><span>${h(c.job)}</span></div></div></section>
          <section class="box"><header><h2>משק בית</h2><a class="btn ghost sm" href="#/contacts/${c.id}/add-member">הוספת חבר משק בית</a></header>${c.family.length ? `<div class="props">${c.family.map(f => `<div class="prop" data-member="${h(f.name)}"><span>${ROLE[f.role]}</span><span>${h(f.name)} · <span class="num">${d8(f.dob)}</span></span></div>`).join('')}</div>` : '<div class="empty">אין חברי משק בית.</div>'}</section>
          <section class="box"><header><h2>קבצים מצורפים</h2><a class="btn ghost sm" href="#/contacts/${c.id}/request-attachment">בקשת קובץ</a></header><div class="props">${c.attachments.map(x => `<div class="prop"><span>${h(x.title)}</span><span class="chip ${x.state === 'pending' ? 'warn' : 'ok'}">${ATT[x.state]}</span></div>`).join('')}</div></section>
        </div>
        <div class="stack">
          <section class="box"><header><h2>כיסויים</h2></header>${c.policies.map(p => `<div class="cov" data-coverage="${p.no}"><b>${h(typeName(p.type))} ${p.risk ? '<span class="chip bad">סיכון נטישה</span>' : ''}</b><span class="price num" data-nova="monthly:${p.no}">${money(p.premium)}</span>
            <span class="muted">${h(p.insurer)} · <span class="mono">${p.no}</span>${p.sum ? ` · כיסוי <span class="num" data-nova="sum:${p.no}">${money(p.sum)}</span>` : ''} · חידוש <span class="num">${d8(p.renew)}</span>${p.note ? '<br>' + h(p.note) : ''}</span><a class="btn ghost sm" href="#/contacts/${c.id}/coverage/${p.no}">ניהול</a></div>`).join('')}</section>
          <section class="box"><header><h2>הזדמנויות</h2><a class="btn ghost sm" href="#/contacts/${c.id}/new-opportunity">הזדמנות חדשה</a></header>${c.opps.length ? `<div class="props">${c.opps.map(o => `<div class="prop"><span>${h(o.title)}${o.source ? `<span class="src">${h(o.source)}</span>` : ''}</span><span class="chip">${STAGE[o.stage]}</span></div>`).join('')}</div>` : '<div class="empty">אין הזדמנויות פתוחות.</div>'}</section>
          <section class="box"><header><h2>פעילות</h2><a class="btn ghost sm" href="#/contacts/${c.id}/log-activity">תיעוד פעילות</a></header><ul class="feed">${acts.map(x => `<li><span class="kind ${x.kind}">${KIND[x.kind]}</span><span>${h(x.subject)}${x.source ? `<span class="src">${h(x.source)}</span>` : ''}<br><span class="muted num">${x.kind === 'task' ? 'יעד ' + d8(x.due) : d8(x.date)}${x.by ? ' · ' + h(x.by) : ''}</span></span></li>`).join('')}</ul></section>
        </div>
      </div></div>`);
  }

  const inp = (name, label, value, o = {}) => {
    const id = 'n-' + name;
    if (o.options) return `<div class="f${o.wide ? ' wide' : ''}"><label for="${id}">${label}</label><select id="${id}" name="${name}">${Object.entries(o.options).map(([v, l]) => `<option value="${h(v)}" ${String(v) === String(value) ? 'selected' : ''}>${h(l)}</option>`).join('')}</select></div>`;
    if (o.check) return `<div class="f${o.wide ? ' wide' : ''}"><span class="toggle"><input type="checkbox" id="${id}" name="${name}" ${value ? 'checked' : ''}><label for="${id}" style="color:inherit;font-weight:400">${label}</label></span></div>`;
    if (o.area) return `<div class="f wide"><label for="${id}">${label}</label><textarea id="${id}" name="${name}" ${o.required ? 'required' : ''}>${h(value)}</textarea></div>`;
    return `<div class="f${o.wide ? ' wide' : ''}"><label for="${id}">${label}</label><input id="${id}" name="${name}" type="${o.type || 'text'}" value="${h(value)}" ${o.required ? 'required' : ''}></div>`;
  };
  const sheet = (c, title, form, inner, extra = '') => frame('contacts', title, `<div class="muted"><a href="#/contacts">אנשי קשר</a> / <a href="#/contacts/${c.id}">${h(c.first + ' ' + c.last)}</a> / ${title}</div>
    <form class="sheet" data-form="${form}" data-contact="${c.id}" ${extra}><h1>${title}</h1><div class="grid2">${inner}</div><input type="hidden" name="source" value="">
    <div class="row-actions"><button class="btn" type="submit">שמירת שינויים</button><a class="btn ghost" href="#/contacts/${c.id}">ביטול</a></div></form>`);

  const vEditContact = c => sheet(c, 'עריכת פרטי קשר', 'edit-contact', [
    inp('given_name', 'שם פרטי', c.first), inp('family_name', 'שם משפחה', c.last), inp('mobile', 'נייד', c.phone), inp('email_address', 'אימייל', c.email, { type: 'email' }),
    inp('residence_street', 'כתובת מגורים: רחוב ומספר', c.street), inp('residence_city', 'כתובת מגורים: יישוב', c.city), inp('date_of_birth', 'תאריך לידה', c.birth, { type: 'date' }),
    inp('family_status', 'מצב משפחתי', c.marital, { options: MARITAL }), inp('occupation', 'מקצוע', c.job), inp('tobacco', 'משתמש/ת במוצרי טבק', c.smoker, { check: true, wide: true })
  ].join(''));
  const vAddMember = c => sheet(c, 'הוספת חבר משק בית', 'add-member', [inp('member_full_name', 'שם מלא', '', { required: true }), inp('member_role', 'תפקיד במשק הבית', 'child', { options: ROLE }), inp('member_dob', 'תאריך לידה', '', { type: 'date' })].join(''));
  const vCoverage = (c, p) => sheet(c, `ניהול כיסוי ${p.no}`, 'coverage', [`<div class="f wide muted">${h(typeName(p.type))} · ${h(p.insurer)}</div>`,
    inp('monthly', 'תשלום חודשי (₪)', p.premium, { type: 'number' }), inp('coverage_amount', 'סכום כיסוי (₪)', p.sum || '', { type: 'number' }), inp('renewal_date', 'תאריך חידוש', p.renew, { type: 'date' }),
    inp('retention_risk', 'סיכון נטישה: הלקוח שוקל לעזוב', p.risk, { check: true, wide: true }), inp('coverage_notes', 'הערות לכיסוי', p.note, { area: true })].join(''), `data-coverage-no="${p.no}"`);
  const vNewOpp = c => sheet(c, 'הזדמנות חדשה', 'new-opportunity', [inp('opp_title', 'כותרת', '', { required: true, wide: true }), inp('opp_value', 'סכום מבוקש (₪)', '', { type: 'number' }),
    inp('opp_stage', 'שלב', 'new', { options: STAGE }), inp('opp_coverage', 'כיסוי קשור', '', { options: Object.fromEntries([['', 'ללא']].concat(c.policies.map(p => [p.no, p.no + ' · ' + typeName(p.type)]))) })].join(''));
  const vReqAtt = c => sheet(c, 'בקשת קובץ מהלקוח', 'request-attachment', [inp('att_title', 'שם הקובץ', '', { required: true, wide: true }), inp('att_state', 'מצב', 'pending', { options: ATT })].join(''));
  const vLog = c => sheet(c, 'תיעוד פעילות', 'log-activity', [inp('act_type', 'סוג', 'note', { options: { note: 'הערה', task: 'משימה', call: 'שיחה' } }), inp('act_due', 'תאריך יעד (למשימה)', '', { type: 'date' }), inp('act_subject', 'תוכן', '', { area: true, required: true })].join(''));

  function vPipeline() {
    const opps = mine().flatMap(c => c.opps.map(o => ({ o, c })));
    return frame('pipeline', 'הזדמנויות', `<h1>הזדמנויות</h1><div class="kanban">${Object.entries(STAGE).map(([k, l]) => `<div class="lane"><h3>${l}</h3>${opps.filter(x => x.o.stage === k).map(({ o, c }) => `<div class="opp"><b>${h(o.title)}</b><a class="muted" href="#/contacts/${c.id}">${h(c.first + ' ' + c.last)}</a>${o.value ? `<span class="num">${money(o.value)}</span>` : ''}${o.source ? `<span class="src">${h(o.source)}</span>` : ''}</div>`).join('') || '<span class="muted">אין</span>'}</div>`).join('')}</div>`);
  }
  function vActivities() {
    const all = mine().flatMap(c => c.activities.map(x => ({ x, c }))).sort((a, b) => b.x.date.localeCompare(a.x.date)).slice(0, 40);
    return frame('activities', 'פעילויות', `<h1>פעילויות</h1><section class="box"><ul class="feed">${all.map(({ x, c }) => `<li><span class="kind ${x.kind}">${KIND[x.kind]}</span><span>${h(x.subject)}${x.source ? `<span class="src">${h(x.source)}</span>` : ''}<br><a class="muted" href="#/contacts/${c.id}">${h(c.first + ' ' + c.last)}</a> · <span class="muted num">${d8(x.date)}</span></span></li>`).join('')}</ul></section>`);
  }
  function vInsights() {
    const cs = mine(); const risk = cs.flatMap(c => c.policies.filter(p => p.risk).map(p => ({ p, c })));
    return frame('insights', 'תובנות', `<h1>תובנות</h1><div class="stats"><div class="stat"><b class="num">${risk.length}</b><span class="muted">כיסויים בסיכון נטישה</span></div><div class="stat"><b class="num">${cs.filter(c => c.smoker).length}</b><span class="muted">לקוחות מעשנים</span></div><div class="stat"><b class="num">${cs.reduce((a, c) => a + c.attachments.filter(x => x.state === 'pending').length, 0)}</b><span class="muted">קבצים שממתינים ללקוח</span></div></div>
      <section class="box"><header><h2>כיסויים בסיכון נטישה</h2></header>${risk.length ? `<div class="props">${risk.map(({ p, c }) => `<div class="prop"><a href="#/contacts/${c.id}">${h(c.first + ' ' + c.last)}</a><span>${h(typeName(p.type))} · חידוש <span class="num">${d8(p.renew)}</span></span></div>`).join('')}</div>` : '<div class="empty">אין כרגע.</div>'}</section>`);
  }
  function vMe() {
    const a = me();
    return frame('me', 'הפרופיל שלי', `<h1>${h(a.name)}</h1><section class="box"><div class="props"><div class="prop"><span>תפקיד</span><span>${h(a.role)}</span></div><div class="prop"><span>רישיון</span><span class="num">${h(a.license)} (בדיוני)</span></div><div class="prop"><span>אנשי קשר בתיק</span><span class="num">${mine().length}</span></div><div class="prop"><span>אימייל</span><span>${h(a.email)}</span></div></div></section>`);
  }

  function render() {
    const { parts, q } = route();
    document.body.dataset.agent = me() ? me().name : '';
    delete document.body.dataset.clientId;
    if (!me()) { app.innerHTML = vSignin(); return; }
    const [top, id, sub, arg] = parts;
    let html;
    if (top === 'contacts' && id) {
      const c = contact(id);
      if (!c) html = frame('contacts', 'איש קשר', '<div class="empty">איש הקשר לא נמצא אצל המשתמש המחובר.</div>');
      else {
        document.body.dataset.clientId = c.id;
        if (sub === 'edit-contact') html = vEditContact(c);
        else if (sub === 'add-member') html = vAddMember(c);
        else if (sub === 'coverage' && arg) { const p = c.policies.find(x => x.no === arg); html = p ? vCoverage(c, p) : vContact(c); }
        else if (sub === 'new-opportunity') html = vNewOpp(c);
        else if (sub === 'request-attachment') html = vReqAtt(c);
        else if (sub === 'log-activity') html = vLog(c);
        else html = vContact(c);
      }
    } else if (top === 'contacts') html = vContacts(q);
    else if (top === 'pipeline') html = vPipeline();
    else if (top === 'activities') html = vActivities();
    else if (top === 'insights') html = vInsights();
    else if (top === 'me') html = vMe();
    else html = vHome();
    app.innerHTML = html;
    window.scrollTo(0, 0);
  }
  const toast = t => { const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); };

  app.addEventListener('click', e => {
    const s = e.target.closest('[data-signin]');
    if (s) { uid = s.dataset.signin; try { localStorage.setItem(SESSION_KEY, uid); } catch (err) { /* ignore */ } location.hash = '#/home'; render(); return; }
    const a = e.target.closest('[data-act]');
    if (a && a.dataset.act === 'signout') { uid = null; try { localStorage.removeItem(SESSION_KEY); } catch (err) { /* ignore */ } location.hash = '#/signin'; render(); }
    if (a && a.dataset.act === 'reset') { db = seedDb(); save(); toast('נתוני הדמו אופסו'); render(); }
  });
  app.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    const v = n => (f.elements[n] ? f.elements[n].value.trim() : '');
    const chk = n => !!(f.elements[n] && f.elements[n].checked);
    if (f.dataset.form === 'search') { location.hash = '#/contacts' + (v('search') ? '?search=' + encodeURIComponent(v('search')) : ''); return; }
    const c = contact(f.dataset.contact); if (!c) return;
    const src = v('source');
    switch (f.dataset.form) {
      case 'edit-contact': {
        const before = JSON.stringify(c);
        Object.assign(c, { first: v('given_name'), last: v('family_name'), phone: v('mobile'), email: v('email_address'), street: v('residence_street'), city: v('residence_city'), birth: v('date_of_birth') || c.birth, marital: v('family_status'), job: v('occupation'), smoker: chk('tobacco') });
        if (JSON.stringify(c) !== before) sys(c, 'פרטי הקשר עודכנו', src);
        break;
      }
      case 'add-member': c.family.push({ name: v('member_full_name'), role: v('member_role'), dob: v('member_dob') }); sys(c, 'נוסף חבר משק בית: ' + v('member_full_name'), src); break;
      case 'coverage': {
        const p = c.policies.find(x => x.no === f.dataset.coverageNo);
        Object.assign(p, { premium: +v('monthly') || 0, sum: +v('coverage_amount') || 0, renew: v('renewal_date') || p.renew, risk: chk('retention_risk'), note: v('coverage_notes') });
        sys(c, `כיסוי ${p.no} עודכן` + (p.risk ? ' · סיכון נטישה' : ''), src); break;
      }
      case 'new-opportunity': c.opps.push({ title: v('opp_title'), value: +v('opp_value') || 0, stage: v('opp_stage'), coverage: v('opp_coverage'), source: src }); sys(c, 'נפתחה הזדמנות: ' + v('opp_title'), src); break;
      case 'request-attachment': c.attachments.push({ title: v('att_title'), date: TODAY, state: v('att_state') }); sys(c, 'נשלחה בקשה לקובץ: ' + v('att_title'), src); break;
      case 'log-activity': c.activities.unshift({ kind: v('act_type'), subject: v('act_subject'), date: TODAY, due: v('act_due') || TODAY, by: me().name, source: src, done: false }); break;
    }
    save(); toast('נשמר'); location.hash = '#/contacts/' + c.id;
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('storage', e => { if (e.key === DB_KEY) { try { db = JSON.parse(e.newValue) || seedDb(); } catch (err) { db = seedDb(); } render(); } });
  render();
})();
