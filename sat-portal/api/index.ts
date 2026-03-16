// Vercel serverless entry point — forwards all /api/* requests to the Express app.
// Vercel automatically handles the Node.js runtime for files in /api.
export { default } from "../apps/api/src/index";
