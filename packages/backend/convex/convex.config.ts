import { defineApp } from "convex/server";
import betterAuth from "@convex-dev/better-auth/convex.config";
import agent from "@convex-dev/agent/convex.config";
import r2 from "@convex-dev/r2/convex.config";
import dodopayments from "@dodopayments/convex/convex.config";

const app = defineApp();
app.use(betterAuth);
app.use(agent);
app.use(r2);
app.use(dodopayments);

export default app;
