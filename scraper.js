var requestRosters = new XMLHttpRequest();
requestRosters.open('GET', "https://classes.cornell.edu/api/2.0/config/rosters.json", true);
requestRosters.send();
 
requestRosters.onreadystatechange = function(e) {
    if (this.readyState != 4 || this.status != 200) {
        return;
    }
    var responseJson = JSON.parse(this.responseText);
    var data = responseJson.data.rosters;
    for (var i = 0; i < data.length; i++) {
        var roster = data[i].slug;
        var subjectRequests = new XMLHttpRequest();
        subjectRequests.open('GET', "https://classes.cornell.edu/api/2.0/config/subjects.json?roster=" + roster, true);
        subjectRequests.send();
        subjectRequests.onreadystatechange = function (roster) {
            return function (e) {
                if (this.readyState != 4 || this.status != 200) {
                    return;
                }
                var responseJson = JSON.parse(this.responseText);
                var listSubjects = responseJson.data.subjects;
                for (var j = 0; j < listSubjects.length; j++) {
                    var subject = listSubjects[j].value;
                
                    var requestClassesForSemester = new XMLHttpRequest();
                    requestClassesForSemester.open('GET', "https://classes.cornell.edu/api/2.0/search/classes.json?roster=" + roster + "&subject=" + subject, true);
                    requestClassesForSemester.send();
                    requestClassesForSemester.onreadystatechange = function(subject) {
                        return function (e) {
                            if (this.readyState != 4 || this.status != 200) {
                                return;
                            }
                            var writeIt = JSON.parse(this.responseText).data.classes;
                            console.log(roster + ": " + subject);
                            console.log(writeIt);
                            saveFile(subject + "+" + roster + ".json", writeIt);
                        };
                    }(subject);
                }
            };
        }(roster);
    }
};

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

/*function addSubjectToGraph(roster, subjects) {
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
}*/