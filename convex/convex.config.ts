import polar from "@convex-dev/polar/convex.config.js";
import rag from "@convex-dev/rag/convex.config";
import ratelimiter from "@convex-dev/ratelimiter/convex.config";
import resend from "@convex-dev/resend/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(polar);
app.use(rag);
app.use(resend);
app.use(ratelimiter);

export default app;
