import type { LucideIcon } from "lucide-react"

export interface Auth {
  user: User
  session: Pick<Session, "id">
}

export interface BreadcrumbItem {
  title: string
  href: string
}

export interface NavItem {
  title: string
  href: string
  icon?: LucideIcon | null
  isActive?: boolean
}

export interface FlashData {
  alert?: string
  notice?: string
}

export interface SharedProps {
  auth: Auth,
  collections: CollectionConfig[],
}

export interface User {
  id: number
  name: string
  email: string
  avatar?: string
  verified: boolean
  created_at: string
  updated_at: string
  [key: string]: unknown // This allows for additional properties...
}

export interface Session {
  id: string
  user_agent: string
  ip_address: string
  created_at: string
}

export interface FieldDefinition {
  name: string
  type:
  | "text" | "textarea" | "slug" | "email" | "url" | "number"
  | "boolean" | "select" | "multi_select" | "date" | "datetime"
  | "rich_text" | "json" | "relationship" | "has_many" | "image" | "file"
  label: string
  description?: string
  placeholder?: string
  required?: boolean
  unique?: boolean
  read_only?: boolean
  hidden?: boolean
  default?: unknown
  options?: string[] | { value: string; label: string }[]
  collection?: string
  min?: number
  max?: number
  min_length?: number
  max_length?: number
  from?: string
}

export interface CollectionConfig {
  slug: string
  label: string
  label_plural: string
  description?: string
  fields: FieldDefinition[]
  list_fields: string[]
  searchable_fields: string[]
  sortable_fields: string[]
  default_sort: { field: string; direction: "asc" | "desc" }
  per_page: number
  timestamps: boolean
}

export interface RelationshipOption {
  value: string | number
  label: string
}

export type RelationshipOptions = Record<string, RelationshipOption[]>

export type RecordData = Record<string, unknown>

export type FormErrors = Record<string, string[]>