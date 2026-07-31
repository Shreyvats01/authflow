import { log, spinner } from "@clack/prompts";
import fs from "fs-extra";
import path from "path";

export async function generate(args: string[]) {
  if (args.length === 0) {
    log.error("Please specify what to generate (env or types).");
    return;
  }

  const target = args[0];
  const s = spinner();

  if (target === "env") {
    s.start("Generating .env.example...");
    const envContent = `
# AuthFlow Environment Variables
AUTHFLOW_SECRET=your_super_secret_key_here
DATABASE_URL=postgres://user:password@localhost:5432/db
# OAuth Providers (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
`;
    await fs.writeFile(path.join(process.cwd(), ".env.example"), envContent.trim() + "\\n");
    s.stop("Generated .env.example");
  } else if (target === "types") {
    s.start("Generating types...");
    const typesDir = path.join(process.cwd(), "types");
    await fs.ensureDir(typesDir);
    
    const typesContent = `
export type User = {
  id: string | number;
  email: string;
  createdAt: Date;
};
`;
    await fs.writeFile(path.join(typesDir, "authflow.d.ts"), typesContent.trim() + "\\n");
    s.stop("Generated types at types/authflow.d.ts");
  } else {
    log.error(`Unknown generate target: ${target}`);
  }
}
