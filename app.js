var focus_node = null, highlight_node = null;
var highlight_color = "blue";
var highlight_trans = 0.1;
var min_zoom = 0.1;
var max_zoom = 3;
var zoom = d3.zoom().scaleExtent([min_zoom,max_zoom]);
var svg = d3.select("svg");
var width = +svg.attr("width");
var height = +svg.attr("height");
var radius = 8;
var textWidth = 8;

var color = d3.scaleOrdinal(d3.schemeCategory20);

var nodesMap = {};
var linksMap = {};
var nodesList = [];
var linksList = [];

var requestRosters = new XMLHttpRequest();
requestRosters.open('GET', "https://classes.cornell.edu/api/2.0/config/rosters.json", true);
requestRosters.send();
 
requestRosters.onreadystatechange = processRequestForRosters;

function processRequestForRosters(e) {
    if (requestRosters.readyState != 4 || requestRosters.status != 200) {
        return;
    }
    var response = JSON.parse(requestRosters.responseText);
    var data = response.data.rosters;
    var rosters = [];
    for (var i = 0; i < data.length; i++) {
        rosters.push(data[i].slug);
    }
    getClasses(rosters);
}

function getClasses(rosters) {
    var classes = [];
    for (var i = 0; i < rosters.length; i++) {
        if (rosters[i].match(/WI*/g)) {
            continue;
        }
        var requestClassesForSemester = new XMLHttpRequest();
        requestClassesForSemester.open('GET', "https://classes.cornell.edu/api/2.0/search/classes.json?roster=" + rosters[i] + "&subject=CS", false);
        requestClassesForSemester.send();
        if (requestClassesForSemester.status != 200) {
            continue;
        }
        var response = JSON.parse(requestClassesForSemester.responseText);
        classes = classes.concat(response.data.classes);
    }
    createGraph(classes);
}


function createGraph(classes) {
    var simulation = d3.forceSimulation()
    .force("link", d3.forceLink()
        .id(function(d) { return d.id; }) // specifies that a link's source/target refers to the id of the node.
        ) 
    .force("charge", d3.forceManyBody().distanceMax(250).strength(-150))
    .force("center", d3.forceCenter().x(width/2).y(height/2))
    .force("collide", d3.forceCollide().radius(4 * textWidth).strength(0.2))
    .force("yAxis", d3.forceY()
        .strength( function(d) {
            return (d.y <= width * d.group/5.0 && d.y >= width * (d.group - 1)/5.0) ? 0 : 3;
        })
        .y( function(d) {
            if (d.y <= height * d.group/5.0 && d.y >= height * (d.group - 1)/5.0) {
                return 0;
            }
            return height * (d.group - 1)/5.0 + height/10.0; 
        })
    );





zoom.on("zoom", function() {
    node.attr("transform", d3.event.transform);
    link.attr("transform", d3.event.transform);
    text.attr("transform", d3.event.transform);
});

  svg.call(zoom);
  

for (var i = 0; i < classes.length; i++) {
    var collegeClass = classes[i];
    var preReqString = collegeClass.catalogPrereqCoreq;
    var className = collegeClass.subject + " " + collegeClass.catalogNbr;
    if (!preReqString) {
        continue;
    }
    
    var preReqSentences = preReqString.split(".");

    for (var j = 0; j < preReqSentences.length; j++) {
        var preReqSentence = preReqSentences[j];
        if (!preReqSentence) {
            continue;
        }
        if (preReqSentence.indexOf("Corequisite") != -1 || 
            preReqSentence.indexOf("Prerequisite or corequisite") != -1) {
            addLinks(className, preReqSentence, "coreq");
        } else if (preReqSentence.indexOf("Prerequisite:") != -1 ||
            preReqSentence.indexOf("Required prerequisite:") != -1) {
            addLinks(className, preReqSentence, "prereq");
        }
    }
    
}

function addLinks(className, preReqString, type) {
    var matches = preReqString.match(/[A-Z]+ \d{4}/g);
    if (!matches) {
        return;
    }
    for (var i = 0; i < matches.length; i++) {
        linksMap[matches[i] + "," + className] = {"source" : matches[i], "target" : className, "type" : type};
    }
}

linksList = d3.values(linksMap);

linksList.forEach(function(link) {
  addToNodes(link.source);
  addToNodes(link.target);
  nodesMap[link.target]["prereqs"].push(link.source);
});

function addToNodes(node_id) {
  if (nodesMap[node_id]) {
    return;
  }
  var group = parseInt(node_id.split(" ")[1].charAt(0));
  group = group >= 5 ? 5 : group;
  var node = {"id": node_id, "group" : group, "prereqs" : []};
  nodesMap[node_id] = node;
}

nodesList = d3.values(nodesMap);


simulation
    .nodes(nodesList)
    .on("tick", ticked);
simulation.force("link")
    .links(linksList);



            

    // build the arrow.
svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
  .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("stroke", "grey")
    .attr("fill", "grey")
    .attr("orient", "auto")
  .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

var link = svg.append("g")
      .selectAll("path")
      .data(linksList)
      .enter().append("path")
    .attr("class", function(d) { return "link " + d.type; })
    .attr("marker-end", "url(#end)"); 



var node = svg.append("g")
      .selectAll("circle")
      .data(nodesList)
      .enter().append("circle")
    .attr("class", "nodes")
    .attr("r", radius)
    .attr("fill", function(d) { return color(d.group + 10); })
    .attr("cy", function(d) {
        return height * (d.group - 1)/5.0 + Math.random()*height/5;
    })
    .attr("cx", function(d) {
        return width * Math.random();
    })
    .on("mouseover", function (d) {
        svg.style("cursor","pointer");
        set_highlight(d);
    })
    .on("mouseout", function (d) {
        svg.style("cursor","move");
        exit_highlight(d);
    })
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

function set_highlight(d) {
    svg.style("cursor","pointer");
    if (focus_node!==null) {
        d = focus_node;
    }
    highlight_node = d;

    /*
    var prereqs = d.prereqs;
    for (var i = 0; i < prereqs.length; i++) {
        prereqs.concat(nodesMap[prereqs[i]].prereqs);
    }*/

    if (highlight_color!="white") {
          node.style("stroke", function(o) {
                return isPrereq(d, o) ? highlight_color : (isNextClass(d,o) ? "red" : "white"); });
            text.style("font-weight", function(o) {
                return (isPrereq(d, o) || isNextClass(d,o)) ? "bold" : "normal";});
            link.style("stroke", function(o) {
              return o.target.id == d.id ? highlight_color : (o.source.id == d.id ? "red" : "#eee");
            });
    }
}

/**
is b a pre-req to a
*/
function isPrereq(a, b) {
    return linksMap[b.id + "," + a.id] || a.id == b.id;
}

/**
can b be taken after completing a
*/
function isNextClass(a, b) {
    return linksMap[a.id + "," + b.id];
}

function exit_highlight()
{
    highlight_node = null;
    if (focus_node===null){
        if (highlight_color!="white"){
          node.style("stroke", "white");
          text.style("font-weight", "normal");
          link.style("stroke", "#999");
        }
    }
}


function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.5).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

node.on("dblclick.zoom", function(d) { d3.event.stopPropagation();
    var dcx = (window.innerWidth/2-d.x*zoom.scale());
    var dcy = (window.innerHeight/2-d.y*zoom.scale());
    zoom.translate([dcx,dcy]);
     g.attr("transform", "translate("+ dcx + "," + dcy  + ")scale(" + zoom.scale() + ")");
     
     
    });

var text = svg.append("g")
    .attr("class", "text")
    .selectAll("text")
    .data(nodesList)
  .enter().append("text")
    .attr("x", textWidth)
    .attr("y", ".31em")
    .text(function(d) { return d.id; });


function ticked() {
    var k = .5 * simulation.alpha();

  // by now, the position coordinates have been updated by the initialized forces
  // so we now need to visually update the x and y coordinates of the links and nodes
  
  
  // l represents a link in the links list, the source becomes an object that retains the name,
  // and adds the x and y coordinate of the source.
    linksList.forEach( function(l, i) {
        if (l.source.y + 30 < l.target.y) {
            return;
        }
        l.target.y += Math.min(l.source.y + 5, height - radius) * k;
        l.source.y -= Math.max(l.target.y - 5, radius) * k;
        
    });

  // d represents a node in the node list

    node
        .attr("cx", function(d) { return d.x = Math.max(4 * textWidth, Math.min(width - 4 * textWidth, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(2 * radius, Math.min(height - 2 * radius, d.y)); });
    link
          .attr("x1", function (d) { return d.source.x; })
          .attr("y1", function (d) { return d.source.y; })
          .attr("x2", function (d) { return d.target.x; })
          .attr("y2", function (d) { return d.target.y; });   

    link.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + 
            d.source.x + "," + 
            d.source.y + "A" + 
            dr + "," + dr + " 0 0,1 " + 
            d.target.x + "," + 
            d.target.y;
    });
    text
      .attr("x", function(d) { return d.x - 3*textWidth; })
      .attr("y", function(d) { return d.y; });
      
}
}
