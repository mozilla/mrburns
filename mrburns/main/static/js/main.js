//get Master firefox version
function getFirefoxMasterVersion(userAgent) {
    var version = 0;
    var ua = userAgent || navigator.userAgent;

    var matches = /Firefox\/([0-9]+).[0-9]+(?:.[0-9]+)?/.exec(
        ua
    );

    if (matches !== null && matches.length > 0) {
        version = parseInt(matches[1], 10);
    }

    return version;
}

function isFirefox(userAgent) {
    var ua = userAgent || navigator.userAgent;
    // camino UA string contains 'like Firefox'
    return (
        (/\sFirefox/).test(ua) &&
        !(/like Firefox/i).test(ua) &&
        !(/SeaMonkey/i).test(ua)
    );
}

function isAustralis() {
    // Check if the visitor is using Firefox and it's v29+
    if (isFirefox()) {
        var fx_version = getFirefoxMasterVersion();
        var minimumAustralisVersion = 29;
        return (fx_version >= minimumAustralisVersion);
    } else {
        return false;
    }
}

var _currentDataTimestamp = 0;

// TODO: make this better and less hacky
// should not be in global scope, nor should
// most of this file.
window.setInterval(function(){
    // bump forward 1 minute
    if (_currentDataTimestamp) {
        // only move forward if it's been set
        _currentDataTimestamp += 60;
    }
}, 60000);  // 60s

function getDevTimestamp() {
    // TODO REMOVE ME
    // confirmed manually that this is equal to
    // smithers.utils.get_epoch_minute()
    var unixtime = (new Date()).getTime() / 1000  // seconds since epoch
    return Math.floor(unixtime / 60) * 60  // round down to minute
}

function getJsonDataUrl() {
    var $body = $('body');
    var staticDataUrl = $body.data('staticDataUrl');

    if (!_currentDataTimestamp) {
        // NOTE: will be 0 when redis is off or returns nothing
        var latestTimestamp = $body.data('timestamp'); // an int

        if (!latestTimestamp) {
            // TODO REMOVE ME
            // guess at the latest timestamp (for dev)
            console.log('USING DEV TIMESTAMP!');
            // take off 3 extra minutes for fewer 404s
            latestTimestamp = getDevTimestamp() - 180;
        }

        // two minutes ago
        _currentDataTimestamp = latestTimestamp - 120;
    }
    console.log('Current timestamp', _currentDataTimestamp);
    var url = staticDataUrl + 'stats/' + _currentDataTimestamp + '.json';
    console.log(url);
    return url;
}

var $stats_panel_tab_title = $('.stats-panel-tab .title');
var stats_panel_opened_title = $stats_panel_tab_title.data('open-title');
var stats_panel_closed_title = $stats_panel_tab_title.text();

function updateStatsPanel() {
    if ($('body').hasClass('stats-panel-open')) {
        hideGlows();
        $stats_panel_tab_title.text(stats_panel_opened_title);
    } else {
        showGlows();
        $stats_panel_tab_title.text(stats_panel_closed_title);
    }
}

$(document).ready(function () {

    var hasMediaQueries = ('matchMedia' in window);
    var mode = 'mobile';

    function checkMode() {
        var current_mode = getMode();
        if (mode !== current_mode) {
            mode = current_mode;
            setMode(mode);
        }
    }

    function getMode() {
        if (hasMediaQueries && matchMedia('(min-width: 768px)').matches) {
            return 'desktop';
        }
        return 'mobile';
    }

    function setMode(mode) {
        if (mode === 'desktop') {
            // move choices to choice-modal
            $('.choices-wrapper').appendTo($('#choice-modal-choice-page'));

            // move links from hamburger menu to desktop UI
            $('.footer-link').appendTo($('footer ul'));
            $('.video-panel-link').prependTo($('.actions'));

            // move stats panel to desktop
            $('.stats-panel-contents')
                .append($('.stats-panel-column'))
                .append($('.stats-panel-column-right'));

            // hide the menu if it is open
            $('.mobile-menu').removeClass('open');

            showGlows();
        } else {
            hideGlows();

            // move choices to mobile
            $('.choices-wrapper').prependTo($('.choices-mobile'));

            // move links from main UI to hanburger menu
            $('.mobile-menu .dropdown-menu')
              .append($('.footer-link'))
              .prepend($('.video-panel-link'));

            // move stats content to mobile
            $('.stats-mobile-content').append($('.stats-panel-column'));
            $('.stats-panel-column-right').insertBefore($('.stats-panel-column .chart2'));
        }
    }

    if (hasMediaQueries) {
        checkMode();
        $(window).on('resize', function () {
            checkMode();
        });
    }

    var $choice_modal = $('.choice-modal');
    var $choices = $('.choices .btn');
    var events = 'transitionend';

    var events = (function() {
        var el = document.createElement('div');
        var transitions = {
            'transition': 'transitionend',
            'OTransition': 'oTransitionEnd',
            'MSTransition': 'msTransitionEnd',
            'MozTransition': 'transitionend',
            'WebkitTransition': 'webkitTransitionEnd'
        }

        for (var selector in transitions){
            if (el.style[selector] !== undefined) {
                return transitions[selector];
            }
        }

        return null;
    })();

    $choice_modal.find('.choice-body-container').on(
        events,
        function (event) {
            var $body = $(this);
            if (event.target === event.currentTarget) {
                var state = $body.data('state');
                if (state === 'opening-opacity-out') {
                    $('.choices').removeClass('in-progress');
                    $choices.each(function(i) {
                        $(this).removeClass('selected');
                    });

                    var from_height = $body.height();

                    // We need to ignore this transition for Safari. Otherwise
                    // it will animate from height 0 to from_height.
                    var transition = $body.css('transition');
                    $body
                        .css('transition', 'none')
                        .css('height', from_height);

                    $choice_modal.addClass('choice-modal-interstitial');

                    var to_height = $body.find('.modal-body').outerHeight();

                    // Hack for Safari 7. If this is not added, the CSS
                    // transitions on the $body do not run.
                    $choice_modal.find('.modal-dialog').css('transform', 'translate(0, 1px)');

                    // Yield to allow the browser to draw at from_height
                    setTimeout(function() {
                        // Re-enable transitions. Yield to allow the browser
                        // to register the transitions.
                        $body.css('transition', transition);
                        setTimeout(function() {
                            $body
                                .data('state', 'opening-height')
                                .css('height', to_height);

                            // Hack for Safari 7. If this is not added, the CSS
                            // transitions on the $body do not run.
                            $choice_modal.find('.modal-dialog').css('transform', 'translate(0, 0)');
                        }, 0);
                    }, 0);
                } else if (state === 'opening-height') {
                    $body.data('state', 'opening-opacity-in').css('opacity', 1);
                } else if (state === 'opening-opacity-in') {
                    $body.data('state', '');
                }
            }
        }
    );

    function openInterstitialModal(choice) {
        $choice_modal.find('.choice-body-container')
            .data('state', 'opening-opacity-out')
            .css('opacity', 0);

        $choices.each(function(i) {
            $choice_modal.removeClass('interstitial-modal-' + $(this).data('choice'));
        });

        if (choice) {
            $choice_modal.addClass('interstitial-modal-' + choice);
        }
    }

    function handleChoiceModalOpen() {
        var $choice_modal = $(this);

        // remove any selection
        $choices.each(function(i) {
            $choice_modal.removeClass('interstitial-modal-' + $(this).data('choice'));
        });

        // make sure we're on the first page
        $choice_modal.removeClass('choice-modal-interstitial')
        $choice_modal.find('.choice-body-container').css('height', 'auto');

        // center it vertically
        $choice_modal.css('display', 'block');
        var $dialog = $choice_modal.find('.modal-dialog');

        setTimeout(function() {
            var offset = Math.max(
                ($(window).height() - $dialog.height()) / 2,
                20
            );
            $dialog.css('margin-top', offset);
        }, 20);
    }

    $choice_modal.on('show.bs.modal', handleChoiceModalOpen);

    var hash = window.location.hash;

    if (isAustralis()) {
        // if the browser is Australis, add a class to HTML tag
        // and show the primary choice modal
        var $html = $(document.documentElement);
        $('html').addClass('australis');

        // if we're on australis, and not mobile,
        // and there's no hash tag, show the choice modal
        if (hash.indexOf("#") === -1) {
            if (getMode() === 'desktop') {
                $choice_modal.modal();
            }
        }
    } else {
        $('html').addClass('non-australis');
    }

    if (hash === '#choice') {
        $choice_modal.modal();
    } else if (hash === '#video') {
        var onVideoPath = true;
        $('#video-modal').modal();
        insertVideo();
    } else if (hash === '#number') {
        $('#number-modal').modal();
    } else if (/^#stats/.test(hash)) {
        // if URL starts with #stats, show the stats modal
        $('body').addClass('stats-panel-open');
        updateStatsPanel();
    }

    $( '.stats-panel-tab' ).click(function() {
        $('body').toggleClass('stats-panel-open');
        updateStatsPanel();
    });

    // turn on fading for choice modal after initial load so it fades
    // on subsequent open/closes, but not the first time
    $choice_modal.addClass('fade');

    // "Share the map" popopver
    $('.popover-markup > .trigger').popover({
        html : true,
        title: function() {
          return $(this).parent().find('.head').html();
        },
        content: function() {
          return $(this).parent().find('.content').html();
        },
        container: 'body'
    });

    // Close popover on click outside of popover
    $('body').on('click', function (e) {
        $('[data-toggle="popover"]').each(function () {
            //the 'is' for buttons that trigger popups
            //the 'has' for icons within a button that triggers a popup
            if (!$(this).is(e.target) &&
                $(this).has(e.target).length === 0 &&
                $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
    });

    function openShareWindow(href) {
        $('.popover-markup  .trigger').popover('hide');
        window.open(href, '_blank', "height=420,width=550");
    }

    function shareChoice(choice) {
        var url = $choice_modal.data('share-url');
        if (url) {
            $.post(url, { 'issue': choice });
        }
    }

    $('.mobile-choice-link').click(function(e) {
        e.preventDefault();
        $choices.removeClass('selected');
        $('.choices').removeClass('in-progress');
        $('body').removeClass('stats-panel-open');
        updateStatsPanel();
    });

    $choices.click(function() {
        $choices.removeClass('selected');
        $(this).addClass('selected');
        $('.choices').addClass('in-progress');

        shareChoice($(this).data('choice'));

        if (getMode() === 'mobile') {
            $('body')
                .addClass('stats-panel-open')
                .scrollTop(0);

            updateStatsPanelChoice($(this).data('choice'));
            updateStatsPanel();
        } else {
            openInterstitialModal($(this).data('choice'));
        }
    });

    $('.stats-mobile-picker').click(function(event) {
        var n = event.target;
        var pass_click = true;
        while (n !== this) {
            if (n.nodeName === 'SELECT') {
                pass_click = false;
                break;
            }
            n = n.parentNode;
        }
        if (pass_click) {
            // Using a regular $.click() doesn't work here. We use the DOM
            // Level 2 Events API instead.
            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('mousedown', true, true, window);
            var $select = $(this).find('select');
            $select.get(0).dispatchEvent(e);
        }
    });

    // Open .share-window links in a new window, and close any popovers
    $(document).on('click', '.share-window', function(event) {
        event.preventDefault();
        openShareWindow(this.href);
    });

    // Insert YouTube video into #video modal
    function insertVideo() {

        $('#video-player').tubeplayer({
            width: 853, // the width of the player
            height: 480, // the height of the player
            allowFullScreen: "true", // true by default, allow user to go full screen
            initialVideo: "Xm5i5kbIXzc", // the video that is loaded into the player
            showinfo: 0,
            autoPlay: 1,
            onPlayerEnded: function(){
                proceedToChoiceModal();
            }, // after the player is stopped
        });

        function proceedToChoiceModal() {
            if (onVideoPath) {
                $('#video-modal').modal('hide');
                $('#choice-modal').modal('show');
            }
            onVideoPath = false;
        }

        $('#video-player').fitVids();

    }

    $('#video-modal').on('show.bs.modal', function (e) {
        // Insert YouTube player when video modal is opened
        insertVideo();
    });

    $('#video-modal').on('hidden.bs.modal', function (e) {
        // Stop YouTube player when video modal is closed
        $('video-player').tubeplayer('destroy');
    });

    // Hide glows when opening modals
    $('.modal').on('show.bs.modal', function (e) {
        hideGlows();
    });

    // Show glows when closing modals
    $('.modal').on('hidden.bs.modal', function (e) {
        if (!$('body').hasClass('stats-panel-open')) {
            showGlows();
        }
    });

});
