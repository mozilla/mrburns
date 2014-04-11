"use strict";

var arc,
    τ = 2 * Math.PI,
    x_scale_stacked_bar;
  
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
        
        //update chart 3
        updateCountryComparisonChart(eval("data.issue_countries." + current_choice));
        
        $(".key-stats-panel a").removeClass("selected");
        $(this).toggleClass("selected");
    
        return false;
    });
    
    $("select").on("change", function(d) {
        current_country = d.val;
        
        //update chart 2
        updateStackedBarChart(eval("data.country_issues." + current_country));
        
        //update chart 3
        updateCountryComparisonChart(eval("data.issue_countries." + current_choice));
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
        drawCountryComparisonChart(eval("json_data.issue_countries." + current_choice));
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
        height = 90,
        x_padding_left = 40,
        x_padding_right = 70,
        bar_y_position = 30,
        bar_height = 17;
  
    x_scale_stacked_bar = d3.scale.linear()
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
            return (d.value == undefined) 
                ? x_scale_stacked_bar(0)
                : x_scale_stacked_bar(d.value);
        })
        .attr("x", function (d) {
            if(d.value == undefined) d.value = 0;
                
            var x_marker_this = x_marker;
            x_marker += d.value;
                
            //append circle
            svg.append("circle")
                .attr("r", 8)
                .attr("class", function() { return "tippy tippy_" + d.key; })
                .attr("cx", function() {
                    return x_padding_left + x_scale_stacked_bar(
                        x_marker_this + ((x_marker - x_marker_this) / 2));
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
                    return x_padding_left + x_scale_stacked_bar(
                        x_marker_this + ((x_marker - x_marker_this) / 2));
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
            
            return x_padding_left + x_scale_stacked_bar(x_marker_this);
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
    
    var x_padding_left = 40,
        x_marker = 0;
    
    d3.selectAll(".bar")
        .transition()
            .duration(300)
            .attr("width", function(d) {
                return (new_data[d.key] == undefined) 
                    ? x_scale_stacked_bar(0)
                    : x_scale_stacked_bar(new_data[d.key]);
            })
            .attr("x", function (d) {
                if(new_data[d.key] == undefined) new_data[d.key] = 0;
            
                var x_marker_this = x_marker;
                x_marker += new_data[d.key];
                console.log(d.key, new_data[d.key]);
                //update circles
                d3.select(".tippy_" + d.key)
                    .transition()
                        .duration(300)
                        .attr("cx", function() {
                            return x_padding_left + x_scale_stacked_bar(
                                x_marker_this + ((x_marker - x_marker_this) / 2));
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
                            return x_padding_left + x_scale_stacked_bar(
                                x_marker_this + ((x_marker - x_marker_this) / 2));
                        })
                        .text(function() {
                            return $(".choice-" + [d.key] + 
                                " .choice-title span").html() + " (" 
                                + Math.round(new_data[d.key]*100) + "%)";
                        });
                
                return x_padding_left + x_scale_stacked_bar(x_marker_this);
            })
}

function drawCountryComparisonChart(data) {
    var width = 565,
        height = 350,
        x_padding_left = 120,
        x_padding_right = 25,
        y_padding_top = 20,
        bar_height = 17,
        bar_width = 20;
  
    data.sort(function(a, b) { return a.count - b.count; })
    
    var min = data[0].count,
        max = data[data.length-1].count,
        median = d3.median(data, function(d) { return d.count; });
    
    var x_scale_country_comparison = d3.scale.linear()
       .domain([min, max])
       .range([x_padding_left, width - x_padding_right]);
  
    var svg = d3.select('.chart3').append('svg')
        .attr('width', width + 50)
        .attr('height', height);
    
    var data_subset = getDataSubsetForCountryComparisonChart(data);

    //add min, median, max lines and labels
    addVerticalLine(min, 'min', x_scale_country_comparison, height, bar_width);
    addVerticalLine(max, 'max', x_scale_country_comparison, height, bar_width);
    addVerticalLine(median, 'med', x_scale_country_comparison, height, bar_width);
    
    //add country comparison data
    svg.selectAll('.country-bar')
        .data(data_subset)
        .enter().append('rect')
        .attr('class', function(d, i) {
            return 'country-bar country-bar_' + i;
        })
        .attr('width', bar_width)
        .attr('x', function (d, i) {
            //append country name
            svg.append('text')
                .attr('class', 'country-label-stats country-label-stats_' + i)
                .attr('text-anchor', 'start')
                .attr('x', function() {
                    return 0;
                })
                .attr('y', function() {
                    return i * (bar_height + 15) + 15 + y_padding_top;
                })
                .text(function() {
                    console.log(d, d.country);
                    return $('.country-' + d.country).html();
                });
                
            //append country value
            svg.append('text')
                .attr('class', 'country-value-stats country-value-stats_' + i)
                .attr('text-anchor', 'start')
                .attr('x', function() {
                    return x_scale_country_comparison(d.count) + bar_width + 6;
                })
                .attr('y', function() {
                    return i * (bar_height + 15) + 15 + y_padding_top;
                })
                .text(function() {
                    return (d.count * 100).toFixed(1) + "%";
                });
            
            return x_scale_country_comparison(d.count);
        })
        .attr('y', function (d, i) {
            return i * (bar_height + 15) + y_padding_top;
        })
        .attr('height', function (d) {
            return bar_height;
        })
        .style('fill', function (d) {
            return color[current_choice];
        })
        .each(function(d, i) {
            svg.append('rect')
                .attr('class', 'band')
                .attr('x', function() {
                    return x_scale_country_comparison(min) + 11;
                })
                .attr('y', function() {
                    return i * (bar_height + 15) + y_padding_top;
                })
                .attr('height', function (d) {
                    return bar_height;
                })
                .attr('width', function() {
                    return x_scale_country_comparison(max) + (bar_width / 2) 
                        - (x_scale_country_comparison(min) + 11);
                });
        });
}

function updateCountryComparisonChart(data) {
    $(".country-bar")
        .css("fill", color[current_choice]);
          
    var width = 565,
        height = 350,
        x_padding_left = 120,
        x_padding_right = 20,
        bar_width = 20;
  
    data.sort(function(a, b) { return a.count - b.count; })
    
    var min = data[0].count,
        max = data[data.length-1].count,
        median = d3.median(data, function(d) { return d.count; });
  
    var x_scale_country_comparison = d3.scale.linear()
       .domain([min, max])
       .range([x_padding_left, width - x_padding_right]);
  
    var svg = d3.select('.chart3 svg');
    
    var data_subset = getDataSubsetForCountryComparisonChart(data);
    
    //add min, median, max lines and labels
    updateVerticalLine(min, 'min', x_scale_country_comparison, bar_width);
    updateVerticalLine(max, 'max', x_scale_country_comparison, bar_width);
    updateVerticalLine(median, 'med', x_scale_country_comparison, bar_width);
        
    //update data
    d3.selectAll('.country-bar')
        .transition()
            .duration(1000)
            .attr('x', function (d, i) {
                d3.select('.country-label-stats_' + i)
                    .text(function() {
                        return $('.country-' + data_subset[i].country).html();
                    });
                    
                d3.select('.country-value-stats_' + i)
                    .transition()
                    .duration(1000)
                        .text(function() {
                            return (data_subset[i].count * 100).toFixed(1) + "%";
                        })
                        .attr('x', function() {
                            return x_scale_country_comparison(data_subset[i].count) 
                                + bar_width + 6;
                        });
                    
                return x_scale_country_comparison(data_subset[i].count);
            });
            
    d3.selectAll('.band')
        .transition()
            .duration(1000)
            .attr('x', function() {
                return x_scale_country_comparison(min) + 11;
            })
            .attr('width', function() {
                return x_scale_country_comparison(max) + (bar_width / 2) 
                    - (x_scale_country_comparison(min) + 11);
            });
}

function gimmeUniquePosition(random_i_map, start, end) {
    var i = randomRange(start, end);
    if(random_i_map[i] != 1)
        return i;
    else
        return probeForUnique(i, random_i_map);
}

function probeForUnique(i, random_i_map) {
    if(random_i_map[i] != 1) {
        //console.log("probe returning --> ", i);
        return i;
    }
    
    while(random_i_map[i] == 1) {
        if(i+1 == data.length - 1) i = 0;
        else  i++;
            
        if(random_i_map[i] != 1) {
            //console.log("probe returning --> ", i);
            return i;
        }
    }
}
    
function getDataSubsetForCountryComparisonChart(data) {
    var current_country_i = 0;
    $.each(data, function(i, d) {
        if(d.country == current_country) {
            current_country_i = i;
            return false;
        }
    });
    
    //current country first, two sets of arbitrarily populated countries, each on
    //either side of the chosen country
    var random_i_map = new Object();

    var end = 0, start = 0;
    if(current_country_i == 0) end = data.length - 1;
    else end = current_country_i - 1;
        
    if(current_country_i == data.length - 1) start = 0;
    else start = current_country_i + 1;

    for(var i=0; i<4; i++) {
        random_i_map[gimmeUniquePosition(
            random_i_map, 0, end)] = 1;
            
        random_i_map[gimmeUniquePosition(
            random_i_map, start, data.length - 1)] = 1;
    }
    
    var random_i_arr = d3.keys(random_i_map);
    return [
        data[current_country_i],
        data[random_i_arr[0]],
        data[random_i_arr[1]],
        data[random_i_arr[2]],
        data[random_i_arr[3]],
        data[random_i_arr[4]],
        data[random_i_arr[5]],
        data[random_i_arr[6]],
        data[random_i_arr[7]]
    ];
}

function addVerticalLine(data, label, x_scale_country_comparison, height, bar_width) {
    d3.select('.chart3 svg').append('line')
        .attr('x1', function() {
            return x_scale_country_comparison(data) + (bar_width / 2);
        })
        .attr('x2', function() {
            return x_scale_country_comparison(data) + (bar_width / 2);
        })
        .attr('y1', function() {
            return 0;
        })
        .attr('y2', function() {
            return height - 15;
        })
        .attr('class', 'stats-vertical-line ' + label);
        
    //append line label and value
    d3.select('.chart3 svg').append('text')
        .attr('class', 'stats-vertical-line-label ' + label + '_text')
        .attr('text-anchor', 'middle')
        .attr('x', function() {
            return x_scale_country_comparison(data) + bar_width + 6;
        })
        .attr('y', function() {
            return height;
        })
        .text(function() {
            return label + " (" + (data * 100).toFixed(1) + "%)";
        });
}

function updateVerticalLine(data, label, x_scale_country_comparison, bar_width) {
    d3.select('.' + label)
        .transition()
            .duration(1000)
            .attr('x1', function() {
                return x_scale_country_comparison(data) + (bar_width / 2);
            })
            .attr('x2', function() {
                return x_scale_country_comparison(data) + (bar_width / 2);
            });
            
    d3.select('.' + label + "_text")
        .transition()
            .duration(1000)
            .attr('x', function() {
                return x_scale_country_comparison(data) + bar_width + 6;
            })
            .text(function() {
                return label + " (" + (data * 100).toFixed(1) + "%)";
            });
}