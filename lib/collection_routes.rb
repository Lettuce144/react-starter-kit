# frozen_string_literal: true

module CollectionRoutes
  def self.draw(router)
    ApplicationCollection.all.each_key do |slug|
      router.resources slug
    end
  end
end
