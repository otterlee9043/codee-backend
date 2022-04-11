const menu = document.querySelector(".context-menu-one") ;
// menu.addEventListener("click", function(e) {
//     e.preventDefault() ;

//     var selectedText = document.getSelection()

//     if(selectedText.toString() != "") {
//         const conMenu = document.querySelector(".context-menu-list.context-menu-root") ;
//         const x = window.innerWidth - 200 > e.clientX ? e.clientX : window.innerWidth - 210 ;
//         const y = window.innerHeight > e.clientY ? e.clientY : window.innerHeight - 100;

//         // console.log(`x: ${e.clientX}, y: ${y}`) ;
//         conMenu.style.top = `${y + 10}px`;
//         conMenu.style.left = `${x}px`;
        
//         $('.context-menu-one').contextMenu() ;
//     }
// }) ;

$.contextMenu({
    selector: '.context-menu-one', 
    trigger: 'none',
    delay: 500,
    autoHide: false,
    position: function (opt, x, y) {
        console.log(x) ;
    },
    callback: function(key, opt, e) {
        var m = "clicked: " + key + " " + opt ;
        console.log(m) ;
        if (key == "comment") {
            console.log("comment") ;
        }
        else if (key == "highlight") {
            console.log("highlight") ;
        }
        else if (key == "record") {
            console.log("record") ;
        }
        else if (key == "hide") {
            selectText() ;
        }
        else if (key == "link") {
            console.log("link") ;
        }
        else {
            console.log("none") ;
        }
        // window.console && console.log(m) || alert(m); 
    },
    items: {
        "comment": {
            name: "Comment",
            icon: "fa-light fa-comment-dots",
            // callback : function(key, opt, e) {
            //     console.log(key) ;

            //     return false ;
            // }
        },
        "highlight": {
            name: "Highlight", 
            icon: "fa-light fa-highlighter",
            // callback : function(key, opt, e) {
            //     console.log(key) ;

            //     return false ;
            // }
        },
        "record": {
            name: "Record", 
            icon: "fa-light fa-microphone",
            // callback : function(key, opt, e) {
            //     console.log(key) ;

            //     return false ;
            // }
        },
        "hide": {
            name: "Hide", 
            icon: "fa-light fa-ellipsis",
            // callback : function(key, opt, e) {
            //     console.log(key) ;

            //     return false ;
            // }
        },
        "sep": "-------",
        "link": {
            name: "Link", 
            icon: "fa-light fa-link",
            items: {
                "link-1": {
                    type: "text"
                }
            }
        }
    },
    events: {
        show: function(opt) {
            var $this = this ;
            $.contextMenu.setInputValues(opt, $this.data()) ;
        },
        hide: function(opt) {
            var $this = this ;
            $.contextMenu.getInputValues(opt, $this.data()) ;
        }
    }
});