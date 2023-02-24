function getIndices(newSpan) {
  let start = 0,
    end;
  //   console.log(newSpan);
  const nodes = newSpan.parentElement.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    if (newSpan.compareDocumentPosition(nodes[i]) & Node.DOCUMENT_POSITION_PRECEDING) {
      if (nodes[i].nodeType === Node.ELEMENT_NODE) start += nodes[i].innerText.length;
      else if (nodes[i].nodeType === Node.TEXT_NODE) start += nodes[i].nodeValue.length;
      else {
        console.log("Another node type!");
        break;
      }
    } else break;
  }
  end = start + newSpan.innerText.length;
  return [start, end];
}
