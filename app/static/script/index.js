const code = document.querySelector("code");
let lineSelected = false;
let start = -1;
let end = -1;
let selectedInfo = [];
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
// 문제 1) 연속된 문자가 나오는 경우, overlapping 단어를 잘 찾지 못한다
// --> focusNodeOffset, anchorNodeOffset으로 split할 index 결정하도록 수정
// 문제 2) splitTree 하고 나오서 원래대로 복구하는 코드가 없음
// --> 같은 level끼리 merge되게 하든지, split 되기 전 코드를 백업해놓든지
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
    expand(lineId, number);
    const lineNumber = parseInt(lineId.replace(/[^0-9]/g, ""));
    selectedInfo = selectedInfo.filter((item) => {
      return lineNumber !== item.start;
    });
  });
  line.before(ellipsisLine);
  return ellipsisLine;
}

window.addEventListener("load", function () {
  // addMenuClass() ;
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

        selectedInfo.push({ start: start, number: numberLinesSelected });
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
      }
      lineSelected = !lineSelected;
    });
  });
  openDirectoryTree();
});

// code.addEventListener("mouseup", selectText, false);

// function splitText(textNode, text, start, same = false) {
function splitText(textNode, index, textLength, start, same = false) {
  const fullText = textNode.nodeValue;
  console.log(fullText);
  text = start ? fullText.substring(index, index + textLength) : fullText.substring(0, index);
  console.log(text);
  const span = document.createElement("span");
  //const span2 = document.createElement("span");

  if (same) {
    if (fullText === text) {
      span.innerText = text;
      textNode.before(span);
      textNode.remove();
      // return fragmented(FALSE, span);
      return [FRAGMENT.FALSE, span];
    }
    if (index === 0) {
      span.innerText = text;
      //span2.innerText = fullText.substring(text.length, fullText.length);
      textNode.nodeValue = fullText.substring(text.length, fullText.length);
      //textNode.before(fragmented(HEAD, span));
      textNode.before(span);
    } else if (index === fullText.length - text.length) {
      //span1.innerText = fullText.substring(0, index);
      textNode.nodeValue = fullText.substring(0, index);
      span.innerText = text;
      textNode.after(span);
    } else {
      const textNode2 = document.createTextNode("");
      textNode.nodeValue = fullText.substring(0, index);
      span.innerText = text;
      textNode2.nodeValue = fullText.substring(index + text.length, fullText.length);
      textNode.after(span);
      span.after(textNode2);
      return [FRAGMENT.CENTER, span];
    }
  } else {
    if (fullText === text) {
      span.innerText = text;
      textNode.before(span);
      textNode.remove();
      // return fragmented(FALSE, span);
      return [FRAGMENT.FALSE, span];
    }
    if (start) {
      textNode.nodeValue = fullText.substring(0, index);
      span.innerText = text;
      textNode.after(span);
    } else {
      span.innerText = text;
      textNode.nodeValue = fullText.substring(text.length, fullText.length);
      textNode.before(span);
    }
  }
  return start ? [FRAGMENT.TAIL, span] : [FRAGMENT.HEAD, span];
}

function fragmented(value, element) {
  // 한 element에서 분리된 element일 경우, true
  element.setAttribute("fragmented", value);
  return element;
}

function splitSpan(span, index, textLength, start, same = false) {
  console.log(span);
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

function merge(newSpan) {
  const listToMerge = [];
  while (newSpan.firstChild) {
    const child = newSpan.firstChild;
    console.log(child);
    newSpan.parentNode.insertBefore(child, newSpan);
    if (child.nodeType == Node.TEXT_NODE) continue;
    if (child.hasAttribute("fragmented")) listToMerge.push(child);
  }
  console.log(listToMerge);
  newSpan.parentNode.removeChild(newSpan);
  listToMerge.map((el) => {
    console.log(el);
    const type = parseInt(el.getAttribute("fragmented"));
    if (el.className === "") {
      switch (type) {
        case FRAGMENT.FALSE:
          const textNode = document.createTextNode(el.innerText);
          el.parent.insertBefore(textNode, el);
          el.remove();
          console.log(el.parent);
          break;
        case FRAGMENT.HEAD:
          el.nextSibling.nodeValue = el.innerText + el.nextSibling.nodeValue;
          el.remove();
          break;
        case FRAGMENT.CENTER:
          el.previousSibling.nodeValue += el.innerText + el.nextSibling.nodeValue;
          el.nextSibling.remove();
          el.remove();
          break;
        case FRAGMENT.TAIL:
          el.previousSibling.nodeValue = el.previousSibling.nodeValue + el.innerText;
          el.remove();
          break;
      }
    } else {
      switch (type) {
        case FRAGMENT.FALSE:
          el.removeAttribute("fragmented");
          break;
        case FRAGMENT.HEAD:
          console.log(el.innerText);
          console.log(el.nextSibling.innerText);
          //mergeSpan(el, el.nextSibling);
          el.nextSibling.innerText = el.innerText + el.nextSibling.innerText;
          el.remove();
          break;
        case FRAGMENT.CENTER:
          el.previousSibling.innerText += el.innerText + el.nextSibling.innerText;
          el.nextSibling.remove();
          el.remove();
          break;
        case FRAGMENT.TAIL:
          const el2 = lastChild(el);
          el.previousSibling.innerText += el.innerText;
          el.remove();
          break;
      }
    }
  });
}

function lastChild(element) {
  while (element.lastChild) {
    element = element.lastChild;
  }
  return element;
}

function firstChild(element) {
  while (element.firstChild) {
    element = element.firstChild;
  }
  return element;
}

function mergeSpan(a, b) {
  console.log(getLeafNodes(a));
  console.log(getLeafNodes(b));
}

function getLeafNodes(element) {
  let e;
  for (e = element; e != null; e = e.hasChildNodes());
  return e.parentElement.childNodes;
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
    newSpan.appendChild(endNode);
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
    merge(newSpan);
  });
  newSpan.before(ellipsisButton);
  newSpan.classList.add("hidden");
}

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}

function indexAmongChildren(parent, child) {
  console.log(...parent.childNodes);
  const index = [...parent.childNodes].indexOf(child);
  console.log(index);
  return index;
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
  let anchorTagType = selectedFirst.parentElement.tagName;
  let focusTagType = selectedLast.parentElement.tagName;
  const parent = selectedFirst.parentElement.closest("td");
  // console.log("parent> ", parent);
  // console.log("selectedFirst >", selectedFirst);
  let startNode, endNode;
  const key = randomId();

  const cutSpan = document.createElement("span");
  let fragmented;
  cutSpan.textContent = "✂️";

  if (selectedFirst.compareDocumentPosition(selectedLast) & Node.DOCUMENT_POSITION_PRECEDING) {
    [selectedFirst, selectedLast] = [selectedLast, selectedFirst];
    [firstOffset, lastOffset] = [lastOffset, firstOffset];
    [anchorTagType, focusTagType] = [focusTagType, anchorTagType];
  } else if (selectedFirst === selectedLast) {
    // 아예 같은 노드
    const textLength = selectedFirst.nodeValue.substring(firstOffset, lastOffset).length;
    console.log(textLength);
    if (lastOffset < firstOffset) [firstOffset, lastOffset] = [lastOffset, firstOffset];
    //if (anchorTagType === "TD") {
    if (nodeType(selectedFirst) == NODE.TEXT) {
      [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true, true);
    } else {
      [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true, true);
      if (fragmented === FRAGMENT.HEAD) startNode.parentElement.insertBefore(cutSpan, startNode.nextSibling);
      else startNode.parentElement.insertBefore(cutSpan, startNode);
      splitTree(parent, cutSpan);
      // startNode = startNode.closest("td>span");
    }
    startNode.setAttribute("fragmented", fragmented);
    const newSpan = bindTags(startNode, null);
    //ellipsisSpan(newSpan);
    return newSpan;
  }

  const textLength = selectedFirst.nodeValue.substring(firstOffset, selectedFirst.nodeValue.length).length;
  if (nodeType(selectedFirst) == NODE.TEXT) {
    [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true);
  } else if (nodeType(selectedFirst) == NODE.SPAN) {
    [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true);
  }
  startNode.parentElement.insertBefore(cutSpan, startNode);
  splitTree(parent, cutSpan);
  startNode = startNode.closest("td>span");
  startNode.setAttribute("fragmented", fragmented);
  //console.log("startNode >>", startNode);

  const textLength2 = selectedLast.nodeValue.substring(lastOffset, selectedLast.nodeValue.length).length;
  // if (focusTagType === "TD") {
  if (nodeType(selectedLast) == NODE.TEXT) {
    [fragmented, endNode] = splitText(selectedLast, lastOffset, textLength2, false);
  } else if (nodeType(selectedLast) == NODE.SPAN) {
    [fragmented, endNode] = splitSpan(selectedLast.parentElement, lastOffset, textLength2, false);
  }
  endNode.parentElement.insertBefore(cutSpan, endNode.nextSibling);
  splitTree(parent, cutSpan);
  // endNode = endNode.closest("td>span");
  endNode.setAttribute("fragmented", fragmented);
  //console.log("endNode >>", endNode);

  // startNode.setAttribute("key", key);
  // endNode.setAttribute("key", key);
  const newSpan = bindTags(startNode, endNode);
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
    //if (selectionText.anchorNode === selectionText.focusNode) ellipsisSpan(collection);

    ellipsisSpan(collection);
  } else if (document.selection) {
    console.log("2");
    selectionText = document.selection.createRange().text;
  }
  selectionText.removeAllRanges();
}

function splitTree(bound, cutElement) {
  for (var parent = cutElement.parentNode; bound != parent; parent = grandparent) {
    var right = parent.cloneNode(false); // parent node를 right로 복사
    while (cutElement.nextSibling) right.appendChild(cutElement.nextSibling); // cut 뒤에 오는 element들을 right에 append
    var grandparent = parent.parentNode;
    grandparent.insertBefore(right, parent.nextSibling); // parent 뒤에 right를 삽입
    grandparent.insertBefore(cutElement, right); // right 앞에 cutElement 삽입
  }
  cutElement.remove();
}
