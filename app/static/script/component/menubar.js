let menu = document.querySelector(".context-menu-one");
let line, startIndex, endIndex;
let range = null;

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
    if (i >= childs.length) break;
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
  let element = document.getSelection();
  let selectedText = element.toString();
  if (selectedText != "") {
    const conMenu = document.querySelector(".context-menu-list.context-menu-root");
    const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
    const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;
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
  let startTag = findOffsetTag(tdTag, startIndex);
  console.log(startTag);
  let endTag = findOffsetTag(tdTag, endIndex);
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
}

function removeFakeSelection(event) {
  let selected = document.querySelector(".selected");
  if (selected !== null) {
    selected.classList.remove("selected");
    const children = [];
    while (selected.firstChild) {
      const child = selected.firstChild;
      children.push(child);
      selected.parentNode.insertBefore(child, selected);
    }
    console.log();
    selected.remove();
    Array.from(children).map((node) => {
      merge(node);
    });
    merge(selected);
    restoreSelection();
  }
}

function openLink(e) {
  console.log("click link");
  url = e.getAttribute("url");
  window.open(url, "_blank").focus();
}

function getTextPosition(span) {
  const [start, end] = getIndices(span);
  const line = parseInt(getTD(span).getAttribute("data-line-number"));
  return {
    start: start,
    end: end,
    line: line,
  };
}

function removeSelectionEvent(inputs) {
  inputs.map((input) => {
    input.removeEventListener("mousedown", createFakeSelection);
    input.removeEventListener("blur", removeFakeSelection);
  });
}

const KEY = {
  ENTER: 13,
};

$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  delay: 500,
  autoHide: false,
  selectableSubMenu: true,
  position: function (opt, x, y) {},
  items: {
    comment: {
      icon: "fa-light fa-comment-dots",
      autoHide: true,
      items: {
        comment: {
          type: "text",
          id: "comment-input",
          events: {
            keyup: function (event) {
              // 키보드가 입력되면 발생
              const inputs = getAll(".context-menu-input input.context-menu-input textarea");
              const input = get("[name=context-menu-input-comment]");
              if (event.keyCode == KEY.ENTER && input.value) {
                addComment(input.value);
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
            mousedown: createFakeSelection,
            blur: removeFakeSelection,
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
        },
      },
      items: {
        comment2: {
          type: "textarea",
          events: {
            mousedown: createFakeSelection,
            blur: removeFakeSelection,
          },
        },
        save: {
          name: "<span class='save button'>save</a>",
          isHtmlName: true,
          className: "button-wrapper",
          callback: function (key, opt, e) {
            createFakeSelection();
            const inputs = getAll(".context-menu-input input, .context-menu-input textarea");
            const input = get("[name=context-menu-input-comment2]");
            if (input.value) {
              addComment2(input.value);
              $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
            }
            removeFakeSelection();
          },
        },
      },
    },
    highlight: {
      icon: "fa-light fa-highlighter",
      autoHide: true,
      items: {
        red: {
          icon: "fa-solid fa-circle",
          callback: () => {
            addHighlight("red");
          },
        },
        yellow: {
          icon: "fa-solid fa-circle",
          callback: () => {
            addHighlight("yellow");
          },
        },
        green: {
          icon: "fa-solid fa-circle",
          callback: () => {
            addHighlight("green");
          },
        },
      },
    },
    hide: {
      icon: "fa-light fa-ellipsis",
      callback: () => {
        const selection = document.getSelection();
        let span = createNewSpan(selection);
        const { start, end, line } = getTextPosition(span);
        const ID = randomId();
        span.id = ID;

        ellipsisSpan(span);
        addWordHide(start, end, line, ID);
      },
    },
    link: {
      icon: "fa-light fa-link",
      autoHide: true,
      items: {
        link: {
          type: "text",
          events: {
            keyup: function (e) {
              console.log("items > link > items > 'link-1' > events");
              const inputs = getAll(".context-menu-input input, .context-menu-input textarea");
              const input = get("[name=context-menu-input-link]");
              if (e.keyCode == KEY.ENTER && input.value) {
                let url = input.value;
                const data = {
                  selected: get(".selected"),
                  url: url,
                  id: randomId(),
                };

                const { start, end, line } = getTextPosition(get(".selected"));
                addLink(start, end, line, url, data.id);

                addLinkTag(data);
                $(".context-menu-list.context-menu-root").trigger("contextmenu:hide");
              }
            },
            mousedown: createFakeSelection,
            blur: removeFakeSelection,
          },
        },
      },
    },
  },
  beforeShow: () => {
    const range = saveSelection();
    return isValidRange(range);
  },
  events: {
    hide: function (e) {
      removeFakeSelection();
      document.getSelection().removeAllRanges();
    },
    show: function (e) {
      const range = saveSelection();
      if (!isValidRange(range)) return false;

      let tdNode = getTD(range.commonAncestorContainer);
      line = tdNode.getAttribute("data-line-number");
      startIndex = findOffset(range.startContainer, range.startOffset);
      endIndex = findOffset(range.endContainer, range.endOffset);
      return true;
    },
  },
});

function isValidRange(range) {
  const nodeName = range.commonAncestorContainer.nodeName;
  return nodeName != null && nodeName != "TBODY";
}

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}

function addComment(comment) {
  let id = randomId();
  let selected = document.querySelector(".selected");
  selected.classList.remove("selected");
  selected.classList.add("comment-underline");
  registerCommentEvent(comment, selected, id, "comment");

  const { start, end, line } = getTextPosition(selected);

  drawComment({
    selected: selected,
    comment: comment,
    id: id,
  });
  addWordComment(start, end, line, comment, id);
}

function addComment2(comment) {
  let id = randomId();
  let selected = document.querySelector(".selected");
  selected.classList.remove("selected");
  selected.classList.add("comment-embed");
  selected.id = id;
  const { start, end, line } = getTextPosition(selected);

  drawComment2({
    selected: selected,
    comment: comment,
    id: id,
  });

  addWordComment2(start, end, line, comment, id);
}

function addHighlight(color) {
  const selection = document.getSelection();
  let selected = createNewSpan(selection);
  const { start, end, line } = getTextPosition(selected);
  const id = randomId();
  selected.id = id;

  drawHighlight({
    selected: selected,
    color: color,
    id: id,
  });
  addWordHighlight(color, start, end, line, id);
}

function embedComment(comment, span, id) {
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
  const line = parseInt(getTD(selected).getAttribute("data-line-number"));
  closeBtn.addEventListener("click", () => {
    deleteDeco(line, commentSpan.id);
    mergeNode(span, commentSpan);
  });
}

function wrapTdtag(span) {
  const td = span.closest("td");
  const div = document.createElement("div");
  div.classList.add("col");
  td.before(div);
  div.appendChild(td);
  return div;
}
