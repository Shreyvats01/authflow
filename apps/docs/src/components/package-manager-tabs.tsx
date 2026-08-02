"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PackageManager = "npm" | "bun" | "pnpm" | "yarn";

const managers: PackageManager[] = ["npm", "bun", "pnpm", "yarn"];
const storageKey = "bolkauth-package-manager";
const changeEvent = "bolkauth-package-manager-change";

const managerMeta: Record<PackageManager, { label: string; accent: string }> = {
  npm: { label: "npm", accent: "bg-red-500" },
  bun: { label: "Bun", accent: "bg-orange-400" },
  pnpm: { label: "pnpm", accent: "bg-yellow-400" },
  yarn: { label: "Yarn", accent: "bg-blue-400" },
};

function toPackageList(packages: string | string[]) {
  return Array.isArray(packages) ? packages.join(" ") : packages;
}

function isPackageManager(value: string | null): value is PackageManager {
  return value !== null && managers.includes(value as PackageManager);
}

function commandParts(command: string) {
  return command.split(" ");
}

function CommandText({ command }: { command: string }) {
  return (
    <code className="block min-w-max whitespace-pre px-4 py-4 font-mono text-[13px] leading-6 tracking-normal sm:px-5 sm:text-sm">
      <span className="select-none text-zinc-500">$ </span>
      {commandParts(command).map((part, index) => {
        const className =
          index === 0
            ? "text-sky-300"
            : part.startsWith("-")
              ? "text-violet-300"
              : part.startsWith("@")
                ? "text-emerald-300"
                : index === 1
                  ? "text-amber-200"
                  : "text-zinc-100";

        return (
          <span key={`${part}-${index}`} className={className}>
            {index > 0 ? " " : ""}
            {part}
          </span>
        );
      })}
    </code>
  );
}

function PackageManagerTabs({
  commands,
}: {
  commands: Record<PackageManager, string>;
}) {
  const [selected, setSelected] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);
  const command = commands[selected];

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (isPackageManager(stored)) {
      setSelected(stored);
    }

    function onManagerChange(event: Event) {
      const value = (event as CustomEvent<PackageManager>).detail;
      if (isPackageManager(value)) {
        setSelected(value);
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key === storageKey && isPackageManager(event.newValue)) {
        setSelected(event.newValue);
      }
    }

    window.addEventListener(changeEvent, onManagerChange);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(changeEvent, onManagerChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  function selectManager(manager: PackageManager) {
    setSelected(manager);
    window.localStorage.setItem(storageKey, manager);
    window.dispatchEvent(new CustomEvent(changeEvent, { detail: manager }));
  }

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="not-prose my-6 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 shadow-[0_18px_45px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 bg-zinc-900/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-zinc-400">
          <Terminal className="size-4 text-zinc-500" aria-hidden="true" />
          Install command
        </div>

        <div className="grid grid-cols-4 rounded-md border border-zinc-800 bg-zinc-950/70 p-1">
          {managers.map((manager) => {
            const active = selected === manager;

            return (
              <button
                key={manager}
                type="button"
                aria-pressed={active}
                onClick={() => selectManager(manager)}
                className={[
                  "relative h-8 min-w-14 rounded px-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  active
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "absolute left-2 top-1/2 size-1.5 -translate-y-1/2 rounded-full",
                    active ? managerMeta[manager].accent : "bg-zinc-700",
                  ].join(" ")}
                />
                <span className="pl-2">{managerMeta[manager].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto bg-[linear-gradient(180deg,rgba(39,39,42,0.32),rgba(9,9,11,0))]">
          <CommandText command={command} />
        </div>

        <button
          type="button"
          onClick={copyCommand}
          className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/90 text-zinc-400 shadow-sm transition-colors hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Copy command"
        >
          {copied ? (
            <Check className="size-4 text-emerald-300" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export function InstallTabs({
  packages,
  dev = false,
  global = false,
}: {
  packages: string | string[];
  dev?: boolean;
  global?: boolean;
}) {
  const packageList = toPackageList(packages);
  const commands = useMemo<Record<PackageManager, string>>(
    () => ({
      npm: `npm install${global ? " -g" : ""}${dev ? " -D" : ""} ${packageList}`,
      bun: `bun add${global ? " -g" : ""}${dev ? " -d" : ""} ${packageList}`,
      pnpm: `pnpm add${global ? " -g" : ""}${dev ? " -D" : ""} ${packageList}`,
      yarn: `${global ? "yarn global add" : `yarn add${dev ? " -D" : ""}`} ${packageList}`,
    }),
    [dev, global, packageList]
  );

  return <PackageManagerTabs commands={commands} />;
}

export function DlxTabs({
  packageName,
  args = "",
}: {
  packageName: string;
  args?: string;
}) {
  const suffix = args.trim() ? ` ${args.trim()}` : "";
  const commands = useMemo<Record<PackageManager, string>>(
    () => ({
      npm: `npx ${packageName}${suffix}`,
      bun: `bunx ${packageName}${suffix}`,
      pnpm: `pnpm dlx ${packageName}${suffix}`,
      yarn: `yarn dlx ${packageName}${suffix}`,
    }),
    [packageName, suffix]
  );

  return <PackageManagerTabs commands={commands} />;
}
