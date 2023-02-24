const settings = {
  objModalPopupBtn: ".modalButton",
  objModalCloseBtn: ".overlay, .closeBtn",
  objModalDataAttr: "data-popup"
}

$(settings.objModalPopupBtn).bind("click", function () {
  if ($(this).attr(settings.objModalDataAttr)) {
    var strDataPopupName = $(this).attr(settings.objModalDataAttr);
    $(".overlay, #" + strDataPopupName).fadeIn();
  }
});

$(settings.objModalCloseBtn).bind("click", function () {
  $('#codee_name').val('');
  $('#codee_path').val('');
  $('#ref_path').val('');
  $(".modal").fadeOut();
});



function drawLineHide(deco) {
  const { start, end, id } = deco;
  const number = Math.abs(start - end) + 1;
  selectedInfo.push({ start: start, number: number, id: id });
  let line = $(`#L${start}`);
  createEllipsisNode(line);
  for (let i = 0; i < number; i++) {
    line.addClass("hidden");
    line = line.next();
  }
}


function drawLink(data, editing) {
  const { selected, url, id } = data;

  const link = $('<a>', {
    id: id,
    url: url,
    class: "link",
    href: "javascript:void(0);"
  });

  link.click(function(){
    openLink(this);
  });

  selected.wrap(link);
  const link_url = new URL(url);
  if(link_url.hostname == "www.youtube.com" || link_url.hostname == "youtu.be"){
    console.log("youtube");
    const div = wrapTdtag(selected);
    const iframe = $('<iframe>', {
      class: "youtube",
      src: link_url.pathname == "/watch"? 
      `https://www.youtube.com/embed/${link_url.searchParams.get("v")}` 
      : `https://www.youtube.com/${link_url.pathname}`,
    }).appendTo(div);
  }

  selected.removeClass("selected");
  registerCommentEvent(url, selected.parent(), id, "link");
}

function drawComment(deco) {
  const { selected, comment, id } = deco;
  selected.addClass("comment-underline");
  console.log(selected);

  registerCommentEvent(comment, selected, id, "comment");
}

function drawComment2(deco) {
  const { selected, comment, id } = deco;
  selected.addClass("comment-embed");
  console.log(selected);

  embedComment(comment, selected, id);
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
    mergeNode(node, commentSpan);
  });
}


function drawHighlight(deco) {
  const { selected, color, id } = deco;
  selected.addClass(color);
  registerCommentEvent("", selected, id, "highlight");
}

function drawWordHide(deco) {
  const { selected, id } = deco;
  selected.classList.add("hidden");

  const ellipsisBtn = document.createElement("span");
  ellipsisBtn.classList.add("ellipsis");
  ellipsisBtn.innerText = "⋯";
  selected.parentElement.insertBefore(ellipsisBtn, selected);

  ellipsisBtn.addEventListener("click", () => {
    selected.classList.remove("hidden");
    let id = deco.id;
    console.log(`id is ${id}`);
    deleteWordHide(id);
    ellipsisBtn.remove();
    mergeNode(selected);
  });
}


let cacheChange = 0;
window.addEventListener("load", async function () {
  
  const pre = $('#pre')[0];
  if (pre.classList.contains("context-menu-one")) {
    console.log(JSON.stringify(ref_data));
    hideLine();
    ref_data.map((deco) => {
      const type = deco.type;

      createNewRange(deco.line, deco.start, deco.end);
      const span = createNewSpan(document.getSelection());
      document.getSelection().removeAllRanges();

      switch (type) {
        case "line_hide":
          drawLineHide(deco);
          break;
        case "link":
          drawLink({
            selected: span,
            url: deco.url,
            id: deco.id
          });
          break;
        case "comment-embedded":
          drawComment2({
            selected: span,
            comment: deco.comment,
            id: deco.id
          });
          break;
        case "comment":
          drawComment({
            selected: span,
            comment: deco.comment,
            id: deco.id
          });
          break;
        case "highlight":
          drawHighlight({
            selected: span,
            color: deco.color,
            id: deco.id
          });
          break;
        case "word_hide":
          drawWordHide({
            selected: span,
            id: deco.id
          });
          break;
      }
    });
  }
});



function hideLine() {
  const numbers = $(".hljs-ln-numbers");
  $.each(numbers, function(_, item) {
    const number = parseInt(item.getAttribute("data-line-number"));
    item = $(item);
    const parentItem = $(item).parent();
    parentItem.attr("id", `L${number}`);
    item.click((event) => {
      if (!lineSelected) {
        start = number;
        item.addClass("selecting");
      } else {
        end = number;
        let numberLinesSelected = Math.abs(start - end) + 1;
        start = Math.min(start, end);
        selectedInfo = selectedInfo.filter((item) => {
          const contained = start < item.start && start + numberLinesSelected - 1 > item.start;
          if (contained) {
            expand(`L${String(item.start)}`, item.number);
          }
          return !contained;
        });
        const ID = randomId();
        selectedInfo.push({ start: start, number: numberLinesSelected, id: ID });
        console.log(selectedInfo);
        let line = $(`#L${start}`);
        createEllipsisNode(line);

        for (let i = 0; i < numberLinesSelected; i++) {
          line.addClass("hidden");
          line = line.next();
        }
        Array.from(numbers).map((number) => {
          number.removeClass("selecting");
        });
        if (ref_data != null) {
          addLineHide(start, end, ID);
        }
      }
      lineSelected = !lineSelected;
    });
  });
}


function registerCommentEvent(comment, node, id, type) {
  const commentSpan = $('<span>', {
    text: comment,
    class: 'comment',
    id: id
  });
  
  const closeBtn = $('<span>', {
    text: 'X',
    class: 'right'
  }).appendTo(commentSpan)

  // commentSpan.appendChild(closeBtn);

  // closeBtn.addEventListener("click", () => {
  closeBtn.click(() => {
    console.log(commentSpan.id);
    if (type == "comment") {
      deleteComment(commentSpan.id);
    } else if (type == "link") {
      deleteLink(id);
    } else if (type == "highlight") {
      deleteHighlight(id);
    }
    addContextMenu();

    mergeNode(node, commentSpan);
  });

  console.log(type);
  if (type == "link") {
    // commentSpan.classList.add("linkComment");
    commentSpan.addClass("linkComment")
    // commentSpan.addEventListener("mouseenter", () => {
    commentSpan.mouseenter(() =>{
      node.onclick = null;
    });
    // commentSpan.addEventListener("mouseleave", () => {
      commentSpan.mouseleave(() =>{
      node.onclick = "openLink(this)";
    });
  }
  node.mouseenter(() => {
    removeContextMenu();
    showCommentDetail(node, commentSpan);
  });
}

function showDecoDetail(span) {
  const type = span.classList[0];
  console.log(type);
  switch (type) {
    case "comment-underline":
  }
}

function showCommentDetail(span, commentSpan) {
  if (span.parent().prop('tagName') === "TD") {
    span.append(commentSpan);
    span.mouseleave(() => {
      addContextMenu();
      hideCommentDetail(commentSpan);
    });
  }
}

function hideCommentDetail(span) {
  span.remove();
}
