
function clearGraph() {
    var svg = d3.select("svg");
    svg.selectAll("*").remove();
}


function addSubjectToGraph(subject) {
    var requestRosters = new XMLHttpRequest();
    requestRosters.open('GET', "https://classes.cornell.edu/api/2.0/config/rosters.json", true);
    requestRosters.send();
     
    requestRosters.onreadystatechange = processRequestForRosters(subject, requestRosters);

}

function processRequestForRosters(subject, response) {
    return function(e) {
        if (response.readyState != 4 || response.status != 200) {
            console.log(response.readyState);
            console.log(response.status);
            return;
        }
        console.log(subject);
        var responseJson = JSON.parse(response.responseText);
        var data = responseJson.data.rosters;
        var rosters = [];
        for (var i = 0; i < data.length; i++) {
            rosters.push(data[i].slug);
        }
        getClasses(subject, rosters);
    }
}

function getClasses(subject, rosters) {
    var classes = [];
    for (var i = 0; i < rosters.length; i++) {
        if (rosters[i].match(/WI*/g)) {
            continue;
        }
        var requestClassesForSemester = new XMLHttpRequest();
        requestClassesForSemester.open('GET', "https://classes.cornell.edu/api/2.0/search/classes.json?roster=" + rosters[i] + "&subject=" + subject, false);
        requestClassesForSemester.send();
        if (requestClassesForSemester.status != 200) {
            continue;
        }
        var response = JSON.parse(requestClassesForSemester.responseText);
        classes = classes.concat(response.data.classes);
    }
    console.log(classes);
    createGraph(subject, classes);
}