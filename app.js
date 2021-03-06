var focus_node = null, highlight_node = null;
var highlight_color = "blue";
var highlight_trans = 0.1;
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
var classDesc = {};


function createGraph(roster, subjects, classes, allClasses) {
    nodesMap = {};
    linksMap = {};
    nodesList = [];
    linksList= [];
    classDesc = {};

    svg = d3.select("svg");
    width = +svg.attr("width");
    height = +svg.attr("height");


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




var blacklist = [];
var combined = {};

//creates cross-listed classes
for (var i = 0; i < classes.length; i++) {
    var collegeClass = classes[i];
    var crossListedClasses = collegeClass.enrollGroups[0].simpleCombinations;
    var className = collegeClass.subject + " " + collegeClass.catalogNbr;
    for (var j = 0; j < crossListedClasses.length; j++) {
        var crossListedClass = crossListedClasses[j];
        var crossListedClassName = crossListedClass.subject + " " + crossListedClass.catalogNbr;
        if (subjects.indexOf(crossListedClass.subject) == -1) {
            blacklist.push(crossListedClassName);
        } else if (!combined[className] && collegeClass.catalogNbr != crossListedClass.catalogNbr) {
            if (collegeClass.subject != crossListedClass.subject) {
                var combinedName = className + "/" + crossListedClassName;
            } else {
                var combinedName = (collegeClass.catalogNbr < crossListedClass.catalogNbr) ? 
                                    collegeClass.subject + " " + collegeClass.catalogNbr + "/" + crossListedClass.catalogNbr
                                    : collegeClass.subject + " " + crossListedClass.catalogNbr + "/" + collegeClass.catalogNbr;
            }
            combined[crossListedClassName] = combinedName;
            combined[className] = combinedName;
        }
    }
    
}

for (var i = 0; i < classes.length; i++) {
    var collegeClass = classes[i];
    var preReqString = collegeClass.catalogPrereqCoreq;
    var className = collegeClass.subject + " " + collegeClass.catalogNbr;
    className = combined[className] ? combined[className] : className;
    // adds all courses in a subject to the graph (regardless if they have any links or not)
    addToNodes(className);
    classDesc[className] = {"name": collegeClass.titleLong,
     "description": collegeClass.description,
     "link": "https://classes.cornell.edu/browse/roster/" + collegeClass.roster + "/class/" + collegeClass.subject + "/" + collegeClass.catalogNbr,
     "prereq": collegeClass.catalogPrereqCoreq};
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
            addLinks(combined, blacklist, className, preReqSentence, "coreq");
        } else if (preReqSentence.indexOf("Prerequisite") != -1 ||
            preReqSentence.indexOf("Required prerequisite") != -1) {
            addLinks(combined, blacklist, className, preReqSentence, "prereq");
        }
    }
}

function addLinks(combined, blacklist, className, preReqString, type) {
    var matches = preReqString.match(/[A-Z]+ \d{4}/g);
    if (!matches) {
        return;
    }
    for (var i = 0; i < matches.length; i++) {
        var match = combined[matches[i]] ? combined[matches[i]] : matches[i];
        //var match = matches[i];
        if (blacklist.includes(match)) {
            continue;
        }
        linksMap[match + "," + className] = {"source" : match, "target" : className, "type" : type};
    }
}

linksList = d3.values(linksMap);

// this allows us to add pre-reqs from a different subject to the graph
linksList.forEach(function(link) {
  addToNodes(link.source);
  addToNodes(link.target);
  nodesMap[link.target]["prereqs"].push(link.source);


  if (!classDesc[link.target]) {
    // if this class isn't offered this semester or doesn't fall in desired subject
    // (for pre-reqs that we pull in -> gives them a description)

    var collegeClass = allClasses[link.target + "/" + roster];
    if (!collegeClass) {
        var maxC = "";
        // is the class in another semester? if so, let's get description from there
        for (c in allClasses) {
            if (c.startsWith(link.target) && c > maxC) {
                maxC = c;
            }
        }
        collegeClass = allClasses[maxC];
    }
    if (collegeClass) {
    
        classDesc[link.target] = {"name": collegeClass.titleLong,
         "description": collegeClass.description,
         "link": "https://classes.cornell.edu/browse/roster/" + collegeClass.roster + "/class/" + collegeClass.subject + "/" + collegeClass.catalogNbr,
         "prereq": collegeClass.catalogPrereqCoreq};
     } else {
        //this class is a prereq, but was never offered (ie. some weird CS 1114 class).
        classDesc[link.target] = {"name": "Class was last offered before 2014... there is no data about it",
         "description": "N/A",
         "link": "N/A",
         "prereq": "N/A"};    
     }
  }
  if (!classDesc[link.source]) {
    // if this class isn't offered this semester or doesn't fall in desired subject
    // (for pre-reqs that we pull in -> gives them a description)
    var collegeClass = allClasses[link.source + "/" + roster];
    if (!collegeClass) {
        // is the class in another semester? if so, let's get description from there
        var maxC = "";
        for (c in allClasses) {
            if (c.startsWith(link.source) && c > maxC) {
                maxC = c;
            }
        }
        collegeClass = allClasses[maxC];
    }

    if (collegeClass) {
            classDesc[link.source] = {"name": collegeClass.titleLong,
         "description": collegeClass.description,
         "link": "https://classes.cornell.edu/browse/roster/" + collegeClass.roster + "/class/" + collegeClass.subject + "/" + collegeClass.catalogNbr,
         "prereq": collegeClass.catalogPrereqCoreq};
    } else {
        //this class is a prereq, but was never offered (ie. some weird CS 1114 class).
        classDesc[link.source] = {"name": "Class was last offered before 2014... there is no data about it",
         "description": "N/A",
         "link": "N/A",
         "prereq": "N/A"};        }
    
  }

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
    .attr("opacity", set_opacity)
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
    .on("click", function (d) {
        document.getElementById('classdesc').innerHTML = "";
        document.getElementById('classdesc').innerHTML = getClassInfo(d);
    });

function set_opacity(d) {
    if (roster != "All" && (allClasses[d.id + "/" + roster] || combined[d.id.split('/')[0]])) {
        return 1;
    } else if (roster == "All" && classDesc[d.id].link != "N/A") {
        return 1;
    }
    return 0.25;
}

function getClassInfo(d) {
    var classInfo = classDesc[d.id];

    return "<b><a href='" + classInfo.link + "' target=\"_blank\">" + d.id + "</a>: " + classInfo.name + "</b><br/><p>" + classInfo.description + "<br/>" + classInfo.prereq + "</p>";
}

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

var text = svg.append("g")
    .attr("class", "text")
    .selectAll("text")
    .data(nodesList)
  .enter().append("text")
    .attr("x", textWidth)
    .attr("y", ".31em")
    .attr("opacity", set_opacity)
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

var zoom = d3.zoom()
    // no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
    // .translate([0, 0]) 
    // .scale(1) 
    .scaleExtent([.75, 2])
    .translateExtent([[-200, -200], [width + 200, height + 200]])
    .on("zoom", zoomed);

function zoomed() {

   var transform = d3.event.transform;
    node.attr("transform", transform);
    link.attr("transform", transform);
    text.attr("transform", transform);
}

svg.call(zoom);

}
