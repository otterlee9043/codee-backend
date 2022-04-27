const menu = document.querySelector(".context-menu-one");

menu.addEventListener("click", function (e) {
  e.preventDefault();

  var element = document.getSelection();
  var selectedText = element.toString();
  if (selectedText != "") {
    const conMenu = document.querySelector(".context-menu-list.context-menu-root");
    const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210;
    const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;

    // console.log(`x: ${x}, y: ${y}`) ;
    conMenu.style.top = `${y + 10}px`;
    conMenu.style.left = `${x}px`;

    $(".context-menu-one").contextMenu();
  }
});

var selectedNode;
$.contextMenu({
  selector: ".context-menu-one",
  trigger: "none",
  delay: 500,
  autoHide: false,
  position: function (opt, x, y) {
    console.log(x);
  },
  callback: function (key, opt, e) {
    var m = "clicked: " + key + " " + opt;
    console.log(m);
    const selection = document.getSelection();

    if (key == "comment") {
      console.log("comment");
    } //else if (key == "highlight") {
    else if (key == "red") {
      console.log("red");
      const span = createNewSpan(selection);
      span.classList.add("red");
    } else if (key == "yellow") {
      console.log("yellow");
      const span = createNewSpan(selection);
      span.classList.add("yellow");
    } else if (key == "green") {
      console.log("green");
      const span = createNewSpan(selection);
      span.classList.add("green");
    } else if (key == "record") {
      console.log("record");
    } else if (key == "hide") {
      const span = createNewSpan(selection);
      console.log(span);
      ellipsisSpan(span);
    } else if (key == "link") {
      console.log("link");
      const span = createNewSpan(selection);
      console.log("LINK!!!");
      // link 가져와서 tag 만들기
    } else {
      console.log("none");
    }
    selection.removeAllRanges();
    // window.console && console.log(m) || alert(m);
  },
  items: {
    comment: {
      // name: "Comment",
      icon: "fa-light fa-comment-dots",
    },
    highlight: {
      // name: "Highlight",
      icon: "fa-light fa-highlighter",
      items: {
        red: {
          // name: "Red",
          selector: "#red",
          icon: "fa-solid fa-circle",
          events: {
            click: function (e) {
              console.log("RED~~");
            },
          },
        },
        yellow: {
          // name: "Yellow",
          icon: "fa-solid fa-circle",
        },
        green: {
          // name: "Green",
          icon: "fa-solid fa-circle",
        },
      },
    },
    record: {
      // name: "Record",
      icon: "fa-light fa-microphone",
    },
    hide: {
      // name: "Hide",
      icon: "fa-light fa-ellipsis",
    },
    link: {
      // name: "Link",
      icon: "fa-light fa-link",
      items: {
        "link-1": {
          type: "text",
          events: {
            // mouseover: function (e) {
            //   selectedNode = document.getSelection();
            //   console.log(selectedNode);
            //   console.log("im activated");
            // },
            keyup: function (e) {
              // add some fancy key handling here?
              if (e.keyCode == 13) {
                //selectedNode = JSON.parse(localStorage.getItem("selection"));
                console.log("link enter");
                // getting link
                const link = document.getElementsByName("context-menu-input-link-1")[0].value;
                console.log(link);

                // create a tag
                var a_tag = document.createElement("a");
                a_tag.classList.add("link");
                a_tag.href = link;
                a_tag.setAttribute("id", randomId());
                a_tag.setAttribute("target", "_blank");

                // add to a tag
                selected = document.querySelector(".selected") ;
                // console.log(selected.toString());
                a_tag.appendChild(selected);

                // store the lick to local storage
                // sessionStorage.setItem(
                //   a_tag.getAttribute("id"),
                //   JSON.stringify({ line: 1, start: 1, end: 1 })
                // );
              }
            },
          },
        },
      },
    },
  },
  events: {
      hide: function(e) {
        var input = document.getElementsByName("context-menu-input-link-1")[0] ;
        var code = document.getElementById('code') ;
        code.removeEventListener('mouseup', null) ;
        input.removeEventListener('mousedown', null) ;
        input.removeEventListener('blur', null) ;
      },
      show: function(e) { // show
        var input = document.getElementsByName("context-menu-input-link-1")[0] ;
        var code = document.getElementById('code') ;
        var menuBar = document.querySelector(".context-menu-list.context-menu-root");
        console.log(input) ;
        var fragment = null ;
        var range = null ;

        function saveSelection() {
          if (window.getSelection) {
            selected = window.getSelection() ;
            if (selected.getRangeAt && selected.rangeCount) {
              return selected.getRangeAt(0) ;
            }
            else if (document.selection && document.selection.createRange) {
              return document.selection.createRange() ;
            }
            return null ;
          }
        }
        
        // function saveSelection() {
        //   if (window.getSelection) {
        //     let selected = document.getSelection() ;
        //     let ran = new Range() ;
        //     let selectedFirst = selected.anchorNode ;
        //     let selectedLast = selected.focusNode ;
        //     let firstOffset = selected.anchorOffset ;
        //     let lastOffset = selectionText.focusOffset ;
        //     if (selectedFirst.compareDocumentPosition(selectedLast) & Node.DOCUMENT_POSITION_PRECEDING) {
        //       [selectedFirst, selectedLast] = [selectedLast, selectedFirst];
        //       [firstOffset, lastOffset] = [lastOffset, firstOffset];
        //     }
        //     else if (selectedFirst === selectedLast) {
        //       const len = selectedFirst.nodeValue.substring(firstOffset, lastOffset).length ;
        //       if (lastOffset < firstOffset)
        //         [firstOffset, lastOffset] = [lastOffset, firstOffset] ;
        //     }
        //     ran.setStart(selectedFirst, firstOffset) ;
        //     ran.setEnd(selectedLast, lastOffset) ;
        //     console.log(ran) ;
        //     return ran ;
        //   }
        // }


        function saveRangeEvent(event) {
          range = saveSelection() ;
          console.log(range.anchorNode) ;
          // if (range && !range.collapsed) {
          //   fragment = range.cloneContents() ;
          // }
        }

        code.addEventListener('mouseup', saveRangeEvent) ;
        // code.addEventListener('keyup', saveRangeEvent) ; 
        var flag = 0 ;
        input.addEventListener('mousedown', function(event) {
          // create fake selection
          if (document.getSelection) {
            var span = createNewSpan(document.getSelection()) ;
            console.log("imdone") ;
            span.classList.add("selected") ;
            flag = 1 ;
          }
        }) ;


        // remove fake selection
        input.addEventListener('blur', function(event) {
          // remove fake selection
          // document.getSelection().addRange(range) ;
          if (flag) {
            var selected = document.querySelector(".selected") ;
            selected.classList.remove("selected") ;
            merge(selected) ;
          }
          flag = 0 ;
        }, true ) ;

        // input.addEventListener('mousedown', function(event) {
        //   // create fake selection
        //   if (fragment) {
        //     var span = createNewSpan(document.getSelection()) ;
        //     span.classList.add("selected") ;
        //     // range.surroundContents(span) ;
        //   }
        // }) ;


        // // remove fake selection
        // input.addEventListener('blur', function(event) {
        //   // remove fake selection
        //   if (fragment) {
        //     var selected = document.querySelector(".selected") ;
        //     // selected.classList.remove("selected") ;
        //     merge(selected) ;
        //   }
        //   fragment = null ;
        // }, true ) ;
    }
  }
  // events: {
  //     show: function(opt) {
  //         var $this = this ;
  //         console.log(`asdfs ${$this.data()}`) ;
  //         $.contextMenu.setInputValues(opt, $this.data()) ;
  //     },
  //     hide: function(opt) {
  //         var $this = this ;
  //         $.contextMenu.getInputValues(opt, $this.data()) ;
  //     }
  // }
});

function randomId() {
  return Math.random().toString(12).substring(2, 11);
}
