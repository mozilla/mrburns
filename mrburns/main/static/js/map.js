var showing_glows = false;
var header_visible = false;

$(document).ready(function() {
    'use strict';

    var width,
        height,
        projection,
        world,
        continent_centers,
        continents,
        counter_interval,
        populate_glows_interval,
        let_it_glow_interval,
        time_passed_interval,
        selected_choice_map_view = '',
        showing_choice = false,
        showing_regions = false,
        map_geo_previous = [], //previous set of map_geos
        glow_size = 1.5,
        glow_tick = 60000; //in ms

    var staticDataUrl = $('body').data('staticDataUrl');
    d3.json(staticDataUrl + "world-continents-110m.json", function(error, d) {
        assignEventListeners();

        world = d;
        drawMap($('#map-container').width() / 2 - 100, false);
    });

    function assignEventListeners() {
        //view by choice listener
        $('.key-map a').on('click', function(e) {
            var previous_choice = selected_choice_map_view;

            selected_choice_map_view = '';

            $('.key-map a').removeClass('selected');
            $(this).toggleClass('selected');

            //did we click one of the choices, as opposed to the region view
            if ($(this).attr('id') != 'view-by-region') {
                var choice = $(this)[0].parentNode.className.split('choice-')[1];

                //are we turning this fine gentleman off?
                if(choice == previous_choice) {
                    $(this).toggleClass('selected');
                    removeMapOverlays();
                    showing_choice = !showing_choice;

                    return;
                }

                selected_choice_map_view = choice;
                removeMapOverlays();
                showing_regions = false;
                showing_choice = true;

                //color continents per that choice and show percentages
                addIssueBreakOutOverContinents(choice, eval('data.issue_continents.' + choice));
            }

            return false;
        });

        //view by region listener
        $('#view-by-region').on('click', function() {
            if(showing_regions) {
                $(this).toggleClass('selected');
                removeMapOverlays();
                showing_regions = !showing_regions;
                showing_choice = false;

                return;
            }

            showing_regions = !showing_regions;
            showing_choice = false;
            addTopIssueLabels();

            return false;
        });

        $(window).bind('resizeEnd', function() {
            resizeCanvasAndSvg();
        });
    }

    function removeMapOverlays() {
        d3.selectAll('.continent')
            .style('stroke', 'none')
            .style('fill', 'rgba(0,0,0,.25)');

        $('.continent-label').hide();
        $('.continent-for-issue-label').hide();
    }

    function addIssueBreakOutOverContinents(choice, choice_data) {
        $('.continent-for-issue-label').hide();
        $('.continent-label').hide();

        //remove antarctica
        choice_data = choice_data.filter(function(d) { return d.continent != 'AN'; })

        var min = d3.min(choice_data, function(d) { return d.count; }),
            max = d3.max(choice_data, function(d) { return d.count; });

        //color continents per issue data per continent
        var color_issue_per_continent = d3.scale.linear()
            .domain([min,max])
            .range([d3.hcl(color[choice]).brighter(1), color[choice]]);

        $.each(choice_data, function(i, d) {
            d3.select('.continent.' + d.continent)
                .style('fill', function() {
                    var rgb = d3.rgb(color_issue_per_continent(d.count));
                    return 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',.90)';
                })
                .style('stroke', function() {
                    return 'none';
                });

            d3.select('#' + d.continent.toLowerCase() + '-perc-for-issue text')
                .text(function() {
                    return (d.count * 100).toFixed(1) + '%';
                })
                .style('fill', function(d, i) {
                    return color[choice];
                })
                .style('stroke', function(d, i) {
                    return color[choice];
                });

            $('.continent-for-issue-label').show();
        });
    }

    function getContinentPositions() {
        width = $('#map-container').parent().width() + 35;

        var pos = new Object();
        pos['na'] = [width / 4.6, height / 4.8];
        pos['sa'] = [width / 3.2, height / 1.65];
        pos['af'] = [width / 1.85, height / 2.2];
        pos['eu'] = [width / 1.95, height / 6.7];
        pos['as'] = [width / 1.36, height / 3.2];
        pos['oc'] = [width / 1.19, height / 1.46];

        return pos;
    }

    function addTopIssueLabels() {
        var top_issues = new Object();
        d3.selectAll('.continent').each(function(d, i) {
            var country_attribs = data.continent_issues[d.name];
            var top_issue_for_this_continent = d3.entries(country_attribs).sort()[0].key;

            top_issues[d.name] = top_issue_for_this_continent;

            d3.select(this)
                .style('fill', function(d, i) {
                    return color[top_issue_for_this_continent];
                })
                .style('stroke', function(d, i) {
                    return color[top_issue_for_this_continent];
                });
        });

        $('.continent-for-issue-label').hide();
        $('.continent-label').hide();

        d3.select('#na-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['NA']
                    + ' .choice-title span').html();
            });

        d3.select('#sa-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['SA']
                    + ' .choice-title span').html();
            });

        d3.select('#af-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['AF']
                    + ' .choice-title span').html();
            });

        d3.select('#as-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['AS']
                    + ' .choice-title span').html();
            });

        d3.select('#oc-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['OC']
                    + ' .choice-title span').html();
            });

        d3.select('#eu-top-issue .top-issue-text')
            .text(function() {
                return $('.choice-' + top_issues['EU']
                    + ' .choice-title span').html();
            });

        $('.continent-label').show();
    }

    function animateCounterContinuous(last_count, current_count) {
        clearInterval(counter_interval);

        //update every 10s
        var increment_by = Math.floor((current_count - last_count) / 6);
        var intermediate_count = last_count + increment_by;

        var shareTotal = $('.share_total')[0];
        shareTotal.textContent = addCommas(Math.round(last_count));

        counter_interval = setInterval(function() {
            $({the_value: intermediate_count - increment_by}) //from
                .animate({the_value: intermediate_count}, { //to
                    duration: 2000,
                    easing: 'swing',
                    step: function(i) {
                        shareTotal.textContent = addCommas(Math.round(this.the_value));
                    }
            });

            intermediate_count += increment_by;
        }, glow_tick / 6);

        // Once we have the share_total, show the site header
        if (!header_visible) {
            $('header').addClass('visible');
        }
    }

    function drawMap(ht, just_resized) {
        //clear our friend the map container
        $('#map-container').empty();

        // Adjust top position to vertically center
        var headerHeight = $('header').height();
        var containerHeight = $('#map-container').parent().height();
        var mapOffset = Math.round(((containerHeight - ht) / 2) - headerHeight);
        if (mapOffset > 0) {
            $('#map-container').css('top', mapOffset);
        }

        width = $('#map-container').parent().width() + 35;
        height = ht;

        continent_centers = getContinentPositions();

        //add canvas
        $('#map-container').prepend("<canvas id='map-canvas'></canvas>");
        var ctx = $('#map-canvas')[0].getContext('2d');

        //initialize canvas display
        if (showing_glows) {
            ctx.canvas.style.display = 'block';
        } else {
            ctx.canvas.style.display = 'none';
        }

        //set canvas' width and height
        ctx.canvas.width = width;
        ctx.canvas.height = ht;

        //add svg
        $('#map-container').append(
            "<svg id='map-vector' "
                + "xmlns='http://www.w3.org/2000/svg' width='100%' height='"
                + ht + "'></svg>");
        var svg = d3.select('#map-vector');

        //add svg for map overlays (top issue and continent perc. breakouts)
        //since we need these to be above the canvas
        $('#map-container').append(
            "<svg id='map-vector-overlays' "
                + "xmlns='http://www.w3.org/2000/svg' width='100%' height='"
                + ht + "'></svg>");
        var svg_overlays = d3.select('#map-vector-overlays');

        //define the projection
        projection = d3.geo.equirectangular()
            .scale((width / 638) * 100)
            .translate([width / 2 - 20, height / 2 + 40])
            .precision(.1);

        var path = d3.geo.path().projection(projection);

        var countries = topojson.feature(world, world.objects.countries);

        //http://geojson.org/geojson-spec.html#introduction
        var asia = {type: "FeatureCollection",name: "AS",id: 1,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "Asia";})};
        var africa = {type: "FeatureCollection",name: "AF",id: 2,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "Africa";})};
        var europe = {type: "FeatureCollection",name: "EU",id: 3,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "Europe";})};
        var na = {type: "FeatureCollection",name: "NA",id: 4,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "North America";})};
        var sa = {type: "FeatureCollection",name: "SA",id: 5,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "South America";})};
        var oceania = {type: "FeatureCollection",name: "OC",id: 7,
            features: countries.features.filter(function (d) {
                return d.properties.continent == "Oceania";})};
        continents = [asia, africa, europe, na, sa, oceania];

        var continent = svg.selectAll(".continent").data(continents);

        continent.enter()
            .insert('path')
                .attr('class', function(d) {
                    return 'continent ' + d.name.replace(/ /g, "_");
                })
                .attr('d', path).attr('id', function(d, i) {
                    return d.id;
            });

        $.each($('.continent'), function(i, d) {
            var continent_code = $(d).attr('class').split(' ')[1].toLowerCase();

            var g = svg_overlays.append('g')
                .attr('class', function() {
                    return 'continent-for-issue-label';
                })
                .attr('id', function() {
                    return continent_code + '-perc-for-issue';
                })
                .attr('transform', function(d) {
                    return 'translate(' + continent_centers[continent_code][0]
                        + ','
                        + continent_centers[continent_code][1]
                        + ')';
                });

            g.append('circle')
                .attr('r', 35);

            g.append('text')
                .attr('text-anchor', 'middle')
                .attr('transform', 'translate(0, 6)');

            //top issue
            var g2 = svg_overlays.append('g')
                .attr('class', function() {
                    return 'continent-label';
                })
                .attr('id', function() {
                    return continent_code + '-top-issue';
                })
                .attr('transform', function(d) {
                    return 'translate(' + continent_centers[continent_code][0]
                        + ','
                        + continent_centers[continent_code][1]
                        + ')';
                });

            g2.append('text')
                .attr('class', 'header')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(-20, 0)')
                .text($('.top-issue-literal').html());

            g2.append('text')
                .attr('class', 'top-issue-text')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(-20, 18)');
        });

        //have we just resized the window, do we need to add any of the overlays
        if(just_resized && !showing_regions && selected_choice_map_view != '') {
            removeMapOverlays();
            showing_regions = false;

            //color continents per that choice and show percentages
            addIssueBreakOutOverContinents(
                selected_choice_map_view,
                    eval('data.issue_continents.' + selected_choice_map_view));
        }
        else if(just_resized && showing_regions) {
            addTopIssueLabels();
        }

        //add glows
        clearInterval(populate_glows_interval);
        clearGlowIntervals();

        populateGlowsFromLastTick();

        //repull the glow data and show new ones, does that after 60s
        populate_glows_interval = setInterval(function() {
            clearGlowIntervals();
            populateGlowsFromLastTick();
        }, glow_tick);
    }

    function clearGlowIntervals() {
        clearInterval(let_it_glow_interval);
        clearInterval(time_passed_interval);
    }

    function populateGlowsFromLastTick() {
        var multiplier = 10;

        var svg = d3.select('#map-vector');
        var ctx = $('#map-canvas')[0].getContext('2d');

        d3.json(getJsonDataUrl(), function(places) {
            //places.map_geo.splice(100, places.map_geo.length-100);
            //console.log('places length -->', places.map_geo.length);

            //animate the counter
            animateCounterContinuous(places.map_previous_total, places.map_total);

            //first we need to modify map_geo, by setting a random delay for each glow
            //we do this only once per tick, i.e. once per 60s
            $.each(places.map_geo, function(i, d) {
                if(places.map_geo[i].count >= 60) {
                    places.map_geo[i].delay = 500; //show right away
                }
                else if(places.map_geo[i].count > 30 && places.map_geo[i].count < 60) {
                    //delay is in ms
                    places.map_geo[i].delay = glow_tick - (places.map_geo[i].count * 1000);
                }
                else {
                    places.map_geo[i].delay = (i * (1000 / multiplier)) % glow_tick;
                }
            });

            //append non-dead map_geos to this new places array
            //so that we get a smooth transition between minutes
            //console.log("map_previous -->", map_geo_previous.length);
            $.each(map_geo_previous, function(i, d) {
                if(d.dead != 1 && d.count < 10) {
                    d.count = 0; //immediately transition this fine gentleman out
                    d.delay = 0;
                    d.transitioning = 1;
                    places.map_geo.push(d);
                }

                if(i == map_geo_previous.length)
                    map_geo_previous = [];
            });

            //console.log("places map geo -->", places.map_geo.length);

            //repaint our canvas
            var i = 0;
            let_it_glow_interval = setInterval(function() {
                letItGlow(places.map_geo, ctx, i, multiplier);
            }, 150);

            //keep track of the time for this tick
            time_passed_interval = setInterval(function() {
                i = i + (1000 / multiplier);
            }, 1000 / multiplier);
        });
    }

    function letItGlow(places, ctx, time_in_ms, multiplier) {
        //clear the canvas
        ctx.clearRect(0, 0, width, height);

        var x = 0, y = 0;

        for(var i=0; i<places.length; i++) {
            if(places[i].dead == 1) continue;

            x = projection([places[i].lon, places[i].lat])[0];
            y = projection([places[i].lon, places[i].lat])[1];

            //if the glow doesn't have an opacity, assume it is 0
            if(places[i].opacity == undefined)
                places[i].opacity = 0;

            //if it's a high-count glow, we show it for the entirety of the tick
            if(places[i].delay == 0 && !places[i].transitioning) {
                places[i].opacity = 1;
            }
            //if it's our glow's time to shine, display it and reduce its opacity henceforth
            else if(time_in_ms >= places[i].delay && places[i].count > 0) {
                //if our glow is about to be born
                if(places[i].opacity <= 0.9) {
                    places[i].opacity = places[i].opacity + 0.2;
                }
                else {
                    //decrement every 1s, since each count is worth 1s of screen time
                    if((time_in_ms % (1000 / multiplier)) == 0) {
                        places[i].count = places[i].count - 1;
                    }

                    places[i].opacity = 1;
                }
            }
            //if our glow had its time to shine and is now, sadly, dying...
            else if(time_in_ms >= places[i].delay && places[i].count <= 0) {
               //if our glow is dying
                if(places[i].opacity > 0.1) {
                    places[i].opacity = places[i].opacity - 0.05;
                }
                else {
                    places[i].opacity = 0;
                    places[i].dead = 1; //r.i.p. glow, until next...minute
                }
            }

            ctx.fillStyle = 'rgba(40, 217, 23, ' + places[i].opacity + ')';
            ctx.beginPath();
            ctx.arc(x, y, glow_size, 0, 2 * Math.PI, false);
            ctx.fill();
        }

        map_geo_previous = places;
    }

    function resizeCanvasAndSvg() {
        //set new width and height for canvas
        width = $('#map-container').parent().width() + 35;
        height = $('#map-container').width() / 2 - 100;

        //redraw map
        //todo don't pull data file again from server on redraw
        d3.selectAll('#map-vector').remove();
        drawMap(height, true);

        var canvas = document.getElementById('map-canvas');
        var ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;
    }

    //http://stackoverflow.com/questions/2854407/
    //javascript-jquery-window-resize-how-to-fire-after-the-resize-is-completed
    $(window).resize(function() {
        if(this.resizeTO) clearTimeout(this.resizeTO);
            this.resizeTO = setTimeout(function() {
            $(this).trigger('resizeEnd');
        }, 500);
    });
});

function showGlows() {
    $('#map-canvas').show();
    showing_glows = true;
}

function hideGlows() {
    $('#map-canvas').hide();
    showing_glows = false;
}

function randomRange(minVal, maxVal, floatVal) {
    var randVal = minVal + (Math.random() * (maxVal - minVal));
    return typeof floatVal == 'undefined'
        ? Math.round(randVal)
        : randVal.toFixed(floatVal);
}

var commasRgx = /(\d+)(\d{3})/;
function addCommas(nStr) {
    nStr += '';
    while (commasRgx.test(nStr)) {
        nStr = nStr.replace(commasRgx, '$1' + getSeparator() + '$2');
    }
    return nStr;
}

/* L10N Number SEPARATOR - Uses html attr lang to determine if , . or space is used
 * Uses globals to minimize DOM queries and array searches. Trying to be fast here.
 */
var LANG = document.documentElement.lang;
var SEPARATOR = null;
var COMMA  = ['en', 'he', 'ko', 'ja', 'zh-cn', 'zh-tw'];
var DOT = ['de', 'es', 'id', 'it', 'nl', 'pt-br', 'ro', 'sl'];
//var space = ['cs', 'fr', 'hu', 'lt', 'pl', 'ru', 'sk', 'sq'];

function getSeparator() {

    //Return if value set - we only do this once per page load.
    if(SEPARATOR != null) {
        return SEPARATOR;
    } else {
        if(COMMA.indexOf(LANG) != -1) {
            SEPARATOR = ',';
            return SEPARATOR;
        }

        if(DOT.indexOf(LANG) != -1) {
            SEPARATOR = '.';
            return SEPARATOR;
        }

        //Default SEPARATOR is space
        SEPARATOR = '\xA0';
        return SEPARATOR;
    }
}
