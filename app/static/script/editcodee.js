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
  const cd = document.getElementById("cd");
  const cdpath = filepath;
  const opts = {
    method: "POST",
    body: JSON.stringify({
      cd_filepath: cdpath,
    }),
  };
  const response = await fetch(`${window.origin}/codination/ver1/show_ref_file`, opts);
  const data = await response.json();
  // fillCodeTag(data, hideLine);
  // hideLine();
  // console.log(data);
  // console.log(JSON.stringify(data));
  return data.cd_data;
}

function addLineHide(start, end, ID) {
  ref_data[0]["data"].push({ type: "line_hide", start: start, end: end, id: ID });
}

function addLink(start, end, url, ID) {
  ref_data[0]["data"].push({ type: "link", start: start, end: end, url: url, id: ID });
}

function addWordComment(start, end) {}

function deleteLineHide(ID) {
  for (let i = 0; i < ref_data[0]["data"].length; i++) {
    if (ref_data[0]["data"][i].id == ID && ref_data[0]["data"][i].type == "line_hide") {
      ref_data[0]["data"].splice(ref_data[0]["data"].indexOf(i), 1);
    }
  }
}

function saveCodee(path, username) {
  // path를 읽고
  // fetch로 보내기
  console.log(filepath);
  const opts = {
    method: "POST",
    body: JSON.stringify({
      codee_path: filepath,
      codee_data: JSON.stringify(ref_data),
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
