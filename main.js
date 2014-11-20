// JavaScript Document

$(document).ready(function() {
	var dViz = {};
	dViz.treemap = new tree_map.construct();
	dViz.treemap.initialize();
	dViz.tipFormatter = function(id, name, value) {
		return name + "\nSize: " + value;
	};
	dViz.canvas = dViz.treemap.createRaphaelCanvas("raphaelPaper");
	
	if (typeof(dViz.boxes)=="undefined") dViz.boxes = dViz.treemap.returnCoords(budget_data(1978),$("#raphaelPaper").width(), $("#raphaelPaper").height());
	dViz.treemap.drawTreeData(dViz.boxes,"#62a3b4", 0, dViz.tipFormatter);
	$("#set2").click(function() {
		if (typeof(dViz.boxes2)=="undefined") dViz.boxes2 = dViz.treemap.returnCoords(budget_data(1979),$("#raphaelPaper").width(), $("#raphaelPaper").height());
		dViz.treemap.drawTreeData(dViz.boxes2,"#62a3b4",400, dViz.tipFormatter);
	});
	$("#set1").click(function() {
		if (typeof(dViz.boxes)=="undefined") dViz.boxes = dViz.treemap.returnCoords(budget_data(1978),$("#raphaelPaper").width(), $("#raphaelPaper").height());
		dViz.treemap.drawTreeData(dViz.boxes,"#62a3b4",400, dViz.tipFormatter);
	});
});
