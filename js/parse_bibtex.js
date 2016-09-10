
// Parse bibTex from link and write to HTML
function parse_bibtex(url, htmlID) {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true);   // asynchronous request for bibTex file
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var str = xmlhttp.responseText.replace(/(\r\n|\n|\r)/gm,"");    // remove line break
            parse(str, htmlID);
        }
    }
};

// Parse bibTex string, insert to HTML
function parse(str, htmlID) {

    // find all '@'
    char = '@';
    var indices = [];
    for (var i = 0; i < str.length; i++) {
        if (str[i]==char) indices.push(i);
    }

    // get text within bracket
    var ENTRIES = [];
    for (var i = 0; i < indices.length; i++) {  // iterate over each '@'
        // find start and end of entry
        bIndex = findMatchingBrace(str.substring(indices[i]));
        if (bIndex==null) return null;
        var relString = str.substring(indices[i]).substring(bIndex.keyStart, bIndex.keyEnd);

        // fill in required entries
        var entry = {};
        // fill in label
        entry.label = relString.split(",")[0];
        // fill in title
        var ise = getStartEnd(relString, "title=");
        if (ise!=null) entry.title = relString.substring(ise.keyStart, ise.keyEnd);
        else entry = null;
        // fill in author
        var ise = getStartEnd(relString, "author=");
        if (ise!=null) entry.author = parseAuthors(relString.substring(ise.keyStart, ise.keyEnd));
        else entry = null;
        // fill in journal
        var ise = getStartEnd(relString, "journal=");
        if (ise!=null) entry.journal = relString.substring(ise.keyStart, ise.keyEnd);
        else entry = null;
        // fill in year
        var ise = getStartEnd(relString, "year=");
        if (ise!=null) entry.year = relString.substring(ise.keyStart, ise.keyEnd);
        else entry = null;
        // fill in link to paper
        var ise = getStartEnd(relString, "paper=");
        if (ise!=null) entry.paper = relString.substring(ise.keyStart, ise.keyEnd);
        // fill in link to code
        var ise = getStartEnd(relString, "code=");
        if (ise!=null) entry.code = relString.substring(ise.keyStart, ise.keyEnd);

        // add to ENTRIES
        ENTRIES.push(entry);
    }

    // write text to HTML
    allString = "";
    for (var i = 0; i < ENTRIES.length; i++) {
        var entry = ENTRIES[i];
        // add names
        var addString = "";
        var names = entry.author.names;
        for (var j = 0; j < names.length; j++) {
            var name = names[j];
            addString += name.first.charAt(0) + ". ";
            if (name.middle!=null) addString += name.middle.charAt(0) + ". ";
            addString += name.last;
            if (j < names.length-1) addString += ", ";
        }
        if (entry.author.others) addString += ",<i>et al</i>."
        addString += ", ";
        // add title
        addString += "\"" + entry.title + "\", ";
        // add journal (in italics)
        addString += "<i>" + entry.journal + "</i>, ";
        // add year
        addString += entry.year + ". ";
        // add link to paper
        addString +=
            "[<a href=\"" + entry.paper + "\"target=\"_blank\" class=\"nofmt_links\">Paper</a>] ";
        // add link to code
        if (entry.code!=null) {
            addString += "[<a href=\"" + entry.code + "\"target=\"_blank\" class=\"nofmt_links\">Code</a>] ";
        }

        addString = "<li>" + addString + "</li>";
        allString += addString;

    }
    allString = "<ol>" + allString + "</ol>";
    document.getElementById(htmlID).innerHTML += allString;
}

function parseAuthors(str) {
    var authors = [];
    var splitName = str.split("and");
    var others = false;
    for (var i = 0; i < splitName.length; i++) {
        var last = null; first = null; firstmiddle = null; middle = null;
        var split2x = splitName[i].split(",");
        if (split2x.length==1) others = true;
        else {
            last = split2x[0].trim();
            firstmiddle = split2x[1].trim().split(" ");
            first = firstmiddle[0].trim();
            if (firstmiddle.length>1)
                middle = firstmiddle[1].trim();
            if (last.charAt(0)=="{" && last.charAt(last.length-1)=="}")
                last = last.substring(1, last.length-1);
            var author = { first: first, middle: middle, last: last};
            authors.push(author);
        }
    }
    return { names: authors, others: others };
}

function getStartEnd(str, keyword) {
    var keyIndex = str.search(keyword);
    if (keyIndex==-1) return null;
    var start = keyIndex+keyword.length;
    var fmb = findMatchingBrace(str.substring(start));
    fmb.keyStart += start;
    fmb.keyEnd += start;
    return fmb;
}

// finds the start and end positions of outermost matching brace
function findMatchingBrace(str) {
    var keyStart, keyEnd;
    var pos = 0;
    var braceFound = false;
    for (var j = 0; j < str.length; j++) {   // find text within bracket
        if (str[j]=='{') {
            if (pos==0) {
                keyStart = j+1;
                braceFound = true;
            }
            pos++;
        }
        if (str[j]=='}')  {
            pos--;
            if (pos==0) {
                keyEnd = j;   // end of string+1
                break;
            }
        }
    }
    if (pos!=0 || !braceFound) return null;
    else return { keyStart: keyStart, keyEnd: keyEnd };
}
