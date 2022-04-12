const code = document.querySelector("code");
let lineSelected = false;
let start = -1;
let end = -1;
let selectedInfo = [];
const tbody = document.querySelector("tbody");
const FALSE = -1;
// 기존 element의 ~~ part이다
const HEAD = 0;
const CENTER = 1;
const TAIL = 2;

// 문제 1) 연속된 문자가 나오는 경우, overlapping 단어를 잘 찾지 못한다
// --> focusNodeOffset, anchorNodeOffset으로 split할 index 결정하도록 수정
// 문제 2) splitTree 하고 나오서 원래대로 복구하는 코드가 없음
// --> 같은 level끼리 merge되게 하든지, split 되기 전 코드를 백업해놓든지

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
  // addEventInMenumar() ;
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
});

code.addEventListener("mouseup", selectText, false);

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
      return [FALSE, span];
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
      return [CENTER, span];
    }
  } else {
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
  return start ? [TAIL, span] : [HEAD, span];
  return span;
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
  text = start ? fullText.substring(index, index + textLength) : fullText.substring(0, index);
  if (same) {
    if (fullText === text) {
      // split 하지 않는 경우
      //return fragmented(FALSE, span);
      return [FALSE, span];
    }
    span.after(span2);
    if (index === 0) {
      // text가 마지막 부분
      span.innerText = text;
      span2.innerText = fullText.substring(text.length, fullText.length);
    } else if (index === fullText.length - text.length) {
      // text가 첫번째 부분
      span.innerText = fullText.substring(0, index);
      span2.innerText = text;
    } else {
      // text가 가운데 부분
      span3 = span.cloneNode(false);
      span.innerText = fullText.substring(0, index);
      span2.innerText = text;
      span3.innerText = fullText.substring(index + text.length, fullText.length);
      span2.after(span3);
      //return fragmented(CENTER, span2);
      return [CENTER, span2];
    }
  } else {
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
  return start ? [TAIL, span2] : [HEAD, span];
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
        case FALSE:
          const textNode = document.createTextNode(el.innerText);
          el.parent.insertBefore(textNode, el);
          el.remove();
          console.log(el.parent);
          break;
        case HEAD:
          el.nextSibling.nodeValue = el.innerText + el.nextSibling.nodeValue;
          el.remove();
          break;
        case CENTER:
          el.previousSibling.nodeValue += el.innerText + el.nextSibling.nodeValue;
          el.nextSibling.remove();
          el.remove();
          break;
        case TAIL:
          el.previousSibling.nodeValue = el.previousSibling.nodeValue + el.innerText;
          el.remove();
          break;
      }
    } else {
      switch (type) {
        case FALSE:
          el.removeAttribute("fragmented");
          break;
        case HEAD:
          el.nextSibling.innerText = el.innerText + el.nextSibling.innerText;
          el.remove();
          break;
        case CENTER:
          el.previousSibling.innerText += el.innerText + el.nextSibling.innerText;
          el.nextSibling.remove();
          el.remove();
          break;
        case TAIL:
          el.previousSibling.innerText += el.innerText;
          el.remove();
          break;
      }
    }
  });
}

function ellipsisSpan(startNode, endNode) {
  const ellipsisButton = document.createElement("span");
  ellipsisButton.innerText = "⋯";
  ellipsisButton.classList.add("ellipsis");
  ellipsisButton.addEventListener("click", () => {
    newSpan.classList.remove("hidden");
    ellipsisButton.remove();
    merge(newSpan);
  });

  const newSpan = document.createElement("span");
  newSpan.classList.add("hidden");

  const key = startNode.getAttribute("key");
  let node = startNode;
  let nextNode = startNode.nextSibling;

  startNode.before(newSpan);
  newSpan.appendChild(node);
  if (endNode) {
    while (1) {
      node = nextNode;
      console.log(node);
      if (node.nodeType === 1 && node.getAttribute("key") === key) {
        newSpan.appendChild(node);
        break;
      }
      nextNode = node.nextSibling;
      newSpan.appendChild(node);
    }
  }

  newSpan.before(ellipsisButton);
}

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}

function indexAmongChildren(parent, child) {
  // console.log("children> ", parent.childNodes);
  if (child.parentElement.tagName == "SPAN") child = child.parentElement;
  const children = parent.childNodes;
  for (let i = 0; i < children.length; i++) {
    if (children[i].isEqualNode(child)) return i;
  }
}

function selectText() {
  var selectionText;
  if (document.getSelection) {
    selectionText = document.getSelection();
    console.log(selectionText);
    console.log(selectionText.toString());
    if (selectionText.toString() === "") {
      return;
    }
    //console.log(selectionText);
    // ====================================
    const selectedString = selectionText.toString();

    let selectedFirst = selectionText.anchorNode;
    let selectedLast = selectionText.focusNode;
    let firstOffset = selectionText.anchorOffset;
    let lastOffset = selectionText.focusOffset;
    let anchorTagType = selectedFirst.parentElement.tagName;
    let focusTagType = selectedLast.parentElement.tagName;
    const parent = selectedFirst.parentElement.closest("td");

    let startNode, endNode;
    const key = randomId();

    const cutSpan = document.createElement("span");
    let fragmented;
    cutSpan.textContent = "✂️";
    console.log("parent> ", parent);

    console.log("selectedFirst >", selectedFirst);
    console.log(indexAmongChildren(parent, selectedFirst));
    if (indexAmongChildren(parent, selectedFirst) > indexAmongChildren(parent, selectedLast)) {
      [selectedFirst, selectedLast] = [selectedLast, selectedFirst];
      [firstOffset, lastOffset] = [lastOffset, firstOffset];
      [anchorTagType, focusTagType] = [focusTagType, anchorTagType];
    } else if (indexAmongChildren(parent, selectedFirst) === indexAmongChildren(parent, selectedLast)) {
      const textLength = selectedFirst.nodeValue.substring(firstOffset, lastOffset).length;
      if (lastOffset < firstOffset) [firstOffset, lastOffset] = [lastOffset, firstOffset];
      if (anchorTagType === "TD") {
        console.log(textLength);
        [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true, true);
      } else {
        [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true, true);
        startNode.parentElement.insertBefore(cutSpan, startNode);
        splitTree(parent, cutSpan);
        startNode = startNode.closest("td>span");
      }
      startNode.setAttribute("fragmented", fragmented);
      ellipsisSpan(startNode, null, true);
      return;
    }

    if (!isString(selectedFirst.nodeValue) || !isString(selectedLast.nodeValue)) {
      console.log("NOT STRING!!");
      return;
    }

    const textLength = selectedFirst.nodeValue.substring(firstOffset, selectedFirst.nodeValue.length).length;
    if (anchorTagType === "TD") {
      console.log(textLength);
      [fragmented, startNode] = splitText(selectedFirst, firstOffset, textLength, true);
    } else if (anchorTagType === "SPAN") {
      [fragmented, startNode] = splitSpan(selectedFirst.parentElement, firstOffset, textLength, true);
    }
    startNode.parentElement.insertBefore(cutSpan, startNode);
    splitTree(parent, cutSpan);
    startNode = startNode.closest("td>span");
    startNode.setAttribute("fragmented", fragmented);
    console.log("startNode >>", startNode);

    const textLength2 = selectedLast.nodeValue.substring(lastOffset, selectedLast.nodeValue.length).length;
    if (focusTagType === "TD") {
      [fragmented, endNode] = splitText(selectedLast, lastOffset, textLength2, false);
    } else if (focusTagType === "SPAN") {
      [fragmented, endNode] = splitSpan(selectedLast.parentElement, lastOffset, textLength2, false);
    }
    endNode.parentElement.insertBefore(cutSpan, endNode.nextSibling);
    splitTree(parent, cutSpan);
    endNode = endNode.closest("td>span");
    endNode.setAttribute("fragmented", fragmented);
    console.log("endNode >>", endNode);

    startNode.setAttribute("key", key);
    endNode.setAttribute("key", key);
    ellipsisSpan(startNode, endNode, false);
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
