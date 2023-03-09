async function fillCodeTag(data) {
  const code_tag = document.getElementById("code");
  console.log(code_tag);
  const refFileName = data.cd_data[0].filepath;
  document.getElementById("filename").innerText = refFileName;
  code_tag.className = get_extension(refFileName);
  code_tag.textContent = data.refData;
  console.log("done1");
  hljs.highlightAll();
  hljs.initLineNumbersOnLoad();
}

async function readCodee() {
  const cdpath = filepath;

  const opts = {
    method: "POST",
    body: JSON.stringify({
      cd_filepath: cdpath,
      username: document.querySelector("li.dir").getAttribute("id")
    }),
    headers: new Headers({
      "content-type": "application/json",
    })
  };
  console.log(`${window.origin}`)
  const response = await fetch(`${window.origin}/codination/ver1/read_codee`, opts);
  const data = await response.json();
  return data.cd_data;
}


function addLineHide(start, end, ID) {
  cacheChange = 1;
  refData.push({ type: "line_hide", start: start, end: end, id: ID });
}

function addLink(start, end, line, url, ID) {
  cacheChange = 1;
  refData.push({ type: "link", start: start, end: end, line: line, url: url, id: ID });
  console.log(refData);
}

function addWordComment(start, end, line, comment, ID) {
  cacheChange = 1;
  refData.push({ type: "comment", start: start, end: end, line: line, comment: comment, id: ID });
}

function addWordComment2(start, end, line, comment, ID) {
  cacheChange = 1;
  refData.push({ type: "comment-embedded", start: start, end: end, line: line, comment: comment, id: ID });
}


function addWordHighlight(color, start, end, line, ID) {
  cacheChange = 1;
  refData.push({ type: "highlight", color: color, start: start, end: end, line: line, id: ID });
}

function addWordHide(start, end, line, ID) {
  cacheChange = 1;
  refData.push({ type: "word_hide", start: start, end: end, line: line, id: ID });
}

function deleteWordHide(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "word_hide") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

function deleteLineHide(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "line_hide") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

function deleteComment(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "comment") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

function deleteComment2(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "comment-embedded") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

function deleteLink(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "link") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

function deleteHighlight(ID) {
  cacheChange = 1;
  for (let i = 0; i < refData.length; i++) {
    if (refData[i].id == ID && refData[i].type == "highlight") {
      refData.splice(refData.indexOf(i), 1);
    }
  }
}

