# Multi-Project Workspace README

This repository contains three separate web projects. Quick links, purpose, and run instructions for each project are below.

## Projects overview
- Cafe landing page: [cafe/index.html](cafe/index.html), [cafe/style.css](cafe/style.css), [cafe/images/](cafe/images/)
- Mid assignment (fullstack sample): [Mid assignment/README.md](Mid%20assignment/README.md)
- Portfolio: [portfolio/index.html](portfolio/index.html), [portfolio/style.css](portfolio/style.css), [portfolio/script.js](portfolio/script.js)

---

## 1) Cafe (static landing)
Location:
- [cafe/index.html](cafe/index.html)
- [cafe/style.css](cafe/style.css)
- [cafe/images/brands/](cafe/images/brands/)

How to run:
- Open [cafe/index.html](cafe/index.html) in a browser, or serve the folder:
  - Python: `python -m http.server 8000` from the `cafe/` directory.

Notes:
- Static HTML/CSS only.

---

## 2) Mid assignment (backend + frontend + db)
Top-level files:
- [Mid assignment/docker-compose.yml](Mid%20assignment/docker-compose.yml)
- [Mid assignment/requirements.txt](Mid%20assignment/requirements.txt)
- [Mid assignment/.gitignore](Mid%20assignment/.gitignore)
- [Mid assignment/BUGFIXES.md](Mid%20assignment/BUGFIXES.md)
- [Mid assignment/README.md](Mid%20assignment/README.md)

Backend:
- [Mid assignment/backend/index.php](Mid%20assignment/backend/index.php)
- [Mid assignment/backend/config.php](Mid%20assignment/backend/config.php)
- [Mid assignment/backend/Dockerfile](Mid%20assignment/backend/Dockerfile)
- [Mid assignment/backend/.htaccess](Mid%20assignment/backend/.htaccess)

Frontend:
- [Mid assignment/frontend/index.html](Mid%20assignment/frontend/index.html)
- [Mid assignment/frontend/app.js](Mid%20assignment/frontend/app.js)
- [Mid assignment/frontend/types.ts](Mid%20assignment/frontend/types.ts)
- [Mid assignment/frontend/nginx.conf](Mid%20assignment/frontend/nginx.conf)
- [Mid assignment/frontend/Dockerfile](Mid%20assignment/frontend/Dockerfile)

Database:
- [Mid assignment/db/init.sql](Mid%20assignment/db/init.sql)

How to run (recommended):
- From the `Mid assignment/` root: `docker-compose up --build`
  - This uses the included Dockerfiles and `docker-compose.yml`.

Alternative (without Docker):
- Set up a PHP web server for `backend/` and a static server for `frontend/`.
- Import SQL in [Mid assignment/db/init.sql](Mid%20assignment/db/init.sql) into your DB.

---

## 3) Portfolio (static)
Location:
- [portfolio/index.html](portfolio/index.html)
- [portfolio/style.css](portfolio/style.css)
- [portfolio/script.js](portfolio/script.js)

How to run:
- Open [portfolio/index.html](portfolio/index.html) in a browser, or serve the folder:
  - Python: `python -m http.server 8001` from the `portfolio/` directory.

---

## Notes & maintenance
- Use the project-specific README: [Mid assignment/README.md](Mid%20assignment/README.md) for detailed Mid assignment notes.
- For quick local testing of static sites, use a simple HTTP server to avoid CORS/file-protocol issues.
- If you want CI, build scripts, or consolidated docker configuration, add them to the root and note them here.

If you want, I can:
- Add run scripts to package.json or Makefile.
- Consolidate Docker setup across projects.