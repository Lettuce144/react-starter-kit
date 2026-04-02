# frozen_string_literal: true

FactoryBot.define do
  factory :post do
    title { "MyString" }
    slug { "MyString" }
    excerpt { "MyText" }
    content { "MyText" }
    status { "MyString" }
    author { nil }
    featured { false }
    published_at { "2026-04-02 09:28:33" }
    seo_title { "MyString" }
    seo_desc { "MyText" }
  end
end
