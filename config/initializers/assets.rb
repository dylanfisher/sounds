# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = "1.0"

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path
Rails.application.config.assets.paths << Rails.root.join("node_modules")

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in the app/assets
# folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )

# Silence Sass deprecation warnings raised inside dependencies (e.g. Bootstrap 5
# still uses @import and legacy built-in functions internally). Note that
# dartsass-sprockets resolves every file through its importer, so this also
# covers app partials; only the entry stylesheet itself still reports warnings.
Rails.application.config.sass.quiet_deps = true
