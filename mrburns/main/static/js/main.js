console.log('Calmer than you are.');

$( '.stats-panel-tab' ).click(function() {
    $( '.stats-panel' ).toggleClass( "open" );
});

$( '#choice' ).modal(choiceOptions);

var choiceOptions = {
    "show" : "true"
}
