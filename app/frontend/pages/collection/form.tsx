import { Head, useForm } from "@inertiajs/react"
import { useCallback } from "react"

import InputError from "@/components/input-error"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AppLayout from "@/layouts/app-layout"
import type {
  BreadcrumbItem,
  CollectionConfig,
  FieldDefinition,
  FormErrors,
  RecordData,
  RelationshipOptions,
} from "@/types"

// ── Field components ──────────────────────────────────────────────────────────

function FieldWrapper({
  field,
  children,
  errors,
}: {
  field: FieldDefinition
  children: React.ReactNode
  errors: FormErrors
}) {
  const fieldErrors = errors[field.name]
  return (
    <div className="grid gap-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {field.description && (
        <p className="text-muted-foreground text-xs">{field.description}</p>
      )}
      <InputError messages={fieldErrors} />
    </div>
  )
}

function TextField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Input
      id={field.name}
      type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? field.label}
      maxLength={field.max_length}
      minLength={field.min_length}
      required={field.required}
      readOnly={field.read_only}
      autoComplete="off"
    />
  )
}

function SlugField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center">
      <span className="border-input bg-muted text-muted-foreground flex h-9 items-center rounded-l-md border border-r-0 px-3 text-sm select-none">
        /
      </span>
      <Input
        id={field.name}
        value={value ?? ""}
        onChange={(e) =>
          onChange(
            e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "-")
              .replace(/-+/g, "-"),
          )
        }
        placeholder="url-slug"
        className="rounded-l-none font-mono text-sm"
        required={field.required}
      />
    </div>
  )
}

function TextareaField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      id={field.name}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? field.label}
      maxLength={field.max_length}
      rows={4}
      required={field.required}
      readOnly={field.read_only}
      className="border-input placeholder:text-muted-foreground focus-visible:ring-ring/50 flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}

function NumberField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <Input
      id={field.name}
      type="number"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      min={field.min}
      max={field.max}
      required={field.required}
    />
  )
}

function BooleanField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={field.name}
        checked={!!value}
        onCheckedChange={(checked) => onChange(checked === true)}
        disabled={field.read_only}
      />
      <Label htmlFor={field.name} className="font-normal cursor-pointer">
        {value ? "Yes" : "No"}
      </Label>
    </div>
  )
}

function SelectField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: string
  onChange: (v: string) => void
}) {
  const options = (field.options ?? []).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  )

  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger id={field.name} className="w-full">
        <SelectValue placeholder={`Select ${field.label.toLowerCase()}…`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RelationshipField({
  field,
  value,
  onChange,
  relationshipOptions,
}: {
  field: FieldDefinition
  value: { id: number | string } | string | number | null
  onChange: (v: string | null) => void
  relationshipOptions: RelationshipOptions
}) {
  const options = relationshipOptions[field.name] ?? []
  const currentVal =
    value && typeof value === "object" && "id" in value
      ? String(value.id)
      : value
        ? String(value)
        : ""

  return (
    <Select value={currentVal} onValueChange={(v) => onChange(v || null)}>
      <SelectTrigger id={field.name} className="w-full">
        <SelectValue placeholder="— None —" />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DateTimeField({
  field,
  value,
  onChange,
}: {
  field: FieldDefinition
  value: string | null
  onChange: (v: string | null) => void
}) {
  const localValue = value
    ? new Date(value).toISOString().slice(0, field.type === "date" ? 10 : 16)
    : ""

  return (
    <Input
      id={field.name}
      type={field.type === "date" ? "date" : "datetime-local"}
      value={localValue}
      onChange={(e) =>
        onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
      }
      required={field.required}
    />
  )
}

// ── Field router ──────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  relationshipOptions,
}: {
  field: FieldDefinition
  value: unknown
  onChange: (v: unknown) => void
  relationshipOptions: RelationshipOptions
}) {
  switch (field.type) {
    case "text":
    case "email":
    case "url":
      return (
        <TextField
          field={field}
          value={value as string}
          onChange={onChange}
        />
      )
    case "slug":
      return (
        <SlugField field={field} value={value as string} onChange={onChange} />
      )
    case "textarea":
    case "rich_text":
      return (
        <TextareaField
          field={field}
          value={value as string}
          onChange={onChange}
        />
      )
    case "number":
      return (
        <NumberField
          field={field}
          value={value as number | null}
          onChange={onChange}
        />
      )
    case "boolean":
      return (
        <BooleanField
          field={field}
          value={value as boolean}
          onChange={onChange}
        />
      )
    case "select":
      return (
        <SelectField
          field={field}
          value={value as string}
          onChange={onChange}
        />
      )
    case "relationship":
      return (
        <RelationshipField
          field={field}
          value={value as string | null}
          onChange={onChange}
          relationshipOptions={relationshipOptions}
        />
      )
    case "date":
    case "datetime":
      return (
        <DateTimeField
          field={field}
          value={value as string | null}
          onChange={onChange}
        />
      )
    default:
      return (
        <TextField
          field={field}
          value={value as string}
          onChange={onChange}
        />
      )
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

interface CollectionFormProps {
  collection: CollectionConfig
  record?: RecordData | null
  errors?: FormErrors
  relationship_options?: RelationshipOptions
}

export default function CollectionForm({
  collection,
  record,
  errors: serverErrors = {},
  relationship_options = {},
}: CollectionFormProps) {
  const isNew = !record?.id
  const base = `/admin/${collection.slug}`

  const breadcrumbs: BreadcrumbItem[] = [
    { title: collection.label_plural, href: base },
    {
      title: isNew ? `New ${collection.label}` : `Edit`,
      href: isNew ? `${base}/new` : `${base}/${record?.id}/edit`,
    },
  ]

  // Build initial form data from record values or field defaults
  const initialData: RecordData = {}
  collection.fields.forEach((field) => {
    if (record && field.name in record) {
      initialData[field.name] = record[field.name]
    } else if (field.default !== undefined) {
      initialData[field.name] = field.default
    } else {
      initialData[field.name] = null
    }
  })

  const { data, setData, post, put, processing, errors } =
    useForm<RecordData>(initialData)

  const allErrors: FormErrors = { ...serverErrors }
  Object.entries(errors).forEach(([k, v]) => {
    allErrors[k] = typeof v === "string" ? [v] : (v as string[])
  })

  const setField = useCallback(
    (name: string, value: unknown) => setData(name as keyof RecordData, value),
    [setData],
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isNew) {
      post(base)
    } else {
      put(`${base}/${record!.id}`)
    }
  }

  const editableFields = collection.fields.filter(
    (f) => !f.hidden && !f.read_only,
  )
  const readOnlyFields = collection.fields.filter((f) => f.read_only)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`${isNew ? "New" : "Edit"} ${collection.label}`} />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4">
        <form onSubmit={handleSubmit}>
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">

            {/* ── Main fields ── */}
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {isNew ? `New ${collection.label}` : `Edit ${collection.label}`}
                  </CardTitle>
                  {collection.description && (
                    <CardDescription>{collection.description}</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  {editableFields.map((field) => (
                    <FieldWrapper key={field.name} field={field} errors={allErrors}>
                      <FieldInput
                        field={field}
                        value={data[field.name]}
                        onChange={(v) => setField(field.name, v)}
                        relationshipOptions={relationship_options}
                      />
                    </FieldWrapper>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* ── Sidebar ── */}
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {isNew ? "Create record" : "Save changes"}
                  </CardTitle>
                </CardHeader>

                <CardFooter className="flex flex-col gap-2 border-t pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={processing}
                  >
                    {processing
                      ? "Saving…"
                      : isNew
                        ? `Create ${collection.label}`
                        : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>

              {/* Timestamps */}
              {/* {!isNew && collection.timestamps && (
                <Card>
                  <CardContent className="flex flex-col gap-3 pt-6">
                    {record?.created_at && (
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
                    {record?.updated_at && (
                      <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">Updated</span>
                        <span className="text-sm">
                          {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(record.updated_at as string))}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )} */}

              {/* Read-only fields */}
              {readOnlyFields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Info</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {readOnlyFields.map((field) => (
                      <div key={field.name} className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs">
                          {field.label}
                        </span>
                        <span className="text-sm font-mono">
                          {String(record?.[field.name] ?? "—")}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}