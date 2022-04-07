
function show_dir(tree, username, parent_node) {
    const tree_len = tree.length;
    if (tree_len > 0) {
      var ul_tag = document.createElement('ul');
      ul_tag.id = "group";
      parent_node.append(ul_tag);

      for (var i = 0; i < tree_len; i++) {
        // 여기서 tree[i]가 string이면 파일이니까 li 파일을 ul에 추
        if (typeof tree[i] == 'string') {
          var li_file = document.createElement('li');
          li_file.addEventListener('click', function (event) {
            show_file(this, this.textContent, username);
          });
          li_file.id = "treeitem";
          li_file.classList.add("file");
          li_file.innerText = tree[i];
          ul_tag.append(li_file);
        }
        else {// else dir이니까 
          const key = Object.keys(tree[i])[0];
          const values = tree[i][key];
          // li 만들고
          var li_dir = document.createElement('li');
          li_dir.id = "treeitem";
          li_dir.ariaExpanded = "false";
          li_dir.classList.add("dir");
          var span = document.createElement('span');
          span.textContent = key;
          li_dir.append(span);

          // ul에 추가
          ul_tag.append(li_dir);

          // dir 하위에 아무 파일이 없을 경우 대비
          if (values.length > 0) {
            var ul_new_tag = document.createElement('ul');
            li_dir.append(ul_new_tag);
          }
          else {
            continue;
          }
          for (var j = 0; j < values.length; j++) {

            if (Array.isArray(values[j]) || (typeof values[j] == 'string')) {
              var li_file = document.createElement('li');
              li_file.addEventListener('click', function (event) {
                show_file(this, this.textContent, username);
              });
              li_file.id = "treeitem";
              li_file.classList.add("file");
              li_file.innerText = values[j];
              ul_new_tag.append(li_file);
            }
            else {
              const new_key = Object.keys(values[j]);
              var li_new_dir = document.createElement('li');
              li_new_dir.id = "treeitem";
              li_new_dir.ariaExpanded = "false";
              li_new_dir.classList.add("dir");
              var new_span = document.createElement('span');
              new_span.textContent = new_key;
              li_new_dir.append(new_span);
              result = show_dir(values[j][new_key], new_key, li_new_dir);
              ul_new_tag.append(li_new_dir);
            }
          }
        }

      }
    }
    return parent_node;

  }