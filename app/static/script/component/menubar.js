const menu = document.querySelector(".context-menu-one");
let line;
let start_index;
let end_index;

function getTD(elem) {
  while (elem.tagName != "TD") {
    elem = elem.parentElement;
  }
  return elem;
}
function findLine(elem) {
  while (elem.tagName != "TD") {
    elem = elem.parentElement;
  }

  return elem;
}

function findOffsetTag(node, offset) {
  let childs = node.childNodes;
  let i = 0;
  let length = 0;
  let prev;
  let prevOffset;
  while (length < offset) {
    prevOffset = length;
    prev = childs[i];
    if (childs[i].tagName == null) {
      length += childs[i].nodeValue.length;
    } else {
      length += childs[i].innerText.length;
    }
    i++;
  }

  if (prev.tagName == null) {
    return { tag: prev, startOffset: offset - prevOffset };
  } else {
    return findOffsetTag(prev, offset - prevOffset);
  }
}

// console.log(range.startContainer.hasChildNodes() ) ;
// console.log(range.startContainer.parentElement.innerText.length ) ;
function findOffset(node, offset) {
  let prev = node;
  while (node.tagName != "TD") {
    node = node.previousSibling;
    while (node != null) {
      if (node.tagName == null) {
        offset += node.nodeValue.length;
      } else {
        offset += node.innerText.length;
      }
      prev = node;
      node = node.previousSibling;
    }
    node = prev.parentElement;
    prev = node;
  }
  return offset;
}

if (menu != null) {
  menu.addEventListener("click", function (e) {
    e.preventDefault();

    var element = document.getSelection();
    var selectedText = element.toString();
    if (selectedText != "") {
      const conMenu = document.querySelector(".context-menu-list.context-menu-root");
      const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
      const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;

      // console.log(`x: ${x}, y: ${y}`) ;
      conMenu.style.top = `${y + 10}px`;
      conMenu.style.left = `${x}px`;

      $(".context-menu-one").contextMenu();
    }
  });
}

var range = null;
var selected = null;

function saveSelection() {
  if (window.getSelection) {
    selected = document.getSelection();
    if (selected.getRangeAt && selected.rangeCount) {
      return selected.getRangeAt(0);
    } else if (document.selection && document.selection.createRange) {
      return document.createRange();
    }
    return null;
  }
}

function restroeSelection() {
  if (flag) {
    console.log("restoreSelection");
    let tdTag = document.querySelector(`#L${line} > .hljs-ln-code`);
    let startTag = findOffsetTag(tdTag, start_index);
    let endTag = findOffsetTag(tdTag, end_index);
    let new_range = document.createRange();
    new_range.setStart(startTag.tag, startTag.startOffset);
    new_range.setEnd(endTag.tag, endTag.startOffset);
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(new_range);
    console.log(document.getSelection().anchorNode);
  }
}
// let url_flag = 0 ;
var flag = 0;
function createFakeSelection(event) {
  console.log(`createFakeSelection : ${flag}`);
  if (!flag) {
    var span = createNewSpan(document.getSelection());
    span.classList.add("selected");
    flag = 1;
  }
  console.log(document.getSelection());
  // selected.removeAllRanges() ;

  // 여기서 range가 없어진다.
}

function removeFakeSelection(event) {
  // remove fake selection
  console.log("second");
  // 만약 tag적용이 됐으면? removeSeleted만 하기
  // if (url_flag) {
  //   var select = document.querySelector(".selected");
  //   select.classList.remove("selected");
  // }
  // else flag 일땐
  console.log(flag);
  if (flag) {
    var select = document.querySelector(".selected");
    select.classList.remove("selected");
    const children = [];
    while (select.firstChild) {
      const child = select.firstChild;
      children.push(child);
      select.parentNode.insertBefore(child, select);
    }
    console.log();
    select.remove();
    Array.from(children).map((node) => {
      merge(node);
    });
    merge(select);
    restroeSelection();
  }
  console.log(range);
  flag = 0;
}

function openLink(self) {
  console.log("click link");
  console.log(self);
  url = self.getAttribute("url");
  window.open(url, "_blank").focus();
}

$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  delay: 500,
  autoHide: false,
  position: function (opt, x, y) {
    // console.log(x);
  },
  callback: function (key, opt, e) {
    var m = "clicked: " + key + " " + opt;
    console.log(m);
    const selection = document.getSelection();
    let span;
    if (key == "comment") {
      console.log("comment");
      span = createNewSpan(selection);
      span.classList.add("comment");
    } //else if (key == "highlight") {
    else if (key == "red") {
      span = createNewSpan(selection);
      span.classList.add("red");
      const [start, end] = getIndices(span);
      var tdNode = getTD(span);
      line = tdNode.getAttribute("data-line-number");
      const ID = randomId();
      span.id = ID;
      addWordHighlight("red", start, end, line, ID);
    } else if (key == "yellow") {
      span = createNewSpan(selection);
      span.classList.add("yellow");
      const [start, end] = getIndices(span);
      var tdNode = getTD(span);
      line = tdNode.getAttribute("data-line-number");
      const ID = randomId();
      span.id = ID;
      addWordHighlight("yellow", start, end, line, ID);
    } else if (key == "green") {
      span = createNewSpan(selection);
      span.classList.add("green");
      const [start, end] = getIndices(span);
      var tdNode = getTD(span);
      line = tdNode.getAttribute("data-line-number");
      const ID = randomId();
      span.id = ID;
      addWordHighlight("green", start, end, line, ID);
    } else if (key == "record") {
      console.log("record");
    } else if (key == "hide") {
      // let docfrag = document.createDocumentFragment();
      const td = selection.anchorNode.parentElement.closest("td");
      const cloneNode = td.cloneNode(true);
      // docfrag.appendChild(cloneNode);
      span = createNewSpan(selection);
      const ID = randomId();
      const [start, end] = getIndices(span);
      var tdNode = getTD(span);
      line = tdNode.getAttribute("data-line-number");
      span.id = ID;
      addWordHide(start, end, line, ID);
      ellipsisSpan(span);
    } else if (key == "link") {
      console.log("link");
      span = createNewSpan(selection);
      console.log("LINK!!!");
      // link 가져와서 tag 만들기
    } else {
      console.log("none");
    }
    // const [startIndex, endIndex] = getIndices(span);
    // console.log(startIndex, endIndex);
    selection.removeAllRanges();
    // window.console && console.log(m) || alert(m);
  },
  items: {
    comment: {
      // name: "Comment",
      icon: "fa-light fa-comment-dots",
      items: {
        "link-1": {
          type: "text",
          events: {
            keyup: function (e) {
              let inputs = document.getElementsByName("context-menu-input-link-1");
              if (e.keyCode == 13 && inputs[0].value) {
                const conMenu = document.querySelector(".context-menu-list.context-menu-root");
                addComment(e, conMenu.style.top, conMenu.style.left);

                Array.from(inputs).map((input) => {
                  input.removeEventListener("mousedown", createFakeSelection);
                  input.removeEventListener("blur", removeFakeSelection);
                });
                flag = 0;
                $(".context-menu-list").trigger("contextmenu:hide");
              }
            },
          },
        },
      },
    },
    highlight: {
      // name: "Highlight",
      icon: "fa-light fa-highlighter",
      items: {
        red: {
          // name: "Red",
          selector: "#red",
          icon: "fa-solid fa-circle",
          events: {
            click: function (e) {
              console.log("RED~~");
            },
          },
        },
        yellow: {
          // name: "Yellow",
          icon: "fa-solid fa-circle",
        },
        green: {
          // name: "Green",
          icon: "fa-solid fa-circle",
        },
      },
    },
    record: {
      // name: "Record",
      icon: "fa-light fa-microphone",
    },
    hide: {
      // name: "Hide",
      icon: "fa-light fa-ellipsis",
    },
    link: {
      // name: "Link",
      icon: "fa-light fa-link",
      items: {
        "link-1": {
          type: "text",
          events: {
            keyup: function (e) {
              // add some fancy key handling here?
              let link_tag = document.getElementsByName("context-menu-input-link-1");
              if (e.keyCode == 13 && link_tag[1].value) {
                console.log(range);
                //selectedNode = JSON.parse(localStorage.getItem("selection"));
                console.log("link enter");
                // getting link
                // line number 가져오기
                let url = link_tag[1].value;
                let id = randomId();
                console.log(url);

                // add to a tag
                var select = document.querySelector(".selected");
                // select.wrap(
                //     `<a id="${id}" url = "${url}" class="link" href="javascript:void(0);" onclick="openLink(this)"></a>`
                //   );
                $(".selected").wrap(
                  `<a id="${id}" url = "${url}" class="link" href="javascript:void(0);" onclick="openLink(this)"></a>`
                );
                select.classList.remove("selected");
                // select.addEventListener("hover", removeLinkTag) ;

                // cache에 store하기
                if (ref_data != null) {
                  console.log("addLink");
                  addLink(start_index, end_index, line, url, id);
                  console.log(ref_data);
                }

                // removeEventListener하기
                var inputs = document.getElementsByName("context-menu-input-link-1");
                Array.from(inputs).map((input) => {
                  input.removeEventListener("mousedown", createFakeSelection);
                  input.removeEventListener("blur", removeFakeSelection);
                });
                flag = 0;
                console.log("fisrtst");
                $(".context-menu-list").trigger("contextmenu:hide");
              }
            },
          },
        },
      },
    },
  },
  events: {
    hide: function (e) {
      var inputs = document.getElementsByName("context-menu-input-link-1");
      Array.from(inputs).map((input) => {
        input.removeEventListener("mousedown", createFakeSelection);
        input.removeEventListener("blur", removeFakeSelection);
      });
      if (flag) {
        removeFakeSelection();
      }
      // const code = document.querySelector("#code");
      // document.getSelection().removeAllRanges();
      console.log("hide");
    },
    show: function (e) {
      // show
      var inputs = document.getElementsByName("context-menu-input-link-1");
      Array.from(inputs).map((input) => {
        input.addEventListener("mousedown", createFakeSelection);
        input.addEventListener("blur", removeFakeSelection);
      });
      // const code = document.querySelector("#code");
      range = saveSelection();

      // line, start index, end index를 구함
      var tdNode = getTD(range.commonAncestorContainer);
      console.log(tdNode);
      line = tdNode.getAttribute("data-line-number");
      start_index = findOffset(range.startContainer, range.startOffset);
      end_index = findOffset(range.endContainer, range.endOffset);
      console.log(start_index);
      console.log(end_index);
    },
  },
});

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}
