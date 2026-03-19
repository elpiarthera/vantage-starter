import polar from "@convex-dev/polar/convex.config.js";
import rag from "@convex-dev/rag/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(polar);
app.use(rag);

export default app;
