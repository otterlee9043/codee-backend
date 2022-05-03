function browse_dir(event, tree, username, parent_node, location = null) {
  event.preventDefault();
  show_dir(tree, username, parent_node, location);
  console.log("browser");
}

function open_dir() {
  console.log("open!");
}
