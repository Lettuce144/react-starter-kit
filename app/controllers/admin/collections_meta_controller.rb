# frozen_string_literal: true

module Admin
  class CollectionsMetaController < ApplicationController
    def index
      render inertia: "dashboard/index", props: {
        collections: ApplicationCollection.all.keys.map do |slug|
          ApplicationCollection.to_frontend(slug)
        end
      }
    end
  end
end
