import { Head, Link, router } from "@inertiajs/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import AppLayout from "@/layouts/app-layout"
import type { CollectionConfig, RecordData, BreadcrumbItem } from "@/types"

interface PaginationMeta {
  current_page: number
  total_pages: number
  total_count: number
  per_page: number
}

interface CollectionIndexProps {
  collection: CollectionConfig
  records: RecordData[]
  meta: PaginationMeta
  filters: {
    search?: string
    sort?: string
    direction?: string
    page?: string
  }
}

function formatCellValue(value: unknown, type: string): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  switch (type) {
    case "boolean":
      return value ? (
        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
          Yes
        </span>
      ) : (
        <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
          No
        </span>
      )

    case "select": {
      const statusColors: Record<string, string> = {
        published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        draft:     "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        archived:  "bg-muted text-muted-foreground",
        active:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        inactive:  "bg-muted text-muted-foreground",
      }
      const color = statusColors[String(value)] ?? "bg-muted text-muted-foreground"
      return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${color}`}>
          {String(value)}
        </span>
      )
    }

    case "relationship":
      return typeof value === "object" && value !== null && "label" in value
        ? String((value as { label: string }).label)
        : String(value)

    case "datetime":
    case "date":
      return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: type === "datetime" ? "short" : undefined,
      } as Intl.DateTimeFormatOptions).format(new Date(String(value)))

    case "image":
      return typeof value === "string" ? (
        <img
          src={value}
          alt=""
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <span className="text-muted-foreground">—</span>
      )

    default: {
      const str = String(value)
      return str.length > 60 ? (
        <span title={str}>{str.slice(0, 60)}…</span>
      ) : (
        str
      )
    }
  }
}

export default function CollectionIndex({
  collection,
  records,
  meta,
  filters,
}: CollectionIndexProps) {
  const [search, setSearch] = useState(filters.search ?? "")
  const base = `/admin/${collection.slug}`

  const currentSort = filters.sort ?? collection.default_sort?.field ?? "created_at"
  const currentDir  = filters.direction ?? collection.default_sort?.direction ?? "desc"

  const breadcrumbs: BreadcrumbItem[] = [
    { title: collection.label_plural, href: base },
  ]

  function navigate(overrides: Record<string, string | number> = {}) {
    router.get(
      base,
      { search, sort: currentSort, direction: currentDir, page: 1, ...overrides },
      { preserveState: true, replace: true },
    )
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search, page: 1 })
  }

  function toggleSort(field: string) {
    if (!collection.sortable_fields.includes(field)) return
    const newDir =
      currentSort === field && currentDir === "asc" ? "desc" : "asc"
    navigate({ sort: field, direction: newDir })
  }

  function handleDelete(id: string | number) {
    if (!confirm("Delete this record? This cannot be undone.")) return
    router.delete(`${base}/${id}`, { onSuccess: () => router.reload() })
  }

  function columnLabel(fieldName: string) {
    const def = collection.fields.find((f) => f.name === fieldName)
    if (def) return def.label
    return fieldName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  function fieldType(fieldName: string) {
    return collection.fields.find((f) => f.name === fieldName)?.type ?? "text"
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={collection.label_plural} />

      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{collection.label_plural}</h1>
            {collection.description && (
              <p className="text-muted-foreground text-sm mt-0.5">
                {collection.description}
              </p>
            )}
          </div>
          <Button asChild>
            <Link href={`${base}/new`}>New {collection.label}</Link>
          </Button>
        </div>

        {/* ── Search ── */}
        {collection.searchable_fields.length > 0 && (
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="search"
              placeholder={`Search ${collection.label_plural.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("")
                  navigate({ search: "", page: 1 })
                }}
              >
                Clear
              </Button>
            )}
          </form>
        )}

        {/* ── Table ── */}
        <div className="border-sidebar-border/70 dark:border-sidebar-border overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {collection.list_fields.map((field) => (
                    <th
                      key={field}
                      className={[
                        "text-muted-foreground px-4 py-3 text-left text-xs font-medium uppercase tracking-wide",
                        collection.sortable_fields.includes(field)
                          ? "cursor-pointer select-none hover:text-foreground"
                          : "",
                      ].join(" ")}
                      onClick={() => toggleSort(field)}
                    >
                      <span className="flex items-center gap-1">
                        {columnLabel(field)}
                        {collection.sortable_fields.includes(field) && (
                          <span className="text-muted-foreground/50">
                            {currentSort === field
                              ? currentDir === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="text-muted-foreground px-4 py-3 text-right text-xs font-medium uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={collection.list_fields.length + 1}
                      className="text-muted-foreground py-12 text-center text-sm"
                    >
                      No {collection.label_plural.toLowerCase()} found.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id as string}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      {collection.list_fields.map((field) => (
                        <td key={field} className="px-4 py-3">
                          {formatCellValue(record[field], fieldType(field))}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`${base}/${record.id}`}>View</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`${base}/${record.id}/edit`}>Edit</Link>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-destructive hover:bg-destructive hover:text-secondary hover:outline-primary"
                            onClick={() =>
                              handleDelete(record.id as string | number)
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination ── */}
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {meta.current_page} of {meta.total_pages} ({meta.total_count} total)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === 1}
                onClick={() => navigate({ page: meta.current_page - 1 })}
              >
                ← Prev
              </Button>
              {Array.from({ length: meta.total_pages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - meta.current_page) <= 2)
                .map((page) => (
                  <Button
                    key={page}
                    variant={page === meta.current_page ? "default" : "outline"}
                    size="sm"
                    onClick={() => navigate({ page })}
                  >
                    {page}
                  </Button>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page === meta.total_pages}
                onClick={() => navigate({ page: meta.current_page + 1 })}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}