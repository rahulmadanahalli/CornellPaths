
function clearGraph() {
    var svg = d3.select("svg");
    svg.selectAll("*").remove();
}


function addSubjectToGraph(roster, subjects) {
    if (roster != "All") {
        var rosters = [roster];
        console.log(roster);
        getClasses(subjects, rosters);
        return;
    }
    var requestRosters = new XMLHttpRequest();
    requestRosters.open('GET', "https://classes.cornell.edu/api/2.0/config/rosters.json", true);
    requestRosters.send();
     
    requestRosters.onreadystatechange = function(e) {
        if (this.readyState != 4 || this.status != 200) {
            return;
        }
        var responseJson = JSON.parse(this.responseText);
        var data = responseJson.data.rosters;
        var rosters = [];
        for (var i = 0; i < data.length; i++) {
            rosters.push(data[i].slug);
        }
        getClasses(subjects, rosters);
    };

}

function getClasses(subjects, rosters) {
    var allClasses = [];
    for (var j = 0; j < subjects.length; j++) {
        for (var i = 0; i < rosters.length; i++) {
            var requestClassesForSemester = new XMLHttpRequest();
            requestClassesForSemester.open('GET', "https://classes.cornell.edu/api/2.0/search/classes.json?roster=" + rosters[i] + "&subject=" + subjects[j], false);
            try {
                requestClassesForSemester.send();
            } catch (err) {
                continue;
            }

            if (requestClassesForSemester.readyState != 4 || requestClassesForSemester.status != 200) {
                    continue;
            }
            
            var classes = JSON.parse(requestClassesForSemester.responseText).data.classes;
            classes.forEach( function(c) {
              c["roster"] = rosters[i];
            });
            
            allClasses = allClasses.concat(classes);
        }
    }
    createGraph(subjects, allClasses);
}