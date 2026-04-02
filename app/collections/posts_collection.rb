# frozen_string_literal: true

class PostsCollection < ApplicationCollection
  collection :posts do
    label        "Post"
    label_plural "Posts"

    field :title,   type: :text,     required: true
    field :slug,    type: :slug,     unique: true, from: :title
    field :content, type: :rich_text
    field :status,  type: :select,   options: %w[draft published archived], default: "draft"

    list_fields       :title, :status, :created_at
    searchable_fields :title, :content
    sortable_fields   :title, :created_at
  end
end
