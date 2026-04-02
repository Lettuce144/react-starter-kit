# frozen_string_literal: true

module Admin
  class PostsController < ApplicationController
    include CollectionController
    serves_collection :posts
  end
end
