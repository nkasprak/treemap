// JavaScript Document

$(document).ready(function() {
	
	(function() {
		for (var year = 1978;year<=2013;year++) {
			$("#year").append('<option value="' + year + '">' + year + '</option>');
		}
	})();
	
	var dViz = {};
	dViz.treemap = new tree_map.construct();
	dViz.treemap.initialize();
	dViz.tipFormatter = function(id, name, value) {
		return name;
	};
	dViz.canvas = dViz.treemap.createRaphaelCanvas("raphaelPaper");
	
	dViz.boxes = {};
	
	dViz.boxes[1978] = dViz.treemap.returnCoords(budget_data(1978),$("#raphaelPaper").width(), $("#raphaelPaper").height());
	
	dViz.calculateYears = function(layoutYear) {
		for (var year = 1978;year<=2013;year++) {
			if (year != layoutYear) dViz.boxes[year] = dViz.treemap.returnCoords(budget_data(year),$("#raphaelPaper").width(), $("#raphaelPaper").height(), dViz.boxes[layoutYear].layoutDef);
		}
	};
	
	dViz.calculateYears(1978);
	
	dViz.treemap.drawTreeData(dViz.boxes[1978].boxes,"#0c61a4",0, dViz.tipFormatter);
	
	$("#year").change(function() {
		var year = $(this).val();
		dViz.treemap.drawTreeData(dViz.boxes[year].boxes,"#0c61a4",400, dViz.tipFormatter);
	});
	
	$("#reset").click(function() {
		var year = $("#year").val();
		dViz.boxes[year] = dViz.treemap.returnCoords(budget_data(year),$("#raphaelPaper").width(), $("#raphaelPaper").height());
		dViz.calculateYears(year);
		dViz.treemap.drawTreeData(dViz.boxes[year].boxes,"#0c61a4",400, dViz.tipFormatter);
	});
	
});
