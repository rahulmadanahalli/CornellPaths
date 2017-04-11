var requestRosters = new XMLHttpRequest();
requestRosters.open('GET', "https://classes.cornell.edu/api/2.0/config/rosters.json", false);
requestRosters.send();
 
var rosters = [];


if (requestRosters.readyState != 4 || requestRosters.status != 200) {
   console.log("fuck");
}
var responseJson = JSON.parse(requestRosters.responseText);
var data = responseJson.data.rosters;
var rosters = [];
for (var i = 0; i < data.length; i++) {
    rosters.push(data[i].slug);
}
console.log(rosters);
 
var requestSubjects = new XMLHttpRequest();
requestSubjects.open('GET', "https://classes.cornell.edu/api/2.0/config/subjects.json?roster=FA17", false);
requestSubjects.send();
var listSubjects = [];

if (requestSubjects.readyState != 4 || requestSubjects.status != 200) {
   console.log("fuck");
}
var responseJson = JSON.parse(requestSubjects.responseText);
var data = responseJson.data.subjects;
var listSubjects = [];
for (var i = 0; i < data.length; i++) {
    listSubjects.push(data[i].value);
}
console.log(listSubjects);

var allClasses = [];

for (var j = 0; j < listSubjects.length; j++) {
    var subject = listSubjects[j];
    allClasses = [];
    for (var i = 0; i < rosters.length; i++) {
        var requestClassesForSemester = new XMLHttpRequest();

        requestClassesForSemester.open('GET', "https://raw.githubusercontent.com/rahulmadanahalli/CornellPaths/master/json/" + subject + "%2B" + rosters[i] + ".json", false);
        try {
            requestClassesForSemester.send();
        } catch (err) {
            continue;
        }

        if (requestClassesForSemester.readyState != 4 || requestClassesForSemester.status != 200) {
            continue;
        }
        var classes = JSON.parse(requestClassesForSemester.responseText);

        // track which roster this class came from (when you're doing ALL semesters)
        classes.forEach( function(c) {
            c["roster"] = rosters[i];
        });

        allClasses = allClasses.concat(classes);
    }
    var allClassesForSubject = JSON.stringify(allClasses);
    console.log(allClasses.length + " classes for " + subject);
    saveFile(subject + ".json", allClassesForSubject);
}

function saveFile(fileName, jsonFile) {
    if ('Blob' in window) {
        var textFileAsBlob = new Blob([jsonFile], {
            type: 'application/json'
        });

        var downloadLink = document.createElement("a");
        downloadLink.download = fileName;
        downloadLink.innerHTML = "Download File";
        if ('webkitURL' in window) {
            // Chrome allows the link to be clicked without actually adding it to the DOM.
            downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
        } else {
            // Firefox requires the link to be added to the DOM before it can be clicked.
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = destroyClickedElement;
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }

        downloadLink.click();
    } else {
        alert('Your browser does not support the HTML5 Blob.');
    }
}