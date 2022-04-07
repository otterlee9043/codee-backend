function get_extension(filename) {
  var length = filename.length;
  var lastDot = filename.lastIndexOf(".");
  var extension = filename.substring(lastDot + 1, length).toLowerCase();

  return extension;
}

function find_path(element, username) {
  // console.log(element.parentElement.parentElement);
  // console.log(element);
  var dir_node = element.parentElement.parentElement;
  // var path = dir_node.querySelector("span").textContent + "/" + element.textContent ;

  var path = element.textContent;
  while (dir_node.id != username) {
    console.log(path);
    path = dir_node.querySelector("span").textContent + "/" + path;

    dir_node = dir_node.parentElement.parentElement;
  }
  return path;
}

function show_file(element, file_name, username) {
  // file root 찾기
  path = find_path(element, username);

  var data = {
    name: file_name,
    path: path,
  };
  // hljs.initHighlightingOnLoad();
  // hljs.initLineNumbersOnLoad();

  fetch(`${window.origin}/codination/ver1/showcode`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(data),
    cache: "no-cache",
    headers: new Headers({
      "content-type": "application/json",
    }),
  })
    .then(function (response) {
      if (response.status !== 200) {
        console.log(
          `Looks like there was a problem. Status code: ${response.status}`
        );
        return;
      }
      response.json().then(function (data) {
        //console.log(data.filedata);
        const code_tag = document.getElementById("code");
        console.log(code_tag);
        code_tag.className = get_extension(file_name);
        console.log(get_extension(file_name));
        code_tag.textContent = data.filedata;
        console.log("done1");

        hljs.highlightAll();
        hljs.initLineNumbersOnLoad();
      });
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
    });
  console.log("done2");
  const numbers = document.querySelectorAll(".hljs-ln-numbers");
  console.log(numbers);
  Array.from(numbers).map((item, index) => {
    const number = parseInt(item.getAttribute("data-line-number"));
    console.log(number);
    item.parentElement.id = `L${number}`;
    console.log(item.parentElement.id);
  });
}
