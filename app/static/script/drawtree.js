

async function drawTree() {
  const tree = await fetch(`/api/v1/repo/${owner}/${repo}/tree/${ref}`)
    .then(function (response) {
      if (response.status !== 200) {
        console.log(`Looks like there was a problem. Status code: ${response.status}`);
        return;
      }
      return response.json();
    })
    .catch(function (error) {
      console.log("Fetch error: " + error);
      return null;
    });

  const jstreeSetting = {
    plugins: ["wholerow"],
    core: {
      themes: {
        responsive: false,
      },
    },
    types: {
      default: {
        icon: "fa fa-folder",
      },
      file: {
        icon: "fa fa-file",
      },
    },
    plugins: ["types"],
    core: {
      data: tree,
    },
  };
  $("#tree").jstree(jstreeSetting);
  $("#modal_tree_1").jstree(jstreeSetting);
  $("#modal_tree_2").jstree(jstreeSetting);

  $("#modal_tree_1").on("changed.jstree", function (e, data) {
    let selectedNode = data.instance.get_node(data.selected[0]);
    if (selectedNode.original.type == "dir") {
      $("#codee_path").val("");
      $("#codee_path").val(selectedNode.id);
    }
  });

  $("#modal_tree_2").on("changed.jstree", function (e, data) {
    let selectedNode = data.instance.get_node(data.selected[0]);
    if (selectedNode.original.type == "file") {
      $("#ref_path").val("");
      $("#ref_path").val(selectedNode.id);
    }
  });
  
  $("#tree").on("select_node.jstree", function (e, data) {
    let node = data.node;
    if (node.type === "file") {
      window.location.href = `/${owner}/${repo}/${ref}/${node["a_attr"]["path"]}`;
    }
  });
}

function spreadTree() {  
  $("#tree").on("ready.jstree", function (e, data) {
    const parents = $("#tree").jstree(true).get_node(content).parents;
    for (let i = parents.length - 2; i >= 0; i--) {
      $("#tree").jstree("open_node", parents[i], 0);
    }
  });
}