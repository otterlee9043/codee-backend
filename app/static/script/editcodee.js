function addLineHide(start, end, id) {
  refData[id] = { type: "line_hide", start: start, end: end };
}

function addLink(start, end, line, url, id) {
  refData[id] = { type: "link", start: start, end: end, line: line, url: url };
}

function addWordComment(start, end, line, comment, id) {
  refData[id] = { type: "comment", start: start, end: end, line: line, comment: comment };
}

function addWordComment2(start, end, line, comment, id) {
  refData[id] = { type: "comment-embedded", start: start, end: end, line: line, comment: comment };
}

function addWordHighlight(color, start, end, line, id) {
  refData[id] = { type: "highlight", color: color, start: start, end: end, line: line };
}

function addWordHide(start, end, line, id) {
  refData[id] = { type: "word_hide", start: start, end: end, line: line };
}

function deleteDeco(id) {
  delete refData[id];
}
