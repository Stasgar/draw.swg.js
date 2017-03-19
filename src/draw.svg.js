/*
    Simple SVG drawing library. The main concept is to create an object (path, ellipse e.t.c) and then
    change it's properties regarding to the created object ('d' for paths; cx,cy,rx,ty for ellipses e.t.c)

    Short instruction: 
    - create <svg id="test"></svg> tag.
    - use drawSVG.element="test"; drawSVG.init() to initialize.
    - now you are ready to go, more info on https://github.com/Stasgar/draw.swg.js
*/

var drawSVG = {
    element: "", //<svg> id property
    strokeWidth: '4px',
    strokeColor: 'green',
    init: function(element){ //This method will render marker for arrow tip inside <svg>
        this.element = element;
    },
    setColor(color)
    {
        this.strokeColor = color;
    },
    setWidth(width)
    {
        this.strokeWidth = width;
    },
    clear: function(){
        this.returnElement().innerHTML = '';
    },
    returnElement: function(){ //This method returns the element, provided by drawSVG.element (id) field
        return document.getElementById(this.element);
    },

    deleteObject: function(id){ //deletes an object from DOM
        var deletable = ['path', 'ellipse'];//deletable object tags
        var element = document.getElementById(id);

        if(deletable.indexOf(element.tagName) != -1)
        {
            element.parentNode.removeChild(element);
        }
    },

    /*
        Next 'create' method used to insert pre-made structures in <svg> element
    */
    createElement: function(id){
        PathHelper.itemId = id; // Change PathHelper itemId
        var element = this.returnElement();
        var strokeColor = this.strokeColor;
        var strokeWidth = this.strokeWidth;
        var HTMLhelper = this.HTMLhelper;

        return {
            path: function(){
                element.innerHTML += HTMLhelper.renderPath(id, strokeWidth, strokeColor);
            },
            ellipse: function(){
                element.innerHTML += HTMLhelper.renderEllipse(id, strokeWidth, strokeColor);
            }
        }
    },

    createObj: function (itemId, type){
        switch(type)
        {
            case 'ellipse':
                this.createElement(itemId).ellipse();
            break;
            case 'path':
                this.createElement(itemId).path();
            break;
        }
    },

    /*
        Next 'draw' methods use existing element, created by 'create' method and change it properties.
        id - id of existing element, that is going to be changed
        fX, fY - first (X;Y) coordinates to start from
        lX, lY - last (X;Y) coordinates to end the figure
    */
    drawObject: function(itemId = PathHelper.itemId, do_create = true){
        var current = this;
        function createManage(id, type)
        {
            if(do_create)
            {
                current.createObj(id, type);
            }
            else
            {
                itemId = PathHelper.itemId;
            }
        }

        return {
            rectangle: function(fX, fY, lX, lY){
                //current.createObj(itemId, 'path');
                createManage(itemId, 'path');
                PathHelper.moveTo(fX, fY);
                PathHelper.lineTo(fX, lY);
                PathHelper.lineTo(lX, lY);
                PathHelper.lineTo(lX, fY);
                PathHelper.lineTo(fX, fY);
                PathHelper.closePath();
            },
            ellipse: function (fX, fY, lX, lY){
                //current.createObj(itemId, 'ellipse');
                createManage(itemId, 'ellipse');
                var ellipse = document.getElementById(itemId);
                ellipse.setAttribute('cx', fX - (fX-lX)/2);
                ellipse.setAttribute('cy', fY - (fY-lY)/2);
                ellipse.setAttribute('rx', Math.abs(fX-lX)/2);
                ellipse.setAttribute('ry', Math.abs(fY-lY)/2);
            },
            arrow: function(fX, fY, lX, lY){
                //current.createObj(itemId, 'path');
                createManage(itemId, 'path');
                // Draws the line
                PathHelper.moveTo(fX, fY);
                PathHelper.lineTo(lX, lY);
                
                // Arrow tip vector points
                var arrowTipPoints = {
                    "x":{"1":0,"2":30,"3":0},
                    "y":{"1":-10,"2":0,"3":10}
                };

                // Draws the given points array in given angle
                function drawRotated(arr, angle) 
                {
                    
                    for(var i=1; i<=3; i++){
                        var x2 = arrowTipPoints["x"][i];
                        var y2 = arrowTipPoints["y"][i];

                        var newX = x2*Math.cos(angle) - y2*Math.sin(angle);
                        var newY = x2*Math.sin(angle) + y2*Math.cos(angle);

                        PathHelper.lineTo(lX+parseFloat(newX), lY+parseFloat(newY) );
                    }

                    PathHelper.lineTo(lX, lY); // Closes the triangle
                }

                //Returns the current line angle in rads
                function getCurrentLineAngle()
                {
                    var angle_rad = Math.atan( (lY - fY) / (lX - fX) );

                    if(lX < fX)
                    {
                        var degree = -90;
                        angle_rad-=degree-1.1;
                    }

                    return angle_rad;
                }

                // Finnaly draws the arrow tip
                var distance = Math.sqrt(Math.pow(lX-fX,2)+Math.pow(lY-fY,2));

                if(distance > 0)
                    drawRotated(arrowTipPoints, getCurrentLineAngle());

            }
        }
    },

    liner: null, //buffer for closure
    drawLine: function(itemId, X, Y, time_between_lines_ticks){
        if(this.liner == null){
            this.liner = this.drawLineFactory();
        }

        return this.liner(itemId, X, Y, time_between_lines_ticks);
    },
    /* 
    This method is used in drawSVG.drawLine().
    You can read more about closures on https://www.w3schools.com/js/js_function_closures.asp
    */
    drawLineFactory: function() {
        var counter = 0;

        //Decrease to draw lines more often; increase to draw lines less often.
        //Greater numbers will produce 'low poly' line effect.
        var TIME_BETWEEN_LINES_TICKS = 10;
        function drawLineH(itemId, X, Y, time_between_lines_ticks = TIME_BETWEEN_LINES_TICKS) {
            counter++;
            //If a line was recently ended, we won't do anything for 10 ticks
            if (counter>=time_between_lines_ticks) {
                counter = 0;
                var path = document.getElementById(itemId);
                if (path.getAttribute('d')) {
                    PathHelper.lineTo(X, Y, itemId); //if path for
                } else {
                    PathHelper.moveTo(X, Y, itemId);
                }
            }
        }
        return drawLineH;
    },

    /*
        HTMLhelper is used to provide easy html implementation of base objects.
    */
    HTMLhelper: {

        renderPath: function(id, strokeWidth = "4px", strokeColor = "green", fill = "none"){
            return '<path class="svg-element" id="'+id+'" stroke-width="'+strokeWidth+'" fill="'+fill+'" stroke="'+strokeColor+'"></path>';
        },

        renderEllipse: function(id, strokeWidth = "4px", strokeColor = "green", fill = "none"){
            return '<ellipse class="svg-element" id="'+id+'" stroke="'+strokeColor+'" stroke-width="'+strokeWidth+'" fill="'+fill+'" />';
        }
    },

};

/*
    PathHelper implements methods of editing existing paths
*/
var PathHelper = {
    itemId:false,

    //Moves 'virtual brush' to the provided coordinates. If not used - 'virtual brush' will start from (0;0)
    moveTo: function(X, Y, itemId = this.itemId){ 
        var path = document.getElementById(itemId)
        path.setAttribute('d', "M"+X.toString()+","+Y.toString());
        return this;
    },

    //Draws the line from 'virtual brush' position to the provided coordinates
    lineTo: function(X, Y, itemId = this.itemId){ 
        var path = document.getElementById(itemId)
        path.setAttribute('d', path.getAttribute('d') + "L"+X.toString()+","+Y.toString());
        return this;
    },

    //Closes the path connectig the first point with the last
    closePath: function(itemId = this.itemId){
        var path = document.getElementById(itemId)
        path.setAttribute('d', path.getAttribute('d') + "z");
    },

    //itemId setter
    setIemId: function(itemId)
    {
        this.itemId = itemId;
    },
};