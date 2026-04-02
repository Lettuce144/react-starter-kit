# frozen_string_literal: true

class Post < ApplicationRecord
  validates :title,  presence: true, length: {minimum: 3, maximum: 200}
  validates :slug,   presence: true, uniqueness: true
  validates :status, inclusion: {in: %w[draft published archived]}

  before_validation :set_slug, if: -> { slug.blank? && title.present? }

  scope :published, -> { where(status: "published") }

  private

  def set_slug
    self.slug = title.parameterize
  end
end
