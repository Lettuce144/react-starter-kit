# frozen_string_literal: true

# Include this concern in any controller that should expose a Collection's
# CRUD operations via Inertia. The including controller just needs to declare
# which collection slug it serves.
#
# Usage:
#   class Admin::PostsController < ApplicationController
#     include CollectionController
#     serves_collection :posts
#   end

module CollectionController
  extend ActiveSupport::Concern

  included do
    before_action :set_collection_config
    before_action :set_record, only: %i[show edit update destroy]
    before_action :authorize_action!
  end

  class_methods do
    def serves_collection(slug)
      @collection_slug = slug.to_sym

      # Expose slug to instances via a method
      define_method(:collection_slug) { self.class.instance_variable_get(:@collection_slug) }
    end
  end

  # ─── Actions ─────────────────────────────────────────────────────────────

  def index
    scope = filtered_scope

    render inertia: "collection/index", props: {
      collection: frontend_config,
      records:    serialize_list(scope),
      meta:       pagination_meta(scope),
      filters:    current_filters
    }
  end

  def show
    render inertia: "collection/show", props: {
      collection: frontend_config,
      record:     serialize_record(@record)
    }
  end

  def new
    render inertia: "collection/form", props: {
      collection:    frontend_config,
      record:        nil,
      relationship_options: relationship_options_for_frontend
    }
  end

  def edit
    render inertia: "collection/form", props: {
      collection:    frontend_config,
      record:        serialize_record(@record),
      relationship_options: relationship_options_for_frontend
    }
  end

  def create
    # ApplicationCollection.run_hooks(@collection_config, :before_create, build_record, current_user)

    @record = model_class.new(permitted_params)

    ApplicationCollection.run_hooks(@collection_config, :before_create, @record, current_user)

    if @record.save
      ApplicationCollection.run_hooks(@collection_config, :after_create, @record, current_user)

      redirect_to collection_path(:index),
        notice: "#{@collection_config[:label]} created successfully."
    else
      render inertia: "collection/form", props: {
        collection:    frontend_config,
        record:        serialize_record(@record),
        errors:        @record.errors.as_json,
        relationship_options: relationship_options_for_frontend
      }
    end
  end

  def update
    ApplicationCollection.run_hooks(@collection_config, :before_update, @record, current_user)

    if @record.update(permitted_params)
      ApplicationCollection.run_hooks(@collection_config, :after_update, @record, current_user)

      redirect_to collection_path(:show, @record),
        notice: "#{@collection_config[:label]} updated successfully."
    else
      render inertia: "collection/form", props: {
        collection:    frontend_config,
        record:        serialize_record(@record),
        errors:        @record.errors.as_json,
        relationship_options: relationship_options_for_frontend
      }
    end
  end

  def destroy
    ApplicationCollection.run_hooks(@collection_config, :before_delete, @record, current_user)
    @record.destroy!
    ApplicationCollection.run_hooks(@collection_config, :after_delete, @record, current_user)

    redirect_to collection_path(:index),
      notice: "#{@collection_config[:label]} deleted."
  end

  # ─── Private ─────────────────────────────────────────────────────────────

  private

  def set_collection_config
    @collection_config = ApplicationCollection[collection_slug]
    raise ActionController::RoutingError, "Unknown collection: #{collection_slug}" unless @collection_config
  end

  def model_class
    @collection_config[:model]
  end

  def frontend_config
    ApplicationCollection.to_frontend(collection_slug)
  end

  def set_record
    @record = model_class.find(params[:id])
  end

  def authorize_action!
    operation = case action_name
    when "index", "show"         then :read
    when "new", "create"         then :create
    when "edit", "update"        then :update
    when "destroy"               then :delete
    end

    doc_needed = %w[edit update destroy].include?(action_name)

    unless ApplicationCollection.can?(@collection_config, operation, current_user,
                                      doc_needed ? @record : nil)
      render inertia: "Errors/Forbidden", status: :forbidden,
             props: {message: "You don't have permission to #{operation} #{@collection_config[:label_plural]}."}
    end
  end

  # Build a new unsaved record (used in before_create hooks)
  # def build_record
  #   model_class.new
  # end

  # ─── Filtering & Sorting ─────────────────────────────────────────────────

  def current_filters
    params.permit(:search, :sort, :direction, :page).to_h
  end

  def filtered_scope
    scope = model_class.all

    # Eager-load relationships
    relationship_fields.each do |field|
      association = field.name
      scope = scope.includes(association) if model_class.reflect_on_association(association)
    end

    # Search
    if params[:search].present? && @collection_config[:searchable_fields].any?
      search_clause = @collection_config[:searchable_fields].map { |f| "#{f} ILIKE :q" }.join(" OR ")
      scope = scope.where(search_clause, q: "%#{params[:search]}%")
    end

    # Sort
    sort_field     = allowed_sort_field
    sort_direction = params[:direction]&.downcase == "asc" ? :asc : :desc
    scope = scope.order(sort_field => sort_direction)

    # Paginate
    scope.page(params[:page]).per(@collection_config[:per_page])
  end

  def allowed_sort_field
    requested = params[:sort]&.to_sym
    allowed   = @collection_config[:sortable_fields]

    if requested && allowed.include?(requested)
      requested
    else
      @collection_config[:default_sort][:field]
    end
  end

  def pagination_meta(scope)
    {
      current_page:  scope.current_page,
      total_pages:   scope.total_pages,
      total_count:   scope.total_count,
      per_page:      scope.limit_value
    }
  end

  # ─── Serialization ───────────────────────────────────────────────────────

  def serialize_list(scope)
    list_fields    = @collection_config[:list_fields]
    base_fields    = %i[id created_at updated_at]
    fields_to_show = (list_fields + base_fields).uniq

    scope.map do |record|
      row = {}
      fields_to_show.each do |field_name|
        row[field_name] = serialize_field_value(record, field_name)
      end
      row
    end
  end

  def serialize_record(record)
    return nil unless record

    result = {id: record.id}

    @collection_config[:fields].each do |field|
      result[field.name] = serialize_field_value(record, field.name)
    end

    if @collection_config[:timestamps]
      result[:created_at] = record.respond_to?(:created_at) ? record.created_at : nil
      result[:updated_at] = record.respond_to?(:updated_at) ? record.updated_at : nil
    end

    result.merge(errors: record.errors.as_json)
  end

  def serialize_field_value(record, field_name)
    return nil unless record.respond_to?(field_name)

    value = record.public_send(field_name)

    case value
    when ActiveRecord::Base
      {id: value.id, label: record_label(value)}
    when ActiveRecord::Associations::CollectionProxy
      value.map { |r| {id: r.id, label: record_label(r)} }
    when ActiveSupport::TimeWithZone, Time, DateTime
      value.iso8601
    else
      value
    end
  end

  # Attempt to find a human-readable label for a related record
  def record_label(record)
    %i[name title email username label].each do |attr|
      return record.public_send(attr) if record.respond_to?(attr)
    end
    "##{record.id}"
  end

  # ─── Params & Validation ─────────────────────────────────────────────────

  def permitted_params
    allowed = @collection_config[:fields]
                .reject(&:read_only?)
                .map { |f| param_name_for(f) }
                .flatten

    params.permit(*allowed)
  end

  def param_name_for(field)
    case field.type
    when :has_many       then {"#{field.name}_ids" => []}
    when :multi_select   then {field.name => []}
    else                 field.name
    end
  end

  # ─── Relationship Options ─────────────────────────────────────────────────

  def relationship_fields
    @collection_config[:fields].select { |f| %i[relationship has_many].include?(f.type) }
  end

  def relationship_options_for_frontend
    relationship_fields.each_with_object({}) do |field, hash|
      related_config = ApplicationCollection[field.related_collection]
      next unless related_config

      records = related_config[:model].all.limit(200)
      hash[field.name] = records.map { |r| {value: r.id, label: record_label(r)} }
    end
  end

  # ─── Path Helpers ─────────────────────────────────────────────────────────

  def collection_path(action, record = nil)
    base = "/admin/#{collection_slug}"
    case action
    when :index  then base
    when :show   then "#{base}/#{record.id}"
    when :edit   then "#{base}/#{record.id}/edit"
    end
  end
end
