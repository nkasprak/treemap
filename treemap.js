// JavaScript Document

var tree_data = [
	{
		id:"set1",
		name: "Set 1",
		data: [
			{
				name: "Set 1a",
				id:"set1a",
				data: 10	
			}, 
			{
				name: "Set 1b",
				id:"set1b",
				data: 20	
			}
		
		],
	},
	{
		name: "Set 2",
		id:"set2",
		data: 30
	},
	{
		name: "Set 3",
		id:"set3",
		data: [
			{
				name: "Set 3a",
				id:"set3a",
				data: 20
			}, 
			{
				id:"set3b",
				name: "Set 3b",
				data: [
					{
						name: "Set 3b1",
						id:"set3b1",
						data: 5
					},
					{
						name: "Set 3b2",
						id:"set3b2",
						data: 8	
					}
				]	
			}
		]	
	}
];

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
		var $canvas = $(canvasID);
		return Raphael("raphaelPaper",$canvas.width(),$canvas.height());
	}
	t.drawTreeData = function(paper,boxList,initialColor) {
		var currentColor = initialColor
		opacity=1,
		tintColor = "#ff0000";
		t.rectByID = {};
		t.textByID = {};
		t.rectParents = {};
		t.idByRaphaelID = {};
		t.nameByID = {};
		t.levelByID = {};
		t.hoverState = 0,
		t.maxLevel = 0;
		rectHover = function(node) {
			var x,y,height,width,name;
			var level = t.levelByID[t.idByRaphaelID[node.raphaelid]];
			for (var or in t.rectByID) {
				t.rectByID[or].attr("stroke-width",0);
			}
			var id = t.idByRaphaelID[node.raphaelid];
			if (level < t.hoverState) {
				t.hoverState = level;
			}
			while (level > t.hoverState) {
				level = t.levelByID[t.rectParents[id]];
				id = t.idByRaphaelID[t.rectByID[t.rectParents[id]].id];
			}
			t.rectByID[id].attr("stroke-width",2);
			t.rectByID[id].attr("stroke","#f00");
			x = t.rectByID[id].attrs.x;
			y = t.rectByID[id].attrs.y;
			height = t.rectByID[id].attrs.height;
			width = t.rectByID[id].attrs.width;
			name =  t.nameByID[id]
			if (t.hoverText) {
				if (t.hoverText.attr("text") != name) {
					t.hoverText.remove();
					if (t.hoverState > 0) {
						t.hoverText = paper.text(x+width/2,y+height/2,name);
						t.hoverText.attr({"font-size":14,"fill":"#fff"});
					}
				}
				
			} else {
				if (t.hoverState > 0) {
					t.hoverText = paper.text(x+width/2,y+height/2,name);
					t.hoverText.attr({"font-size":14,"fill":"#fff"});	
				}
			}
			
		};
		rectClick = function(node) {
			var id = t.idByRaphaelID[node.raphaelid];
			var level = t.levelByID[id];
			t.hoverState = (t.hoverState+1)%(t.maxLevel+1);
			rectHover(node);
		}
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
			t.rectByID[rect.id] = paper.rect(x,y,width,height);
			t.rectByID[rect.id].attr("stroke-width",0);
			t.rectParents[rect.id] = rect.parent;
			t.idByRaphaelID[t.rectByID[rect.id].id] = rect.id;
			$node = $(t.rectByID[rect.id].node);
			$node.on("mousemove touchstart", function(e) {
				rectHover(this);	
			});
			$node.on("click", function(e) {
				rectClick(this);
			});
			switch (level) {
				case 0 :
				t.rectByID[rect.id].attr("fill",currentColor);
				hsvColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(currentColor));
				hsvColor[0] = (hsvColor[0] - 20)%360;
				currentColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
				t.textByID[rect.id] = paper.text(x+5,y+15,rect.name);
				t.textByID[rect.id].attr({"font-size":16,"text-anchor":"start","fill":"#fff"});
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
	var canvas = tree_map.createRaphaelCanvas("#raphaelPaper");
	var boxes = tree_map.returnCoords(tree_data,$("#raphaelPaper").width(), $("#raphaelPaper").height());
	tree_map.drawTreeData(canvas,boxes,"#62a3b4");
});

