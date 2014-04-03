console.log('Calmer than you are.');

$( '.stats-panel-tab' ).click(function() {
    $( '.stats-panel' ).toggleClass( "open" );
});

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

$(document).ready(function () {

    var hash = window.location.hash;

    if (isAustralis()) {
        // if the browser is Australis, add a class to HTML tag
        // and show the primary choice modal
        var $html = $(document.documentElement);
        $('html').addClass('australis');

        // if we're on australis and there's no hash tag, show the choice modal
        window.alert(hash.indexOf("#") === -1);
        if (hash.indexOf("#") === -1) {
            $( '#choice' ).modal();
        }

    }

    if (hash.indexOf("choice") != -1) {
        // if #choice is in the URL, show the choice modal
        $( '#choice' ).modal();
    } else if (hash.indexOf("video") != -1) {
        // if #video is in the URL, show the video modal
        $( '#video' ).modal();
    } else if (hash.indexOf("number") != -1) {
        // if #number is in the URL, show the number modal
        $( '#number' ).modal();
    }

});