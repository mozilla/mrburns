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
    //TODO we'll just need this once deployed on dev
    /*$.ajax({ 
             type: "GET",
             dataType: "json",
             url: "https://webwewant.allizom.org/latest_data/",
             success: function(data){        
                rounded_timestamp = data.timestamp - (60 * 5);
             }
         });*/

    var coeff = 1000 * 60;
    
    //TODO remove this once deployed on dev
    var date = new Date().addHours(7);
    
    //get data file from 2 mins ago
    //TODO revisit once in dev
    rounded_timestamp = new Date(Math.round(date.getTime() / coeff) * 60).getTime() - 120;
    
    console.log(rounded_timestamp);
    console.log("https://webwewant.allizom.org/static/data/stats_" + rounded_timestamp + ".json");
    
    return "https://webwewant.allizom.org/static/data/stats_" + rounded_timestamp + ".json";
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
            $( '#choice-modal' ).modal();
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
    }

    $( '.stats-panel-tab' ).click(function() {
        $( 'body' ).toggleClass( "stats-panel-open" );
    });

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

    // Open .share-window links in a new window, and close any popovers
    $(document).on('click', '.share-window', function(event) {
        event.preventDefault();
        openShareWindow(this.href);
    });

    var $choices = $('.choices .btn');
    $choices.click(function() {
        $choices.removeClass('selected');
        $(this).addClass('selected');
        showShareButtons();
    });

    $('.modal-footer .share-twitter').click(function(e) {
        var $selected = $('.choices .selected');
        if ($selected.length) {
            openShareWindow($selected.data('twitter'));
        }
    });

    $('.modal-footer .share-facebook').click(function(e) {
        var $selected = $('.choices .selected');
        if ($selected.length) {
            openShareWindow($selected.data('facebook'));
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
    })

});
