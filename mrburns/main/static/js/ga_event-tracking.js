/**
 * Google Analytics Event Tracking
 */
;(function($) {
'use strict';

    /* Choice & Interstitial Modal
    ***************************************************************************/
    $('#choice-modal').on('shown.bs.modal', function () {
        ga('send', 'event', 'Question: What Kind of Web Do You Want?', 'open modal',{'nonInteraction': 1});
    });

    $('#choice-modal').on('hidden.bs.modal', function () {
        ga('send', 'event', 'Modal: What Kind of Web Do You Want?', 'close modal');
    });

    // Buttons
    $('.choices-wrapper button').click(function() {
        var choice = $(this).data('choice');
        ga('send', 'event', 'Question: What Kind of Web Do You Want?', 'answer button click', choice);
    });

    // Interstitial
    $('#interstitial-modal').on('hidden.bs.modal', function () {
        ga('send', 'event', 'Modal: Did you know?', 'Go To Map Via', 'close modal');
    });

    $('#interstitial-modal .interstitial-close-link').click(function() {
        ga('send', 'event', 'Modal: Did you know?', 'Go To Map Via', 'Now see what kind of web the world wants');
    });

    /* Video Modal
    ***************************************************************************/
    $('#video-modal').on('shown.bs.modal', function () {
        ga('send', 'event', 'Main Map Page Interactions', 'Watch The Video','open video');
    });

    $('#video-modal').on('hidden.bs.modal', function () {
        ga('send', 'event', 'Main Map Page Interactions', 'Watch The Video','close video');
    });

    $('.video-panel-link').click(function() {
        ga('send', 'event', 'Main Map Page Interactions', 'Watch The Video','open video link click');
    });

    /* Number Info Modal
    ***************************************************************************/
    $('#number-modal').on('shown.bs.modal', function () {
        ga('send', 'event', 'Main Map Page Interactions', 'What does this number mean?', 'Open Modal');
    });

    $('#ga-modal-blog-post a').click(function() {
        ga('send', 'event', 'Main Map Page Interactions', 'What does this number mean?', 'Check Out this Blog Post Exit');
    });

    /* FF Download
    ***************************************************************************/
    // TODO double check https error
    $('.btn-download').click(function() {
        ga('send', 'event', 'Main Map Page Interactions', 'download button click','Get Firefox');
    });

    /* Map Left Nav & Bottom Nav
    ***************************************************************************/
    //Left Nav
    $('.key-map a').click(function() {
        var choice = $(this)[0].parentNode.className.split("choice-")[1];
        ga('send', 'event', 'Main Map Page Interactions', 'Navigation: View By Menu Link Clicks', choice);
    });

    //Stats Nav Open & Close
    $('.stats-panel-tab').click(function() {
        var state = $(this).find('span.title').html();
        ga('send', 'event', 'Main Map Page Interactions', state);
    });

    $('#ga-what-matters-link').click(function() {
        ga('send', 'event', 'Question: What Kind of Web Do You Want?', 'what matters to you link click');
    });

    $('.stats-panel-link a.trigger').click(function() {
        ga('send', 'event', 'Main Map Page Interactions', 'Share this Page', 'initiate share action');
    });


    /* Stats
    ***************************************************************************/
    //Left Nav
    $('.key-stats-panel a').click(function() {
        var choice = $(this)[0].parentNode.className.split("choice-")[1];
        ga('send', 'event', 'Facts and Figures Tab', 'Navigation: View By Menu Link Clicks', choice);
    });

    //Share This Page - Relies on Global current_choice from stats.js
    $('.stats-share-link a.trigger').click(function() {
        ga('send', 'event', 'Facts and Figures Tab', 'Share this Page', current_choice);
    });

    //Dropdown Filter
    $('#country').change(function() {
        ga('send', 'event', 'Facts and Figures Tab', 'Geo Filter', $(this).val());
    });

})(jQuery);
