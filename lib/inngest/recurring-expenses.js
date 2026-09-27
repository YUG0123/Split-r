import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api"; // Verify your path relative to lib/inngest

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const generateRecurringExpenses = inngest.createFunction(
  { id: "generate-recurring-expenses", cron: "0 6 * * *" }, // daily at 6am UTC
  async ({ step }) => {
    const dueTemplates = await step.run("fetch-due-templates", () =>
      convex.query(api.inngest.getDueRecurringExpenses),
    );

    const results = await step.run("generate-instances", () =>
      Promise.all(
        dueTemplates.map((template) =>
          convex.mutation(api.inngest.createExpenseFromRecurringTemplate, {
            templateId: template._id,
          }),
        ),
      ),
    );

    return { processed: dueTemplates.length, results };
  },
);
