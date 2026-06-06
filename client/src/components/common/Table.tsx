import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface Column<T> {
  header: React.ReactNode;
  key: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  sortKey?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (sortKey: string) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  loadingMessage = "Updating List...",
  emptyMessage = "No items found matching your criteria.",
  sortBy,
  sortOrder,
  onSort,
}: TableProps<T>) {
  return (
    <div className="bg-zinc-950/70 border border-blue-500/10 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/5">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/40 text-zinc-300">
          <tr>
            {columns.map((column) => {
              const isSortable = column.sortable && onSort;
              const displaySortKey = column.sortKey || column.key;
              const isSortedActive = sortBy === displaySortKey;

              return (
                <th
                  key={column.key}
                  className={`text-left px-6 py-4 font-medium ${
                    isSortable ? "cursor-pointer hover:text-white transition-colors" : ""
                  }`}
                  onClick={() => isSortable && onSort(displaySortKey)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {isSortable && (
                      isSortedActive ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="w-3 h-3 text-blue-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-blue-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                      )
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-500/10">
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-zinc-500 animate-pulse uppercase tracking-widest text-xs"
              >
                {loadingMessage}
              </td>
            </tr>
          ) : data && data.length > 0 ? (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="bg-zinc-900/60 hover:bg-blue-500/5 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4">
                    {column.render ? column.render(item) : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
