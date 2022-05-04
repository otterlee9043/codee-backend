function browse_dir(event, tree, username, parent_node, location = null) {
  event.preventDefault();
  show_dir(tree, username, parent_node, location);
  console.log("browser");
}

function open_dir(id) {
  document.getElementById(id).style.height = "250px";
  const dir = document.querySelector("#browse1 .focus");
  console.log(dir);
}

async function createCodee() {
  const codee_name = document.getElementById("codee_name").value;
  const codee_path = document.getElementById("browse1_path").value;
  const ref_path = document.getElementById("browse2_path").value;
  const opts = {
    method: "POST",
    body: JSON.stringify({
      codee_name: codee_name,
      codee_path: codee_path,
      ref_path: ref_path,
    }),
  };

  const response = await fetch(`${window.origin}/codination/ver1/create_codee`, opts);
  location.href = `/codination/ver1/${codee_path}/${codee_name}.cd`;
  // console.log("here");
}
