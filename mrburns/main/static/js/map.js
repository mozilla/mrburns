"use strict";

var width,
    height,
    projection,
    continent_centers,
    display_subsets_of_glows_interval,
    user_just_switched_geos = false,
    showing_regions = false,
    showing_glows = true,
    showing_top_geos = true;

var glow_tick = 60000, //in ms
    chunks = 1, //how many chunks are showing the glows in during a tick
    high_download_count_threshold = 50,
    max_simultaneous_glows = 700,
    number_of_medium_count_geos_to_show = 0;

$(document).ready(function() {
    assignEventListeners();
    drawMap($("#map-container").width() / 2 - 100);
});

function assignEventListeners() {
    //toggle glows listener
    $(".toggle-geos").on("click", function(e) {
        //if we're showing top geos, then switch to showing all geos
        if($(".toggle-geos span").hasClass('currently-showing-top-geo')) {
            $(".toggle-geos span")
                .toggleClass('currently-showing-top-geo')
                .html($('.show-top-cities').html());
            
            //show all geos
            showing_top_geos = false;
            user_just_switched_geos = true;
            chunks = 6;
            clearInterval(display_subsets_of_glows_interval);
            $('.glows circle').fadeOut();
            populateGlowsFromLastTick();
        }
        else {
            $(".toggle-geos span")
                .toggleClass('currently-showing-top-geo')
                .html($('.show-all-cities').html());
            
            //show top geos
            showing_top_geos = true;
            user_just_switched_geos = true;
            chunks = 1;
            clearInterval(display_subsets_of_glows_interval);
            $('.glows circle').hide();
            populateGlowsFromLastTick();
        }

        return false;
    });
    
    //view by choice listener
    $(".key-map a").on("click", function(e) {
        $(".key-map a").removeClass("selected");
        $(this).toggleClass("selected");
        
        if ($(this).attr("id") != "view-by-region") {
            var choice = $(this)[0].parentNode.className.split("choice-")[1];
            removeMapOverlays();            
            showing_regions = false;
            
            //color continents per that choice and show percentages
            addIssueBreakOutOverContinents(choice, eval("data.issue_continents." + choice));
        }

        return false;
    });

    //view by region listener
    $("#view-by-region").on("click", function() {
        if(showing_regions) {
            $(this).toggleClass("selected");
            removeMapOverlays(); 
            showing_regions = !showing_regions;
            
            return;
        }
                
        showing_regions = !showing_regions;
        
        var top_issues = new Object();
        d3.selectAll(".continent").each(function(d, i) {
            var country_attribs = data.continent_issues[d.name];
            var top_issue_for_this_continent = d3.entries(country_attribs).sort()[0].key;

            top_issues[d.name] = top_issue_for_this_continent;
        
            d3.select(this)
                .style("fill", function(d, i) {
                    return color[top_issue_for_this_continent];
                })
                .style("stroke", function(d, i) {
                    return color[top_issue_for_this_continent];
                });
        });
        
        addTopIssueLabels(top_issues);

        return false;
    });
}

function showGlows() {
    $("#map-container svg circle").show();
}

function hideGlows() {
    $("#map-container svg circle").hide();
}

function removeMapOverlays() {
    d3.selectAll(".continent")
        .style("stroke", "#166c9e")
        .style("fill", "#166c9e");
                
    $(".continent-label").hide();
    $(".continent-for-issue-label").hide();
}

function addIssueBreakOutOverContinents(choice, choice_data) {
    $(".continent-for-issue-label").hide();
    $(".continent-label").hide();

    //remove antarctica
    choice_data = choice_data.filter(function(d) { return d.continent != "AN"; })
    
    var min = d3.min(choice_data, function(d) { return d.count; }),
        max = d3.max(choice_data, function(d) { return d.count; });
    
    //todo color continents per issue data per continent
    var color_issue_per_continent = d3.scale.linear()
        .domain([min,max])
        .range([d3.hcl(color[choice]).brighter(1), color[choice]]);
    
    $.each(choice_data, function(i, d) {
        d3.select(".continent." + d.continent)
            .style("fill", function() {
                return color_issue_per_continent(d.count);
            })
            .style("stroke", function() {
                return color_issue_per_continent(d.count);
            });
                    
        d3.select('#' + d.continent.toLowerCase() + '-perc-for-issue text')
            .text(function() {
                return (d.count * 100).toFixed(1) + "%";
            })
            .style("fill", function(d, i) {
                return color[choice];
            })
            .style("stroke", function(d, i) {
                return color[choice];
            });
            
        $(".continent-for-issue-label").show();
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

function drawMap(ht) {
    var staticDataUrl = $('body').data('staticDataUrl');
    width = $('#map-container').parent().width() + 35;
    height = ht;
    
    continent_centers = getContinentPositions();
    
    //add svg
    $('#map-container')
        .html(
            "<svg id='map-vector' preserveAspectRatio='xMidYMin meet' viewBox='0 0 "
            + width + " "
            + ht + "' "
            + "xmlns='http://www.w3.org/2000/svg' width='100%' height='" 
            + ht + "'></svg>");
        
    var svg = d3.select("svg");
    
    //define the projection
    projection = d3.geo.equirectangular()
        .scale((width / 628) * 100)
        .translate([width / 2, height / 2 + 40])
        .precision(.1);
        
    var path = d3.geo.path().projection(projection);

    d3.json(staticDataUrl + "world-continents-110m.json", function(error, world) {
        var countries = topojson.feature(world, world.objects.countries);

        //http://geojson.org/geojson-spec.html#introduction
        var asia = {type: "FeatureCollection",name: "AS",id: 1,features: countries.features.filter(function (d) {return d.properties.continent == "Asia";})};
        var africa = {type: "FeatureCollection",name: "AF",id: 2,features: countries.features.filter(function (d) {return d.properties.continent == "Africa";})};
        var europe = {type: "FeatureCollection",name: "EU",id: 3,features: countries.features.filter(function (d) {return d.properties.continent == "Europe";})};
        var na = {type: "FeatureCollection",name: "NA",id: 4,features: countries.features.filter(function (d) {return d.properties.continent == "North America";})};
        var sa = {type: "FeatureCollection",name: "SA",id: 5,features: countries.features.filter(function (d) {return d.properties.continent == "South America";})};
        var oceania = {type: "FeatureCollection",name: "OC",id: 7,features: countries.features.filter(function (d) {return d.properties.continent == "Oceania";})};
        var continents = [asia, africa, europe, na, sa, oceania];

        var continent = svg.selectAll(".continent").data(continents);

        continent.enter().insert("path").attr("class", function(d) {
            return "continent " + d.name.replace(/ /g, "_");
        }).attr("d", path).attr("id", function(d, i) {
            return d.id;
        });

        $.each($('.continent'), function(i, d) {
            var continent_code = $(d).attr('class').split(' ')[1].toLowerCase();
            
            var g = svg.append('g')
                .attr('class', function() {
                    return 'continent-for-issue-label';
                })
                .attr('id', function() {
                    return continent_code + '-perc-for-issue';
                })
                .attr('transform', function(d) {
                    return 'translate(' + continent_centers[continent_code][0].toFixed(2) 
                        + ',' 
                        + continent_centers[continent_code][1].toFixed(2)
                        + ')';
                });
            
            g.append('circle')
                .attr('r', 30);
                
            g.append('text')
              .attr('text-anchor', 'middle')
              .attr('transform', 'translate(0, 6)'); 
              
            //top issue
            var g2 = svg.append('g')
                .attr('class', function() {
                    return 'continent-label';
                })
                .attr('id', function() {
                    return continent_code + '-top-issue';
                })
                .attr('transform', function(d) {
                    return 'translate(' + continent_centers[continent_code][0].toFixed(2) 
                        + ',' 
                        + continent_centers[continent_code][1].toFixed(2)
                        + ')';
                });
            
            g2.append('text')
                .attr('class', 'header')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(-20, 0)')
                .text('Top Issue');
                
            g2.append('text')
                .attr('class', 'top-issue-text')
                .attr('text-anchor', 'start')
                .attr('transform', 'translate(-20, 18)');
        });

        //add group for glows
        svg.append('g')
            .attr('class', 'glows');
        
        //add glows
        populateGlowsFromLastTick();

        //repull the glow data and show new ones does that after 60s
        var populate_glows_interval = setInterval(function() {
            populateGlowsFromLastTick();
        }, glow_tick);
    });
}

function addTopIssueLabels(top_issues) {
    $(".continent-for-issue-label").hide();
    $(".continent-label").hide();
         
    d3.select('#na-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["NA"] 
                + " .choice-title span").html();
        });
        
    d3.select('#sa-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["SA"] 
                + " .choice-title span").html();
        });
        
    d3.select('#af-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["AF"] 
                + " .choice-title span").html();
        });
        
    d3.select('#as-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["AS"] 
                + " .choice-title span").html();
        });
        
    d3.select('#oc-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["OC"] 
                + " .choice-title span").html();
        });
        
    d3.select('#eu-top-issue .top-issue-text')
        .text(function() {
            return $(".choice-" + top_issues["EU"] 
                + " .choice-title span").html();
        });
            
    $(".continent-label").show();
}

function animateCounterContinuous(last_count, current_count) {
    //don't reset if the user switched geos rather than the 60s being up
    if(user_just_switched_geos) {
        user_just_switched_geos = false;
        return;
    }
    
    $({the_value: last_count}) //from
        .animate({the_value: current_count}, { //to
            duration: glow_tick,
            easing: 'swing',
            step: function(i) {
                if(Math.floor(i-last_count) % 10 == 0) {
                    $(".share_total")
                        .html(addCommas(Math.round(this.the_value)));
                }
            }
    });
}

function populateGlowsFromLastTick() {
    var svg = d3.select("svg")
    
    d3.json(getJsonDataUrl(), function(places) {
        //animate the counter
        animateCounterContinuous(places.map_previous_total, places.map_total);
        
        //split map_geos by 6 for use below, we don't want to overwhelm the browser, and
        //so regardless of how many we actually have, they're capped by 
        //max_simultaneous_flows, we do not use just the constant so that in the case that
        //it is erroneously set too high, we don't end up showing all the map_geos in the
        //first 10 seconds
        
        //we sort by count to give preference to locations that have the most downloads
        //dots for locations that have a lot of downloads persist for the entire length 
        //of the tick, for now, cycle through subsets of max_simultaneous_glows 
        //glows every 10s, any more and the animation becomes less graceful
        places.map_geo.sort(function(a, b) { return b.count - a.count; })
        //console.log(places);
        
        
        //are we showing all glows, if so do the sub-chunking every 10s as before
        if(showing_top_geos == false) {
            var glows_per_subtick = Math.floor(places.map_geo.length / chunks);
            max_simultaneous_glows = Math.min(glows_per_subtick, max_simultaneous_glows);
            
            //show it the first time
            displaySubsetOfGlows(places.map_geo.splice(
                    places.map_geo.length-max_simultaneous_glows, 
                        max_simultaneous_glows), projection, svg); 
            
            //load each sub-chunk every 10s
            var i = 1;
            display_subsets_of_glows_interval = setInterval(function() {
                //console.log(places.map_geo.length);
                displaySubsetOfGlows(places.map_geo.splice(
                    places.map_geo.length-max_simultaneous_glows, 
                        max_simultaneous_glows), projection, svg);
            
                i++;
                areWeClearingTheInterval(i);
            }, glow_tick / chunks);
        }
        //are we showing a subset of highly engaged geos
        else {
            //get just the subset of high-count ones 
            $.each(places.map_geo, function(i, d) {
                if(d.count < high_download_count_threshold) {
                    places.map_geo.splice(i + number_of_medium_count_geos_to_show, 
                        places.map_geo.length - i);
                    
                    displaySubsetOfGlows(places.map_geo, projection, svg);
                
                    return false;
                }
            });
        }
        
        function areWeClearingTheInterval(i) {
            if(i == chunks) {
                clearInterval(display_subsets_of_glows_interval);
            }
        }
    });
}
    
function displaySubsetOfGlows(places, projection, svg) {
    console.log("loading subchunk of glows");

    d3.select('.glows').selectAll('.glow')
            .data(places)
            .enter().append("circle")
                .attr("r", 0)
                .style("opacity", 1)
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon, d.lat]) + ")"
                })
                .attr("display", function() {
                    if(!showing_glows)
                        return "none";
                })
                .transition()
                    .delay(function(d, i) {
                        if(d.count > high_download_count_threshold)
                            //start high-count geos within 3s
                            return randomRange(0, 3000, 0);
                        else
                            //start the rest of of the geos within 60s
                            //if showing_top_geos is true, otherwise show
                            //it within 10s
                            if(showing_top_geos)
                                return randomRange(0, glow_tick, 0);
                            else
                                return randomRange(0, glow_tick / chunks, 0);
                    })
                    .duration(function(d, i) {
                        //appear in 1s
                        return 1000;
                    })
                    .attr("r", 2)
                    .transition()
                        .duration(function(d, i) {    
                            //show high-count geos for 60s, there will be some overlap
                            //fade out the others after 0s
                            if(d.count > high_download_count_threshold) 
                                return glow_tick;
                            else
                                return 1000;
                        })
                        .transition()
                            .duration(function(d, i) {
                                //fade out geos in 3s
                                return 3000;
                            })
                            .style("opacity", 0)
                            .remove();

    // If the Choice modal is visible, hide the Glows
    if ($('.choice-modal').hasClass('in')) {
        hideGlows();
        console.log('Hide glow because choice modal was open');

    }

}

function randomRange(minVal, maxVal, floatVal) {
    var randVal = minVal + (Math.random() * (maxVal - minVal));
    return typeof floatVal == 'undefined' ? Math.round(randVal) : randVal.toFixed(floatVal);
}

function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}
