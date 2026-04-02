# frozen_string_literal: true

# This is the base class for defining logic and fields usable in the framework
# It allows us to use a dsl (custom project specific langauge)
#

class ApplicationCollection
  class FieldDefinition
    VALID_TYPES = %i[
      text textarea slug email url number boolean
      select multi_select date datetime
      rich_text json
      relationship has_many
      image file
      group array blocks
    ].freeze

    attr_reader :name, :type, :options

    def initialize(name, type:, **opts)
      raise ArgumentError, "Unknown field type: #{type}" unless VALID_TYPES.include?(type)

      @name    = name.to_sym
      @type    = type
      @options = opts
    end

    def required?     = options[:required] == true
    def unique?       = options[:unique] == true
    def read_only?    = options[:read_only] == true
    def hidden?       = options[:hidden] == true
    def default_value = options[:default]
    def label         = options[:label] || name.to_s.humanize
    def description   = options[:description]
    def placeholder   = options[:placeholder]

    # Relationship helpers
    def related_collection = options[:collection]
    def related_model      = options[:model]

    # Select helpers
    def select_options = options[:options] || []

    # Validation helpers
    def min       = options[:min]
    def max       = options[:max]
    def min_length = options[:min_length]
    def max_length = options[:max_length]
    def pattern   = options[:pattern]

    def to_h
      {
        name:        name,
        type:        type,
        label:       label,
        description: description,
        placeholder: placeholder,
        required:    required?,
        unique:      unique?,
        read_only:   read_only?,
        hidden:      hidden?,
        default:     default_value,
        options:     select_options,
        collection:  related_collection,
        min:         min,
        max:         max,
        min_length:  min_length,
        max_length:  max_length,
        pattern:     pattern,
        from:        options[:from]  # for slug fields
      }.compact
    end
  end

  # ─── DSL Builder ─────────────────────────────────────────────────────────

  class Builder
    attr_reader :config

    def initialize(slug, model_class)
      @config = {
        slug:              slug,
        model:             model_class,
        label:             slug.to_s.humanize,
        label_plural:      slug.to_s.humanize.pluralize,
        description:       nil,
        fields:            [],
        list_fields:       [],
        searchable_fields: [],
        sortable_fields:   [:created_at],
        default_sort:      {field: :created_at, direction: :desc},
        hooks:             {before_create: [], after_create: [],
                             before_update: [], after_update: [],
                             before_delete: [], after_delete: []},
        access:            {read: ->(_u) { true }, create: ->(_u) { true },
                             update: ->(_u, _d) { true }, delete: ->(_u) { true }},
        per_page:          25,
        timestamps:        true
      }
    end

    def label(val)             = @config[:label] = val
    def label_plural(val)      = @config[:label_plural] = val
    def description(val)       = @config[:description] = val
    def per_page(val)          = @config[:per_page] = val
    def timestamps(val)        = @config[:timestamps] = val

    def list_fields(*names)
      @config[:list_fields] = names.flatten.map(&:to_sym)
    end

    def searchable_fields(*names)
      @config[:searchable_fields] = names.flatten.map(&:to_sym)
    end

    def sortable_fields(*names)
      @config[:sortable_fields] = names.flatten.map(&:to_sym)
    end

    def default_sort(field:, direction: :desc)
      @config[:default_sort] = {field: field.to_sym, direction: direction.to_sym}
    end

    def field(name, type:, **opts)
      @config[:fields] << FieldDefinition.new(name, type: type, **opts)
    end

    def hooks(&block)
      HooksBuilder.new(@config[:hooks]).instance_eval(&block)
    end

    def access(&block)
      AccessBuilder.new(@config[:access]).instance_eval(&block)
    end
  end

  class HooksBuilder
    def initialize(hooks_hash)
      @hooks = hooks_hash
    end

    def before_create(&block) = @hooks[:before_create] << block
    def after_create(&block)  = @hooks[:after_create]  << block
    def before_update(&block) = @hooks[:before_update] << block
    def after_update(&block)  = @hooks[:after_update]  << block
    def before_delete(&block) = @hooks[:before_delete] << block
    def after_delete(&block)  = @hooks[:after_delete]  << block
  end

  class AccessBuilder
    def initialize(access_hash)
      @access = access_hash
    end

    def read(&block)   = @access[:read]   = block
    def create(&block) = @access[:create] = block
    def update(&block) = @access[:update] = block
    def delete(&block) = @access[:delete] = block
  end

  # ─── Registry ────────────────────────────────────────────────────────────

  REGISTRY = {}

  class << self
    def collection(slug, model: nil, &block)
      model_class = model || slug.to_s.singularize.camelize.constantize
      builder     = Builder.new(slug, model_class)
      builder.instance_eval(&block) if block_given?

      config = builder.config

      # Auto-add timestamp fields to list if none specified
      if config[:list_fields].empty?
        config[:list_fields] = config[:fields].first(3).map(&:name) + [:created_at]
      end

      # Register globally
      ApplicationCollection::REGISTRY.merge!(slug.to_sym => config)

      config
    end

    def [](slug)
      ApplicationCollection::REGISTRY[slug.to_sym]
    end

    def all
      ApplicationCollection::REGISTRY
    end

    # Run hooks for a lifecycle event
    def run_hooks(config, event, doc, user = nil)
      config[:hooks][event].each { |hook| hook.call(doc, user) }
    end

    # Check access for an operation
    def can?(config, operation, user, doc = nil)
      fn = config[:access][operation]
      return true unless fn.is_a?(Proc)

      case fn.arity
      when 1 then fn.call(user)
      when 2 then fn.call(user, doc)
      else        fn.call
      end
    end

    # Serialize config for frontend consumption
    def to_frontend(slug)
      config = self[slug]
      return nil unless config

      {
        slug:              config[:slug],
        label:             config[:label],
        label_plural:      config[:label_plural],
        description:       config[:description],
        fields:            config[:fields].reject(&:hidden?).map(&:to_h),
        list_fields:       config[:list_fields],
        searchable_fields: config[:searchable_fields],
        sortable_fields:   config[:sortable_fields],
        default_sort:      config[:default_sort],
        per_page:          config[:per_page],
        timestamps:        config[:timestamps]
      }
    end
  end
end
