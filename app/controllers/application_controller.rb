# frozen_string_literal: true

class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :set_current_request_details
  before_action :authenticate
  before_action :share_inertia_data

  inertia_config default_render: true

  private

  def share_inertia_data
    inertia_share(
      auth: {
          user: -> { Current.user.as_json(only: %i[id name email verified created_at updated_at]) },
          session: -> { Current.session.as_json(only: %i[id]) }
      },
      collections: ApplicationCollection.all.keys.map { |slug|
          ApplicationCollection.to_frontend(slug)
        }
      )
  end

  def current_user
    Current.user
  end

  def authenticate
    redirect_to sign_in_path unless perform_authentication
  end

  def require_no_authentication
    return unless perform_authentication

    flash[:notice] = "You are already signed in"
    redirect_to root_path
  end

  def perform_authentication
    Current.session ||= Session.find_by_id(cookies.signed[:session_token])
  end

  def set_current_request_details
    Current.user_agent = request.user_agent
    Current.ip_address = request.ip
  end
end
