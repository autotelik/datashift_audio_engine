# Copyright:: (c) Autotelik Media Ltd 2018
# Author ::   Tom Statter
# License::   MIT
#
# Details::   Configure Datashift Audio Engine operations
#
module DatashiftAudioEngine

  class Configuration

    # @param [Boolean] Player can start playing audio on page load, rather than waiting for visitor to click play.
    #
    # @return [Boolean]
    #
    attr_accessor :autoplay

    # @param [Number] Player will report back current status to a save callback.
    # This parameter can be used to set the interval between reports in milliseconds.
    #
    # Default is 1000 milliseconds
    # @return [Number]
    #
    attr_accessor :save_callback_interval

    def initialize
      @autoplay = false
      @save_callback_interval = 1000
    end

    # @return [DatashiftAudioEngine::Configuration] DataShift's current configuration
    def self.call
      @configuration ||= Configuration.new
    end

    def self.reset
      @configuration = Configuration.new
    end

    # Set DataShift's configuration
    # @param config [DatashiftAudioEngine::Configuration]
    class << self
      attr_writer :configuration
    end

    # Modify DataShift's current configuration through a block
    #
    # ```
    # DatashiftAudioEngine::Configuration.call do |config|
    #   config.verbose = false
    # end
    # ```
    def self.configure
      yield call
    end

  end

end