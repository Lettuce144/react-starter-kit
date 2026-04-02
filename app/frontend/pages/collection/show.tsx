import { Head, Link, router } from "@inertiajs/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import type { CollectionConfig, FieldDefinition, RecordData } from "./types"

// ── Field value renderers ─────────────────────────────────────────────────────

function renderValue(field: FieldDefinition, value: unknown): React.ReactNode {
    if (value === null || value === undefined || value === "") {
        return <span className="text-muted-foreground text-sm">—</span>
    }

    switch (field.type) {
        case "boolean":
            return value ? (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                    Yes
                </Badge>
            ) : (
                <Badge variant="secondary">No</Badge>
            )

        case "select": {
            const statusStyles: Record<string, string> = {
                published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
                draft: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0",
                archived: "border-0",
                active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
                inactive: "border-0",
            }
            const style = statusStyles[String(value)] ?? "border-0"
            return (
                <Badge variant="secondary" className={`capitalize ${style}`}>
                    {String(value)}
                </Badge>
            )
        }

        case "relationship":
            return typeof value === "object" && value !== null && "label" in value
                ? <span className="text-sm">{String((value as { label: string }).label)}</span>
                : <span className="text-sm">{String(value)}</span>

        case "datetime":
        case "date":
            return (
                <span className="text-sm">
                    {new Intl.DateTimeFormat("en-US", {
                        dateStyle: "long",
                        timeStyle: field.type === "datetime" ? "short" : undefined,
                    } as Intl.DateTimeFormatOptions).format(new Date(String(value)))}
                </span>
            )

        case "image":
            return typeof value === "string" ? (
                <img
                    src={value}
                    alt={field.label}
                    className="max-h-48 rounded-lg object-cover border"
                />
            ) : null

        case "rich_text":
        case "textarea": {
            const text = String(value)
            return (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
            )
        }

        case "url":
            return (
                <a
                    href={String(value)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                >
                    {String(value)}
                </a>
            )

        case "email":
            return (
                <a
                    href={`mailto:${value}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                >
                    {String(value)}
                </a>
            )

        default:
            return <span className="text-sm">{String(value)}</span>
    }
}

// ── Field row ─────────────────────────────────────────────────────────────────

function FieldRow({ field, value }: { field: FieldDefinition; value: unknown }) {
    const isBlock = ["rich_text", "textarea", "image", "json"].includes(field.type)

    if (isBlock) {
        return (
            <div className="flex flex-col gap-2 py-4 border-b last:border-0">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    {field.label}
                </span>
                {renderValue(field, value)}
            </div>
        )
    }

    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
            <span className="text-muted-foreground text-sm shrink-0 w-40">
                {field.label}
            </span>
            <div className="text-right">
                {renderValue(field, value)}
            </div>
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface CollectionShowProps {
    collection: CollectionConfig
    record: RecordData
}

export default function CollectionShow({
    collection,
    record,
}: CollectionShowProps) {
    const base = `/admin/${collection.slug}`

    const breadcrumbs: BreadcrumbItem[] = [
        { title: collection.label_plural, href: base },
        { title: `#${record.id}`, href: `${base}/${record.id}` },
    ]

    // Try to find a human-readable record title
    const recordTitle =
        (record.title ?? record.name ?? record.email ?? `#${record.id}`) as string

    function handleDelete() {
        if (!confirm("Delete this record? This cannot be undone.")) return
        router.delete(`${base}/${record.id}`, {
            onSuccess: () => router.visit(base),
        })
    }

    // Separate fields into main and sidebar groups
    const sidebarTypes = ["boolean", "select", "date", "datetime", "relationship"]
    const mainFields = collection.fields.filter(
        (f) => !f.hidden && !sidebarTypes.includes(f.type),
    )
    const sidebarFields = collection.fields.filter(
        (f) => !f.hidden && sidebarTypes.includes(f.type),
    )

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${collection.label} — ${recordTitle}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">{recordTitle}</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {collection.label} #{record.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`${base}/${record.id}/edit`}>Edit</Link>
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">

                    {/* ── Main fields ── */}
                    <div className="flex flex-col gap-6">
                        {mainFields.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {mainFields.map((field) => (
                                        <FieldRow
                                            key={field.name}
                                            field={field}
                                            value={record[field.name]}
                                        />
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    <div className="flex flex-col gap-4">

                        {/* Status / meta fields */}
                        {sidebarFields.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Meta</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sidebarFields.map((field) => (
                                        <FieldRow
                                            key={field.name}
                                            field={field}
                                            value={record[field.name]}
                                        />
                                    ))}
                                </CardContent>
                                {/* Timestamps */}
                                {collection.timestamps && (
                                    <CardContent className="flex flex-col gap-3 ">
                                        {record.created_at && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-xs">Created</span>
                                                <span className="text-sm">
                                                    {new Intl.DateTimeFormat("en-US", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    }).format(new Date(record.created_at as string))}
                                                </span>
                                            </div>
                                        )}
                                        {record.updated_at && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-muted-foreground text-xs">Last updated</span>
                                                <span className="text-sm">
                                                    {new Intl.DateTimeFormat("en-US", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    }).format(new Date(record.updated_at as string))}
                                                </span>
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        )}


                        {/* Back link */}
                        <Button variant="ghost" size="sm" className="w-full" asChild>
                            <Link href={base}>← Back to {collection.label_plural}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}