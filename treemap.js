// JavaScript Document

document.write('<script type="text/javascript" src="treemap.colors.js"></script>');

var tree_map = {
	construct: function() {
		var t = this;
		t.initialize = function() {
			if (tree_map.colorUtils) t.colorUtils = tree_map.colorUtils;
		};
		t.returnCoords = function(d,width,height, layoutOverride) {
			if (typeof(layoutOverride)=="undefined") layoutOverride = null;
			var i,getTotal,total,recurse,recursionLevel=0,returnBoxes = [], layoutDef = {}, stripDef;
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
			returnBoxes.push({id:"globalBox",name:"",level:-1,coords:[[0,0],[width,height]],parent:"none",value:getTotal(d)});
			recurse = function(d,topLeft,bottomRight,parentID) {
				var box, height, width, ratio, subtotal, 
				total = getTotal(d), j, k, stripTotal, 
				stripWidth, stripHeight, remainingNodes, stripTopLeft, 
				stripBottomRight, startNode, stripRatio, stripCond,
				dByID={},oD,stripDef,loopCondition,useOverride = false,
				currentNode,boxCond;
				for (j=0;j<d.length;j++) {
					d[j].calculatedTotal = getTotal(d[j].data);
				}
				d.sort(function(a,b) {
					return b.calculatedTotal - a.calculatedTotal;
				});
				j=0;
				layoutDef[parentID] = [];
				if (layoutOverride) {
					if (layoutOverride[parentID]) {
						useOverride = true;
					}
				}
				if (useOverride) {
					//organize data by ID
					for (j=0;j<d.length;j++) {
						dByID[d[j].id] = d[j];
					};
					j=0;
					oD = layoutOverride[parentID];
					loopCondition = (j<oD.length);
				} else {
					loopCondition = (j<d.length);
				}
				while (loopCondition) {
					width = bottomRight[0] - topLeft[0];
					height = bottomRight[1] - topLeft[1];
					stripTotal = 0;
					stripCond = true;
					k=0;
					if (!useOverride) {
						stripDef = {};
						stripDef.boxes = [];
						startNode = j;
						remainingNodes = 0;
					}
					while (stripCond) {
						if (useOverride) {
							stripTotal += dByID[oD[j].boxes[k]].calculatedTotal;
							k++;
							stripCond = k<oD[j].boxes.length;
						} else {
							stripTotal += d[j].calculatedTotal;
							stripRatio = stripTotal/total;
							if (width >= height) {
								stripDef.direction="vertical";
								stripWidth = stripRatio*width;
								stripHeight = height;	
							} else {
								stripDef.direction="horizontal";
								stripWidth = width;
								stripHeight = stripRatio*height;
							}
							stripDef.boxes.push(d[j].id);
							remainingNodes++;
							j++;
							stripCond = (!(Math.max(stripWidth/stripHeight, stripHeight/stripWidth) <= remainingNodes)) && j<d.length;
						}
					}
					if (useOverride) {
						stripRatio = stripTotal/total;
						stripCond = (oD[j].direction=="vertical");
						if (stripCond) {
							stripWidth = stripRatio*width;
							stripHeight = height;
						} else {
							stripWidth = width;
							stripHeight = stripRatio*height;
						}
						remainingNodes = oD[j].boxes.length;
					} else {
						if (stripWidth >= stripHeight) stripDef.boxDirection = "horizontal";
						else stripDef.boxDirection = "vertical";
						layoutDef[parentID].push(stripDef);
						stripCond = (width >= height);
					}
					 
					if (stripCond) {
						stripTopLeft = [topLeft[0],topLeft[1]];
						stripBottomRight = [topLeft[0] + stripWidth,bottomRight[1]];
					} else {
						stripTopLeft = [topLeft[0],topLeft[1]];
						stripBottomRight = [bottomRight[0],topLeft[1]+stripHeight];
					}
					
					for (k=0;k<remainingNodes;k++) {
						if (useOverride) {
							currentNode = dByID[oD[j].boxes[k]];
							stripDef = oD[j];
						} else currentNode = d[k+startNode];	
						subtotal = currentNode.calculatedTotal;
						ratio = subtotal/stripTotal;
						if (stripDef.boxDirection=="horizontal") {
							box = [ [stripTopLeft[0],stripTopLeft[1]],
									[stripTopLeft[0] + stripWidth*ratio,stripBottomRight[1]]];
							stripTopLeft[0] += stripWidth*ratio;
						} else {
							box = [ [stripTopLeft[0],stripTopLeft[1]],
									[stripBottomRight[0],stripTopLeft[1] + stripHeight*ratio]];
							stripTopLeft[1] += stripHeight*ratio;
						}
						if (typeof(currentNode.name)=="undefined")  currentNode.name= currentNode.id;
						if (subtotal > 0) returnBoxes.push({id:currentNode.id,coords:box,level:recursionLevel,parent:parentID,name:currentNode.name,value:subtotal});
						if (typeof(currentNode.data) == "object") {
							recursionLevel++;
							recurse(currentNode.data,[box[0][0],box[0][1]],[box[1][0],box[1][1]],currentNode.id);
							recursionLevel--;	
						}
					}
					total -= stripTotal;
					if (stripCond) {
						topLeft[0] += stripWidth;	
					} else {
						topLeft[1] += stripHeight;
					}
					if (useOverride) {
						j++;
						loopCondition = (j<oD.length);
					} else {
						loopCondition = (j<d.length);
					}
				}
			}
			recurse(d,[0,0],[width,height],"globalBox");
			return {boxes:returnBoxes,layoutDef:layoutDef};
		},
		t.determineNodeFromCoords = function(coords,level) {
			var currentLevelBoxList = [];
			for (var i = 0;i<t.activeBoxList.length;i++) {
				if (t.activeBoxList[i].level == level) {
					currentLevelBoxList.push(t.activeBoxList[i]);	
				}
			}
			function containsCoords(range,coord) {
				var contains = false;
				if (coord[0] >= range[0][0] && coord[0] <= range[1][0] && coord[1] >= range[0][1] && coord[1] <= range[1][1]) {
					contains = true;	
				}
				return contains;
			}
			for (i=0;i<currentLevelBoxList.length;i++) {
				if (containsCoords(currentLevelBoxList[i].coords,coords)) return currentLevelBoxList[i].id;
			}
			return null;
		},
		t.createRaphaelCanvas = function(canvasID) {
			var $canvas = $("#" + canvasID);
			$canvas.css("cursor","pointer");
			t.paper = Raphael(canvasID,$canvas.width(),$canvas.height());
			t.canvasID = canvasID;
			$canvas.off("mouseleave");
			$canvas.on("mouseleave",t.deleteOverlays);
			return t.paper;
		}
		t.resetTextColors = function() {
			$.each(t.textByID,function(id,textObj) {
				textObj.attr({"fill":"#fff","opacity":1});
			});
		}
		t.drawOverlayRect = function(rectID,mode) {
			var x,y,height,width;
			x = t.rectByID[rectID].attrs.x;
			y = t.rectByID[rectID].attrs.y;
			height = Math.max(t.rectByID[rectID].attrs.height,0);
			width = Math.max(t.rectByID[rectID].attrs.width,0);
			if (mode=="primary") {
				t.overlayRect = t.paper.rect(x+1,y+1,Math.max(width-2,0),Math.max(height-2,0));
				t.overlayRect.attr({"stroke":"#ff0","stroke-width":2,"stroke-opacity":0.5,"fill-opacity":0});
			} else if (mode=="secondary") {
				t.secondaryOverlayRect =  t.paper.rect(x+2,y+2,Math.max(width-4,0),Math.max(height-4,0));
				t.secondaryOverlayRect.attr({"stroke":"#f00","stroke-width":4,"stroke-opacity":0.5});
			}
			return {x:x,y:y,height:height,width:width};
		}
		t.drawSecondaryOverlayText = function(pageX, pageY,id,createNew) {
			if (typeof(createNew)=="undefined") createNew = true;
			var x,y,width,height,dims,textBBox,textBBoxWidth, textBBoxHeight,nodeValue;
			var name = t.nameByID[id];
			function positionOverlayRect(mCoord,size,rectC,minSep) {
				var baseCoord = (mCoord + rectC + size/2)/2;
				var sep = baseCoord - mCoord;
				if (sep < 0) {
					if (sep > 0-minSep) {
						baseCoord -= (minSep + sep);	
					} 
				} else {
					if (sep < minSep) {
						baseCoord += (minSep - sep);
					}
				}
				return baseCoord;
			}
			
			dims = t.drawOverlayRect(id,"secondary");
			x=dims.x;y=dims.y;height=dims.height;width=dims.width;
			if (typeof(t.secondaryHoverText)=="undefined" || createNew) {
				t.secondaryHoverText = t.paper.text(0,0,"");
			}
			nodeValue = t.dataByID[id];
			t.secondaryHoverText.attr({"text":t.tipFormatter(id,name,nodeValue),"font-size":14,"text-anchor":"start"});
			textBBox = t.secondaryHoverText.getBBox();
			textBBoxWidth = textBBox.width + 5;
			textBBoxHeight = textBBox.height + 5;
			if (t.rectByID[t.rectParents[id]].attr("width") > t.rectByID[t.rectParents[id]].attr("height")) {
				if ((t.rectByID[id].attr("y")+t.rectByID[id].attr("height")/2)/$("#" + t.canvasID).height() < 0.5) {
					mouseY = pageY - $("#" + t.canvasID).offset().top + textBBoxHeight/2 + 10;
				} else {
					mouseY = pageY - $("#" + t.canvasID).offset().top - textBBoxHeight/2 - 10;
				}
				mouseX = positionOverlayRect(pageX - $("#" + t.canvasID).offset().left,t.rectByID[id].attr("width"),t.rectByID[id].attr("x"),0);
			} else {
				if ((t.rectByID[id].attr("x")+t.rectByID[id].attr("width")/2)/$("#" + t.canvasID).width() < 0.5) {
					mouseX = pageX - $("#" + t.canvasID).offset().left + textBBoxWidth/2 + 10;
				} else {
					mouseX = pageX - $("#" + t.canvasID).offset().left - textBBoxWidth/2 - 10;
				}
				mouseY = positionOverlayRect(pageY - $("#" + t.canvasID).offset().top,t.rectByID[id].attr("height"),t.rectByID[id].attr("y"),0);
			}
			mouseX = Math.min(mouseX, $("#" + t.canvasID).width() - textBBoxWidth/2);
			mouseY = Math.min(mouseY, $("#" + t.canvasID).height() - textBBoxHeight/2);
			t.secondaryHoverText.attr({x:mouseX-textBBoxWidth/2+2,y:mouseY,fill:"#fff"});
			if (typeof(t.secondaryTextRect)=="undefined" || createNew) {
				t.secondaryTextRect = t.paper.rect(0,0,0,0);
			}
			t.secondaryTextRect.attr({x:mouseX-textBBoxWidth/2,y:mouseY-textBBoxHeight/2,width:textBBoxWidth,height:textBBoxHeight});
			t.secondaryTextRect.attr({fill:"#b9292f","stroke-width":0});
		}
		t.rectHover = function(node,e,createNew) {
			if (typeof(createNew)=="undefined") createNew = true;
			var dims,name,mouseX,mouseY;
			var level = t.levelByID[t.idByRaphaelID[node.raphaelid]];
			
			if (t.overlayRect) t.overlayRect.remove();
			if (t.secondaryOverlayRect) t.secondaryOverlayRect.remove();
			delete t.overlayRect;
			delete t.secondaryOverlayRect;
			if (createNew) {
				if (t.secondaryHoverText) t.secondaryHoverText.remove();
				if (t.secondaryTextRect) t.secondaryTextRect.remove();
				delete t.secondaryHoverText;
				delete t.secondaryTextRect;
			}
			var id = t.idByRaphaelID[node.raphaelid];
			if (level < t.hoverState) {
				t.hoverState = level;
			}
		
			while (level > t.hoverState) {
				if (level == t.hoverState+1) {
					t.drawSecondaryOverlayText(e.pageX,e.pageY,id,createNew);
					if (createNew) {
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).off("mouseover");
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).on("mouseover",function(e) {
							t.rectHover(node,e,false);
							e.cancelBubble = true;
							e.stopPropagation();
						});
						$(t.secondaryHoverText.node, t.secondaryTextRect.node).on("click",function(e) {
							t.rectClick(node,e,false);
							e.cancelBubble = true;
							e.stopPropagation();
						});
					}
				}
				level = t.levelByID[t.rectParents[id]];
				id = t.idByRaphaelID[t.rectByID[t.rectParents[id]].id];
			}
			
			dims = t.drawOverlayRect(id,"primary");
			x=dims.x;y=dims.y;height=dims.height;width=dims.width;
			t.resetTextColors();
			if (t.textByID[id]) {
				t.textByID[id].attr({"fill":"#ff0","opacity":0.5});
			}
			name =  t.nameByID[id];
			function makeYellowHoverText() {
				
				t.hoverText = t.paper.text(x+width/2,y+height/2,name);
				t.hoverText.attr({"font-size":14,"fill":"#ff0","opacity":0.5});
				$(t.hoverText.node).on("mousemove", function(e) {
					t.generalizedHover(e,level);	
				});
				$(t.hoverText.node).on("click",function(e) {
					t.generalizedClick(e,level);
				});
				t.hoverText.toFront();
				
			}
			if (t.hoverText) {
				if (t.hoverText.attr("text") != name) {
					t.hoverText.remove();
					if (t.hoverState > 0) {
						makeYellowHoverText();
					}
				}
			} else {
				if (t.hoverState > 0) {
					makeYellowHoverText();
				}
			}
			if (createNew) {
				if (t.secondaryTextRect) t.secondaryTextRect.toFront();
				if (t.secondaryHoverText) t.secondaryHoverText.toFront();
			}
		};
		t.generalizedHover = function(e,level) {
			var id = t.determineNodeFromCoords([ e.pageX - $("#" + t.canvasID).offset().left,
												e.pageY - $("#" + t.canvasID).offset().top],
												level+1);
			if (id) t.rectHover(t.rectByID[id].node,e);
		};
		t.generalizedClick = function(e,level) {
			var id = t.determineNodeFromCoords([ e.pageX - $("#" + t.canvasID).offset().left,
												e.pageY - $("#" + t.canvasID).offset().top],
												level+1);
			if (id) t.rectClick(t.rectByID[id].node,e);
		}
		t.rectClick = function(node,e) {
			var id = t.idByRaphaelID[node.raphaelid];
			var level = t.levelByID[id];
			t.hoverState = (t.hoverState+1)%(t.maxLevel+1);
			
			t.rectHover(node,e,false);
		}
		t.deleteOverlays = function() {
			if (t.overlayRect) t.overlayRect.remove();
			if (t.secondaryOverlayRect) t.secondaryOverlayRect.remove();
			if (t.secondaryHoverText) t.secondaryHoverText.remove();
			if (t.secondaryTextRect) t.secondaryTextRect.remove();
			if (t.hoverText) t.hoverText.remove();
			t.hoverState = -1;
			t.resetTextColors();
		}
		t.drawTreeData = function(boxList,initialColor,duration, tipFormatter) {
			t.activeBoxList = boxList;
			var currentColor = initialColor
			opacity=1,
			tintColor = "#ff0000",
			paper = t.paper;
			if (typeof(tipFormatter)=="undefined") var tipFormatter = function(id, name, value) {
				return name;
			};
			t.tipFormatter = tipFormatter;
			if (typeof(t.rectByID)=="undefined") t.rectByID = {};
			if (typeof(t.textByID)=="undefined") t.textByID = {};
			delete(t.baseAnimation);
			delete(t.baseAnimationEl);
			t.rectParents = {};
			t.idByRaphaelID = {};
			t.totalByID = {};
			t.nameByID = {};
			t.dataByID = {};
			t.levelByID = {};
			t.hoverState = -1,
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
			
			t.deleteOverlays();
			
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
				t.dataByID[rect.id] = rect.value;
				t.nameByID[rect.id] = rect.name;
				if (typeof(t.rectByID[rect.id]) == "undefined") {
					t.rectByID[rect.id] = paper.rect(x,y,Math.max(width,0),Math.max(height,0));
				} else {
					if (typeof(t.baseAnimation == "undefined")) {
						t.baseAnimation = Raphael.animation({x:x,y:y,width:Math.max(width,0),height:Math.max(height,0)},duration);
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
					t.rectHover(this,e);	
					e.cancelBubble = true;
					e.stopPropagation();
				});
				$node.on("click", function(e) {
					t.rectClick(this,e);
					e.cancelBubble = true;
					e.stopPropagation();
				});
				t.rectByID[rect.id].attr("stroke","#000");
				t.rectByID[rect.id].attr("stroke-opacity",0.2);
				t.rectByID[rect.id].attr("stroke-width",0.5);
				switch (level) {
					case 0 :
					t.rectByID[rect.id].attr("fill",currentColor);
					hsvColor = t.colorUtils.RGBToHSV(t.colorUtils.HexToRGB(currentColor));
					hsvColor[0] = (hsvColor[0] - 40)%360;
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
					hsvColor[0] = (hsvColor[0] + 40)%360;
					tintColor = t.colorUtils.RGBToHex(t.colorUtils.HSVToRGB(hsvColor));
					break;
					default:
					t.rectByID[rect.id].attr("stroke-width",1.5/(level-2));
					t.rectByID[rect.id].attr("stroke","#333");
					t.rectByID[rect.id].attr("stroke-opacity",0.5/(level-2));
					t.rectByID[rect.id].attr("fill","#fff");
					t.rectByID[rect.id].attr("fill-opacity",0.01);
					break;
				}
			});
			for (var id in t.textByID) {
				t.textByID[id].toFront();
				$(t.textByID[id].node).on("mousemove", function(e) {
					t.generalizedHover(e,t.hoverState);	
				});	
				$(t.textByID[id].node).on("click", function(e) {
					t.generalizedClick(e,t.hoverState);	
				});	
			}
		}
	}
};

