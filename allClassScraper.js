/*
    scrapes all classes. scrapes a dictionary where key is the classid/roster and the value is the corresponding classes
    needs to split among 2 files (did split by half of rosters in one and other half in the other)

*/

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
 
var listSubjects = [];
var subjectsSet = {};
for (var r = 0; r < rosters.length; r++) {
    var requestSubjects = new XMLHttpRequest();
    requestSubjects.open('GET', "https://classes.cornell.edu/api/2.0/config/subjects.json?roster=" + rosters[r], false);
    requestSubjects.send();

    if (requestSubjects.readyState != 4 || requestSubjects.status != 200) {
       console.log("fuck");
    }
    var responseJson = JSON.parse(requestSubjects.responseText);
    var data = responseJson.data.subjects;
    for (var i = 0; i < data.length; i++) {
        var subject = data[i].value;
        if (!subjectsSet[subject]) {
            listSubjects.push(subject);
        }
        subjectsSet[subject] = true;
    }
}
console.log(listSubjects);


var result = {};

for (var j = 0; j < listSubjects.length; j++) {
    var subject = listSubjects[j];
    // change the below loop guard to iterate over half of rosters
    //for (var i = 0; i < Math.floor(rosters.length/2); i++) {
    for (var i = Math.floor(rosters.length/2); i < rosters.length; i++) {
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

        var dict = {};
        classes.forEach( function(c) {
          dict[c.subject + " " + c.catalogNbr + "/" + rosters[i]] = c;
        });
        for(var key in dict) result[key] = dict[key];                        
    }
}

var allClassesEver = JSON.stringify(result);
//change the name here
saveFile("classes2.json", allClassesEver);           

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