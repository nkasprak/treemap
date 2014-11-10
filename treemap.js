// JavaScript Document

var tree_map = {};

(function(t) {
	t.returnCoords = function(d,width,height) {
		var i,getTotal,total,recurse,recursionLevel=0,returnBoxes = [];
		getTotal = function(dataArr) {
			var total = 0;
			switch(typeof(dataArr)) {
				case "object":
				for (var j=0;j<dataArr.length;j++) {
					total += getTotal(dataArr[j].data);	
				}
				return total;
				break;
				case "number":
				return dataArr;
				break;
				default:
				throw "error: data invalid";
			}
		}
		recurse = function(d,topLeft,bottomRight,parentID) {
			
			var box, height, width, ratio, subtotal, total = getTotal(d);
			for (var j=0;j<d.length;j++) {
				subtotal = getTotal(d[j].data);
				ratio = subtotal/total;
				width = bottomRight[0] - topLeft[0];
				height = bottomRight[1] - topLeft[1];
				if (width > height) {
					box = [ [topLeft[0],topLeft[1]],
							[topLeft[0] + width*ratio,bottomRight[1]]];
					
					
					topLeft[0] += width*ratio;
				} else {
					box = [ [topLeft[0],topLeft[1]],
							[bottomRight[0],topLeft[1] + height*ratio]];
					
					topLeft[1] += height*ratio;
				}
				if (typeof(d[j].name)=="undefined")  d[j].name= d[j].id;
				returnBoxes.push({id:d[j].id,coords:box,level:recursionLevel,parent:parentID,name:d[j].name});
				if (typeof(d[j].data) == "object") {
					recursionLevel++;
					recurse(d[j].data,[box[0][0],box[0][1]],[box[1][0],box[1][1]],d[j].id);
					recursionLevel--;	
				}
				total -= subtotal;
			}
		}
		recurse(d,[0,0],[width,height],"none");
		return returnBoxes;
	}
	t.createRaphaelCanvas = function(canvasID) {
		var $canvas = $("#" + canvasID);
		t.paper = Raphael(canvasID,$canvas.width(),$canvas.height());
		return t.paper;
	}
	t.resetTextColors = function() {
		$.each(t.textByID,function(id,textObj) {
			textObj.attr({"fill":"#fff","opacity":1});
		});
	}
	t.rectHover = function(node) {
		var x,y,height,width,name;
		var level = t.levelByID[t.idByRaphaelID[node.raphaelid]];
		if (t.overlayRect) t.overlayRect.remove();
		if (t.secondaryOverlayRect) t.secondaryOverlayRect.remove();
		
		var id = t.idByRaphaelID[node.raphaelid];
		if (level < t.hoverState) {
			t.hoverState = level;
		}
		
		function drawOverlayRect(rectID,mode) {
			x = t.rectByID[id].attrs.x;
			y = t.rectByID[id].attrs.y;
			height = t.rectByID[id].attrs.height;
			width = t.rectByID[id].attrs.width;
			if (mode=="primary") {
				t.overlayRect = t.paper.rect(x+1,y+1,width-2,height-2);
				t.overlayRect.attr({"stroke":"#ff0","stroke-width":2,"stroke-opacity":0.5,"fill-opacity":0});
			} else if (mode=="secondary") {
				t.secondaryOverlayRect =  t.paper.rect(x+2,y+2,width-4,height-4);
				t.secondaryOverlayRect.attr({"stroke":"#f00","stroke-width":4,"stroke-opacity":0.5,"fill-opacity":0});
				
			}
		}
		
		while (level > t.hoverState) {
			if (level == t.hoverState+1) drawOverlayRect(id,"secondary");
			level = t.levelByID[t.rectParents[id]];
			id = t.idByRaphaelID[t.rectByID[t.rectParents[id]].id];
		}
		drawOverlayRect(id,"primary");
		t.resetTextColors();
		if (t.textByID[id]) t.textByID[id].attr({"fill":"#ff0","opacity":0.5});
		
		name =  t.nameByID[id]
		if (t.hoverText) {
			if (t.hoverText.attr("text") != name) {
				t.hoverText.remove();
				if (t.hoverState > 0) {
					t.hoverText = t.paper.text(x+width/2,y+height/2,name);
					t.hoverText.attr({"font-size":14,"fill":"#ff0","opacity":0.5});
				}
			}
			
		} else {
			if (t.hoverState > 0) {
				t.hoverText = t.paper.text(x+width/2,y+height/2,name);
				t.hoverText.attr({"font-size":14,"fill":"#ff0","opacity":0.5});	
			}
		}
		
	};
	t.rectClick = function(node) {
		var id = t.idByRaphaelID[node.raphaelid];
		var level = t.levelByID[id];
		t.hoverState = (t.hoverState+1)%(t.maxLevel+1);
		
		t.rectHover(node);
	}
	t.drawTreeData = function(boxList,initialColor,duration) {
		var currentColor = initialColor
		opacity=1,
		tintColor = "#ff0000",
		paper = t.paper;
		if (typeof(t.rectByID)=="undefined") t.rectByID = {};
		if (typeof(t.textByID)=="undefined") t.textByID = {};
		delete(t.baseAnimation);
		delete(t.baseAnimationEl);
		t.rectParents = {};
		t.idByRaphaelID = {};
		t.nameByID = {};
		t.levelByID = {};
		t.hoverState = 0,
		t.maxLevel = 0;
		
		//delete unused rectangles
		$.each(t.rectByID,function(id,rect) {
			var removeBox = true;
			$.each(boxList,function(i,box) {
				if (box.id == id) removeBox = false;
			});
			if (removeBox) {
				if (typeof(t.rectByID[id]) !== "undefined") {
					t.rectByID[id].remove();
					delete(t.rectByID[id]);
				}
				if (typeof(t.textByID[id]) !== "undefined") {
					t.textByID[id].remove();
					delete(t.textByID[id]);
				}
			}
		});
		if (t.overlayRect) t.overlayRect.remove();
		if (t.secondaryOverlayRect) t.secondaryOverlayRect.remove();
		t.resetTextColors();
		
		$.each(boxList,function(i,rect) {
			var box = rect.coords,
			level = rect.level,
			x = box[0][0],
			y = box[0][1],
			width = box[1][0] - box[0][0],
			height = box[1][1] - box[0][1], 
			hsvColor,$node;
			
			if (level > t.maxLevel) t.maxLevel = level;
			t.levelByID[rect.id] = level;
			t.nameByID[rect.id] = rect.name;
			if (typeof(t.rectByID[rect.id]) == "undefined") {
				t.rectByID[rect.id] = paper.rect(x,y,width,height);
			} else {
				if (typeof(t.baseAnimation == "undefined")) {
					t.baseAnimation = Raphael.animation({x:x,y:y,width:width,height:height},duration);
					t.baseAnimationEl = t.rectByID[rect.id];
					t.rectByID[rect.id].animate(t.baseAnimation);
				} else {
					t.rectByID[rect.id].animateWith(
						t.baseAnimationEl,
						t.baseAnimation,
						{x:x,y:y,width:width,height:height}
					);
				}
			}
			t.rectByID[rect.id].attr("stroke-width",0);
			t.rectParents[rect.id] = rect.parent;
			t.idByRaphaelID[t.rectByID[rect.id].id] = rect.id;
			$node = $(t.rectByID[rect.id].node);
			$node.off("mousemove touchstart click");
			$node.on("mousemove touchstart", function(e) {
				t.rectHover(this);	
			});
			$node.on("click", function(e) {
				t.rectClick(this);
			});
			switch (level) {
				case 0 :
				t.rectByID[rect.id].attr("fill",currentColor);
				hsvColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(currentColor));
				hsvColor[0] = (hsvColor[0] - 20)%360;
				currentColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
				if (typeof(t.textByID[rect.id]) == "undefined") {
					t.textByID[rect.id] = paper.text(x+5,y+15,rect.name);
					t.textByID[rect.id].attr({"font-size":16,"text-anchor":"start","fill":"#fff"});
				} else {
					if (typeof(t.baseAnimation == "undefined")) {
						t.baseAnimation = Raphael.animation({x:x+5,y:y+15},duration);
						t.baseAnimationEl = t.textByID[rect.id];
						t.textByID[rect.id].animate(t.baseAnimation);
					} else {
						t.textByID[rect.id].animateWith(
							t.baseAnimationEl,
							t.baseAnimation,
							{x:x+5,y:y+15}
						);
					}
				}
				break;
				case 1:
				t.rectByID[rect.id].attr("fill","#000");
				t.rectByID[rect.id].attr("fill-opacity",opacity/10);
				opacity = (opacity+1)%3;
				break;
				case 2:
				t.rectByID[rect.id].attr("fill",tintColor);
				t.rectByID[rect.id].attr("fill-opacity",.1);
				hsvColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(tintColor));
				hsvColor[0] = (hsvColor[0] + 20)%360;
				tintColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
				break;
				default:
				t.rectByID[rect.id].attr("stroke-width",0.5);
				t.rectByID[rect.id].attr("stroke","#777");
				break;
			}
		});
	}
})(tree_map);

$(document).ready(function() {
	var canvas = tree_map.createRaphaelCanvas("raphaelPaper");
	var boxes = tree_map.returnCoords(tree_data,$("#raphaelPaper").width(), $("#raphaelPaper").height());
	var boxes2 = tree_map.returnCoords(tree_data_2,$("#raphaelPaper").width(), $("#raphaelPaper").height());
	tree_map.drawTreeData(boxes,"#62a3b4");
	$("#set2").click(function() {
		tree_map.drawTreeData(boxes2,"#62a3b4",400);
	});
	$("#set1").click(function() {
		tree_map.drawTreeData(boxes,"#62a3b4",400);
	});
});

