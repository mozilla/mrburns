"use strict";

var width,
    height,
    showing_regions = false,
    showing_glows = true,
    last_count = 0;

var max_simultaneous_glows = 1000,
    glow_tick = 60000; //in ms

var continent_centers;

$(document).ready(function() {
    assignEventListeners();
    drawMap($("#map-container").width() / 2 - 100);
});

function assignEventListeners() {
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
    width = $('#map-container').parent().width() + 35;
    height = ht;
    
    continent_centers = getContinentPositions();
    
    $('#map-container')
        .html(
            "<svg id='map-vector' preserveAspectRatio='xMidYMin meet' viewBox='0 0 "
            + Math.floor(width) + " "
            + Math.floor(ht) + "' "
            + "xmlns='http://www.w3.org/2000/svg' width='100%' height='" 
            + ht + "'></svg>");
        
    var svg = d3.select("svg");

    var projection = d3.geo.equirectangular()
        .scale((width / 628) * 100)
        .translate([width / 2, height / 2 + 40])
        .precision(.1);
        
    var path = d3.geo.path().projection(projection);

    d3.json("/static/data/world-continents-110m.json", function(error, world) {
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
        }).attr("title", function(d, i) {
            return d.name;
        });

        continent.on("mouseenter", function(d, i) {
            console.log(d.name);
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
                    return 'translate(' + continent_centers[continent_code][0] 
                        + ',' 
                        + continent_centers[continent_code][1]
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
                    return 'translate(' + continent_centers[continent_code][0] 
                        + ',' 
                        + continent_centers[continent_code][1]
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

        //add glows
        populateGlowsFromLastTick(projection, svg);

        //repull the glow data and show new ones does that after 60s
        setInterval(function() {
            populateGlowsFromLastTick(projection, svg);
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

function populateGlowsFromLastTick(projection, svg) {
    d3.json(getJsonDataUrl(), function(places) {
        //animate total share counter
        $({someValue: last_count}).animate({someValue: places.share_total}, {
            duration: 3500,
            easing:'swing',
            step: function() {
                $(".share_total").html(addCommas(Math.round(this.someValue)));
            }
        });
        
        last_count = places.share_total;
        
        //split map_geos by 6 for use below, we don't want to overwhelm the browser, and
        //so regardless of how many we actually have, they're capped by 
        //max_simultaneous_flows, we do not use just the constant so that in the case that
        //it is erroneously set too high, we don't end up showing all the map_geos in the
        //first 10 seconds
        var glows_per_subtick = Math.floor(places.map_geo.length / 6);
        max_simultaneous_glows = Math.min(glows_per_subtick, max_simultaneous_glows);
        console.log(max_simultaneous_glows);
        
        //we sort by count to give preference to locations that have the most downloads
        //dots for locations that have a lot of downloads persist for the entire length 
        //of the tick, for now, cycle through subsets of max_simultaneous_glows 
        //glows every 10s, any more and the animation becomes less graceful
        places.map_geo.sort(function(a, b) { return a.count - b.count; })
        
        displaySubsetOfGlows(places.map_geo.splice(
            places.map_geo.length-max_simultaneous_glows, 
                places.map_geo.length), projection, svg);
        
        setTimeout(function() {
            displaySubsetOfGlows(places.map_geo.splice(
                places.map_geo.length-max_simultaneous_glows, 
                    places.map_geo.length), projection, svg);
        }, 10000);
        
        setTimeout(function() {
            displaySubsetOfGlows(places.map_geo.splice(
                places.map_geo.length-max_simultaneous_glows, 
                    places.map_geo.length), projection, svg);
        }, 20000);
        
        setTimeout(function() {
            displaySubsetOfGlows(places.map_geo.splice(
                places.map_geo.length-max_simultaneous_glows, 
                    places.map_geo.length), projection, svg);
        }, 30000);
        
        setTimeout(function() {
            displaySubsetOfGlows(places.map_geo.splice(
                places.map_geo.length-max_simultaneous_glows, 
                    places.map_geo.length), projection, svg);
        }, 40000);
        
        setTimeout(function() {
            displaySubsetOfGlows(places.map_geo.splice(
                places.map_geo.length-max_simultaneous_glows, 
                    places.map_geo.length), projection, svg);
        }, 50000);
    });
}

function displaySubsetOfGlows(places, projection, svg) {
    console.log("loading subchunk of glows");
    svg.selectAll(".glow")
            .data(places)
            .enter().insert("circle", ":nth-child(7)")
                .attr("class", "glow")
                .attr("r", 0)
                .style("opacity", 0.8)
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon, d.lat]) + ")"
                })
                .attr("display", function() {
                    if(!showing_glows)
                        return "none";
                })
                .transition()
                    .delay(function(d, i) {
                        if(d.count > 30)
                            return randomRange(0, 2000, 0);
                        else
                            //10s is the sub-tick length
                            return randomRange(0, 10000, 0);
                    })
                    .duration(function(d, i) {
                        return 1000;
                    })
                    .attr("r", 2)
                    .transition()
                        .duration(function(d, i) {    
                            if(d.count > 30) 
                                return glow_tick; //show for 60s
                            else
                                return 0;
                        })
                        .transition()
                            .duration(function(d, i) {
                                return 3000;
                            })
                            .style("opacity", 0)
                            .remove();
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
