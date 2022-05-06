const menu = document.querySelector(".context-menu-one");
const test = document.querySelector("#code");

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

var fragment = null;
var range = null;
var selected = null;

function saveSelection() {
  if (window.getSelection) {
    selected = window.getSelection();
    if (selected.getRangeAt && selected.rangeCount) {
      return selected.getRangeAt(0);
    } else if (document.selection && document.selection.createRange) {
      return document.selection.createRange();
    }
    return null;
  }
}

function restroeSelection() {
  if (range) {
    console.log("1");
    if (window.getSelection) {
      console.log(range);

      selected = document.getSelection();
      selected.removeAllRanges();
      selected.addRange(range);
    } else if (document.selection && range.select) {
      console.log("3");

      range.select();
    }
  }
}

var flag = 0;
var new_range = null;

// function findChild(node) {
//   if (node.tagName == "SPAN") {
//     return findChild(node.parentNode);
//   }
//   else if (node.tagName == "TD") {
//     for (var i = 0; i < node.childNodes.length; i++) {
//       // if (node.)
//     }
//     return;
//   }
//   console.log(node.parentNode);
// }
function createFakeSelection(event) {
  // create fake selection
  new_range = document.createRange();
  var startoffset = range.startOffset;
  var endoffset = range.endOffset;
  // new_range.setStart(range.startContainer, startoffset) ;
  // new_range.setEnd(range.endContainer, endoffset) ;
  console.log(range.startOffset);
  console.log(range.endOffset);
  console.log(range.startContainer);
  console.log(range);
  // console.log(range.commonAncestorContainer) ;
  // console.log(range.startContainer.parentNode);
  // findChild(range.startContainer.parentNode, );
  if (document.getSelection) {
    var span = createNewSpan(document.getSelection());
    new_range.setStart(range.startContainer, 3);
    new_range.setEnd(range.endContainer, 3);
    console.log(new_range.startOffset);
    console.log(new_range);
    console.log(range.startContainer);
    console.log("imdone");
    span.classList.add("selected");
    flag = 1;
  }
  // 여기서 range가 없어진다.
}

function removeFakeSelection(event) {
  // remove fake selection
  console.log(range);
  if (flag) {
    var select = document.querySelector(".selected");
    select.classList.remove("selected");
    merge(select);
    restroeSelection();
  }

  // var temp = document.createRange();
  // temp.setStart(childs[0], 1);
  // temp.setEnd(childs[0], 1);
  // window.getSelection().addRange(temp);
  flag = 0;
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
    } //else if (key == "highlight") {
    else if (key == "red") {
      console.log("red");
      span = createNewSpan(selection);
      span.classList.add("decoration");
      span.classList.add("red");
    } else if (key == "yellow") {
      console.log("yellow");
      span = createNewSpan(selection);
      span.classList.add("decoration");
      span.classList.add("yellow");
    } else if (key == "green") {
      console.log("green");
      span = createNewSpan(selection);
      span.classList.add("decoration");
      span.classList.add("green");
    } else if (key == "record") {
      console.log("record");
    } else if (key == "hide") {
      span = createNewSpan(selection);
      console.log(span);
      ellipsisSpan(span);
    } else if (key == "link") {
      console.log("link");
      span = createNewSpan(selection);
      console.log("LINK!!!");
      // link 가져와서 tag 만들기
    } else {
      console.log("none");
    }
    const [startIndex, endIndex] = getIndices(span);
    console.log(startIndex, endIndex);
    selection.removeAllRanges();
    // window.console && console.log(m) || alert(m);
  },
  items: {
    comment: {
      // name: "Comment",
      icon: "fa-light fa-comment-dots",
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
              if (e.keyCode == 13) {
                //selectedNode = JSON.parse(localStorage.getItem("selection"));
                console.log("link enter");
                // getting link
                const link = document.getElementsByName("context-menu-input-link-1")[0].value;
                console.log(link);

                // create a tag
                // var a_tag = document.createElement("a");
                // a_tag.classList.add("link");
                // a_tag.href = link;
                // a_tag.setAttribute("id", randomId());
                // a_tag.setAttribute("target", "_blank");

                // add to a tag
                $(".selected").wrap(`<a id="${randomId()}" class="link" href="${link}" target="_blank"></a>`);
                // selected = document.querySelector(".selected") ;
                // selected.wrap(`<a id="${randomId()}" class="link" href="${link} target="_blank"></a>`) ;
                // console.log(selected.toString());
                // a_tag.appendChild(selected);

                // store the lick to local storage
                // sessionStorage.setItem(
                //   a_tag.getAttribute("id"),
                //   JSON.stringify({ line: 1, start: 1, end: 1 })
                // );
              }
            },
          },
        },
      },
    },
  },
  events: {
    hide: function (e) {
      var input = document.getElementsByName("context-menu-input-link-1")[0];
      const code = document.querySelector("#code");

      input.removeEventListener("mousedown", createFakeSelection);
      input.removeEventListener("blur", removeFakeSelection);
      console.log("hide");
    },
    show: function (e) {
      // show
      var input = document.getElementsByName("context-menu-input-link-1")[0];
      const code = document.querySelector("#code");
      console.log("show");

      range = saveSelection();
      console.log(range);
      if (range && !range.collapsed) {
        fragment = range.cloneContents();
      }
      input.addEventListener("mousedown", createFakeSelection);
      // // remove fake selection
      input.addEventListener("blur", removeFakeSelection, true);
    },
  },
});

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}
