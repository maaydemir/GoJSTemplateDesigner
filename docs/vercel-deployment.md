# Deploying the GoJS Template Designer to Vercel

This repository includes a `vercel.json` configuration so the app can be deployed as a static Vite build on Vercel. Follow these steps to create a live example:

1. **Import the repo into Vercel.** Choose "Add New Project" in the Vercel dashboard and select this repository. Keep the project root as the repository root so `vercel.json` is applied automatically.
2. **Install and build with the defaults.** The `vercel.json` file runs `cd project && npm install` and `cd project && npm run build`, outputting the static site to `project/dist`.
3. **Set the output directory.** Vercel will publish the contents of `project/dist` automatically, so no extra configuration is required in the dashboard.
4. **Run previews locally if needed.** Inside `project/`, run `npm install`, then:
   - `npm run dev -- --host` to experience the live designer with hot reloading at http://localhost:5173.
   - `npm run preview -- --host --port 4173` after a build to serve the exact production bundle Vercel will host.

After the first deployment completes, Vercel will build and publish preview environments for pull requests and a production URL when you promote or merge changes.

## GitHub Actions trigger for PR previews

The repository also contains a `Vercel Preview Deploy` GitHub Actions workflow that can be triggered automatically for pull requests or manually via `workflow_dispatch`. Configure the following repository secrets so the workflow can create a deployment for the current PR branch and surface a "View deployment" button directly on the PR:

- `VERCEL_TOKEN`: A Vercel personal token with access to the project.
- `VERCEL_ORG_ID`: The organization ID where the Vercel project lives.
- `VERCEL_PROJECT_ID`: The ID of the Vercel project for this app.

When the workflow runs, it builds the Vite app, deploys a preview to Vercel, posts the unique preview URL as a PR comment, and registers a deployment entry so the PR shows a button that opens the preview.

If any of the secrets above are missing, the workflow will fail early with a clear message instead of prompting for `vercel login`.
