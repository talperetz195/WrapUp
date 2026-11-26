# WrapUp
AI Venture Night | Hackaton

## Demo CRM sites

Two fictional insurance-agency CRMs used to demo WrapUp. They are deliberately different from each other (screens, field names, date formats) so the same tool can be shown working against more than one system.

| Site | Path | What's inside |
| --- | --- | --- |
| אופק | `ofek/` | Agent login, dashboard, client list with search, client file (overview, personal details, family, policies, documents, notes, tasks, history), edit forms, leads, tasks, reports, agent profile |
| Nova | `nova/` | User sign-in, today view, contacts, contact page (contact details, household, coverages, opportunities, attachments, activity), edit forms, opportunities pipeline, activities, insights |

`index.html` at the repo root links to both. `shared/seed.js` holds the fictional data both sites start from.

### Using the sites
- Sign in as **אבי לוי**. He owns the demo clients מיכל אברהם and שירן דהן.
- Changes are saved in the browser's localStorage only. Nothing is sent to a server.
- **איפוס נתוני דמו** in each site's header restores the starting data.

### Running locally
From the repo root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/ in Chrome.

### Publishing with GitHub Pages
A repo admin enables it once: **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`. The sites are then at `https://talperetz195.github.io/WrapUp/`.

All people, phone numbers, policies and insurers in this data are invented.
