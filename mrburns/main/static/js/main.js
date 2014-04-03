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

    var fx_version = getFirefoxMasterVersion();
    var minimumAustralisVersion = 29;

    return (fx_version >= minimumAustralisVersion);

}

$(document).ready(function () {

    if (isFirefox() && isAustralis()) {
        // if the browser is Australis, add a class to HTML tag
        // and show the primary choice modal
        var $html = $(document.documentElement);
        $('html').addClass('australis');
        $( '#choice' ).modal();
    } else {
    }

});