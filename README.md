# Mozaik Insights — mozaikinsights.com

Static multi-dashboard site hosted on **GitHub Pages**, pointed at **mozaikinsights.com** via Namecheap DNS.

## Structure
```
/                       landing page (Home)
/marketing/             marketing hub
/marketing/unified/     Unified Marketing Dashboard
/sales/                 sales hub (placeholders)
/operations/            operations hub (placeholders)
/assets/style.css       shared styles + nav
/CNAME                  custom domain: mozaikinsights.com
```

Every page shares the same top nav: **Home · Marketing · Sales · Operations**.

## Add a new dashboard (30 seconds)
1. Create `dashboards/<department>/<slug>/index.html` (copy one of the existing ones).
2. Open `<department>/index.html` and add a new `<a class="card" href="<slug>/"> … </a>` block.
3. Commit & push. Live in ~30s.

## First-time deploy

### 1. Create the GitHub repo
- New repo: `mozaikinsights-site` (public).
- Upload every file/folder from this directory to the repo root.

### 2. Turn on GitHub Pages
- Repo → **Settings → Pages**
- Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)** → **Save**
- Custom domain: `mozaikinsights.com` → **Save** → check **Enforce HTTPS** once available.

### 3. Namecheap DNS
Domain List → **Manage** → **Advanced DNS** → delete any default parking records, then add:

| Type  | Host | Value                              |
|-------|------|------------------------------------|
| A     | @    | 185.199.108.153                    |
| A     | @    | 185.199.109.153                    |
| A     | @    | 185.199.110.153                    |
| A     | @    | 185.199.111.153                    |
| CNAME | www  | `<your-github-username>.github.io.`|

Wait 10–60 min for DNS. Visit `https://mozaikinsights.com`.

### 4. Replace the embedded dashboard (optional)
`marketing/unified/index.html` currently iframes the existing
`mozaik-unified-dashboard.html` on the old repo. For best results, copy that
HTML into this folder directly so everything lives under one domain.
