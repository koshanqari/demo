"use client";

import { Dialog } from "./Dialog";
import type { TableSchema } from "@/lib/schemas";

export function SchemaDialog({
  open,
  onClose,
  schema,
}: {
  open: boolean;
  onClose: () => void;
  schema: TableSchema;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${schema.title} table`}
      description={schema.description}
      size="xl"
    >
      <div className="space-y-5">
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-800">
                <th className="px-3 py-2 font-medium">Column</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {schema.columns.map((c) => (
                <tr key={c.col}>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                    {c.col}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-brand-700 dark:text-brand-400">
                    {c.type}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-sm font-semibold">DDL</h3>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
            <code>{schema.ddl}</code>
          </pre>
        </div>

        {schema.footer && <p className="text-xs text-zinc-500">{schema.footer}</p>}
      </div>
    </Dialog>
  );
}
