How to publish this `web/` project to GitHub and deploy to Vercel

1) Initialize git, commit, and create a GitHub repo using the GitHub CLI (recommended):

# from inside the web/ folder
git init
git add .
git commit -m "Initial commit for plugcraft web"
# create remote repo (replace <org-or-user> with your GitHub username or org)
gh repo create <org-or-user>/plugcraft --public --source=. --remote=origin --push

2) If you don't have `gh`, use standard git + GitHub UI:

git init
git add .
git commit -m "Initial commit for plugcraft web"
# create new repo on GitHub via web UI named 'plugcraft'
# then add remote and push
git remote add origin https://github.com/<org-or-user>/plugcraft.git
git branch -M main
git push -u origin main

3) Deploy to Vercel
- Sign in to Vercel and import the GitHub repo `plugcraft`.
- Vercel will detect Next.js and set the build command to `npm run build` and output to `.next`.
- Ensure the environment variables from your `.env.example` are added to the Vercel project settings.

Notes
- The repo content is the current contents of the `web/` folder. If you want me to instead create a top-level repo including other files, tell me and I'll provide an adjusted workflow.
