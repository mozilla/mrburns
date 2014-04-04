"use strict";

var arc,
    τ = 2 * Math.PI;
  
var data,
    default_choice = "choice-privacy";

var color = new Object();
    color["choice-privacy"] = "#e24063";
    color["choice-opportunity"] = "#682567";
    color["choice-access"] = "#092c74",
    color["choice-freedom"] = "#81bc2e",
    color["choice-learning"] = "#f18903",
    color["choice-control"] = "#c43a31";
    
var icon = new Object();
    icon["choice-privacy"] = 'fa-eye';
    icon["choice-opportunity"] = 'fa-heart';
    icon["choice-access"] = 'fa-user';
    icon["choice-freedom"] = 'fa-check-circle-o';
    icon["choice-learning"] = 'fa-book';
    icon["choice-control"] = 'fa-cogs';

$(document).ready(function () {
    $("#country").select2();
    
    assignStatsEventListeners();
    drawCharts();
  
    $(".key-stats-panel ul .choice-privacy a")
        .toggleClass("selected")
});

function assignStatsEventListeners() {
    $(".key-stats-panel a").on("click", function () {
        var choice = $(this)[0].parentNode.className;
        
        //update chart 1
        updateDonut(data.GLOBAL[choice], choice);
        $(".donut-icon i")
            .removeClass("fa-eye fa-heart fa-user fa-check-circle-o fa-book fa-cogs")
            .addClass(icon[choice]);
        
        $(".key-stats-panel a").removeClass("selected");
        $(this).toggleClass("selected");
    
        return false;
    });
}

function drawCharts() {
    $(".stats-panel-contents svg").empty();
  
    d3.json("/static/data/dummy-stats.json", function(json_data) {
        data = json_data;
        
        //add donut prose, all of them, to the html page
        $.each(json_data.GLOBAL, function(i, d) {
            $("." + i + "-prose .percentage").html(Math.round(d*100) + '%');
        })
        
        drawDonut(json_data.GLOBAL[default_choice]);
    });
}

function updateDonut(data, current_choice) {
    $(".donut-prose p").html($("." + current_choice + "-prose").html());

    d3.select(".donut-foreground").transition()
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
    $(".donut-prose p").html($("." + default_choice + "-prose").html());
  
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
        .style("fill", color[default_choice])
        .style("stroke", color[default_choice])
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