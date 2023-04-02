const pathName = window.location.pathname;
const pathArray = pathName.split("/");
const owner = pathArray[1];
const repo = pathArray[2];
const ref = pathArray[3];
const content = pathArray.slice(4).join("/");
const openFile = content;
let jsonData = null;
let refData = null;

$(async function () {
  drawTree();
  spreadTree();
  jsonData = JSON.parse(await getFileContent(owner, repo, content));
  refData = JSON.parse(jsonData["data"]);
  const refFileContent = await getFileContent(owner, repo, jsonData["referenced_file"]);
  $("#filename").text(jsonData["referenced_file"]);
  $("#code").text(refFileContent);

  hljs.highlightAll();
  await new Promise((resolve, reject) => {
    hljs.initLineNumbersOnLoad();
    resolve();
  });

  setTimeout(() => {
    renderCodee();
  }, 0);
});


async function getFileContent(owner, repo, content) {
  return await fetch(`/api/v1/repo/${owner}/${repo}/contents/${content}`)
    .then(function (response) {
      if (response.status !== 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      return response.text();
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
      return null;
    });
}
