// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require rails-ujs
//= require activestorage
//= require_tree .

var test_audio_data_json = {
    user_token: '1234567890',
    client_token: '0987654321',

    playlist: '0',

    page: '1',
    total_pages: '3',

    track: '0',
    position: '0',

    tracks: [
        {
            id: '1',

            author: 'Full Name',
            name: 'First Track Name',

            cover_image: 'http://localhost:3000/images/1.jpeg',
            audio_url: 'http://localhost:3000/audio/1.mp3',

            duration: 100,
        },

        {
            id: '2',
    
            author: 'Full Name 2',
            name: 'Second Track Name',

            cover_image: 'http://localhost:3000/images/1.jpeg',
            audio_url: 'http://localhost:3000/audio/1.mp3',

            duration: 100,
        },

        {
            id: '3',
    
            author: 'Full Name 3',
            name: 'Third Track Name',

            cover_image: 'http://localhost:3000/images/1.jpeg',
            audio_url: 'http://localhost:3000/audio/1.mp3',

            duration: 100,
        }
    ],

    radio: {
        radio_url: 'http://air2.radiorecord.ru:805/rr_320',
        
        author: 'Full Name 3',
        track: 'Third Track Name',

        cover_image: 'http://localhost:3000/images/1.jpeg',
        audio_url: 'http://localhost:3000/audio/1.mp3',
        
        duration: 100,
        position: 0,
        
        // or

        audio_data_pack: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    },

    saved: {
        service: {
            user_token: '1234567890',
            client_token: '0987654321',
        },

        audio_player: {
            color_schema: {
                main: 'white',
                secondary: 'black',
                accent: 'red',
                additional: 'grey',

            },
            autoplay: false,
            random: false,
            repeat: null,
            volume: 1,
        },

        audio: {
            playlist: 'id',
            
            page: '1',
            total_pages: '3',
            
            track: 0,
            position: 0,
        }
    }, 
}

var audio_player = document.querySelector('#datashift-audio-player');
var wave_controller = '';

var datashift_audio = {
    state: null,
    engine: null,

    is_radio: false,
    radio_url: null,

    settings: {
        autoplay: false,
        random: false,
        repeat: null,
        volume: 1,
    },
    
    user_token: null,
    client_token: null,

    playlist: {},
    audio_data: {},
    visual: {},

    timer: null,
    
    init: function(){
        //
        // Load data from local storage first time
        //
        var self = this;

        // service
        var user_token = window.localStorage.getItem('user_token');
        var client_token = window.localStorage.getItem('client_token');

        // player
        var autoplay = window.localStorage.getItem('autoplay');
        var random = window.localStorage.getItem('random');
        var repeat = window.localStorage.getItem('repeat');
        var volume = parseFloat(window.localStorage.getItem('volume'));
        
        if (isNaN(volume)) volume = 1;

        // normalize player settings
        this.settings.autoplay = (autoplay == 'true');
        this.settings.random = (random == 'true');
        this.settings.repeat = repeat;
        this.settings.volume = volume;

        //
        // Update settings
        //

        // sync settings
        $.post( "init", { user_token: user_token, client_token: client_token } ).done(function( pure_data ) {
            // service
            var data = JSON.parse(pure_data);

            self.user_token = data.saved.service.user_token;
            self.client_token = data.saved.service.client_token;

            window.localStorage.setItem('user_token', self.user_token);
            window.localStorage.setItem('client_token', self.client_token);

            // track
            self.audio_data.playlist = parseInt(data.saved.audio.playlist);
            self.audio_data.page = parseInt(data.saved.audio.page);
            self.audio_data.total_pages = parseInt(data.saved.audio.total_pages);
            self.audio_data.track = parseInt(data.saved.audio.track);
            self.audio_data.position = parseFloat(data.saved.audio.position);

            if (self.audio_data.playlist == null || self.audio_data.playlist == NaN) self.audio_data.playlist = 0;
            if (self.audio_data.page == null || self.audio_data.page == NaN) self.audio_data.page = 0;
            if (self.audio_data.total_pages == null || self.audio_data.total_pages == NaN) self.audio_data.total_pages = 0;
            if (self.audio_data.track == null || self.audio_data.track == NaN) self.audio_data.track = 0;
            if (self.audio_data.position == null || self.audio_data.position == NaN) self.audio_data.position = 0;

            self.state = 'inited';
            console.log(self.state);
        }).fail(function(){
            self.audio_data.playlist = -1;
            self.audio_data.page = 0;
            self.audio_data.track = 0;
            self.audio_data.position = 0;

            self.state = 'fail inited';
            console.error(self.state);
        });

        //
        // Visual update
        //

        this.visual = {
            play: $('#datashift-audio-player .play'),
            pause: $('#datashift-audio-player .pause'),

            prev: $('#datashift-audio-player .track-controls .previous'),
            next: $('#datashift-audio-player .track-controls .next'),
    
            volume: $('#datashift-audio-player .track-volume input[type=range]'),
    
            author_name: $('#datashift-audio-player .track-basic-info .author-name'),
            track_name: $('#datashift-audio-player .track-basic-info .track-name'),
    
            cover_image: $('#datashift-audio-player .track-cover'),

            playlist: $('.datashift-audio-playlist'),
            waveform: $('#datashift-audio-player #waveform'),

            current_position: $('#datashift-audio-player .current-position'),
            total_duration: $('#datashift-audio-player .total-duration'),

            pages: $('#datashift-audio-player .pages'),

            btn_playlist: $('#datashift-audio-player .track-playlist .view_list'),
        }

        //
        // Events
        //

        this.visual.play.on('click', function(){
            self.play();
        });
    
        this.visual.pause.on('click', function(){
            self.pause();
        });

        this.visual.prev.on('click', function(){
            self.previous();
        });
    
        this.visual.next.on('click', function(){
            self.next();
        });

        this.visual.btn_playlist.on('click', function(){
            if(self.visual.btn_playlist.hasClass('active')){
                self.visual.btn_playlist.removeClass('active');
                self.visual.playlist.parent().addClass('hide');
            } else {
                self.visual.btn_playlist.addClass('active');
                self.visual.playlist.parent().removeClass('hide');
            }
        });

        $('#datashift-audio-player .track-volume i').on('click', function(){
            var current_value = parseInt(datashift_audio.visual.volume.attr('value'));
            var audio_dom_el = datashift_audio.visual.volume.get(0);
            console.log( 'volume: ' + current_value );


            if (current_value > 0){
                console.log('current_value > 0');
                
                datashift_audio.visual.volume.get(0).value = 0;
                datashift_audio.visual.volume.attr('value', 0);

                datashift_audio.engine.setVolume(0);
                
                if(audio_dom_el.value == 0) {
                    $('.track-volume i').addClass('hide');
                    $('.track-volume i.volume_off').removeClass('hide')
                }
                console.log(datashift_audio.visual.volume.get(0).value);
            } else {
                console.log('current_value == 0');

                if (current_value == 0 && datashift_audio.settings.volume == 0){
                    current_value = 1;
                    datashift_audio.settings.volume = current_value;
                }

                audio_dom_el.value = datashift_audio.settings.volume * 100;
                datashift_audio.visual.volume.attr('value',  datashift_audio.settings.volume * 100);
                datashift_audio.volume(datashift_audio.settings.volume);

                if(audio_dom_el.value >= 75) {
                    $('.track-volume i').addClass('hide');
                    $('.track-volume i.volume_up').removeClass('hide')
                }
        
                if(audio_dom_el.value >= 50 && audio_dom_el.value < 75) {
                    $('.track-volume i').addClass('hide');
                    $('.track-volume i.volume_down').removeClass('hide')
                }
        
                if(audio_dom_el.value >= 25 && audio_dom_el.value < 50) {
                    $('.track-volume i').addClass('hide');
                    $('.track-volume i.volume_mute').removeClass('hide')
                }    

                console.log(datashift_audio.visual.volume.attr('value'));
            }
        });

        this.visual.volume.on('input change', function(update = true) { 
            if(this.value >= 75) {
                $('.track-volume i').addClass('hide');
                $('.track-volume i.volume_up').removeClass('hide')
            }
    
            if(this.value >= 50 && this.value < 75) {
                $('.track-volume i').addClass('hide');
                $('.track-volume i.volume_down').removeClass('hide')
            }
    
            if(this.value >= 25 && this.value < 50) {
                $('.track-volume i').addClass('hide');
                $('.track-volume i.volume_mute').removeClass('hide')
            }
    
            if(this.value == 0) {
                $('.track-volume i').addClass('hide');
                $('.track-volume i.volume_off').removeClass('hide')
            }
    
            if (update)
                datashift_audio.volume(this.value / 100.0);
        });
    },

    // LOAD DATA
    //
    // ajax request to back-end to get data about track/playlist/radio 
    // and save it to local variables
    //
    load: function(url, is_new=false) {
        var self = this;
        $.ajax(
            {   method: "POST",
                url: url,
                dataType: "script",
                data: { user_token: this.user_token, client_token: this.client_token, random: this.settings.random }
            }).done(function( pure_data ) {
            var data = JSON.parse(pure_data);

            self.playlist = data.tracks;

            self.playlist.forEach((track, index) => {          
                var duration = '<div class="duration">' + formatTime(track.duration) + '</div>';
                var full_name = '<div class="full-name">' + track.author + " - " + track.name + '</div>';

                var track_set = duration + full_name;
                self.visual.playlist.append('<li id="track-' + index + '" >' + track_set + '</li>')
            });

            datashift_audio.visual.playlist.children('li').on('click', function(){ 
                datashift_audio.audio_data.track = parseInt(this.id.split('-')[1]); 
                datashift_audio.settings.autoplay = true;
                datashift_audio.render_wave_from_audio_file() 
            });
            
            self.audio_data.playlist = parseInt(data.playlist);
            self.audio_data.total_pages = parseInt(data.total_pages);

            if (is_new == true){
                self.audio_data.page = 1;
                self.audio_data.track = 0;
                self.audio_data.position = 0;

                console.log('is new playlist');
            } else {
                self.audio_data.page = parseInt(data.page);
                self.audio_data.track = parseInt(data.track);
                self.audio_data.position = parseFloat(data.position);
            }

            if (self.audio_data.playlist == null || self.audio_data.playlist == NaN) self.audio_data.playlist = 0;
            if (self.audio_data.page == null || self.audio_data.page == NaN) self.audio_data.page = 0;
            if (self.audio_data.total_pages == null || self.audio_data.total_pages == NaN) self.audio_data.total_pages = 0;
            if (self.audio_data.track == null || self.audio_data.track == NaN) self.audio_data.track = 0;
            if (self.audio_data.position == null || self.audio_data.position == NaN) self.audio_data.position = 0;

            self.state = 'playlist loaded';
            console.log(self.state);
        }).fail(function(){
            self.playlist = test_audio_data_json.tracks;

            self.playlist.forEach((track, index) => {
                var duration = '<div class="duration">' + formatTime(track.duration) + '</div>';
                var full_name = '<div class="full-name">' + track.author + " - " + track.name + '</div>';

                var track_set = duration + full_name;
                self.visual.playlist.append('<li id="track-' + index + '" >' + track_set + '</li>');
            });  

            datashift_audio.visual.playlist.children('li').on('click', function(){ 
                datashift_audio.audio_data.track = parseInt(this.id.split('-')[1]); 
                datashift_audio.settings.autoplay = true;
                datashift_audio.render_wave_from_audio_file() 
            });

            self.audio_data.playlist = parseInt(test_audio_data_json.playlist);
            self.audio_data.total_pages = parseInt(test_audio_data_json.total_pages);
            
            for(counter = 1; counter <= self.audio_data.total_pages; counter++){
                $('.page-selectors .pages').append('<li id="page-'+ counter +'" >' + counter + '</li>')
            }

            datashift_audio.visual.pages.children('li').on('click', function(){ 
                datashift_audio.audio_data.page = parseInt(this.id.split('-')[1]); 
                var next_page = parseInt(this.id.split('-')[1]);
                var url = 'playlists/' + datashift_audio.playlist + '.' + next_page
                datashift_audio.new_page(url) 
            });

            if (is_new == true){
                self.audio_data.page = 1;
                self.audio_data.track = 0;
                self.audio_data.position = 0;

                console.log('is new playlist');
            } else {
                self.audio_data.page = parseInt(test_audio_data_json.page);
                self.audio_data.track = parseInt(test_audio_data_json.track);
                self.audio_data.position = parseFloat(test_audio_data_json.position);
    
            }

            if (self.audio_data.playlist == null || self.audio_data.playlist == NaN) self.audio_data.playlist = 0;
            if (self.audio_data.page == null || self.audio_data.page == NaN) self.audio_data.page = 0;
            if (self.audio_data.total_pages == null || self.audio_data.total_pages == NaN) self.audio_data.total_pages = 0;
            if (self.audio_data.track == null || self.audio_data.track == NaN) self.audio_data.track = 0;
            if (self.audio_data.position == null || self.audio_data.position == NaN) self.audio_data.position = 0;

            self.state = 'fail playlist loaded';
            console.error(self.state);
        });     
    },

    // TODO: Show current state of player
    update_info: function(){
        this.audio_data.position = this.engine.getCurrentTime();
    },

    // Render audio wave from audio file or pure data
    render_wave_from_audio_file: function(){
        // clear
        this.visual.waveform.html('');

        if( this.engine != null )
            this.engine.destroy();
        clearInterval(this.timer);

        this.is_radio = false;
        this.visual.prev.removeClass('hide');
        this.visual.next.removeClass('hide');

        // init new
        this.engine = WaveSurfer.create({
                container: '#waveform',
                waveColor: 'grey',
                progressColor: 'white',
                cursorColor: '#dafcff',
                barWidth: 3,
                hideScrollbar: true
            });
                
        var track = this.playlist[this.audio_data.track];

        this.visual.playlist.children('.datashift-audio-playlist li').removeClass('active');
        var visual_track = $('#track-' + this.audio_data.track);
        visual_track.addClass('active');

        this.visual.pages.children('li').removeClass('active');
        var visual_page = $('#page-' + this.audio_data.page);
        visual_page.addClass('active')

        this.engine.load(track.audio_url);
        
        this.visual.cover_image.css('background-image', 'url("'+ track.cover_image +'")');
        this.visual.track_name.html(track.name);
        this.visual.author_name.html(track.author);
        
        var self = this;
        this.engine.on('ready', function(){
            self.seek(self.audio_data.position);

            self.visual.current_position.html(formatTime(self.audio_data.position));
            self.visual.total_duration.html(formatTime(self.engine.getDuration()));

            self.volume(self.settings.volume);
            self.visual.volume.get(0).value = self.settings.volume * 100;
            self.visual.volume.attr('value',  self.settings.volume * 100);

            var volume = parseInt(self.visual.volume.attr('value'));
            self.visual.volume.change();

            if (self.settings.autoplay) {
                self.play();
            }

            self.engine.on('finish', function(){
                self.save_current_state();
                clearInterval(self.timer);
                self.next();
                console.log('track finished');
            })

            self.state = 'loaded';
            console.log(self.state);
        });
    },

    render_wave_from_pure_data: function(url){
        // get data from back-end
        // adapt data for render and play
        this.visual.waveform.html('');
        this.is_radio = true;
        this.visual.prev.addClass('hide');
        this.visual.next.addClass('hide');
        this.radio_url = url;
        
        this.visual.waveform.append("<audio id='radio' ><source src='" + url +  "' type='audio/mpeg' ></audio>");

        this.engine = document.getElementById('radio');
    },

    // MAIN AUDIO CONTROLS
    play: function() {
        this.visual.play.addClass('hide');
        this.visual.pause.removeClass('hide');
        
        if (this.is_radio == false) {
            this.audio_data.autoplay = true;
            this.timer = setInterval(this.save_current_state, 1000);
        } else {
            this.timer = setInterval(function(){
                $.post('radio_data', { radio_url: this.radio_url }).done(function(pure_data){
                    var data = JSON.parse(pure_data);
    
                    datashift_audio.visual.cover_image.css('background-image', 'url("'+ data.radio.cover_image +'")');
                    datashift_audio.visual.author_name.html(data.radio.author);
                    datashift_audio.visual.track_name.html(data.radio.track);

                    console.log('update radio metadata');
                }).fail(function(){
                    datashift_audio.visual.cover_image.css('background-image', 'url("'+ test_audio_data_json.radio.cover_image +'")');
                    datashift_audio.visual.author_name.html(test_audio_data_json.radio.author);
                    datashift_audio.visual.track_name.html(test_audio_data_json.radio.track);

                    console.log('fail update radio metadata');
                });
            }, 1000);
        }

        this.engine.play();
    },

    pause: function() {
        this.visual.pause.addClass('hide');
        this.visual.play.removeClass('hide');

        if (this.is_radio == false) {
            this.audio_data.autoplay = false;
            this.save_current_state();
        }
        clearInterval(this.timer);

        this.engine.pause();
    },

    previous: function(){
        var new_track = this.audio_data.track - 1;
        var track = this.playlist[new_track];

        if (track != null) {
            this.audio_data.track = new_track;
            this.audio_data.position = 0;
            this.settings.autoplay = true;

            this.render_wave_from_audio_file();
            this.save_current_state();
        } else {
            if (this.audio_data.page > 1)
            this.new_page('playlist/:id.new_page', false)
        }
    }, 

    next: function(){
        var new_track = this.audio_data.track + 1;
        var track = this.playlist[new_track];

        if (track != null) {
            this.audio_data.track = new_track;
            this.audio_data.position = 0;
            this.settings.autoplay = true;

            this.render_wave_from_audio_file();
            this.save_current_state();
        } else {
            if (this.audio_data.page < this.audio_data.total_pages)
                this.new_page('playlist/:id.new_page', true)
        }
    },

    // url = 'playlist/:id.new_page'
    new_page: function(url, fromBeginning = true){
        $.post(url).done(function(pure_data){
            console.log('render new page and select new track');

            var data = JSON.parse(pure_data);
            datashift_audio.playlist = data.tracks;
            datashift_audio.page = parseInt(data.page);

            datashift_audio.visual.playlist.html('');
            
            datashift_audio.visual.pages.children('li').removeClass('active');
            var visual_page = $('#page-' + data.page);
            visual_page.addClass('active')

            datashift_audio.playlist.forEach((track, index) => {
                var duration = '<div class="duration">' + formatTime(track.duration) + '</div>';
                var full_name = '<div class="full-name">' + track.author + " - " + track.name + '</div>';

                var track_set = duration + full_name;
                datashift_audio.visual.playlist.append('<li id="track-' + index + '" onClick="" >' + track_set + '</li>')
            });

            datashift_audio.visual.playlist.children('li').on('click', function(){ 
                datashift_audio.audio_data.track = parseInt(this.id.split('-')[1]); 
                datashift_audio.settings.autoplay = true;
                datashift_audio.render_wave_from_audio_file() 
            });

            if (fromBeginning == true){
                datashift_audio.audio_data.track = -1;
                datashift_audio.next();
            } else {
                datashift_audio.audio_data.track = datashift_audio.playlist.length;
                datashift_audio.previous();    
            }
        }).fail(function(){
            console.error('page not found');

            if (fromBeginning == true)
                test_audio_data_json.page = parseInt(test_audio_data_json.page) + 1;
            else
                test_audio_data_json.page = parseInt(test_audio_data_json.page) - 1;

            var data = test_audio_data_json;
            datashift_audio.playlist = data.tracks;
            datashift_audio.audio_data.page = parseInt(data.page);

            datashift_audio.visual.playlist.html('');
            
            datashift_audio.visual.pages.children('li').removeClass('active');
            var visual_page = $('#page-' + data.page);
            visual_page.addClass('active')

            datashift_audio.playlist.forEach((track, index) => {
                var duration = '<div class="duration">' + formatTime(track.duration) + '</div>';
                var full_name = '<div class="full-name">' + track.author + " - " + track.name + '</div>';

                var track_set = duration + full_name;
                datashift_audio.visual.playlist.append('<li id="track-' + index + '" >' + track_set + '</li>')
            });      

            datashift_audio.visual.playlist.children('li').on('click', function(){ 
                datashift_audio.audio_data.track = parseInt(this.id.split('-')[1]); 
                datashift_audio.settings.autoplay = true;
                datashift_audio.render_wave_from_audio_file() 
            });

            if (fromBeginning == true){
                datashift_audio.audio_data.track = -1;
                datashift_audio.next();
            } else {
                datashift_audio.audio_data.track = datashift_audio.playlist.length;
                datashift_audio.previous();    
            }

            console.log('page: ' + datashift_audio.audio_data.page)
        });
    },

    volume: function(value){
        if (isNaN(value)) value = 1;

        this.settings.volume = value;

        if (this.is_radio == true){
            this.engine.volume = value;
        } else {
            this.engine.setVolume(value);
            window.localStorage.setItem('volume', value);
        }
    },

    seek: function(position){
        this.engine.setCurrentTime(position);
        this.audio_data.position = position;
        this.save_current_state();
    },

    // Save current state of a player and send it to the back-end to sync it
    save_current_state: function(){
        if ( datashift_audio.state == undefined ) return;

        datashift_audio.update_info();

        datashift_audio.visual.current_position.html(formatTime(datashift_audio.audio_data.position));

        var data = {
            user_token: datashift_audio.user_token,
            client_token: datashift_audio.client_token,
            random: datashift_audio.settings.random,
            audio_data: datashift_audio.audio_data,
        }

        $.post( 'save', data )
        .done(function(){
            console.log('saved');
        }).fail(function(){
            console.log('fail to save');
        });
    },
}

function formatTime(time_in_seconds){
    var seconds = Math.floor(time_in_seconds);
    var minutes = Math.floor(seconds / 60);

    minutes = (minutes >= 10) ? minutes : "0" + minutes;

    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;

    return minutes + ":" + seconds;
}

// if playlist page is going to end up then request the next one
