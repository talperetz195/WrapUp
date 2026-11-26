/* Fictional demo data shared by both demo CRMs. Every person, phone number and policy here is invented. */
(function () {
  const agents = [
    { id: 'avi', name: 'אבי לוי', license: '0-41287', role: 'סוכן ביטוח, ענפי חיים וכללי', phone: '03-555-0141', email: 'avi@demo-agency.example', since: '2016' },
    { id: 'ronit', name: 'רונית כץ', license: '0-38810', role: 'סוכנת ביטוח פנסיוני', phone: '03-555-0142', email: 'ronit@demo-agency.example', since: '2019' },
    { id: 'david', name: 'דוד אלון', license: '0-29934', role: 'סוכן ביטוח כללי', phone: '03-555-0143', email: 'david@demo-agency.example', since: '2012' }
  ];

  const TYPES = {
    life: { name: 'ביטוח חיים (ריסק)', pre: 'RK' },
    health: { name: 'ביטוח בריאות', pre: 'HB' },
    car: { name: 'ביטוח רכב מקיף', pre: 'CR' },
    home: { name: 'ביטוח דירה', pre: 'HM' },
    pension: { name: 'קרן פנסיה', pre: 'PN' },
    ltc: { name: 'ביטוח סיעודי', pre: 'LT' }
  };
  const INSURERS = ['מבטח א׳', 'מבטח ב׳', 'מבטח ג׳', 'מבטח ד׳'];

  const michal = {
    id: 'c101', agent: 'avi', first: 'מיכל', last: 'אברהם', idNo: '•••••4127', birth: '1989-03-14', phone: '052-441-8203', email: 'michal.a@example.com',
    street: 'הרצל 18', city: 'רחובות', marital: 'נשואה', job: 'מעצבת גרפית', smoker: true, since: '2024',
    family: [
      { name: 'עידו אברהם', rel: 'spouse', birth: '1987-08-02', insured: 'חיים' },
      { name: 'נועה אברהם', rel: 'daughter', birth: '2019-05-11', insured: 'בריאות' }
    ],
    policies: [
      { no: 'RK-448120', type: 'life', insurer: 'מבטח א׳', sum: 1000000, premium: 210, renew: '2027-03-01', status: 'active', retention: 'normal', note: '' },
      { no: 'HB-77314', type: 'health', insurer: 'מבטח ב׳', sum: 0, premium: 164, renew: '2027-07-01', status: 'active', retention: 'normal', note: '' },
      { no: 'CR-90211', type: 'car', insurer: 'מבטח ג׳', sum: 0, premium: 286, renew: '2027-01-26', status: 'active', retention: 'normal', note: '' },
      { no: 'HM-30588', type: 'home', insurer: 'מבטח א׳', sum: 0, premium: 72, renew: '2026-12-15', status: 'active', retention: 'normal', note: '' }
    ],
    docs: [
      { name: 'צילום תעודת זהות', date: '2024-01-12', status: 'received' },
      { name: 'טופס הצטרפות, ביטוח חיים', date: '2024-03-03', status: 'received' },
      { name: 'פוליסת רכב 2026', date: '2026-01-15', status: 'received' }
    ],
    notes: [{ date: '2026-09-02', by: 'אבי לוי', text: 'הלקוחה ביקשה לבדוק הרחבת כיסוי לטיפולי שיניים לבת.' }],
    tasks: [{ text: 'חידוש ביטוח דירה: לשלוח תזכורת', due: '2026-12-15', done: false, policyNo: 'HM-30588' }],
    history: [
      { date: '2026-09-02', text: 'שיחה יוצאת, 6 דק׳. תועדה ידנית.', by: 'אבי לוי' },
      { date: '2026-01-15', text: 'חידוש ביטוח רכב', by: 'אבי לוי' },
      { date: '2024-03-03', text: 'הצטרפות לביטוח חיים', by: 'אבי לוי' }
    ]
  };

  const shiran = {
    id: 'c102', agent: 'avi', first: 'שירן', last: 'דהן', idNo: '•••••8833', birth: '1993-06-21', phone: '054-772-1930', email: 'shiran.d@example.com',
    street: 'ז׳בוטינסקי 40', city: 'רמת גן', marital: 'רווקה', job: 'אחות', smoker: false, since: '2022',
    family: [],
    policies: [
      { no: 'HB-55120', type: 'health', insurer: 'מבטח ב׳', sum: 0, premium: 138, renew: '2027-04-01', status: 'active', retention: 'normal', note: '' },
      { no: 'CR-61877', type: 'car', insurer: 'מבטח ד׳', sum: 0, premium: 245, renew: '2027-03-10', status: 'active', retention: 'normal', note: '' }
    ],
    docs: [{ name: 'צילום תעודת זהות', date: '2022-05-04', status: 'received' }],
    notes: [],
    tasks: [],
    history: [{ date: '2026-03-10', text: 'חידוש ביטוח רכב', by: 'אבי לוי' }]
  };

  // Compact rows for the rest of the book: first, last, agent, birth, phone, street, city, marital, job, smoker, policies "type:premium[:sum]|..."
  const rows = [
    ['יוסי', 'מזרחי', 'avi', '1978-11-02', '050-318-4471', 'הגפן 3', 'מודיעין', 'נשוי', 'מהנדס תוכנה', false, 'life:182:1200000|health:171|pension:0|car:310'],
    ['משה', 'פרץ', 'avi', '1949-02-17', '052-660-1188', 'ויצמן 22', 'כפר סבא', 'נשוי', 'פנסיונר', false, 'ltc:265|health:298|home:88'],
    ['ליאת', 'גולן', 'avi', '1985-07-30', '053-902-7714', 'הדקל 11', 'חולון', 'גרושה', 'עורכת דין', false, 'life:121:800000|health:149'],
    ['אורי', 'שלום', 'avi', '1990-12-05', '058-447-2205', 'בן יהודה 90', 'תל אביב', 'רווק', 'שף', true, 'health:133|car:402'],
    ['נעמה', 'ביטון', 'ronit', '1982-04-19', '050-772-6640', 'הרימון 5', 'אשדוד', 'נשואה', 'מורה', false, 'pension:0|life:99:600000|health:158'],
    ['אלון', 'פרידמן', 'ronit', '1975-09-08', '052-118-9031', 'סוקולוב 14', 'הרצליה', 'נשוי', 'רואה חשבון', false, 'pension:0|ltc:142|home:95'],
    ['רחל', 'אוחיון', 'ronit', '1968-01-25', '054-339-5702', 'יפו 120', 'ירושלים', 'אלמנה', 'מנהלת חשבונות', false, 'health:211|ltc:188'],
    ['עומר', 'חדד', 'david', '1996-03-03', '053-610-4428', 'הנשיא 8', 'חיפה', 'רווק', 'סטודנט', false, 'car:355'],
    ['דנה', 'שגיא', 'david', '1988-10-14', '058-205-8816', 'אחד העם 31', 'פתח תקווה', 'נשואה', 'רופאה', false, 'life:240:2000000|health:177|home:110'],
    ['אייל', 'ברק', 'david', '1971-06-27', '050-944-3367', 'העצמאות 2', 'באר שבע', 'נשוי', 'קבלן', true, 'life:390:1500000|car:298|home:131']
  ];

  let seq = 0;
  const clients = [michal, shiran];
  rows.forEach((r, i) => {
    const [first, last, agent, birth, phone, street, city, marital, job, smoker, pol] = r;
    const policies = pol.split('|').map((p, j) => {
      const [type, premium, sum] = p.split(':');
      seq++;
      const no = TYPES[type].pre + '-' + String(31000 + seq * 1237 + i * 71).slice(0, 5);
      const m = String(((i + j) % 12) + 1).padStart(2, '0');
      return { no, type, insurer: INSURERS[(i + j) % 4], sum: sum ? +sum : 0, premium: +premium || 0, renew: (j % 2 ? '2027-' : '2026-12-').replace('2026-12-', '2026-12-') + (j % 2 ? m + '-01' : '2' + ((i % 8) + 1)), status: 'active', retention: 'normal', note: '' };
    });
    clients.push({
      id: 'c' + (103 + i), agent, first, last, idNo: '•••••' + String(1000 + i * 733).slice(-4), birth, phone,
      email: 'client' + (103 + i) + '@example.com', street, city, marital, job, smoker, since: String(2015 + (i % 9)),
      family: [], policies, docs: [{ name: 'צילום תעודת זהות', date: '2023-0' + ((i % 9) + 1) + '-10', status: 'received' }],
      notes: [], tasks: i % 3 === 0 ? [{ text: 'שיחת סקירה שנתית', due: '2026-12-0' + ((i % 8) + 1), done: false, policyNo: policies[0].no }] : [],
      history: [{ date: '2026-0' + ((i % 9) + 1) + '-1' + (i % 9), text: 'שיחת שירות', by: agents.find(a => a.id === agent).name }]
    });
  });

  const leads = [
    { name: 'גיל רוזן', phone: '050-221-7780', interest: 'ביטוח חיים', source: 'אתר', agent: 'avi', stage: 'חדש', date: '2026-11-24' },
    { name: 'מאיה לנדאו', phone: '052-908-1143', interest: 'ביטוח בריאות', source: 'הפניה', agent: 'avi', stage: 'נוצר קשר', date: '2026-11-20' },
    { name: 'תומר עזרא', phone: '054-330-9921', interest: 'ביטוח רכב', source: 'פייסבוק', agent: 'david', stage: 'הצעה נשלחה', date: '2026-11-18' },
    { name: 'הדס כהן', phone: '053-771-2048', interest: 'פנסיה', source: 'הפניה', agent: 'ronit', stage: 'חדש', date: '2026-11-25' },
    { name: 'ניר אשכנזי', phone: '058-610-3376', interest: 'ביטוח דירה', source: 'אתר', agent: 'avi', stage: 'הצעה נשלחה', date: '2026-11-12' }
  ];

  window.WRAPUP_SEED = { agents, clients, leads, TYPES, today: '2026-11-26' };
})();
