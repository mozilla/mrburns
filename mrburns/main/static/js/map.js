"use strict";

var width,
    height;

var color = new Object();
	color["Asia"] = "#d6557a";
	color["Africa"] = "#6e3f7d";
	color["South America"] = "#1d4488",
	color["North America"] = "#6c9e45",
	color["Europe"] = "#df9128",
	color["Oceania"] = "#be514f";
	/*color["privacy"] = "#e24063";
	color["opportunity"] = "#682567";
	color["accessibility"] = "#092c74",
	color["freedom"] = "#81bc2e",
	color["learning"] = "#f18903",
	color["user_control"] = "#c43a31";*/

$(document).ready(function () {
    assignEventListeners();
    drawMap($("#map_container").width() / 2 - 100);
});

function assignEventListeners() {
    $(".key a").on("click", function (i, d) {
        if ($(this).attr("id") != "view_by_region") {
            d3.selectAll(".continent")
                .style("stroke", "#166c9e")
                .style("fill", "#166c9e");

            $(".continent_label").html("");
        }

        $(".key a").removeClass("selected");

        $(this).toggleClass("selected");

        return false;
    });

    $("#view_by_region").on("click", function () {
        d3.selectAll(".continent")
            .each(function (d, i) {
                d3.select(this)
                    .style("fill", function (d, i) {
                        return color[d.name];
                    })
                    .style("stroke", function (d, i) {
                        return color[d.name];
                    });
            });

        addTopIssueLabels();

        return false;
    });
}

function drawMap(ht) {
    $("#map_container").html("<svg id='map' xmlns='http://www.w3.org/2000/svg' width='100%' height='" + ht + "'></svg>");
    var svg = d3.select("svg");

    width = $("svg").parent().width();
    height = ht;

    var projection = d3.geo.equirectangular()
        .scale((width / 640) * 100)
        .translate([width / 2, height / 2 + 40])
        .precision(.1);

    var path = d3.geo.path()
        .projection(projection);

    d3.json("/static/data/world-continents-110m.json", function (error, world) {
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
		//var antarctica = {type: "FeatureCollection", name: "Antarctica", color: "#98df8a", id:6, features: countries.features.filter(function(d) { return d.properties.continent=="Antarctica"; })};
        
        var continents = [asia, africa, europe, na, sa, oceania];

		var continent = svg.selectAll(".continent")
				.data(continents);
				
        continent
        	.enter().insert("path")
            .attr("class", function (d) {
                //console.log(d.name.replace(/ /g, "_"));
                return "continent " + d.name.replace(/ /g, "_");
            })
            .attr("d", path)
            .attr("id", function (d, i) {
                return d.id;
            })
            .attr("title", function (d, i) {
                return d.name;
            });
            
        continent
            .on("mouseenter", function (d, i) {
                console.log(d.name);
            });

		//add glows
        populateGlowsFromLastTick(projection, svg);

        //repull the glow data and show new ones does that after 5s, change once we have actual data
        setInterval(function () {
            populateGlowsFromLastTick(projection, svg);
        }, 5000);
    });
}

function addTopIssueLabels() {
	var na_position = [width / 5, 100 + height / 4.6],
        sa_position = [width / 3.2, 100 + height / 1.65],
        africa_position = [width / 1.9, 100 + height / 2.2],
        europe_position = [width / 1.9, 100 + height / 4.6],
        asia_position = [width / 1.42, 100 + height / 3.2],
        oceania_position = [width / 1.2, 100 + height / 1.46];

    $("#na_top_issue")
        .css("left", na_position[0] + "px")
        .css("top", na_position[1] + "px")
        .html("<div class='header'>Top Issue</div>Freedom");

    $("#sa_top_issue")
        .css("left", sa_position[0] + "px")
        .css("top", sa_position[1] + "px")
        .html("<div class='header'>Top Issue</div>Accessibility");

    $("#africa_top_issue")
        .css("left", africa_position[0] + "px")
        .css("top", africa_position[1] + "px")
        .html("<div class='header'>Top Issue</div>Opportunity");

    $("#asia_top_issue")
        .css("left", asia_position[0] + "px")
        .css("top", asia_position[1] + "px")
        .html("<div class='header'>Top Issue</div>Privacy");

    $("#europe_top_issue")
        .css("left", europe_position[0] + "px")
        .css("top", europe_position[1] + "px")
        .html("<div class='header'>Top Issue</div>Learning");

    $("#oceania_top_issue")
        .css("left", oceania_position[0] + "px")
        .css("top", oceania_position[1] + "px")
        .html("<div class='header'>Top Issue</div>User control");
}

function populateGlowsFromLastTick(projection, svg) {
    d3.json("/static/data/dummy.json", function (places) {
        console.log(places);
        svg.selectAll(".pin")
            .data(places.downloads_geo)
            .enter().append("circle")
            .attr("r", 0)
            .style("opacity", 0)
            .attr("transform", function (d) {
                return "translate(" + projection([
                    d.long,
                    d.lat
                ]) + ")"
            })
            .transition()
            	.delay(function (d, i) {
                	console.log($("circle").length);
	                return randomRange(0, 2000, 0);
    	        })
        	    .duration(2000)
            	.attr("r", 3)
	            .style("opacity", 0.8)
    	        .transition()
        	    	.duration(4000)
            		.style("opacity", 0)
	            	.remove();
    });
}

function randomRange(minVal, maxVal, floatVal) {
    var randVal = minVal + (Math.random() * (maxVal - minVal));
    return typeof floatVal == 'undefined' ? Math.round(randVal) : randVal.toFixed(floatVal);
}