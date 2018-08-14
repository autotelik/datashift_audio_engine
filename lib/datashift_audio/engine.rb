module DatashiftAudio
  class Engine < ::Rails::Engine
    isolate_namespace DatashiftAudio

    # Add a load path for this specific Engine
    config.autoload_paths += Dir["#{config.root}/lib/**/"]

    config.assets.paths << root.join("app", "assets", "javascripts", "datashift_audio")
    config.assets.paths << root.join("vendor", "assets", "javascripts")

    config.assets.precompile += %w[*.png]
  end
end
