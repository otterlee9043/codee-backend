let menu = document.querySelector(".context-menu-one");
let line, start_index, end_index;
let range = null;

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
  let element = document.getSelection();
  let selectedText = element.toString();
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





function saveSelection() {
  if (window.getSelection) {
    let selection = document.getSelection();
    if (selection.getRangeAt && selection.rangeCount) {
      return selection.getRangeAt(0);
    } else if (document.selection && document.selection.createRange) {
      return document.createRange();
    }
    return null;
  }
}

function restoreSelection() {
  console.log("restoreSelection");
  let tdTag = document.querySelector(`#L${line} > .hljs-ln-code`);
  let startTag = findOffsetTag(tdTag, start_index);
  console.log(startTag) ;
  let endTag = findOffsetTag(tdTag, end_index);
  let newRange = document.createRange();
  newRange.setStart(startTag.tag, startTag.startOffset);
  newRange.setEnd(endTag.tag, endTag.startOffset);
  document.getSelection().removeAllRanges();
  document.getSelection().addRange(newRange);
}


function createFakeSelection(event) {
  let span = createNewSpan(document.getSelection());
  console.log("createFakeSelection", span);
  span.classList.add("selected");
  // console.log(document.getSelection());
  // selected.removeAllRanges() ;
  // 여기서 range가 없어진다.
}

function removeFakeSelection(event) {
  let select = document.querySelector(".selected");
  if (select !== null) {
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
}


function openLink(e) {
  console.log("click link");
  url = e.getAttribute("url");
  window.open(url, "_blank").focus();
}

function getTextPosition(span){
  const [start, end] = getIndices(span);
  const line = getTD(span).getAttribute("data-line-number");
  return {
    start: start,
    end: end,
    line: line
  };
}

function removeSelectionEvent(inputs){
  inputs.map((input) => {
    input.removeEventListener("mousedown", createFakeSelection);
    input.removeEventListener("blur", removeFakeSelection);
  });
}

const KEY = {
  ENTER: 13
}

$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  delay: 500,
  autoHide: false,
  selectableSubMenu: true,
  position: function (opt, x, y) {
  },
  callback: function (key, opt, e) {
    let m = "clicked: " + key + " " + opt;
    console.log(m);
    const selection = document.getSelection();
    let span = createNewSpan(selection);
    const { start, end, line } = getTextPosition(span);
    const ID = randomId();
    span.id = ID;
    
    switch(key) {
      case "comment":
        break;
      case "red":
        span.classList.add("red");
        addWordHighlight("red", start, end, line, ID);
        registerCommentEvent("", span, ID, "highlight");
        break;
      case "yellow":
        span.classList.add("yellow");
        addWordHighlight("yellow", start, end, line, ID);
        registerCommentEvent("", span, ID, "highlight");
        break;
      case "green":
        span.classList.add("green");
        addWordHighlight("green", start, end, line, ID);
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
      autoHide: true,
      items: {
        comment: {
          type: "text",
          id: "comment-input",
          events: {
            keyup: function (e) { // 키보드가 입력되면 발생
              const inputs = getAll('.context-menu-input input.context-menu-input textarea');
              const input = get('[name=context-menu-input-comment]');
              if (e.keyCode == KEY.ENTER && input.value) {
                addComment(input.value);
                removeSelectionEvent(inputs); 
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
            mousedown: createFakeSelection,
            blur: removeFakeSelection
          },
        },
      },
    },
    comment2: {
      icon: "fa-solid fa-align-justify",
      className: "comment2",
      autoHide: false,
      selectableSubMenu: true,
      events: {
        click: (event) => {
          console.log("@@@ mousedown", event);
        }
      },
      items: {
        comment2: {
          type: "textarea",
          events: {
            keyup: function (e) {
              const inputs = getAll('.context-menu-input input, .context-menu-input textarea');
              const input = get('[name=context-menu-input-comment2]');
              if (e.keyCode == KEY.ENTER && input.value) {
                addComment2(input.value); 
                removeSelectionEvent(inputs);
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
            mousedown: createFakeSelection,
            blur: () => {
              removeFakeSelection();
              console.log("blur...");
            }
          },
        },
        save: {
          name: "<span class='save button'>save</a>",
          isHtmlName: true,
          className: "button-wrapper",
          events: {
            "mouseup": function(){
              console.log("please...");
            }
          },
          callback: function (key, opt, e) {
            console.log("callback..!!", e);
          
          }
        }
      },
    },
    highlight: {
      icon: "fa-light fa-highlighter",
      autoHide: true,
      items: {
        red: {
          selector: "#red",
          icon: "fa-solid fa-circle",
          events: {
            click: function (e) {
              console.log("RED~~");
            },
          },
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
      // name: "Hide",
      icon: "fa-light fa-ellipsis",
    },
    link: {
      // name: "Link",
      icon: "fa-light fa-link",
      autoHide: true,
      items: {
        link: {
          type: "text",
          events: {
            keyup: function (e) {
              console.log("items > link > items > 'link-1' > events")
              const inputs = getAll('.context-menu-input input, .context-menu-input textarea');
              const input = get('[name=context-menu-input-link]');
              if (e.keyCode == KEY.ENTER && input.value) {
                let url = input.value;
                const data = {
                  selected: get(".selected"),
                  url: url,
                  id: randomId()
                };
                addLinkTag(data);
                const { start, end, line } = getTextPosition(get(".selected"));
                addLink(start, end, line, url, data.id);
                removeSelectionEvent(inputs);
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
            mousedown: createFakeSelection,
            blur: removeFakeSelection
          },
        },
      },
    },
  },
  
  events: {
    hide: function (e) {
      console.log("events > hide");
      let inputs = getAll('.context-menu-input input, .context-menu-input textarea');
      // removeSelectionEvent(inputs);
      removeFakeSelection();
      // const code = document.querySelector("#code");
      document.getSelection().removeAllRanges();
      // console.log(e);
    },
    show: function (e) {
      // console.log("events > show");
      // console.log(document.getSelection());
      // let inputs = getAll('.context-menu-input input, .context-menu-input textarea');
      // console.log("show > inputs", inputs);
      // Array.from(inputs).map((input) => {
      //   input.addEventListener("mousedown", createFakeSelection);
      //   input.addEventListener("blur", removeFakeSelection);
      // });
      // const code = document.querySelector("#code");
      let firstRange = saveSelection();

      let tdNode = getTD(firstRange.commonAncestorContainer);
      // console.log(tdNode);
      line = tdNode.getAttribute("data-line-number");
      start_index = findOffset(firstRange.startContainer, firstRange.startOffset);
      end_index = findOffset(firstRange.endContainer, firstRange.endOffset);
      // console.log(start_index);
      // console.log(end_index);
    },
  },
});

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}

function addComment(comment) {
  let id = randomId();
  console.log(id);
  let select = document.querySelector(".selected");
  select.classList.remove("selected");
  select.classList.add("comment-underline");
  registerCommentEvent(comment, select, id, "comment");

  let tdNode = getTD(select);
  const line = tdNode.getAttribute("data-line-number");
  const [start, end] = getIndices(select);
  // select.id = id;
  addWordComment(start, end, line, comment, id);
}

function addComment2(comment) {
  let id = randomId();
  console.log(id);
  let select = document.querySelector(".selected");
  select.classList.remove("selected");


  select.classList.add("comment-embed");
  // registerCommentEvent(comment, select, id, "comment-embed");
  embedComment(comment, select, id)

  let tdNode = getTD(select);
  const line = tdNode.getAttribute("data-line-number");
  const [start, end] = getIndices(select);
  // select.id = id;
  addWordComment2(start, end, line, comment, id);
}

function embedComment(comment, span, id){
  const commentSpan = document.createElement("span");
  commentSpan.innerText = comment;
  commentSpan.id = id;
  commentSpan.classList.add("comment-embedded");
  span.closest("td").after(commentSpan);
  const wrapper = wrapTdtag(span);
  wrapper.appendChild(commentSpan);

  const closeBtn = document.createElement("span");
  closeBtn.innerText = "X";
  closeBtn.classList.add("right");

  commentSpan.appendChild(closeBtn);
  closeBtn.addEventListener("click", () => {
    deleteComment2(commentSpan.id);
    // console.log(commentSpan.id);
    // if (type == "comment") {
    //   deleteComment(commentSpan.id);
    // } else if (type == "link") {
    //   deleteLink(id);
    // } else if (type == "highlight") {
    //   deleteHighlight(id);
    // }
    // addContextMenu();


    mergeNode(node, commentSpan);
  });
}

function wrapTdtag(span){
  const td = span.closest("td");
  const div = document.createElement("div");
  div.classList.add("col");
  td.before(div);
  div.appendChild(td);
  return div;
}

function addLinkTag(data) {
  const { selected, url, id } = data;

  const link = document.createElement("a");
  link.id = id;
  link.url = url;
  link.classList.add("link");
  link.href = "javascript:void(0);";

  link.addEventListener("click", openLink); 
  selected.before(link)
  link.appendChild(selected);
  
  console.log(url);
  const linkUrl = new URL(url);
  if(linkUrl.hostname == "www.youtube.com" || linkUrl.hostname == "youtu.be"){
    console.log("youtube");
    const div = wrapTdtag(selected);
    const iframe = $('<iframe>', {
      class: "youtube",
      src: linkUrl.pathname == "/watch"? 
      `https://www.youtube.com/embed/${linkUrl.searchParams.get("v")}` 
      : `https://www.youtube.com/${linkUrl.pathname}`,
    }).appendTo(div);
  }

  // selected.classList.remove("selected");
  registerCommentEvent(url, selected.parentElement, id, "link");

  if (ref_data != null) {
    console.log("addLink");
    addLink(start_index, end_index, line, url, id);
    console.log(ref_data);
  }
}