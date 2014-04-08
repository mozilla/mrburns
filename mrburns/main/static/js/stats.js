"use strict";

var arc,
    τ = 2 * Math.PI,
    xScale;
  
var data,
    current_choice = "privacy",
    current_country = "US";

var color = new Object();
    color["privacy"] = "#e24063";
    color["opportunity"] = "#682567";
    color["access"] = "#092c74",
    color["freedom"] = "#81bc2e",
    color["learning"] = "#f18903",
    color["control"] = "#c43a31";
    
var icon = new Object();
    icon["privacy"] = 'fa-eye';
    icon["opportunity"] = 'fa-heart';
    icon["access"] = 'fa-user';
    icon["freedom"] = 'fa-check-circle-o';
    icon["learning"] = 'fa-book';
    icon["control"] = 'fa-cogs';

$(document).ready(function () {
    $("#country").select2({
        width: 200
    });
    
    //set rhs
    $(".what-is-mozilla-doing-about-it .seperator")
        .css("background-color", color[current_choice]);
    $(".what-is-mozilla-doing-about-it h2")
        .html($(".choice-" + current_choice + "-prose-title-rhs").html());
    $(".what-is-mozilla-doing-about-it .paragraph1")
        .html($(".choice-" + current_choice + "-prose-rhs1").html());
    $(".what-is-mozilla-doing-about-it .paragraph2")
        .html($(".choice-" + current_choice + "-prose-rhs2").html());
            
    assignStatsEventListeners();
    drawCharts();
  
    $(".key-stats-panel ul .choice-privacy a")
        .toggleClass("selected")
});

function assignStatsEventListeners() {
    $(".key-stats-panel a").on("click", function () {
        var choice = $(this)[0].parentNode.className.split("choice-")[1];
        current_choice = choice;
        
        //update right-hand-side
        $(".what-is-mozilla-doing-about-it .seperator")
            .css("background-color", color[current_choice]);
        $(".what-is-mozilla-doing-about-it h2")
            .html($(".choice-" + current_choice + "-prose-title-rhs").html());
        $(".what-is-mozilla-doing-about-it .paragraph1")
            .html($(".choice-" + current_choice + "-prose-rhs1").html());
        $(".what-is-mozilla-doing-about-it .paragraph2")
            .html($(".choice-" + current_choice + "-prose-rhs2").html());
        
        //update chart 1
        updateDonut(data.country_issues.GLOBAL[choice], choice);
        $(".donut-icon i")
            .removeClass("fa-eye fa-heart fa-user fa-check-circle-o fa-book fa-cogs")
            .addClass(icon[choice]);
        
        //update chart 2
        $(".tippy").hide();
        $(".tippytext").hide();
        $(".tippy_" + current_choice).show();
        $(".tippytext_" + current_choice).show();
        
        
        $(".key-stats-panel a").removeClass("selected");
        $(this).toggleClass("selected");
    
        return false;
    });
    
    $("select").on("change", function(d) {
        current_country = d.val;
        
        //update chart 2
        updateStackedBarChart(eval("data.country_issues." + current_country));
    });
}

function drawCharts() {
    $(".stats-panel-contents svg").empty();

    d3.json(getJsonDataUrl(), function(json_data) {
        data = json_data;
        
        //add donut prose, all of them, to the html page
        $.each(json_data.country_issues.GLOBAL, function(i, d) {
            $(".choice-" + i + "-prose .percentage").html(Math.round(d*100) + '%');
        })
        
        drawDonut(json_data.country_issues.GLOBAL[current_choice]);
        drawStackedBarChart(eval("json_data.country_issues." + current_country));
    });
}

function updateDonut(data, current_choice) {
    $(".donut-prose p").html($(".choice-" + current_choice + "-prose").html());

    d3.select(".donut-foreground")
        .transition()
            .duration(950)
            .style("fill", color[current_choice])
            .style("stroke", color[current_choice])
            .call(arcTween, data * τ);
      
    function arcTween(transition, newAngle) {
        transition.attrTween("d", function(d) {
            var interpolate = d3.interpolate(d.endAngle, newAngle);
            return function(t) {
                d.endAngle = interpolate(t);
                return arc(d);
            };
        });
     }
}

function drawDonut(data) {
    $(".donut-prose p").html($(".choice-" + current_choice + "-prose").html());
  
    var width = 170,
        height = 200;
    
    arc = d3.svg.arc()
        .innerRadius(60)
        .outerRadius(80)
        .startAngle(0);
  
    var svg = d3.select(".donut").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")

    //add the background arc, from 0 to 100% (τ)
    var background = svg.append("path")
        .datum({endAngle: τ})
        .attr("d", arc);

    //add the foreground arc
    var foreground = svg.append("path")
        .datum({endAngle: 0 * τ})
        .attr("class", "donut-foreground")
        .style("fill", color[current_choice])
        .style("stroke", color[current_choice])
        .attr("d", arc);

    foreground.transition()
        .duration(950)
        .call(arcTween, data * τ);

    function arcTween(transition, newAngle) {
        transition.attrTween("d", function(d) {
        var interpolate = d3.interpolate(d.endAngle, newAngle);
            return function(t) {
                d.endAngle = interpolate(t);
                return arc(d);
            };
        });
    }
}

function drawStackedBarChart(data_unsorted) {
    data_unsorted = d3.entries(data_unsorted);
    
    var data = new Array();
    $.each(data_unsorted, function(i, d) {
        if(d.key == "privacy")
            data[0] = d;
        else if(d.key == "opportunity")
            data[1] = d;
        else if(d.key == "access")
            data[2] = d;
        else if(d.key == "freedom")
            data[3] = d;
        else if(d.key == "learning")
            data[4] = d;
        else if(d.key == "control")
            data[5] = d;
    })

    var width = 565,
        height = 120,
        x_padding_left = 30,
        x_padding_right = 60,
        bar_y_position = 30,
        bar_height = 17;
  
    xScale = d3.scale.linear()
       .domain([0, 1])
       .range([0, width - x_padding_right]);
  
    var svg = d3.select(".chart2").append("svg")
        .attr("width", width+50)
        .attr("height", height);
        
    var x_marker = 0;
    
    //add stacked bar chart
    svg.selectAll("rect.bar")
        .data(data)
        .enter().append("rect")
        .attr("class", function(d) {
            return "bar bar_" + d.key;
        })
        .attr("width", function(d) {
            return xScale(d.value);
        })
        .attr("x", function (d) {
            var x_marker_this = x_marker;
            x_marker += d.value;
                
            //append circle
            svg.append("circle")
                .attr("r", 8)
                .attr("class", function() { return "tippy tippy_" + d.key; })
                .attr("cx", function() {
                    return x_padding_left + xScale(x_marker_this + ((x_marker - x_marker_this) / 2));
                })
                .attr("cy", bar_y_position + bar_height - 3)
                .style("fill", function () {
                    return color[d.key];
                })
                .style("opacity", function() {
                    if(d.value < 0.04)
                        return 0;
                });
                
            //append text labels
            svg.append("text")
                .attr("class", function() { return "tippytext tippytext_" + d.key; })
                .attr("text-anchor", "middle")
                .attr("x", function() {
                    return x_padding_left + xScale(x_marker_this + ((x_marker - x_marker_this) / 2));
                })
                .attr("y", function() {
                    return bar_y_position + bar_height + 22;
                })
                .text(function() {
                    return $(".choice-" + [d.key]
                        + " .choice-title span").html()
                        + " (" + Math.round(d.value*100) + "%)";
                })
                .style("fill", function () {
                    return "white";
                });
            
            return x_padding_left + xScale(x_marker_this);
        })
        .attr("y", function (d) {
            return bar_y_position;
        })
        .attr("height", function (d) {
            return bar_height;
        })
        .style("fill", function (d) {
            return color[d.key];
        })
        .style("display", function(d) {
            if(d.key == current_choice) {
                $(".tippy_" + d.key).show();
                $(".tippytext_" + d.key).show();
            }
        })
        .on('mouseenter', function (d) {            
            $(".tippy").hide();
            $(".tippy_" + d.key).show();
            
            $(".tippytext").hide();
            $(".tippytext_" + d.key).show();
        });    
}

function updateStackedBarChart(new_data) {
    console.log(new_data);
    
    var x_padding_left = 30,
        x_marker = 0;
    
    d3.selectAll(".bar")
        .transition()
            .duration(300)
            .attr("width", function(d) {
                return xScale(new_data[d.key]);
            })
            .attr("x", function (d) {
                var x_marker_this = x_marker;
                x_marker += new_data[d.key];
                console.log(d.key, new_data[d.key]);
                //update circles
                d3.select(".tippy_" + d.key)
                    .transition()
                        .duration(300)
                        .attr("cx", function() {
                            return x_padding_left + xScale(x_marker_this + ((x_marker - x_marker_this) / 2));
                        })
                        .style("opacity", function() {
                            if(new_data[d.key] < 0.04)
                                return 0;
                            else
                                return 1;
                        });
                
                //update text labels
                d3.selectAll(".tippytext_" + d.key)
                    .transition()
                        .duration(300)
                        .attr("x", function() {
                            return x_padding_left + xScale(x_marker_this + ((x_marker - x_marker_this) / 2));
                        })
                        .text(function() {
                            return $(".choice-" + [d.key] + " .choice-title span").html() + " (" + Math.round(new_data[d.key]*100) + "%)";
                        });
                
                return x_padding_left + xScale(x_marker_this);
            })
}