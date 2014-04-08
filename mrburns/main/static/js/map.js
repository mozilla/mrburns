"use strict";

var width,
    height;

var max_simultaneous_glows = 300,
    glow_tick = 60000; //in ms

$(document).ready(function() {
    assignEventListeners();
    drawMap($("#map-container").width() / 2 - 100);
});

function assignEventListeners() {
    $(".key-map a").on("click", function(i, d) {
        if ($(this).attr("id") != "view-by-region") {
            d3.selectAll(".continent").style("stroke", "#166c9e").style("fill", "#166c9e");

            $(".continent-label").html("");
        }

        $(".key-map a").removeClass("selected");

        return false;
    });

    $("#view-by-region").on("click", function() {
        var top_issues = new Object();
        
        d3.selectAll(".continent").each(function(d, i) {
            var country_attribs = data.continent_issues[getContinentCode(d.name)];
            var top_issue_for_this_continent = d3.entries(country_attribs).sort()[0].key;

            top_issues[getContinentCode(d.name)] = top_issue_for_this_continent;
        
            d3.select(this).style("fill", function(d, i) {
                return color[top_issue_for_this_continent];
            }).style("stroke", function(d, i) {
                return color[top_issue_for_this_continent];
            });
        });
        
        addTopIssueLabels(top_issues);

        return false;
    });
}

function getContinentCode(continent_name) {
    if(continent_name == "Asia") return "AS";
    else if(continent_name == "Africa") return "AF";
    else if(continent_name == "North America") return "NA";
    else if(continent_name == "South America") return "SA";
    else if(continent_name == "Oceania") return "OC";
    else if(continent_name == "Europe") return "EU";
}

function drawMap(ht) {
    $("#map-container").html("<svg id='map' xmlns='http://www.w3.org/2000/svg' width='100%' height='" + ht + "'></svg>");
    var svg = d3.select("svg");

    width = $("svg#map").parent().width() + 35;
    height = ht;

    var projection = d3.geo.equirectangular()
        .scale((width / 640) * 100)
        .translate([width / 2 - 20, height / 2 + 40])
        .precision(.1);
        
    var path = d3.geo.path().projection(projection);

    d3.json("/static/data/world-continents-110m.json", function(error, world) {
        console.log(world);
        console.log(topojson);

        var countries = topojson.feature(world, world.objects.countries);

        //http://geojson.org/geojson-spec.html#introduction
        var asia = {type: "FeatureCollection",name: "Asia",id: 1,features: countries.features.filter(function (d) {return d.properties.continent == "Asia";})};
        var africa = {type: "FeatureCollection",name: "Africa",id: 2,features: countries.features.filter(function (d) {return d.properties.continent == "Africa";})};
        var europe = {type: "FeatureCollection",name: "Europe",id: 3,features: countries.features.filter(function (d) {return d.properties.continent == "Europe";})};
        var na = {type: "FeatureCollection",name: "North America",id: 4,features: countries.features.filter(function (d) {return d.properties.continent == "North America";})};
        var sa = {type: "FeatureCollection",name: "South America",id: 5,features: countries.features.filter(function (d) {return d.properties.continent == "South America";})};
        var oceania = {type: "FeatureCollection",name: "Oceania",id: 7,features: countries.features.filter(function (d) {return d.properties.continent == "Oceania";})};
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

        //add glows
        populateGlowsFromLastTick(projection, svg);

        //repull the glow data and show new ones does that after 60s
        setInterval(function() {
            populateGlowsFromLastTick(projection, svg);
        }, glow_tick);
    });
}

function addTopIssueLabels(top_issues) {
    var top_offset = 0;

    var na_position = [width / 5, top_offset + height / 4.6],
        sa_position = [width / 3.2, top_offset + height / 1.65],
        africa_position = [width / 1.9, top_offset + height / 2.2],
        europe_position = [width / 1.9, top_offset + height / 4.6],
        asia_position = [width / 1.42, top_offset + height / 3.2],
        oceania_position = [width / 1.2, top_offset + height / 1.46];

    $("#na-top-issue")
        .css("margin-left", na_position[0] + "px")
        .css("margin-top", na_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["NA"] 
            + " .choice-title span").html());
            
    $("#sa-top-issue")
        .css("margin-left", sa_position[0] + "px").css("margin-top", sa_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["SA"] 
            + " .choice-title span").html());
            
    $("#africa-top-issue")
        .css("margin-left", africa_position[0] + "px")
        .css("margin-top", africa_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["AF"] 
            + " .choice-title span").html());
            
    $("#asia-top-issue")
        .css("margin-left", asia_position[0] + "px")
        .css("margin-top", asia_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["AS"] 
            + " .choice-title span").html());
    
    $("#europe-top-issue")
        .css("margin-left", europe_position[0] + "px")
        .css("margin-top", europe_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["EU"] 
            + " .choice-title span").html());

    $("#oceania-top-issue")
        .css("margin-left", oceania_position[0] + "px")
        .css("margin-top", oceania_position[1] + "px")
        .html("<div class='header'>Top Issue</div>" + $(".choice-" + top_issues["OC"] 
            + " .choice-title span").html());
}

function populateGlowsFromLastTick(projection, svg) {
    d3.json(getJsonDataUrl(), function(places) {
        $(".share_total").html(addCommas(places.share_total));
        
        //we sort by count to give preference to locations that have the most downloads
        //dots for locations that have a lot of downloads persist for the entire length of the tick
        //for now, cycle through subsets of 400 glows every 10s, any more and the animation becomes less graceful
        //places.map_geo.sort(function(a, b) { return a.count - b.count; })
        
        displaySubsetOfGlows(places.map_geo.splice(places.map_geo.length-max_simultaneous_glows, places.map_geo.length), projection, svg);
        
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
    svg.selectAll(".pin")
            .data(places)
            .enter().append("circle")
                .attr("r", 0)
                .style("opacity", 0)
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon, d.lat]) + ")"
                })
                .transition()
                    .delay(function(d, i) {
                        if(d.count > 30)
                            return randomRange(0, 2000, 0);
                        else
                            return randomRange(0, 10000, 0); //10s is the sub-tick length
                    })
                    .duration(function(d, i) {
                        return 1000; //show for 1s
                    })
                    .attr("r", 3)
                    .style("opacity", 0.8)
                    .transition()
                        .duration(function(d, i) {
                            if(d.count > 30) 
                                return glow_tick; //show for 60s
                            else
                                return 4000;
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