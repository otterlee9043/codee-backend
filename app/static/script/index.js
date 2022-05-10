window.addEventListener("load", async function () {
  // addMenuClass() ;
  const pre = document.querySelector("pre");
  const classes = pre.classList;
  if (classes.contains("context-menu-one")) {
    ref_data = await readCodee();
    console.log(JSON.stringify(ref_data));
    hideLine();
    ref_data[0].data.map((deco) => {
      console.log(deco);
      const s = deco.start;
      const e = deco.end;
      const n = Math.abs(s - e) + 1;
      const i = deco.id;
      selectedInfo.push({ start: s, number: n, id: i });
      console.log(selectedInfo);
      let line = document.querySelector(`#L${s}`);
      console.log(line);
      createEllipsisNode(line);
      for (let i = 0; i < n; i++) {
        line.classList.add("hidden");
        line = line.nextElementSibling;
      }
    });
  }
  openDirectoryTree();
});

const code = document.querySelector("code");
let lineSelected = false;
let start = -1;
let end = -1;
let selectedInfo = [];
let ref_data = null;
const tbody = document.querySelector("tbody");

const FRAGMENT = {
  FALSE: -1,
  HEAD: 0,
  CENTER: 1,
  TAIL: 2,
};

const NODE = {
  SPAN: 0,
  TEXT: 1,
};
// Problem 1
// fragment 속성 값은 가장 상위 노드에 설정? 해당 노드에 설정?

var fragment = null;
function saveSelection() {
  if (window.getSelection) {
    const selection = window.getSelection();
    if (selection.getRangeAt && selection.rangeCount) {
      return selection.getRangeAt(0);
    }
  } else if (document.selection && document.selection.createRange) {
    return document.selection.createRange();
  }
  return null;
}

function saveRangeEvent(event) {
  range = saveSelection();
  if (range && !range.collapsed) {
    fragment = range.cloneContents();
  }
}

window.addEventListener("mouseup", saveRangeEvent);
window.addEventListener("keyup", saveRangeEvent);

function isString(inputText) {
  if (typeof inputText === "string" || inputText instanceof String) return true;
  else return false;
}

function compare(a, b) {
  const num1 = parseInt(a.querySelector(".lineNumber span").innerText);
  const num2 = parseInt(b.querySelector(".lineNumber span").innerText);
  return num1 - num2;
}

function expand(lineId, number) {
  let firstLine = document.querySelector(`.hidden#${lineId}`);
  firstLine.previousSibling.remove();
  for (let i = 0; i < number; i++) {
    firstLine.classList.remove("hidden");
    firstLine = firstLine.nextSibling;
  }
}

function createEllipsisNode(line) {
  let ellipsisLine = line.cloneNode(true);
  console.log(ellipsisLine);
  ellipsisLine.firstChild.classList.remove("selecting");
  const lnNumber = ellipsisLine.querySelector(".hljs-ln-numbers div");
  lnNumber.setAttribute("data-line-number", ""); // <span1>
  const ellipsisBtn = document.createElement("span");
  ellipsisBtn.classList.add("ellipsis");
  ellipsisBtn.innerText = "⋯";
  lnNumber.appendChild(ellipsisBtn);
  ellipsisLine.querySelector(".hljs-ln-code").innerText = ""; // <span2>
  ellipsisLine.addEventListener("click", () => {
    const info = selectedInfo.find((item) => `L${item.start}` === ellipsisLine.id);
    const lineId = `L${info.start}`;
    const number = info.number;
    const ID = info.id;
    // console.log(ref_data[0]) ;
    deleteLineHide(ID);
    // console.log(ref_data[0]) ;
    expand(lineId, number);
    const lineNumber = parseInt(lineId.replace(/[^0-9]/g, ""));
    selectedInfo = selectedInfo.filter((item) => {
      return lineNumber !== item.start;
    });
  });
  line.before(ellipsisLine);
  return ellipsisLine;
}

function hideLine() {
  const numbers = document.querySelectorAll(".hljs-ln-numbers");
  //console.log(numbers);
  Array.from(numbers).map((item, index) => {
    const number = parseInt(item.getAttribute("data-line-number"));
    item.parentElement.id = `L${number}`;
    item.addEventListener("click", (event) => {
      console.log(number);
      if (!lineSelected) {
        start = number;
        item.classList.add("selecting");
      } else {
        end = number;
        let numberLinesSelected = Math.abs(start - end) + 1;
        start = Math.min(start, end);
        selectedInfo = selectedInfo.filter((item) => {
          // contained = 숨길 lines 중에 이미 숨김된 line이 있는지
          const contained = start < item.start && start + numberLinesSelected - 1 > item.start;
          if (contained) {
            expand(`L${String(item.start)}`, item.number);
          }
          return !contained;
        });
        const ID = randomId();
        selectedInfo.push({ start: start, number: numberLinesSelected, id: ID });
        console.log(selectedInfo);
        let line = document.querySelector(`#L${start}`);
        console.log(line);
        createEllipsisNode(line);

        for (let i = 0; i < numberLinesSelected; i++) {
          line.classList.add("hidden");
          line = line.nextElementSibling;
        }
        Array.from(numbers).map((number) => {
          number.classList.remove("selecting");
        });
        console.log(JSON.stringify(ref_data));
        if (ref_data != null) {
          // ref_data[0]['data'].push({"type" : "line_hide", "start" : start, "end" : end, "id" : ID}) ;
          console.log(start);
          addLineHide(start, end, ID);
          console.log(JSON.stringify(ref_data[0]));
        }
      }
      lineSelected = !lineSelected;
    });
  });
}

// code.addEventListener("mouseup", selectText, false);

// function splitText(textNode, text, start, same = false) {
function splitText(textNode, index, textLength, start, same = false) {
  const fullText = textNode.nodeValue;
  text = start ? fullText.substring(index, index + textLength) : fullText.substring(0, index);
  const span = document.createElement("span");
  span.innerText = textNode.nodeValue;
  textNode.replaceWith(span);
  return splitSpan(span, index, textLength, start, same);
}

function splitSpan(span, index, textLength, start, same = false) {
  const fullText = span.innerText;
  const span2 = span.cloneNode(false);
  let span3;
  const text = start ? fullText.substring(index, index + textLength) : fullText.substring(0, index);
  if (same) {
    if (fullText === text) {
      // split 하지 않는 경우
      //return fragmented(FALSE, span);
      return [FRAGMENT.FALSE, span];
    }
    span.after(span2);
    if (index === 0) {
      // text가 마지막 부분
      span.innerText = text;
      span2.innerText = fullText.substring(text.length, fullText.length);
      return [FRAGMENT.HEAD, span];
    } else if (index === fullText.length - text.length) {
      // text가 첫번째 부분
      span.innerText = fullText.substring(0, index);
      span2.innerText = text;
      return [FRAGMENT.TAIL, span2];
    } else {
      // text가 가운데 부분
      span3 = span.cloneNode(false);
      span.innerText = fullText.substring(0, index);
      span2.innerText = text;
      span3.innerText = fullText.substring(index + text.length, fullText.length);
      span2.after(span3);
      //return fragmented(CENTER, span2);
      return [FRAGMENT.CENTER, span2];
    }
  } else {
    if (fullText === text) {
      // split 하지 않는 경우
      //return fragmented(FALSE, span);
      return [FRAGMENT.FALSE, span];
    }
    span.after(span2);
    if (start) {
      //const span2 = span.cloneNode("span");
      span.innerText = fullText.substring(0, index);
      span2.innerText = text;
      console.log(span.innerText);
      console.log(span2.innerText);
    } else {
      span.innerText = text;
      span2.innerText = fullText.substring(text.length, fullText.length);
    }
  }

  console.log("span >", span);
  console.log("span2 >", span2);
  //return start ? fragmented(TAIL, span2) : fragmented(HEAD, span);
  return start ? [FRAGMENT.TAIL, span2] : [FRAGMENT.HEAD, span];
}

function bindTags(startNode, endNode) {
  const newSpan = document.createElement("span");
  let node = startNode;
  let prev_node;
  startNode.before(newSpan);
  if (endNode) {
    while (endNode.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING) {
      prev_node = node;
      node = node.nextSibling;
      newSpan.appendChild(prev_node);
    }
    // endNode의 상위노드가 존재한다면 while문에서 이동해버림
    if (endNode.parentElement.tagName !== "SPAN") newSpan.appendChild(endNode);
  } else {
    newSpan.appendChild(startNode);
  }

  return newSpan;
}

function ellipsisSpan(newSpan) {
  const ellipsisButton = document.createElement("span");
  ellipsisButton.innerText = "⋯";
  ellipsisButton.classList.add("ellipsis");
  ellipsisButton.addEventListener("click", () => {
    newSpan.classList.remove("hidden");
    ellipsisButton.remove();
    const children = [];
    while (newSpan.firstChild) {
      const child = newSpan.firstChild;
      children.push(child);
      // console.log(child);
      newSpan.parentNode.insertBefore(child, newSpan);
    }
    console.log();
    newSpan.remove();
    Array.from(children).map((node) => {
      merge(node);
    });
    // merge(newSpan);
  });
  newSpan.before(ellipsisButton);
  newSpan.classList.add("hidden");
}

function nodeType(element) {
  if (element.parentElement.tagName == "TD") {
    return NODE.TEXT;
  } else if (element.parentElement.tagName == "SPAN") {
    if (element.parentElement.childNodes.length >= 2) {
      // span 안에 있는 text 노드 (innerText가 아닌)
      return NODE.TEXT;
    } else {
      return NODE.SPAN;
    }
  }
}

function createNewSpan(selectionText) {
  console.log(selectionText);
  // console.log(selectionText.toString());
  if (selectionText.toString() === "") {
    return;
  }

  let selectedFirst = selectionText.anchorNode;
  let selectedLast = selectionText.focusNode;
  let firstOffset = selectionText.anchorOffset;
  let lastOffset = selectionText.focusOffset;
  // selectionText.removeAllRanges();
  let anchorTagType = selectedFirst.parentElement.tagName;
  let focusTagType = selectedLast.parentElement.tagName;
  const parent = selectedFirst.parentElement.closest("td");
  // console.log("parent> ", parent);
  // console.log("selectedFirst >", selectedFirst);
  let startNode, endNode;

  const cutSpan = document.createElement("span");
  let fragmented;
  cutSpan.textContent = "✂️";

  if (selectedFirst.compareDocumentPosition(selectedLast) & Node.DOCUMENT_POSITION_PRECEDING) {
    [selectedFirst, selectedLast] = [selectedLast, selectedFirst];
    [firstOffset, lastOffset] = [lastOffset, firstOffset];
    [anchorTagType, focusTagType] = [focusTagType, anchorTagType];
  } else if (selectedFirst === selectedLast) {
    // 아예 같은 노드
    if (lastOffset < firstOffset) [firstOffset, lastOffset] = [lastOffset, firstOffset];

    // const textLength = selectedFirst.nodeValue.substring(firstOffset, selectedFirst.nodeValue.length).length;
    // if (nodeType(selectedFirst) == NODE.TEXT) {
    //   [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true);
    //   // startNode = splitNode(selectedFirst, firstOffset, textLength, true);
    // } else if (nodeType(selectedFirst) == NODE.SPAN) {
    //   [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true);
    // }
    // startNode.parentElement.insertBefore(cutSpan, startNode);
    // const start = splitTree(cutSpan, Position.START, true);

    // selectedLast = startNode.firstChild;
    // console.log(selectedLast.nodeValue);

    // const textLength2 = selectedLast.nodeValue.substring(
    //   0,
    //   selectedLast.nodeValue.length - firstOffset
    // ).length;
    // console.log(textLength, textLength2);
    // if (nodeType(selectedLast) == NODE.TEXT) {
    //   [fragmented, endNode] = splitText(selectedLast, 0, textLength2, true);
    // } else if (nodeType(selectedLast) == NODE.SPAN) {
    //   [fragmented, endNode] = splitSpan(selectedLast.parentElement, 0, textLength2, true);
    // }
    // endNode.parentElement.insertBefore(cutSpan, endNode.nextSibling);
    // const end = splitTree(cutSpan, Position.END, true);

    // const newSpan = bindTags(start, end);
    // return newSpan;

    const textLength = selectedFirst.nodeValue.substring(firstOffset, lastOffset).length;
    let start, end;
    if (nodeType(selectedFirst) == NODE.TEXT) {
      [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true, true);
    } else {
      [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true, true);
    }
    if (fragmented === FRAGMENT.HEAD) startNode.parentElement.insertBefore(cutSpan, startNode.nextSibling);
    else {
      startNode.parentElement.insertBefore(cutSpan, startNode);
      start = splitTree(cutSpan, Position.START, true);
      console.log(start);
      startNode.parentElement.insertBefore(cutSpan, startNode.nextSibling);
      end = splitTree(cutSpan, Position.END, true);
      console.log(end);
    }

    const newSpan = bindTags(end, null);
    return newSpan;
  }

  const textLength = selectedFirst.nodeValue.substring(firstOffset, selectedFirst.nodeValue.length).length;
  if (nodeType(selectedFirst) == NODE.TEXT) {
    [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true);
    // startNode = splitNode(selectedFirst, firstOffset, textLength, true);
  } else if (nodeType(selectedFirst) == NODE.SPAN) {
    [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true);
  }
  startNode.parentElement.insertBefore(cutSpan, startNode);
  const start = splitTree(cutSpan, Position.START, true);
  // startNode = startNode.closest("td>span");
  // startNode.setAttribute("fragmented", fragmented);

  const textLength2 = selectedLast.nodeValue.substring(lastOffset, selectedLast.nodeValue.length).length;
  if (nodeType(selectedLast) == NODE.TEXT) {
    [fragmented, endNode] = splitText(selectedLast, lastOffset, textLength2, false);
  } else if (nodeType(selectedLast) == NODE.SPAN) {
    [fragmented, endNode] = splitSpan(selectedLast.parentElement, lastOffset, textLength2, false);
  }
  endNode.parentElement.insertBefore(cutSpan, endNode.nextSibling);
  const end = splitTree(cutSpan, Position.END, true);
  // endNode = endNode.closest("td>span");
  // endNode.setAttribute("fragmented", fragmented);

  const newSpan = bindTags(start, end);
  return newSpan;
}

function hideText() {
  var selectionText;
  if (document.getSelection) {
    selectionText = document.getSelection();
    console.log(selectionText);
    if (!isString(selectionText.anchorNode.nodeValue) || !isString(selectionText.focusNode.nodeValue)) {
      console.log("NOT STRING!!");
      return;
    }
    const collection = createNewSpan(selectionText);
    // collection.id = randomId();
    //if (selectionText.anchorNode === selectionText.focusNode) ellipsisSpan(collection);

    ellipsisSpan(collection);
  } else if (document.selection) {
    console.log("2");
    selectionText = document.selection.createRange().text;
  }
  selectionText.removeAllRanges();
}

const Position = {
  START: 0,
  END: 1,
};

function splitNode(node, index, length, start, same = false) {
  if (nodeType(node) == NODE.TEXT) {
    const fullText = node.nodeValue;
    console.log(fullText);
    text = start ? fullText.substring(index, index + length) : fullText.substring(0, index);
    console.log(text);
    const span = document.createElement("span");
    if (fullText === text) {
      span.innerText = text;
      node.before(span);
      node.remove();
    }
    if (index === 0) {
      span.innerText = text;
      //span2.innerText = fullText.substring(text.length, fullText.length);
      node.nodeValue = fullText.substring(text.length, fullText.length);
      //node.before(fragmented(HEAD, span));
      node.before(span);
    } else if (index === fullText.length - text.length) {
      //span1.innerText = fullText.substring(0, index);
      node.nodeValue = fullText.substring(0, index);
      span.innerText = text;
      node.after(span);
    } else {
      const node2 = document.createTextNode(fullText.substring(0, index));
      span.innerText = text;
      node2.nodeValue = fullText.substring(index + text.length, fullText.length);
      node.after(span);
      span.after(node2);
    }
    return span;
  } else {
  }
}
function splitTree(cutElement, position, split) {
  const bound = cutElement.parentElement.closest("td");
  let parent, right, grandparent;
  let node = position === Position.START ? cutElement.nextSibling : cutElement.previousSibling;
  if (node.hasAttribute("fragmented")) {
    // TAIL이었으면 CENTER
    node.setAttribute("fragmented", FRAGMENT.CENTER);
  } else {
    if (split) node.setAttribute("fragmented", position === Position.START ? FRAGMENT.TAIL : FRAGMENT.HEAD);
    else node.setAttribute("fragmented", FRAGMENT.FALSE);
  }

  for (parent = cutElement.parentNode; parent != bound; parent = grandparent) {
    right = parent.cloneNode(false); // parent node를 right로 복사
    while (cutElement.nextSibling) right.appendChild(cutElement.nextSibling); // cut 뒤에 오는 element들을 right에 append
    grandparent = parent.parentNode;
    grandparent.insertBefore(right, parent.nextSibling); // parent 뒤에 right를 삽입
    grandparent.insertBefore(cutElement, right); // right 앞에 cutElement 삽입
    node = position === Position.START ? right : parent;
    if (node.hasAttribute("fragmented")) node.setAttribute("fragmented", FRAGMENT.CENTER);
    else node.setAttribute("fragmented", position === Position.START ? FRAGMENT.TAIL : FRAGMENT.HEAD);
  }
  if (parent === bound) {
    right = cutElement.nextSibling;
    parent = cutElement.previousSibling;
  }
  cutElement.remove();
  return position === Position.START ? right : parent;
}

function merge(wrapper) {
  if (wrapper.nodeType === Node.TEXT_NODE) return;
  if (!wrapper.hasAttribute("fragmented")) return;

  // console.log(listToMerge);
  const type = parseInt(wrapper.getAttribute("fragmented"));
  let node, prevNode, nextNode;
  console.log(wrapper.childNodes);
  if (wrapper.childNodes.length == 1) {
    switch (type) {
      case FRAGMENT.FALSE:
        if (wrapper.nodeType === Node.ELEMENT_NODE) {
          wrapper.removeAttribute("fragmented");
        } else {
          const textNode = document.createTextNode(wrapper.innerText);
          wrapper.parent.insertBefore(textNode, wrapper);
          wrapper.remove();
        }
        break;
      case FRAGMENT.HEAD: //endNode, nextSibling과 이어야
        node = wrapper;
        let nextNode = wrapper.nextSibling;
        if (node.className === "") {
          node.innerText = node.innerText + nextNode.innerText;
          const text = document.createTextNode(node.innerText);
          node.replaceWith(text);
        } else {
          node.innerText = node.innerText + nextNode.innerText;
          node.removeAttribute("fragmented");
        }
        nextNode.remove();

        break;
      case FRAGMENT.CENTER:
        node = wrapper;
        prevNode = node.previousSibling;
        nextNode = node.nextSibling;

        if (node.className === "") {
          node.innerText = prevNode.innerText + node.innerText + nextNode.innerText;
          const text = document.createTextNode(node.innerText);
          node.replaceWith(text);
        } else {
          node.innerText = prevNode.innerText + node.innerText + nextNode.innerText;
        }
        // nextSibling에 firstChild 뒤에 다른 node들이 있는 경우는 처리가 안됨.

        nextNode.remove();
        prevNode.remove();
        node.removeAttribute("fragmented");
        break;
      case FRAGMENT.TAIL: //startNode, previousSibling과 이어야 함
        node = wrapper;
        let prevNode = wrapper.previousSibling;
        if (node.className === "") {
          // split하느라 span에 감싸진 text node
          node.innerText = prevNode.innerText + node.innerText;
          const text = document.createTextNode(node.innerText);
          node.replaceWith(text);
        } else {
          node.innerText = prevNode.innerText + node.innerText;
        }
        node.removeAttribute("fragmented");
        prevNode.remove();
        break;
    }
  } else {
    let node, prevNode, nextNode;
    let nodes = [];
    switch (type) {
      case FRAGMENT.FALSE:
        if (wrapper.nodeType === Node.ELEMENT_NODE) {
          wrapper.removeAttribute("fragmented");
        } else {
          const textNode = document.createTextNode(wrapper.innerText);
          wrapper.parent.insertBefore(textNode, wrapper);
          wrapper.remove();
        }
        break;
      case FRAGMENT.HEAD: //endNode, nextSibling과 이어야
        node = wrapper;
        nextNode = wrapper.nextSibling;
        /// ********** merge Call
        while (nextNode.firstChild) {
          nodes.push(nextNode.firstChild);
          node.appendChild(nextNode.firstChild);
        }
        Array.from(nodes).map((node) => {
          merge(node);
        });
        nextNode.remove();
        node.removeAttribute("fragmented");
        break;
      case FRAGMENT.CENTER:
        node = wrapper;
        prevNode = node.previousSibling;
        nextNode = node.nextSibling;

        while (node.firstChild) {
          nodes.push(node.firstChild);
          prevNode.appendChild(node.firstChild);
        }

        while (nextNode.firstChild) {
          prevNode.appendChild(nextNode.firstChild);
        }
        nextNode.remove();
        node.remove();
        // node.removeAttribute("fragmented");
        Array.from(nodes).map((node) => {
          merge(node);
        });
        break;
      case FRAGMENT.TAIL: //startNode, previousSibling과 이어야 함
        node = wrapper;
        prevNode = wrapper.previousSibling;
        while (node.firstChild) {
          nodes.push(node.firstChild);
          prevNode.appendChild(node.firstChild);
        }

        Array.from(nodes).map((node) => {
          merge(node);
        });

        // node.removeAttribute("fragmented");
        // prevNode.remove();
        node.remove();
        break;
    }
  }
}
