const filename = document.getElementById("filename").innerText;
const code_tag = document.getElementById("code");
if (code_tag != null) {
  code_tag.className = get_extension(filename);
}
var getLocation = function (href) {
  var l = document.createElement("a");
  l.href = href;
  return l;
};

const pathname = getLocation(location.href).pathname;
const filepath = pathname.split("/codination/ver1/").pop();
const splitPath = filepath.split("/");
const dirs = splitPath.slice(1, splitPath.length - 1);
const file = splitPath[splitPath.length - 1];
console.log(dirs);

// window.addEventListener("load", function () {
//   openDirectoryTree();
// });

function openDirectoryTree() {
  let tree = document.getElementById("dir_tree");
  dirs.map((dir) => {
    console.log(dir);
    const li = tree.querySelector(`[name="${dir}"]`);
    console.log(li);
    li.ariaExpanded = true;
    tree = li.querySelector("ul");
  });
}

function get_extension(filename) {
  var length = filename.length;
  var lastDot = filename.lastIndexOf(".");
  var extension = filename.substring(lastDot + 1, length).toLowerCase();

  return extension;
}

function find_path(element, username) {
  // console.log(element.parentElement.parentElement);
  // console.log(element);
  console.log(username);
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

function find_dir_path(element, username) {
  // console.log(element.parentElement.parentElement);
  // console.log(element);
  console.log(username);
  var dir_node = element.parentElement.parentElement;
  // var path = dir_node.querySelector("span").textContent + "/" + element.textContent ;

  var path = element.firstChild.textContent;
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
  // location.href = `/codination/ver1/showfile/${path}?user=${username}`;
  location.href = `/codination/ver1/${username}/${path}`;

  // fetch(`${window.origin}/codination/ver1/${path}`, {
  //   method: "GET",
  //   credentials: "include",
  //   cache: "no-cache",
  // })
  //   .then(function (response) {
  //     if (response.status !== 200) {
  //       console.log(`Looks like there was a problem. Status code: ${response.status}`);
  //       return;
  //     }
  //     response.json().then(function (data) {
  //       //console.log(data.filedata);
  //       const code_tag = document.getElementById("code");
  //       // change the name
  //       const filename = document.querySelector("filename");
  //       filename.textContent = data.path;
  //       console.log(code_tag);
  //       code_tag.className = get_extension(file_name);
  //       console.log(get_extension(file_name));
  //       code_tag.textContent = data.filedata;
  //       console.log("done1");

  //       hljs.highlightAll();
  //       hljs.initLineNumbersOnLoad();

  //       addEventInMenumar(code_tag);
  //     });
  //   })
  //   .catch(function (error) {
  //     console.log("Fetch error: " + error);
  //   });
  // console.log("done2");
  // const numbers = document.querySelectorAll(".hljs-ln-numbers");
  // console.log(numbers);
  // Array.from(numbers).map((item, index) => {
  //   const number = parseInt(item.getAttribute("data-line-number"));
  //   console.log(number);
  //   item.parentElement.id = `L${number}`;
  //   console.log(item.parentElement.id);
  // });
}

function show_dir(tree, username, parent_node, browse = false, inputId, file = false) {
  console.log(username);
  const tree_len = tree.length;
  if (tree_len > 0) {
    var ul_tag = document.createElement("ul");
    ul_tag.id = "group";

    parent_node.append(ul_tag);

    for (var i = 0; i < tree_len; i++) {
      // 여기서 tree[i]가 string이면 파일이니까 li 파일을 ul에 추
      if (typeof tree[i] == "string") {
        var li_file = document.createElement("li");

        if (browse) {
          if (file) {
            li_file.addEventListener("click", function (event) {
              setPath(inputId, find_path(this, username));
            });
          }
        } else {
          li_file.addEventListener("click", function (event) {
            show_file(this, this.textContent, username);
          });
        }

        li_file.id = "treeitem";
        li_file.classList.add("file");
        li_file.innerText = tree[i];
        ul_tag.append(li_file);
      } else {
        // else dir이니까
        const key = Object.keys(tree[i])[0];
        const values = tree[i][key];
        // li 만들고
        var li_dir = document.createElement("li");
        li_dir.id = "treeitem";
        li_dir.ariaExpanded = "false";
        li_dir.setAttribute("name", key);
        li_dir.classList.add("dir");
        var span = document.createElement("span");
        span.textContent = key;
        li_dir.append(span);
        if (browse && !file) {
          li_dir.addEventListener("click", function (event) {
            setPath(inputId, find_dir_path(this, username));
          });
        }
        // ul에 추가
        ul_tag.append(li_dir);

        // dir 하위에 아무 파일이 없을 경우 대비
        if (values.length > 0) {
          var ul_new_tag = document.createElement("ul");
          li_dir.append(ul_new_tag);
        } else {
          continue;
        }
        for (var j = 0; j < values.length; j++) {
          if (Array.isArray(values[j]) || typeof values[j] == "string") {
            var li_file = document.createElement("li");

            if (browse) {
              if (file) {
                li_file.addEventListener("click", function (event) {
                  setPath(inputId, find_path(this, username));
                });
              }
            } else {
              li_file.addEventListener("click", function (event) {
                show_file(this, this.textContent, username);
              });
            }
            li_file.id = "treeitem";
            li_file.classList.add("file");
            li_file.innerText = values[j];
            ul_new_tag.append(li_file);
          } else {
            const new_key = Object.keys(values[j]);
            var li_new_dir = document.createElement("li");
            li_new_dir.id = "treeitem";
            li_new_dir.ariaExpanded = "false";
            li_new_dir.classList.add("dir");
            var new_span = document.createElement("span");
            new_span.textContent = new_key;
            li_new_dir.setAttribute("name", new_key);
            li_new_dir.append(new_span);
            if (browse && !file) {
              li_new_dir.addEventListener("click", function (event) {
                setPath(inputId, find_dir_path(this, username));
              });
            }
            // console.log(new_key);
            result = show_dir(values[j][new_key], new_key, li_new_dir);
            ul_new_tag.append(li_new_dir);
          }
        }
      }
    }
  }
  return parent_node;
}

function setPath(inputId, path) {
  const element = document.getElementById(inputId);
  element.value = "";
  element.value = path;
}

function browse_dir(event, tree, username, parent_node, location = null) {
  event.preventDefault();
  show_dir(tree, username, parent_node, location);
  console.log("browser");
}
