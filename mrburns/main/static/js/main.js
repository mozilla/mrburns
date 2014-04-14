console.log('Calmer than you are.');

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

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

function getJsonDataUrl() {
    var $body = $('body');
    var staticDataUrl = $body.data('staticDataUrl');

    // NOTE: will be 0 when redis is off or returns nothing
    var latestTimestamp = $body.data('timestamp'); // an int

    if (!latestTimestamp) {
        // guess at the latest timestamp (mostly for dev)
        var coeff = 1000 * 60;
        var date = new Date().addHours(7);
        latestTimestamp = new Date(Math.round(date.getTime() / coeff) * 60).getTime();
    }

    // two minutes ago
    latestTimestamp -= 120;  // seconds
    var url = staticDataUrl + 'stats_' + latestTimestamp + '.json';
    console.log(url);
    return url;
}

var $stats_panel_tab_title = $('.stats-panel-tab .title');
var stats_panel_opened_title = $stats_panel_tab_title.data('open-title');
var stats_panel_closed_title = $stats_panel_tab_title.text();

function openStatsPanel() {
    // hide glows on stats panel open
    if (showing_glows) {
        hideGlows();
    } else {
        showGlows();
    }

    showing_glows = !showing_glows;

    // update tab title
    if ($('body').hasClass('stats-panel-open')) {
        $stats_panel_tab_title.text(stats_panel_opened_title);
    } else {
        $stats_panel_tab_title.text(stats_panel_closed_title);
    }
}

$(document).ready(function () {

    var $choice_modal = $('.choice-modal');
    var $choices = $('.choices .btn');
    var events = 'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd';

    $('.choice-footer-container').on(
        events,
        function (event) {
            if (event.target === event.currentTarget) {
                var state = $(this).data('state');
                if (state === 'opening-height') {
                    $(this).data('state', '');
                    $('.choice-footnotes').css('display', 'block');
                    $('.choice-footer-content, .choice-footnotes')
                        .data('state', 'opening-opacity')
                        .css('opacity', '1');
                }
            }
        }
    );

    $('.choice-footnotes').on(
        events,
        function (event) {
            if (event.target === event.currentTarget) {
                var state = $(this).data('state');
                if (state === 'closing-opacity') {
                    $(this).data('state', '').css('display', 'none');
                }
            }
        }
    );

    $('.choice-footer-content').on(
        events,
        function (event) {
            if (event.target === event.currentTarget) {
                var state = $(this).data('state');
                if (state === 'closing-opacity') {
                    $('.choice-footer-container')
                        .data('state', 'closing-height')
                        .css('height', 0);
                }
            }
        }
    );

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

                    // TODO: we need to ignore this transition
                    $body.css('height', from_height);

                    $choice_modal.addClass('choice-modal-interstitial');

                    var to_height = $body.find('.modal-body').outerHeight();

                    setTimeout(function() {
                        // TODO: this gets triggered on initial height event
                        $body.data('state', 'opening-height');
                        $body.css('height', to_height);
                    }, 0);
                } else if (state === 'opening-height') {
                    $body.data('state', 'opening-opacity-in').css('opacity', 1);
                } else if (state === 'opening-opacity-in') {
                    $body.data('state', '');
                }
            }
        }
    );

    function showShareButtons() {
        var height = $('.choice-footer-container .modal-footer').outerHeight();
        $('.choice-footer-container').data('state', 'opening-height').height(height);
    }

    function hideShareButtons() {
        $('.choice-footnotes, .choice-footer-content')
            .data('state', 'closing-opacity')
            .css('opacity', 0);
    }


    function openInterstitialModal(choice) {
        hideShareButtons();

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
                // 150 pixels to approximately account for share buttons
                ($(window).height() - $dialog.height() - 150) / 2,
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

        // if we're on australis and there's no hash tag, show the choice modal
        if (hash.indexOf("#") === -1) {
            $choice_modal.modal();
        }
    } else {
        $('html').addClass('non-australis');
    }

    if (hash.indexOf("choice") != -1) {
        // if #choice is in the URL, show the choice modal
        $choice_modal.modal();
    } else if (hash.indexOf("video") != -1) {
        // if #video is in the URL, show the video modal
        $( '#video-modal' ).modal();
        insertVideo();
    } else if (hash.indexOf("number") != -1) {
        // if #number is in the URL, show the number modal
        $( '#number-modal' ).modal();
    } else if (hash.indexOf("stats") != -1) {
        // if #number is in the URL, show the number modal
        $( 'body' ).addClass('stats-panel-open');
        openStatsPanel();
    }

    $( '.stats-panel-tab' ).click(function() {
        $( 'body' ).toggleClass( "stats-panel-open" );
        openStatsPanel();
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

    $choices.click(function() {
        $choices.removeClass('selected');
        $(this).addClass('selected');
        $('.choices').addClass('in-progress');
        showShareButtons();
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

    // Open .share-window links in a new window, and close any popovers
    $(document).on('click', '.share-window', function(event) {
        event.preventDefault();
        openShareWindow(this.href);
    });

    $('.modal-footer .share-twitter').click(function(e) {
        var $selected = $('.choices .selected');
        if ($selected.length) {
            openShareWindow($selected.data('twitter'));
            openInterstitialModal($selected.data('choice'));
            shareChoice($selected.data('choice'));
        }
    });

    $('.modal-footer .share-facebook').click(function(e) {
        var $selected = $('.choices .selected');
        if ($selected.length) {
            openShareWindow($selected.data('facebook'));
            openInterstitialModal($selected.data('choice'));
            shareChoice($selected.data('choice'));
        }
    });

    $('.choice-footnotes .share-local').click(function(e) {
        var $selected = $('.choices .selected');
        if ($selected.length) {
            openInterstitialModal($selected.data('choice'));
            shareChoice($selected.data('choice'));
        }
    });

    // Insert YouTube video into #video modal
    function insertVideo(autoplay) {
        if (autoplay) {
            autoplay = '1';
        } else {
            autoplay = '0';
        }
        var width = 853;
        var height = 480;
        var id = 'WB98kYqQt9c';
        $('#video-modal .modal-body').html('<iframe width="' + width + '" height="' +
            height + '" src="//www.youtube-nocookie.com/embed/' +
            id + '?autoplay=' + autoplay + '&' +
            '" frameborder="0" allowfullscreen></iframe>')
    }

    $('#video-modal').on('show.bs.modal', function (e) {
        // Insert YouTube player when video modal is opened
        insertVideo(true);
    });

    $('#video-modal').on('hidden.bs.modal', function (e) {
        // Stop YouTube player when video modal is closed
        $('#video-modal .modal-body').html('');
    });

});
