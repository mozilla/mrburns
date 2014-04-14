// vim:set et ts=4 sw=4
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
    //TODO get the timestamp this way once deployed on dev
    /*$.ajax({ 
             type: "GET",
             dataType: "json",
             url: "/latest_data/",
             success: function(data){        
                rounded_timestamp = data.timestamp;
             }
         });*/

    var coeff = 1000 * 60;
    var date = new Date().addHours(7);
    var url = ($('body').attr('data-static-url') != undefined) ?
        $('body').attr('data-static-url') :
        'https://webwewant.mozilla.org/static/';
        
    //get data file from 2 mins ago
    url = 'https://webwewant.allizom.org/static/'; //TODO for local development only
    rounded_timestamp = new Date(Math.round(date.getTime() / coeff) * 60).getTime() - 120;
    console.log(url + 'data/stats_' + rounded_timestamp + '.json');
    
    return url + 'data/stats_' + rounded_timestamp + '.json';
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

    var hash = window.location.hash;

    if (isAustralis()) {
        // if the browser is Australis, add a class to HTML tag
        // and show the primary choice modal
        var $html = $(document.documentElement);
        $('html').addClass('australis');

        // if we're on australis and there's no hash tag, show the choice modal
        if (hash.indexOf("#") === -1) {
            $('#choice-modal').modal();
        }
    } else {
        $('html').addClass('non-australis');
    }

    if (hash.indexOf("choice") != -1) {
        // if #choice is in the URL, show the choice modal
        $( '#choice-modal' ).modal();
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
    $('#choice-modal').addClass('fade');

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

    var $choices = $('.choices .btn');
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

    function openInterstitialModal(choice) {
        $( '#choice-modal' ).modal('hide');

        $interstitial_modal = $('.interstitial-modal');

        $choices.each(function(i) {
            $interstitial_modal.removeClass('interstitial-modal-' + $(this).data('choice'));
        });

        if (choice) {
            $interstitial_modal.addClass('interstitial-modal-' + choice);
        }

        $interstitial_modal.modal('show');
    }

    function shareChoice(choice) {
        var url = $('#choice-modal').data('share-url');
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

    function showShareButtons() {
        $('.choice-footer-container')
            .bind(
                'transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd',
                function (event) {
                    if (event.target === event.currentTarget) {
                        $('.choice-footnotes').css('display', 'block');
                        $('.choice-footer-content, .choice-footnotes').css('opacity', '1');
                    }
                }
            )
            .css('height', '80px');
    }

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

});
