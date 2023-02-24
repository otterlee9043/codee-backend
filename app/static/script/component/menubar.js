let menu = document.querySelector(".context-menu-one");
let line;
let start_index;
let end_index;

console.log(menu);

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

function restoreSelection() {
  if (flag) {
    console.log("restoreSelection");
    let tdTag = document.querySelector(`#L${line} > .hljs-ln-code`);
    let startTag = findOffsetTag(tdTag, start_index);
    console.log(startTag) ;
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

function getLineNumber(span){
  return getTD(span).getAttribute("data-line-number");
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
    restoreSelection();
  }
  console.log(range);
  flag = 0;
}


function openLink(e) {
  console.log("click link");
  url = e.getAttribute("url");
  window.open(url, "_blank").focus();
}

function deactivateClickEvent(){
  var inputs = document.getElementsByName("context-menu-input-link-1");
  Array.from(inputs).map((input) => {
    input.removeEventListener("mousedown", createFakeSelection);
    input.removeEventListener("blur", removeFakeSelection);
  });
}

$(document).on('click', '.context-menu-submenu input', function (e) {
  console.log("~~~~~~)))");
});


$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  autoHide: false,
  delay: 500,
  selectableSubMenu: true,
  position: function (opt, x, y) {
  },
  callback: function (key, opt, e) {
    var m = "clicked: " + key + " " + opt;
    console.log(m);
    const selection = document.getSelection();
    let span = createNewSpan(selection);
    const [start, end] = getIndices(span);
    const line = getLineNumber(span);
    const ID = randomId();
    span.id = ID;
    
    switch(key) {
      case "comment":
        break;
      case "red":
        span.classList.add("red");
        addWordHighlight(start, end, line, ID, "red");
        registerCommentEvent("", span, ID, "highlight");
        break;
      case "yellow":
        span.classList.add("yellow");
        addWordHighlight(start, end, line, ID, "yellow");
        registerCommentEvent("", span, ID, "highlight");
        break;
      case "green":
        span.classList.add("green");
        addWordHighlight(start, end, line, "green", ID);
        registerCommentEvent("", span, ID, "highlight");
        break;
      case "hide":
        ellipsisSpan(span) ;
        addWordHide(start, end, line, ID);  
        break;
      case "link":
        console.log("link");
        span = createNewSpan(selection);
        break;
    }
    selection.removeAllRanges();
  },
  items: {
    comment: {
      icon: "fa-light fa-comment-dots",
      autoHide: false,
      items: {
        "comment-input": {
          type: "text",
          autoHide: false,
          selectableSubMenu: true,
          events: {
            click: function(e){
              e.preventDefault();
            },
            keyup: function (e) { // 키보드가 입력되면 발생
              const comment = $('[name="context-menu-input-comment-input"]').val();
              if (e.keyCode == 13 && comment) { 
                drawComment({
                  selected: $(".selected"),
                  comment: comment,
                  id: randomId()
                });
                if (ref_data != null)
                  addWordComment(start, end, line, comment, id);
                
                deactivateClickEvent();
                
                flag = 0;
              }
            },
          },
        },
      },
    },
    comment2: {
      icon: "fa-solid fa-align-justify",
      autoHide: false,
      items: {
        "comment2-input": {
          type: "textarea",
          events: {
            keyup: function (e) {
              console.log("items > comment2 > items > 'link-1' > events");
              const comment = $('[name="context-menu-input-comment2-input"]');
              console.log("comment ", comment);
              if (e.keyCode == 13 && inputs[1].value) {  
                drawComment2({
                  selected: $(".selected"),
                  comment: inputs[1].value,
                  id: ID
                }, true);
                if (ref_data != null)
                  addWordComment2(start, end, line, comment, ID);
              
                deactivateClickEvent();
                flag = 0;
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
          },
        },
        "add": {
          name: "<a class='button right'>save</a>",
          isHtmlName: true,
        }
      },
    },
    highlight: {
      icon: "fa-light fa-highlighter",
      autoHide: true,
      items: {
        red: {
          icon: "fa-solid fa-circle",
        },
        yellow: {
          icon: "fa-solid fa-circle",
        },
        green: {
          icon: "fa-solid fa-circle",
        },
      },
    },
    hide: {
      icon: "fa-light fa-ellipsis",
    },
    link: {
      icon: "fa-light fa-link",
      autoHide: true,
      items: {
        "link-input": {
          type: "text",
          id: "link-input",
          events: {
            keyup: function (e) {
              console.log("items > link > items > 'link-1' > events")
              let link_tag = document.getElementsByName("context-menu-input-link-input");
              if (e.keyCode == 13 && link_tag[2].value) {
                let url = link_tag[2].value;
                const data = {
                  selected: $(".selected"),
                  url: url,
                  id: ID
                };
                drawLink(data);
                deactivateClickEvent();
                
                if(ref_data != null){
                  addLink(start, end, line, url, ID);
                }
                flag = 0;
                // $(".context-menu-list").trigger("contextmenu:hide");
              }
            },
          },
        },
      },
    },
  },
  events: {
    hide: function (e) {
      deactivateClickEvent();
      if (flag) {
        removeFakeSelection();
      }
      document.getSelection().removeAllRanges();
    },
    show: function (e) {
      console.log("events > show, ", e);
      deactivateClickEvent();
      range = saveSelection();
      // createFakeSe
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

function wrapTdtag(span){
  const td = span.closest("td");
  const div = $('<div>', {
    class: "col"
  });
  td.before(div);
  div.append(td);
  return div;
}


// function addComment(e, x, y, comment) {
//   let id = randomId();
//   console.log(id);
//   var select = document.querySelector(".selected");
//   select.classList.remove("selected");
//   select.classList.add("comment-underline");
//   registerCommentEvent(comment, select, id, "comment");

//   // const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
//   // const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;

//   const input = document.getElementsByName("context-menu-input-link-1")[0];
//   input.removeEventListener("blur", removeFakeSelection);

//   var tdNode = getTD(select);
//   const line = tdNode.getAttribute("data-line-number");
//   const [start, end] = getIndices(select);
//   // select.id = id;
//   addWordComment(start, end, line, comment, id);
// }

// function addComment2(comment) {
//   let id = randomId();
//   console.log(id);
//   var select = document.querySelector(".selected");
//   select.classList.remove("selected");


//   select.classList.add("comment-embed");
//   // registerCommentEvent(comment, select, id, "comment-embed");
//   embedComment(comment, select, id)

//   const input = document.getElementsByName("context-menu-input-link-1")[1];
//   input.removeEventListener("blur", removeFakeSelection);

//   var tdNode = getTD(select);
//   const line = tdNode.getAttribute("data-line-number");
//   const [start, end] = getIndices(select);
//   // select.id = id;
//   addWordComment2(start, end, line, comment, id);
// }


