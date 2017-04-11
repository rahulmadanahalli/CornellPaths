var allClasses = {};
var request = new XMLHttpRequest();
request.open('GET', "https://raw.githubusercontent.com/rahulmadanahalli/CornellPaths/master/json/classes1.json", true);
request.send();
request.onreadystatechange = function (e) {
    if (this.readyState != 4 || this.status != 200) {
        return;
    }
    var classes = JSON.parse(this.responseText);
    for(var key in classes) allClasses[key] = classes[key];                        
};


request = new XMLHttpRequest();
request.open('GET', "https://raw.githubusercontent.com/rahulmadanahalli/CornellPaths/master/json/classes2.json", true);
request.send();
request.onreadystatechange = function (e) {
    if (this.readyState != 4 || this.status != 200) {
        return;
    }
    var classes = JSON.parse(this.responseText);
    for(var key in classes) allClasses[key] = classes[key];
};
                       


function clearGraph() {
    var svg = d3.select("svg");
    svg.selectAll("*").remove();
}


function addSubjectToGraph(roster, subjects) {
    getClasses(subjects, roster);
}

function getClasses(subjects, roster) {
    var desiredClasses = [];
    for (var j = 0; j < subjects.length; j++) {
        var requestClassesForSemester = new XMLHttpRequest();
        if (roster == "All") {
            requestClassesForSemester.open('GET', "https://raw.githubusercontent.com/rahulmadanahalli/CornellPaths/master/json/" + subjects[j] + ".json", false);
        } else {
            requestClassesForSemester.open('GET', "https://raw.githubusercontent.com/rahulmadanahalli/CornellPaths/master/json/" + subjects[j] + "%2B" + roster + ".json", false);
        }

        try {
            requestClassesForSemester.send();
        } catch (err) {
            continue;
        }

        if (requestClassesForSemester.readyState != 4 || requestClassesForSemester.status != 200) {
                continue;
        }
        
        var classes = JSON.parse(requestClassesForSemester.responseText);
        if (roster != "All") {
            classes.forEach( function(c) {
              c["roster"] = roster;
            });
        }
        
        desiredClasses = desiredClasses.concat(classes);
    }
    createGraph(roster, subjects, desiredClasses, allClasses);
}