/*
    Used for scraping new semester's classes info 
    TODO: put this on a cronjob

    DON'T forget, you have to rescrape the CS.json data (getting all classes for subject across all semesters)
*/

// CHANGE THIS TO THE DESIRED SEMESTER, and copy paste all files to the json directory
var roster = "FA17";
var subjectRequests = new XMLHttpRequest();
subjectRequests.open('GET', "https://classes.cornell.edu/api/2.0/config/subjects.json?roster=" + roster, true);
subjectRequests.send();
subjectRequests.onreadystatechange = function (e) {
    if (this.readyState != 4 || this.status != 200) {
        return;
    }
    var responseJson = JSON.parse(this.responseText);
    var listSubjects = responseJson.data.subjects;
    saveFile(roster + ".json", JSON.stringify(listSubjects));
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
                var writeIt = JSON.stringify(JSON.parse(this.responseText).data.classes);
                console.log(roster + ": " + subject);
                console.log(writeIt);
                saveFile(subject + "+" + roster + ".json", writeIt);
            };
        }(subject);
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