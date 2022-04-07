const css =
  ".hljs{display:block;overflow-x:auto;padding:0.5em;color:#333;background:#f8f8f8}.hljs-comment,.hljs-quote{color:#998;font-style:italic}.hljs-keyword,.hljs-selector-tag,.hljs-subst{color:#333;font-weight:bold}.hljs-number,.hljs-literal,.hljs-variable,.hljs-template-variable,.hljs-tag .hljs-attr{color:#008080}.hljs-string,.hljs-doctag{color:#d14}.hljs-title,.hljs-section,.hljs-selector-id{color:#900;font-weight:bold}.hljs-subst{font-weight:normal}.hljs-type,.hljs-class .hljs-title{color:#458;font-weight:bold}.hljs-tag,.hljs-name,.hljs-attribute{color:#000080;font-weight:normal}.hljs-regexp,.hljs-link{color:#009926}.hljs-symbol,.hljs-bullet{color:#990073}.hljs-built_in,.hljs-builtin-name{color:#0086b3}.hljs-meta{color:#999;font-weight:bold}.hljs-deletion{background:#fdd}.hljs-addition{background:#dfd}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:bold} .hljs-ln{border-collapse:collapse}.hljs-ln td{padding:0}.hljs-ln-n{width: 10px;} .hljs-ln-numbers{width: 50px ;}";
function copyToClip(element) {
  function listener(e) {
    var str =
      "<style type='text/css'>" +
      css +
      "</style><div>" +
      clone_el.innerHTML +
      "</div>";
    console.log(str);
    str = str.replace(/    /gi, "&nbsp;&nbsp;&nbsp;&nbsp;");
    console.log(str);

    e.clipboardData.setData("text/html", str);

    // var htmlToRtfLocal = new window.htmlToRtf();
    // var rtfContent = htmlToRtfLocal.convertHtmlToRtf(str);
    // e.clipboardData.setData("text", rtfContent);
    //     navigator.clipboard.writeText(rtfContent).then(() => { //console.log(navigator.clipboard);
    //     // Alert the user that the action took place.
    //     // Nobody likes hidden stuff being done under the hood!
    //     alert("Copied to clipboard");
    // });

    // e.clipboardData.setData("text/plain", str);
    e.preventDefault();
  }

  var clone_el = element.cloneNode(true);
  var hidden = clone_el.querySelectorAll(".hidden");
  Array.from(hidden).map((item) => {
    item.remove();
  });
  const lineNumbers = clone_el.querySelectorAll(".hljs-ln-n");
  Array.from(lineNumbers).map((item, index) => {
    item.innerText = item.getAttribute("data-line-number");
  });
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
}
