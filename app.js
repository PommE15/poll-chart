/* Variables 
/* ******/
// Data:
var dayAvg = 14,
dayConst = 86400000,
dayUnit,
jsonSrc = "http://interactive.guim.co.uk/spreadsheetdata/1YilVzArect3kcE1rzJvYivXkfs1oL0MLCrvC9GjPF6E.json",
partyList = ["con", "lab", "ldem", "ukip", "grn"/*, "others"*/],  
pGroup1 = ["Lord Ashcroft", "Opinium", "Populus", "YouGov"],
pGroup2 = ["ComRes", "ComResO", "ICM", "Ipsos", "TNS", "Survation"],
termDic = { con: "Con", lab: "Lab", ukip: "UKIP", ldem: "LD", grn: "Green", YouGov: "YouGov", Populus: "Populus", "Lord Ashcroft": "Ashcroft", Opinium: "Opinium", ComRes: "ComRes", ComResO: "ComRes Online", TNS: "TNS BMRB", ICM: "ICM", Ipsos: "Ipsos-MORI", Survation: "Survation" };

// Window size and chart's coordinate system:
var width, height,
margin = {top: 30, right:0, bottom: 30, left: 0},
xAxis, yAxis, x, y,
coord = {x: 0, y: 40};

// Date format:
var dateStr, dateEnd, //TODO: fix left padding; 7/5 election date
dateFormat = "%d/%m/%Y",
xAxisTextFormat,
formatMon = d3.time.format("%b"),
formatMonth = d3.time.format("%B"),
formatPercent = d3.format(".0%");
// Parse the date / time
var parseDate = d3.time.format(dateFormat).parse;

// SVG:
// Add the svg
var svg = d3.select("#pollChart")
.attr("width", 600)
.attr("height", 300)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Define the line
var line = d3.svg.line()
//.interpolate("basis")
.x(function(d) { return x(d.date); })
.y(function(d) { return y(d.vi); });
/* ************/


/* Window size update and redraw 
/* ******/
// Window resize 
function setChartSize() {
  // Dimensions of the chart
  var w = window,
      d = document,
      e = d.documentElement,
      p = d.querySelector("#pollChartContainer"),
      w = e.clientWidth || w.innerWidth,
      h = e.clientHeight || w.innerHeight,
      w = w - 10,
      h = h - 15,
      str;

width = w - margin.left - margin.right;
height = h - margin.top - margin.bottom;

//p.setAttribute("width", w);
//p.setAttribute("height", h);

// Ranges of the charts
x = d3.time.scale().range([0, width]);
y = d3.scale.linear().range([height, 0]);

// Define the axes
xAxis = d3.svg.axis().scale(x).orient("bottom")
.ticks(d3.time.month),  
yAxis = d3.svg.axis().scale(y).orient("right")
.ticks(5).tickSize(width)
.tickFormat(function(d) {
  return d === 40 ? formatPercent(d / 100) : d ;
});

// for mobile
if (width < (660 - 10)) {
  var today = new Date,
  month = today.getMonth() + 1;

  dateStr = "24/11/2014"; 
  dateEnd = (today.getDate() + 11) + "/" + month + "/" + today.getFullYear();
  xAxisTextFormat = formatMon;
} else {
  dateStr = "20/11/2014";  
  dateEnd = "15/05/2015";
  xAxisTextFormat = formatMonth;
}

// Scale the range of the data
x.domain([parseDate(dateStr), parseDate(dateEnd)]);
y.domain([coord.x, coord.y]); 

str = +parseDate(dateStr);
dayUnit = x(str + dayConst) - x(str);

// xAxis format
xAxis.tickFormat(xAxisTextFormat);

// resize the chart
d3.select("#pollChart")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom);

}       

function drawSVG() {
  drawCoordinate();  
  drawText();
  drawPathWithLines();
  drawPolygons();
  drawCircles(gcPoll, 3);
  drawCircles(gcDate, 3.5);
  drawRects();

  //TODO: remove hotfix
  var ele;
  svg.select(".tp-circle").remove();
  ele = document.querySelector("#tpTextBox");
  ele.style.top = "-100px";
  ele.style.left = "-100px";
  ele.style.rifht = "auto";
  eleList = ele.children;
  eleList[2].className = "";
}

var to = null;
function resize() {
  if (to) {
    clearTimeout(to);
    to = null;
  }
  to = setTimeout(function() {
    setChartSize();
    drawSVG();
  }, 100);
}

setChartSize();
d3.select(window).on('resize', resize); 
/* ************/


/* D3: Drawing
/* ******/
// x, y axes; circle, path, area (polygon as range), text
var gx, gy/*, gc*/ ,gp, ga, gt,
gcPoll, gcDate, gr;

function addCoordinate () {
  gx = svg.append("g").attr("class", "x axis ff-ss fz-12");
  gy = svg.append("g").attr("class", "y axis ff-ss fz-12");
}
function drawCoordinate() {
  // x axis
  gx.attr("transform", "translate(0," + height + ")")
  .call(xAxis)
  .selectAll("text")
  .attr("x", -2)
  .style("text-anchor", "start");
  // y axis
  gy.call(yAxis);
  gy.selectAll("g")
  .filter(function(d) { return d; })
  .classed("sc-ddd", true);
  gy.selectAll("text")
  .attr("x", 0)
  .attr("dy", -3);
}

// avg path
function addPathWithLines(svgObj, className){
  gp = svgObj.append("path")
  .attr("class", className); 
}
function drawPathWithLines(){
  gp.attr("d", function(d) { return line(d.values); })
}

//TODO: change to use muti-line voronoi
function addPolygons(svgObj, className) {
  ga = svgObj.append("polygon")
  .attr("class", className);
} 
function drawPolygons() {
  ga.attr("points", function(d) { 
    var points,
    yMax, yMin, ptMax, ptMin;

    // area for avg line and all vi dots
    ptMax = d.values.map(function(d) {
      //console.log(d);
      yMax = (d.viMax > d.vi) ? y(d.viMax) : y(d.vi) - 10;
      return [x(d.date), yMax].join(","); 
    }).join(" ");
    ptMin = d.values.map(function(d) { 
      yMin = (d.viMin < d.vi) ? y(d.viMin) : y(d.vi) + 10;
      return [x(d.date), yMin].join(","); 
    }).reverse().join(" ");
    /*
    // area for avg line
    ptMax = d.values.map(function(d) { return [x(d.date), y(d.vi) - 5].join(","); }).join(" ");
    ptMin = d.values.map(function(d) { return [x(d.date), y(d.vi) + 5].join(","); }).reverse().join(" ");
    */
    //TODO: area for detection
    // ...

    points = [ptMax, ptMin];
    return points;
  });
}
function onPolygon() {
  var ele;
  ga.on("mouseover", function(d) { 
      ele = document.querySelector(".party-polls." + d.party);
      d3.select(ele).classed("op-1-polls", true);
      d3.select(this.parentNode).classed("op-1-path", true); 
      }).on("mouseout", function() { 
        d3.select(ele).classed("op-1-polls", false);
        d3.select(this.parentNode).classed("op-1-path", false); 
        });
}

function addRects(svgObj) {
  gr = svgObj.append("rect")
    .attr("class", function(d) { return "t" + d; });
}
function drawRects() {
  gr.attr("x", function(d) { return x(d) - (x(d) - x(d - dayConst)) / 2; })
    .attr("y", 0)
    .attr("width", function(d) { return (x(d) - x(d - dayConst)); })
    .attr("height", height); 
}
function onRects() {
  var nl; //node list
  gr.on("mouseover", function(d) {
      nl = document.querySelectorAll(".t" + d + ".op-0");
      for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", false); }
      var n = document.createTextNode(' '); document.body.appendChild(n); document.body.removeChild(n);
      })
  .on("mouseout", function(d) {
      for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); }
      var n = document.createTextNode(' '); document.body.appendChild(n); document.body.removeChild(n);
      });

    /*/ pan evnt using hammerjs
    var el = document.querySelector(".dates"),
    op = { preventDefault: true },
    hr = new Hammer(el, op),
    preCN = null, // CN, classname
    curCN,
    strCN,
    numCN;

    hr.get("pan").set({ direction: Hammer.DIRECTION_HORIZONTAL });

    hr.on("panstart", function(e) {
      strCN = e.target.className.baseVal;
      var s = strCN.slice(1);
      numCN = parseInt(s);
    });

    hr.on("panmove", function(e) {
      var d = Math.round(e.deltaX / dayUnit);
      curCN = "t" + (numCN + dayConst * d);
      // if pan position has not change
      if (preCN === curCN ) { return; } 
      // remove highlight if any 
      if (preCN !== null) {
        for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); } 
      }
      // add hightlight
      nl = document.querySelectorAll("." + curCN + ".op-0");
      for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", false); }
      preCN = curCN;
    });

    hr.on("panend", function(e) {
      // remove last highlight 
      for (var i=0; i<nl.length; i++) { d3.select(nl[i]).classed("op-0", true); }
    });*/
  }

  function drawCircle(svgObj, cx, cy, r, className) {
    svgObj.append("circle")
    .attr("class", className)
    .attr("cx", cx) 
    .attr("cy", cy)
    .attr("r", r);
  }

  function addCircles(svgObj, className, key) {
    var g = svgObj.selectAll("circle")
    .data(function(d) { return d.values; })
    .enter().append("circle")
    //.attr("class", className);
    .attr("class", function(d) { return "t" + d[key] + " " + className; });
    return g;
  }

  function drawCircles(gc, r) {
    gc.attr("cx", function(d) { return x(d.date) /*+ Math.random()*10*/; })
    .attr("cy", function(d) { return y(d.vi); })
    .attr("r", r);
  }

  function onCirclePoll(gc) {
    var ele, eleList;

    gc.on("mouseover", function(d) {
      // 1. Add tooltip
      var xPos = parseFloat(d3.select(this).attr("cx")),
      yPos = parseFloat(d3.select(this).attr("cy")),
      xPosEnd = x(parseDate(dateEnd)),
      yShift = 60,
      date = new Date(d.date),
      dateText = date.getDate() + " " + formatMonth(date);

      //drawLine(svg, xPos, yPos - 8, xPos, yPos - 120, "tp-line");
      drawCircle(svg, xPos, yPos, 5, "tp-circle");

      ele = document.querySelector("#tpTextBox");
      d3.select(ele).classed('d-n', false);

      // top or bottom  
      ele.style.top = ((yPos - yShift) < (-10)) ? ((yPos + yShift) + "px") : ((yPos - yShift) + "px");
      if (xPos < (xPosEnd - 100)) {
        // align right
        ele.style.left = (xPos - 5) + "px";
        ele.style.right = "auto";
      } else {
        // align left
        ele.style.left = "auto";
        ele.style.right = (xPosEnd - xPos - 10) + "px";
      }

      //TODO: bottom if too height access the iframe
      eleList = ele.children;
      eleList[0].textContent = termDic[d.pollster];                 //pollster
      eleList[1].textContent = dateText;                            //date
      eleList[2].textContent = termDic[d.party] + " " + d.vi + "%"; //party and vi
      d3.select(eleList[2]).classed(d.party, true);

      // 2. highlight paths
      d3.select(this.parentNode).classed("op-1-pathpolls", true);
      d3.select("." + d.party).classed("op-1-path", true);
    })
    .on("mouseout", function(d) {
      // 1. Remove tooltip
      //svg.select(".tp-line").remove();
      svg.select(".tp-circle").remove();

      d3.select(ele).classed('d-n', true);
      d3.select(eleList[2]).classed(d.party, false);

      // 2. Remove highlight
      d3.select(this.parentNode).classed("op-1-pathpolls", false);
      d3.select("." + d.party).classed("op-1-path", false);
    });
  }

  function addText(svgObj, className, key) {
    gt = svgObj.append("text")
    //TODO: make sure data order
    .datum(function(d) { return {key: d[key], value: d.values[d.values.length - 1], party: d.party}; })
    .attr("class", className);
  } 
  function drawText() {
    gt.attr("text-anchor", "left")
    .attr("x", function(d){ return x(d.value.date) + 8; })
    .attr("y", function(d){ return y(d.value.vi) + 6; })
    .text(function(d) { 
      var num = (d.value.vi).toFixed(1); 
      return d.party === "lab" ? num + "%" : num; 
    });
  }

  function drawTooltip(data, el, elList) {}
  function removeTooltip(data, el, elList) {}

  /*
     function drawLine(svgObj, x1, y1, x2, y2, className) {
     svgObj.append("line")
     .attr("class", className)
     .attr("x1", x1) 
     .attr("y1", y1)
     .attr("x2", x2)
     .attr("y2", y2);
     }

  // old tooltip
  function drawForeignObject (svgObj, w, h, x, y, className, data) {
  var date = new Date(data.date),
  dateText = monthShortNameFormat(date) + " " + date.getDate() + " " + date.getFullYear();

  svgObj.append("foreignObject")
  .attr("class", className)
  .attr("width", w)
  .attr("height", h)
  .attr("x", x)
  .attr("y", y)
  .append("xhtml:body")
  .html(
  '<div class="tp-text">' + 
  '<div class="tp-text-misc"><b>' + termDic[data.pollster] + " Poll</b></br>" + dateText + '</div>' +
  '<div class="tp-text-vi ' + data.party + '">' + termDic[data.party] + ": " + data.vi + "</div>" + 
  "</div>"
  );
  } 
  */
  /* ************/


  /* D3: Data and Drawing
  /* ******/
  d3.json(/*"data.json"*/jsonSrc, function(error, rawData) {

    var data, dataset,
    svgParty, svgPolls, svgDates, svgRects,
    dateList; 

    // Make sure data is loaded correctly
    if (error) { console.error("Try refreshing your browser."); return; } 
    else { console.info("Data is good to go!"); }


    /* Data */ 
    data = rawData.sheets["vi-continuous-series"];


    /* Data play ground /
       var vis = [];
       data.map(function(d, index, arr) {
       var preDate = "";
       if (index > 1) {preDate = arr[index-1].date; }
       if (d.date !== preDate) { 
       vis = []; 
       console.log(d.date); 
       }
       partyList.forEach(function(p) {
       if (vis.indexOf(d[p]) === -1) {
       vis.push(d[p]);
       console.log("vi:", d[p], vis);
       } else {
       console.log("vi:", d[p], vis, "(duplicates)");
       }

       })
       });
       / End of data play ground */


    // Parse date
    data = data.map(function(d) {
      // + convert a Date object to time in milliseconds
      d.date = +parseDate(d.date); 
      return d;  
    }).filter(function(d) {
      return d.date >= (+parseDate(dateStr)); 
    });

    // Compose data 
    var dateList = extractDataByKey(data, "date"),
    dataset = composeDataByParty(data);
    //console.log(dataset); 

    /* Drawing */
    // 1. Draw coordinate
    addCoordinate();
    drawCoordinate();

    svgRects = svg.append("g")
    .attr("class", "dates op-0")
    .selectAll("rect")
    .data(dateList)
    .enter();

    svgParty = svg.selectAll("party")
    .data(dataset.date)
    .enter().append("g")            
    .attr("class", function(d) { return "party " + d.party; });

    svgDates = svg.selectAll("party-dates")
    .data(dataset.date)
    .enter().append("g")            
    .attr("class", function(d) { return "paraty-dates " + d.party; });

    svgPolls = svg.selectAll("party-polls")
    .data(dataset.pollster)
    .enter().append("g")
    .attr("class", function(d) { return "party-polls " + d.party; })
    .selectAll("g")
    .data(function(d) { return d.pollster; })
    .enter().append("g")
    .attr("class", function(d, index) { return "pollster p" + index;} );

    // 2. Draw over time view
    gcDate = addCircles(svgDates, "op-0", "date"); 
    drawCircles(gcDate, 3.5);
    addRects(svgRects);
    drawRects();
    onRects();

    // 3. Draw area, path (with lines) - avarage, text
    addText(svgParty, "ff-ss fz-14", "party");
    drawText();

    addPathWithLines(svgParty, "path-avg");
    drawPathWithLines();
    addPolygons(svgParty, "polygon-range");
    drawPolygons(svgParty);
    onPolygon(); 

    // 4. Draw path (with lines) - individuals, text
    //drawPathWithLines(svgPolls, "path-polls");
    //drawText(svgPollster, "pollster");

    // 5. Draw circle - vi
    gcPoll = addCircles(svgPolls, "circle-poll");
    drawCircles(gcPoll, 3);
    onCirclePoll(gcPoll);

  });
/* ************/


/* Data: Utility functions
/* ******/
function averageArray(array) {
  var sum = array.reduce(function(preVal, curVal) {
    return preVal + curVal;
  });
  return sum / array.length;
}

function extractDataByKey(data, key) {
  return data.map(function(d) {
    return d[key];
  }).sort().filter(function(d, index, array) {
    //unique
    return d !== array[index - 1];
  });     
}

function composeDataByParty(data) {
  var dateList = extractDataByKey(data, "date"),
  pollsterList = extractDataByKey(data, "pollster"),
  dataByParty,
  dataByPartyPollster,
  dataByPartyDate,
  dataByDate;

  // data grouped by party  
  dataByParty = partyList.map(function(party) {
    return {
      party: party,
      values: data.map(function(d) {
        return {
          date: d.date,
          pollster: d.pollster,
          vi: d[party]
        }})//end of data.map (values)
    };});//end of partyList.map

    // data grouped by party and pollster  
    dataByPartyPollster = dataByParty.map(function(d) {
      var datum = d.values;

      return {
        party: d.party,

        pollster: pollsterList.map(function(pollster) {
          return {
            pollster: pollster,
            values: datum.filter(function(p) {
              return p.pollster === pollster;
            }).map(function(p) {
              return {
                party: d.party,
                pollster: p.pollster,
                date: p.date,
                vi: p.vi
              };
            }) //end of datum.filter (values)
          };}), //end of pollster.map
      };});

      // data grouped by party and pollster  
      dataByPartyDate = dataByParty.map(function(d) {
        var datum = d.values,
        testDate = (+parseDate("15/02/2015"));

        return {
          party: d.party,

          values: dateList.map(function(date) {
            var viDayList, 
            viAvgList = [],
            viAvg; 

            viDayList = datum.filter(function(d) { 
              return d.date === date; 
            }).map(function(d) { 
              return d.vi; 
            });

            function findViListByGroup(group, p) {
              return datum.filter(function(d) {
                switch (group) {
                  case 1: return (d.pollster === p) && (d.date <= date) && (d.date > (date - dayConst*dayAvg)); break;
                  case 2: return (d.pollster === p) && (d.date <= date); break;
                  default: console.err("wrong group!");
                }
              }).map(function(d) {
                return d.vi;
              });
            }

            // Take the vi from the past 14 days and average it (if any)
            pGroup1.forEach(function(d) {
              var li = findViListByGroup(1, d);
              //if (date === testDate) { console.log(li, averageArray(li), d); }
              if (li.length !== 0) {
                viAvgList.push(averageArray(li));
              }});
              //if (date === testDate) { console.log("---");}  

              // Take the nearest vi from the past (if any)
              pGroup2.forEach(function(d) {
                var li = findViListByGroup(2, d),
                len = li.length;
                // if (date === testDate) { console.log(li, li[len-1], d);}  
                if (len !== 0) {
                  viAvgList.push(li[len-1]);
                }});
                //console.log("[" + date.getDate() + "." + date.getMonth() + "]", viAvgList.join(", ")); 
                //if (date === testDate) { console.log("avg =>", averageArray(viAvgList)); }

                viAvg = Math.round(averageArray(viAvgList) * 100) / 100; 
                return {
                  party: d.party,
                  date: date,
                  vi: viAvg,
                  //viAvgList: viAvgList,
                  //viDayList: viDayList,
                  viMin: d3.min(viDayList), 
                  viMax: d3.max(viDayList) 
                };
          }) //end of dateList.map (values)  
        };}); //end of dataByParty.map

        return { 
          date: dataByPartyDate,
          pollster: dataByPartyPollster
        }
}
/* ************/
