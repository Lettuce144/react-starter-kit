# frozen_string_literal: true

class CreatePosts < ActiveRecord::Migration[8.1]
  def change
    create_table :posts do |t|
      t.string :title
      t.string :slug
      t.text :excerpt
      t.text :content
      t.string :status
      t.boolean :featured
      t.datetime :published_at
      t.string :seo_title
      t.text :seo_desc

      t.timestamps
    end
  end
end
