async function fillCodeTag(data, callback) {
  const code_tag = document.getElementById("code");
  console.log(code_tag);
  const refFileName = data.cd_data[0].filepath;
  document.getElementById("filename").innerText = refFileName;
  code_tag.className = get_extension(refFileName);
  code_tag.textContent = data.ref_data;
  console.log("done1");
  hljs.highlightAll();
  hljs.initLineNumbersOnLoad();
  callback();
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

// if (cd) {
//   let codee = readCodee();
//   console.log(JSON.stringify(codee)) ;
// }
