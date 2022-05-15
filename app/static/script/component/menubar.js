let menu = document.querySelector(".context-menu-one ");
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
function removeContextMenu() {
  menu = document.querySelector(".context-menu-one ");
  menu.removeEventListener("click", addingContextMenu);
}

function addContextMenu() {
  menu = document.querySelector(".context-menu-one ");
  menu.addEventListener("click", addingContextMenu);
}
function addingContextMenu(e) {
  e.preventDefault();
  var element = document.getSelection();
  var selectedText = element.toString();
  if (selectedText != "") {
    const conMenu = document.querySelector(".context-menu-list.context-menu-root");
    const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
    const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;
    console.log(e.clientX);
    console.log(window.innerWidth - 200);
    console.log(x);
    console.log(x + window.scrollX);
    // console.log(`x: ${x}, y: ${y}`) ;
    conMenu.style.top = `${y + window.scrollY + 10}px`;
    conMenu.style.left = `${x + window.scrollX}px`;

    $(".context-menu-one").contextMenu();
  }
}

if (menu != null) {
  menu.addEventListener("click", addingContextMenu);
}

// if (menu != null) {
//   menu.addEventListener("click", function (e) {
//     e.preventDefault();
//     var element = document.getSelection();
//     var selectedText = element.toString();
//     if (selectedText != "") {
//       const conMenu = document.querySelector(".context-menu-list.context-menu-root");
//       const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
//       const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;
//       console.log(e.clientX) ;
//       console.log(window.innerWidth - 200) ;
//       console.log(x) ;
//       console.log(x + window.scrollX ) ;
//       // console.log(`x: ${x}, y: ${y}`) ;
//       conMenu.style.top = `${y + window.scrollY + 10}px`;
//       conMenu.style.left = `${x + window.scrollX}px`;

//       $(".context-menu-one").contextMenu();
//     }
//   });
// }

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

// function openLink(self) {
//   console.log("click link");
//   console.log(self);
//   url = self.getAttribute("url");
//   window.open(url, "_blank").focus();
// }
function openLink(e) {
  console.log("click link");
  url = e.getAttribute("url");
  window.open(url, "_blank").focus();
}

$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  delay: 500,
  autoHide: false,
  position: function (opt, x, y) {
    // console.log(`${x} ${y}`);
  },
  callback: function (key, opt, e) {
    var m = "clicked: " + key + " " + opt;
    console.log(m);
    const selection = document.getSelection();
    let span = createNewSpan(selection);
    const [start, end] = getIndices(span);
    var tdNode = getTD(span);
    line = tdNode.getAttribute("data-line-number");
    const ID = randomId();
    span.id = ID;

    if (key == "comment") {
    } //else if (key == "highlight") {
    else if (key == "red") {
      span.classList.add("red");
      addWordHighlight("red", start, end, line, ID);
      registerCommentEvents("", span, ID, "highlight");
    } else if (key == "yellow") {
      span.classList.add("yellow");
      addWordHighlight("yellow", start, end, line, ID);
      registerCommentEvents("", span, ID, "highlight");
    } else if (key == "green") {
      span.classList.add("green");
      addWordHighlight("green", start, end, line, ID);
      registerCommentEvents("", span, ID, "highlight");
    } else if (key == "hide") {
      ellipsisSpan(span) ;
      addWordHide(start, end, line, ID);
    } else if (key == "link") {
      console.log("link");
      span = createNewSpan(selection);
      console.log("LINK!!!");
    } else {
      console.log("none");
    }
    selection.removeAllRanges();
  },
  items: {
    comment: {
      // name: "Comment",
      icon: "fa-light fa-comment-dots",
      autoHide: true,
      items: {
        "link-1": {
          type: "text",
          events: {
            mouseleave: function(e) {
              $("ul.context-menu-list").trigger("contextmenu:hide");
              console.log("hello") ;
            },
            keyup: function (e) {
              let inputs = document.getElementsByName("context-menu-input-link-1");
              if (e.keyCode == 13 && inputs[0].value) {
                const conMenu = document.querySelector(".context-menu-list.context-menu-root");

                addComment(e, conMenu.style.top, conMenu.style.left, inputs[0].value);

                Array.from(inputs).map((input) => {
                  input.removeEventListener("mousedown", createFakeSelection);
                  input.removeEventListener("blur", removeFakeSelection);
                });
                flag = 0;
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
          },
        },
      },
    },
    highlight: {
      // name: "Highlight",
      icon: "fa-light fa-highlighter",
      autoHide: true,
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
    // record: {
    //   // name: "Record",
    //   icon: "fa-light fa-microphone",
    // },
    hide: {
      // name: "Hide",
      icon: "fa-light fa-ellipsis",
    },
    link: {
      // name: "Link",
      icon: "fa-light fa-link",
      autoHide: true,
      items: {
        "link-1": {
          type: "text",
          events: {
            keyup: function (e) {
              // add some fancy key handling here?
              let link_tag = document.getElementsByName("context-menu-input-link-1");
              if (e.keyCode == 13 && link_tag[1].value) {
                let url = link_tag[1].value;
                const conMenu = document.querySelector(".context-menu-list.context-menu-root");
                addLinkTag(e, conMenu.style.top, conMenu.style.left, url);

                // removeEventListener하기
                var inputs = document.getElementsByName("context-menu-input-link-1");
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

function addComment(e, x, y, comment) {
  let id = randomId();
  console.log(id);
  var select = document.querySelector(".selected");
  select.classList.remove("selected");
  select.classList.add("comment-underline");
  registerCommentEvents(comment, select, id, "comment");

  // const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
  // const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;

  const input = document.getElementsByName("context-menu-input-link-1")[0];
  input.removeEventListener("blur", removeFakeSelection);

  var tdNode = getTD(select);
  const line = tdNode.getAttribute("data-line-number");
  const [start, end] = getIndices(select);
  // select.id = id;
  addWordComment(start, end, line, comment, id);
}

function addLinkTag(e, x, y, url) {
  let id = randomId();
  var select = document.querySelector(".selected");
  $(".selected").wrap(
    `<a id="${id}" url = "${url}" class="link" href="javascript:void(0);" onclick="openLink(this)"></a>`
    // `<a id="${id}" url = "${url}" class="link" href="javascript:void(0);"></a>`

  );
  select.classList.remove("selected");
  registerCommentEvents(url, select.parentElement, id, "link");

  if (ref_data != null) {
    console.log("addLink");
    addLink(start_index, end_index, line, url, id);
    console.log(ref_data);
  }
}