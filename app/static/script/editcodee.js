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

// async function readCommitId() {
//   const cdpath = filepath;
//   const opts = {
//     method: "POST",
//     body: JSON.stringify({
//       cd_filepath: cdpath,
//       read: true,
//     }),
//   };
//   const response = await fetch(`${window.origin}/codination/ver1/read_codee`, opts);
//   const data = await response.json();
//   return data.commit_id;
// }
function addLineHide(start, end, ID) {
  cacheChange = 1;
  ref_data.push({ type: "line_hide", start: start, end: end, id: ID });
}

function addLink(start, end, line, url, ID) {
  cacheChange = 1;
  ref_data.push({ type: "link", start: start, end: end, line: line, url: url, id: ID });
}

function addWordComment(start, end, line, comment, ID) {
  cacheChange = 1;
  ref_data.push({ type: "comment", start: start, end: end, line: line, comment: comment, id: ID });
}

function addWordComment2(start, end, line, comment, ID) {
  cacheChange = 1;
  ref_data.push({ type: "comment-embedded", start: start, end: end, line: line, comment: comment, id: ID });
}


function addWordHighlight(color, start, end, line, ID) {
  cacheChange = 1;
  ref_data.push({ type: "highlight", color: color, start: start, end: end, line: line, id: ID });
}

function addWordHide(start, end, line, ID) {
  cacheChange = 1;
  ref_data.push({ type: "word_hide", start: start, end: end, line: line, id: ID });
}

function deleteWordHide(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "word_hide") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteLineHide(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "line_hide") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteComment(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "comment") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteComment2(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "comment-embedded") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteLink(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "link") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function deleteHighlight(ID) {
  cacheChange = 1;
  for (let i = 0; i < ref_data.length; i++) {
    if (ref_data[i].id == ID && ref_data[i].type == "highlight") {
      ref_data.splice(ref_data.indexOf(i), 1);
    }
  }
}

function saveCodee(username) {
  // path를 읽고
  // fetch로 보내기
  cacheChange = 1;
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
