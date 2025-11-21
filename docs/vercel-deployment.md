# Deploying the GoJS Template Designer to Vercel

This repository includes a `vercel.json` configuration so the app can be deployed as a static Vite build on Vercel. Follow these steps to create a live example:

1. **Import the repo into Vercel.** Choose "Add New Project" in the Vercel dashboard and select this repository. Keep the project root as the repository root so `vercel.json` is applied automatically.
2. **Install and build with the defaults.** The `vercel.json` file runs `cd project && npm install` and `cd project && npm run build`, outputting the static site to `project/dist`.
3. **Set the output directory.** Vercel will publish the contents of `project/dist` automatically, so no extra configuration is required in the dashboard.
4. **Run previews locally if needed.** You can mirror the Vercel build locally by running `npm install` and `npm run build` inside the `project` directory, or use `npm run dev` for a development server.

After the first deployment completes, Vercel will build and publish preview environments for pull requests and a production URL when you promote or merge changes.
