# Push this repo to GitHub — step-by-step

Your prepared git repo is inside `mozaik-sales-funnel-repo.zip`. It already has:
- All three deliverables committed (`Enterprise_Sales_Dashboard.html`, `Enterprise_Sales_Funnel_Clean.xlsx`, `README.md`)
- A `.gitignore` that excludes LibreOffice/Excel lock files
- Commit authored as Balamir &lt;balamir@mozaikdesign.com&gt; on branch `main`

## One-time: extract the zip

Unzip `mozaik-sales-funnel-repo.zip` somewhere convenient on your computer (e.g. your Documents folder). That gives you a `mozaik-sales-funnel/` folder with the git history already inside.

## Create the empty repo on GitHub

1. Go to https://github.com/new
2. **Repository name:** `mozaik-sales-funnel` (or whatever you prefer)
3. **Visibility:** **Private** ✅
4. Leave "Add a README", "Add .gitignore", and "Choose a license" **unchecked** — the repo already has those locally
5. Click **Create repository**

GitHub will show you a "push an existing repository from the command line" section. Copy the HTTPS URL it gives you; it looks like:

```
https://github.com/<your-username>/mozaik-sales-funnel.git
```

## Push from your machine

Open a terminal and run:

```bash
cd path/to/mozaik-sales-funnel
git remote add origin https://github.com/<your-username>/mozaik-sales-funnel.git
git push -u origin main
```

You'll be prompted to authenticate:
- **macOS:** the Git Credential Manager pops a browser window — log in once, done.
- **Windows:** same (Git Credential Manager for Windows).
- **Linux / no credential helper:** either use a **Personal Access Token** (github.com → Settings → Developer settings → Personal access tokens → Tokens (classic) → "Generate new token" → check the `repo` scope → copy the token and paste it as the password when git prompts), or install GitHub CLI (`gh auth login`).

## Verify

Refresh the repo page — you should see `README.md` rendered, plus the HTML and XLSX files. Click `Enterprise_Sales_Dashboard.html` → "Raw" to download and open it locally. GitHub won't render the HTML inline (for security), but anyone with access can download and open.

## Sharing

- In the repo → **Settings → Collaborators and teams → Add people** to give specific teammates access.
- Or share a time-boxed link through **Settings → Code security and analysis** or via a GitHub Organization if you have one.

## If you want, later

- Enable **GitHub Pages** (Settings → Pages → Source: `main` branch, `/root`) — that would host the dashboard HTML at a shareable URL. **Don't do this** with client data unless you make the repo public, because Pages is always publicly served.
