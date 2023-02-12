async function fillCodeTag(data) {
  const code_tag = document.getElementById("code");
  console.log(code_tag);
  const refFileName = data.cd_data[0].filepath;
  document.getElementById("filename").innerText = refFileName;
  code_tag.className = get_extension(refFileName);
  code_tag.textContent = data.ref_data;
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
  // fillCodeTag(data, hideLine);
  // hideLine();
  // console.log(data);
  // console.log(JSON.stringify(data));
  return data.cd_data;
}


function addLineHide(start, end, id) {
  ref_data.push({ type: "line_hide", start: start, end: end, id: id });
}

function addLink(start, end, line, url, id) {
  ref_data.push({ type: "link", start: start, end: end, line: line, url: url, id: id });
}

function addWordComment(start, end, line, comment, id) {
  ref_data.push({ type: "comment", start: start, end: end, line: line, comment: comment, id: id });
}

function addWordComment2(start, end, line, comment, id) {
  ref_data.push({ type: "comment-embedded", start: start, end: end, line: line, comment: comment, id: id });
}


function addWordHighlight(color, start, end, line, id) {
  ref_data.push({ type: "highlight", color: color, start: start, end: end, line: line, id: id });
}

function addWordHide(start, end, line, id) {
  ref_data.push({ type: "word_hide", start: start, end: end, line: line, id: id });
}

function deleteWordHide(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "word_hide") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteLineHide(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "line_hide") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteComment(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "comment") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteComment2(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "comment-embedded") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteLink(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "link") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteHighlight(ID) {
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "highlight") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function saveCodee(username) {
  // path를 읽고
  // fetch로 보내기
  console.log(filepath);
  console.log(ref_data);
  const opts = {
    method: "POST",
    body: JSON.stringify({
      codee_path: filepath,
      codee_data: JSON.stringify(ref_data),
      username: document.querySelector("li.dir").getAttribute("id")
    }),
    headers: new Headers({
      "content-type": "application/json",
    }),
  };
  fetch(`${window.origin}/codination/ver1/saveCodee`, opts)
    .then(function (response) {
      if (response.status != 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
}
