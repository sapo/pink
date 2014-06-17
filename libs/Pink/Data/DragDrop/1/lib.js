/**
 * @module Pink.Data.DragDrop
 * @desc Drag & Drop bindings
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */

Ink.createModule('Pink.Data.DragDrop', '1', ['Pink.Data.Binding_1', 'Ink.Dom.Element_1', 'Ink.Dom.Event_1', 'Ink.Dom.Css_1', 'Ink.Dom.Selector_1', 'Ink.Dom.Browser_1', 'Ink.UI.Common_1', 'Ink.Util.Array_1'], function(ko, inkEl, inkEvt, inkCss, inkSel, inkBrw, inkComn, inkArr) {
    var InkElement=inkEl, InkEvent=inkEvt, Css=inkCss, Browser=inkBrw, Selector=inkSel, Common=inkComn, InkArray=inkArr; // Alias

    var unknownDropId = 0;
    var dataTransfer=undefined; // Holds the dragged data (can be a single object or an array)
    var dropSuccess = false;
    var selectedData = []; // Array of selected objects (multi drag)
    var lastSelectedContainer = undefined;
    
    
    /*
     * Important note:
     * 
     * Ink's Draggable & Droppable components are embedded in this module to fix some implementation problems until these fixes reach upstream.
     * Check "PINK:" Comments bellow for fix details
     * 
     */
    
    /* 
     * Ink's Draggble Component With fixes
     *  
     */
    
    var x = 0,
    y = 1;  // For accessing coords in [x, y] arrays

    // Get a value between two boundaries
    function between (val, min, max) {
        val = Math.min(val, max);
        val = Math.max(val, min);
        return val;
    }
    
    /**
     * @class Ink.UI.Draggable
     * @version 1
     * @constructor
     * @param {String|DOMElement}   target                      Target element.
     * @param {Object}              [options]                   Optional object to configure the component.
     * @param {String}              [options.constraint]        Movement constraint. None by default. Can be `vertical`, `horizontal`, or `both`.
     * @param {String|DOMElement}   [options.constraintElm]     Constrain dragging to be within this element. None by default.
     * @param {Number}              [options.top]               Limits to constrain draggable movement.
     * @param {Number}              [options.right]             Limits to constrain draggable movement.
     * @param {Number}              [options.bottom]            Limits to constrain draggable movement.
     * @param {Number}              [options.left]              Limits to constrain draggable movement.
     * @param {String|DOMElement}   [options.handle]            If specified, this element or CSS ID will be used as a handle for dragging.
     * @param {Boolean}             [options.revert]            Flag to revert the draggable to the original position when dragging stops.
     * @param {String}              [options.cursor]            Cursor type (CSS `cursor` value) used when the mouse is over the draggable object.
     * @param {Number}              [options.zIndex]            Z-index applied to the draggable element while dragged.
     * @param {Number}              [options.fps]               If set, throttles the drag effect to this number of frames per second.
     * @param {DOMElement}          [options.droppableProxy]    If set, a shallow copy of this element will be moved around with transparent background.
     * @param {String}              [options.mouseAnchor]       Anchor for the drag. Can be one of: 'left','center','right','top','center','bottom'.
     * @param {String}              [options.dragClass]         Class to add when the draggable is being dragged. Defaults to drag.
     * @param {Function}            [options.onStart]           Callback called when dragging starts.
     * @param {Function}            [options.onEnd]             Callback called when dragging stops.
     * @param {Function}            [options.onDrag]            Callback called while dragging, prior to position updates.
     * @param {Function}            [options.onChange]          Callback called while dragging, after position updates.
     *
     * @sample Ink_UI_Draggable_1.html
     */
    var Draggable = function(element, options) {
        this.init(element, options);
    };
    
    Draggable.prototype = {
    
        /**
         * Init function called by the constructor
         * 
         * @method _init
         * @param {String|DOMElement}   element     Element ID of the element or DOM Element.
         * @param {Object}              [options]   Options object for configuration of the module.
         * @private
         */
        init: function(element, options) {
            var o = Ink.extendObj( {
                constraint:         false,
                constraintElm:      false,
                top:                false,
                right:              false,
                bottom:             false,
                left:               false,
                handle:             options.handler /* old option name */ || false,
                revert:             false,
                cursor:             'move',
                zindex:             options.zindex /* old option name */ || 9999,
                dragClass:          'drag',
                onStart:            false,
                onEnd:              false,
                onDrag:             false,
                onChange:           false,
                droppableProxy:     false,
                mouseAnchor:        undefined,
                skipChildren:       true,
                fps:                100,
                debug:              false
            }, options || {}, InkElement.data(element));
    
            this.options = o;
            this.element = Common.elOrSelector(element);
            this.constraintElm = o.constraintElm && Common.elOrSelector(o.constraintElm);
    
            this.handle             = false;
            this.elmStartPosition   = false;
            this.active             = false;
            this.dragged            = false;
            this.prevCoords         = false;
            this.placeholder        = false;
    
            this.position           = false;
            this.zindex             = false;
            this.firstDrag          = true;
    
            if (o.fps) {
                this.deltaMs = 1000 / o.fps;
                this.lastRunAt = 0;
            }
    
            this.handlers = {};
            this.handlers.start         = Ink.bindEvent(this._onStart,this);
            this.handlers.dragFacade    = Ink.bindEvent(this._onDragFacade,this);
            this.handlers.drag          = Ink.bindEvent(this._onDrag,this);
            this.handlers.end           = Ink.bindEvent(this._onEnd,this);
            this.handlers.selectStart   = function(event) {    InkEvent.stop(event);    return false;    };
    
            // set handle
            this.handle = (this.options.handle) ?
                Common.elOrSelector(this.options.handle) : this.element;
            this.handle.style.cursor = o.cursor;
    
            InkEvent.observe(this.handle, 'touchstart', this.handlers.start);
            InkEvent.observe(this.handle, 'mousedown', this.handlers.start);
    
            if (Browser.IE) {
                InkEvent.observe(this.element, 'selectstart', this.handlers.selectStart);
            }
    
            Common.registerInstance(this, this.element);
        },
    
        /**
         * Removes the ability of the element of being dragged
         * 
         * @method destroy
         * @public
         */
        destroy: function() {
            InkEvent.stopObserving(this.handle, 'touchstart', this.handlers.start);
            InkEvent.stopObserving(this.handle, 'mousedown', this.handlers.start);
    
            if (Browser.IE) {
                InkEvent.stopObserving(this.element, 'selectstart', this.handlers.selectStart);
            }
        },
    
        /**
         * Gets coordinates for a given event (with added page scroll)
         * 
         * @method _getCoords
         * @param {Object} e window.event object.
         * @return {Array} Array where the first position is the x coordinate, the second is the y coordinate
         * @private
         */
        _getCoords: function(e) {
            var ps = [InkElement.scrollWidth(), InkElement.scrollHeight()];
            return {
                x: (e.touches ? e.touches[0].clientX : e.clientX) + ps[x],
                y: (e.touches ? e.touches[0].clientY : e.clientY) + ps[y]
            };
        },
    
        /**
         * Clones src element's relevant properties to dst
         * 
         * @method _cloneStyle
         * @param {DOMElement} src Element from where we're getting the styles
         * @param {DOMElement} dst Element where we're placing the styles.
         * @private
         */
        _cloneStyle: function(src, dst) {
            dst.className = src.className;
            dst.style.borderWidth   = '0';
            dst.style.padding       = '0';
            dst.style.position      = 'absolute';
            dst.style.width         = InkElement.elementWidth(src)        + 'px';
            dst.style.height        = InkElement.elementHeight(src)    + 'px';
            dst.style.left          = InkElement.elementLeft(src)        + 'px';
            dst.style.top           = InkElement.elementTop(src)        + 'px';
            dst.style.cssFloat      = Css.getStyle(src, 'float');
            dst.style.display       = Css.getStyle(src, 'display');
        },
    
        /**
         * onStart event handler
         * 
         * @method _onStart
         * @param {Object} e window.event object
         * @return {Boolean|void} In some cases return false. Otherwise is void
         * @private
         */
        _onStart: function(e) {
            if (!this.active && InkEvent.isLeftClick(e) || typeof e.button === 'undefined') {
    
                var tgtEl = InkEvent.element(e);
                if (this.options.skipChildren && tgtEl !== this.handle) {    return;    }
    
                InkEvent.stop(e);
    
                Css.addClassName(this.element, this.options.dragClass);
    
                this.elmStartPosition = [
                    InkElement.elementLeft(this.element),
                    InkElement.elementTop( this.element)
                ];
    
                var pos = [
                    parseInt(Css.getStyle(this.element, 'left'), 10),
                    parseInt(Css.getStyle(this.element, 'top'),  10)
                ];
    
                var dims = InkElement.elementDimensions(this.element);
    
                this.originalPosition = [ pos[x] ? pos[x]: null, pos[y] ? pos[y] : null ];
                this.delta = this._getCoords(e); // mouse coords at beginning of drag
    
                this.active = true;
                this.position = Css.getStyle(this.element, 'position');
                this.zindex = Css.getStyle(this.element, 'zIndex');
    
                var div = document.createElement('div');
                div.style.position      = this.position;
                div.style.width         = dims[x] + 'px';
                div.style.height        = dims[y] + 'px';
                div.style.marginTop     = Css.getStyle(this.element, 'margin-top');
                div.style.marginBottom  = Css.getStyle(this.element, 'margin-bottom');
                div.style.marginLeft    = Css.getStyle(this.element, 'margin-left');
                div.style.marginRight   = Css.getStyle(this.element, 'margin-right');
                div.style.borderWidth   = '0';
                div.style.padding       = '0';
                div.style.cssFloat      = Css.getStyle(this.element, 'float');
                div.style.display       = Css.getStyle(this.element, 'display');
                div.style.visibility    = 'hidden';
    
                this.delta2 = [ this.delta.x - this.elmStartPosition[x], this.delta.y - this.elmStartPosition[y] ]; // diff between top-left corner of obj and mouse
                if (this.options.mouseAnchor) {
                    var parts = this.options.mouseAnchor.split(' ');
                    var ad = [dims[x], dims[y]];    // starts with 'right bottom'
                    if (parts[0] === 'left') {    ad[x] = 0;    } else if(parts[0] === 'center') {    ad[x] = parseInt(ad[x]/2, 10);    }
                    if (parts[1] === 'top') {     ad[y] = 0;    } else if(parts[1] === 'center') {    ad[y] = parseInt(ad[y]/2, 10);    }
                    this.applyDelta = [this.delta2[x] - ad[x], this.delta2[y] - ad[y]];
                }
    
                var dragHandlerName = this.options.fps ? 'dragFacade' : 'drag';
    
                this.placeholder = div;
    
                if (this.options.onStart) {        this.options.onStart(this.element, e);        }
    
                if (this.options.droppableProxy) {    // create new transparent div to optimize DOM traversal during drag
                    this.proxy = document.createElement('div');
                    dims = [
                        window.innerWidth     || document.documentElement.clientWidth   || document.body.clientWidth,
                        window.innerHeight    || document.documentElement.clientHeight  || document.body.clientHeight
                    ];
                    var fs = this.proxy.style;
                    fs.width            = dims[x] + 'px';
                    fs.height           = dims[y] + 'px';
                    fs.position         = 'fixed';
                    fs.left             = '0';
                    fs.top              = '0';
                    fs.zIndex           = this.options.zindex + 1;
                    fs.backgroundColor  = '#FF0000';
                    Css.setOpacity(this.proxy, 0);
    
                    var firstEl = document.body.firstChild;
                    while (firstEl && firstEl.nodeType !== 1) {    firstEl = firstEl.nextSibling;    }
                    document.body.insertBefore(this.proxy, firstEl);
    
                    
                    InkEvent.observe(this.proxy, 'mousemove', this.handlers[dragHandlerName]);
                    InkEvent.observe(this.proxy, 'touchmove', this.handlers[dragHandlerName]);
                }
                else {
                    InkEvent.observe(document, 'mousemove', this.handlers[dragHandlerName]);
                }
    
                this.element.style.position = 'absolute';
                this.element.style.zIndex = this.options.zindex;
                this.element.parentNode.insertBefore(this.placeholder, this.element);
    
                this._onDrag(e);
    
                InkEvent.observe(document, 'mouseup',      this.handlers.end);
                InkEvent.observe(document, 'touchend',     this.handlers.end);
    
                return false;
            }
        },
    
        /**
         * Function that gets the timestamp of the current run from time to time. (FPS)
         * 
         * @method _onDragFacade
         * @param {Object} window.event object.
         * @private
         */
        _onDragFacade: function(e) {
            var now = +new Date();
            if (!this.lastRunAt || now > this.lastRunAt + this.deltaMs) {
                this.lastRunAt = now;
                this._onDrag(e);
            }
        },
    
        /**
         * Function that handles the dragging movement
         * 
         * @method _onDrag
         * @param {Object} window.event object.
         * @private
         */
        _onDrag: function(e) {
            if (this.active) {
                InkEvent.stop(e);
                this.dragged = true;
                var mouseCoords = this._getCoords(e),
                    mPosX       = mouseCoords.x,
                    mPosY       = mouseCoords.y,
                    o           = this.options,
                    newX        = false,
                    newY        = false;
    
                if (this.prevCoords && mPosX !== this.prevCoords.x || mPosY !== this.prevCoords.y) {
                    if (o.onDrag) {        o.onDrag(this.element, e);        }
                    this.prevCoords = mouseCoords;
    
                    newX = this.elmStartPosition[x] + mPosX - this.delta.x;
                    newY = this.elmStartPosition[y] + mPosY - this.delta.y;
    
                    var draggableSize = InkElement.elementDimensions(this.element);
    
                    if (this.constraintElm) {
                        var offset = InkElement.offset(this.constraintElm);
                        var size = InkElement.elementDimensions(this.constraintElm);
                        var constTop = offset[y] + (o.top || 0),
                            constBottom = offset[y] + size[y] - (o.bottom || 0),
                            constLeft = offset[x] + (o.left || 0),
                            constRight = offset[x] + size[x] - (o.right || 0);
    
                        newY = between(newY, constTop, constBottom - draggableSize[y]);
                        newX = between(newX, constLeft, constRight - draggableSize[x]);
                    } else if (o.constraint) {
                        var right = o.right === false ? InkElement.pageWidth() - draggableSize[x] : o.right,
                            left = o.left === false ? 0 : o.left,
                            top = o.top === false ? 0 : o.top,
                            bottom = o.bottom === false ? InkElement.pageHeight() - draggableSize[y] : o.bottom;
                        if (o.constraint === 'horizontal' || o.constraint === 'both') {
                            newX = between(newX, left, right);
                        }
                        if (o.constraint === 'vertical' || o.constraint === 'both') {
                            newY = between(newY, top, bottom);
                        }
                    }
    
                    //var Droppable = Ink.getModule('Ink.UI.Droppable_1');
                    
                    // PINK: This needs to execute on every movement because droppable's containers viewport may change over time.
                    if (Droppable) {    Droppable.updateAll();    }
                    
                    if (this.firstDrag) {
                        //if (Droppable) {    Droppable.updateAll();    }
                        /*this.element.style.position = 'absolute';
                        this.element.style.zIndex = this.options.zindex;
                        this.element.parentNode.insertBefore(this.placeholder, this.element);*/
                        this.firstDrag = false;
                    }
    
                    if (newX) {        this.element.style.left = newX + 'px';        }
                    if (newY) {        this.element.style.top  = newY + 'px';        }
    
                    if (Droppable) {
                        // apply applyDelta defined on drag init
                        var mouseCoords2 = this.options.mouseAnchor ?
                            {x: mPosX - this.applyDelta[x], y: mPosY - this.applyDelta[y]} :
                            mouseCoords;
                        Droppable.action(mouseCoords2, 'drag', e, this.element);
                    }
                    if (o.onChange) {    o.onChange(this);    }
                }
            }
        },
    
        /**
         * Function that handles the end of the dragging process
         * 
         * @method _onEnd
         * @param {Object} window.event object.
         * @private
         */
        _onEnd: function(e) {
            InkEvent.stopObserving(document, 'mousemove', this.handlers.drag);
            InkEvent.stopObserving(document, 'touchmove', this.handlers.drag);
    
            if (this.options.fps) {
                this._onDrag(e);
            }
    
            Css.removeClassName(this.element, this.options.dragClass);
    
            if (this.active && this.dragged) {
    
                if (this.options.droppableProxy) {    // remove transparent div...
                    document.body.removeChild(this.proxy);
                }
    
                if (this.pt) {    // remove debugging element...
                    InkElement.remove(this.pt);
                    this.pt = undefined;
                }
    
                /*if (this.options.revert) {
                    this.placeholder.parentNode.removeChild(this.placeholder);
                }*/
    
                if(this.placeholder) {
                    InkElement.remove(this.placeholder);
                }
    
                if (this.options.revert) {
                    this.element.style.position = this.position;
                    if (this.zindex !== null) {
                        this.element.style.zIndex = this.zindex;
                    }
                    else {
                        this.element.style.zIndex = 'auto';
                    } // restore default zindex of it had none
    
                    this.element.style.left = (this.originalPosition[x]) ? this.originalPosition[x] + 'px' : '';
                    this.element.style.top  = (this.originalPosition[y]) ? this.originalPosition[y] + 'px' : '';
                }
    
                if (this.options.onEnd) {
                    this.options.onEnd(this.element, e);
                }
                
                //var Droppable = Ink.getModule('Ink.UI.Droppable_1');
                
                if (Droppable) {
                    Droppable.action(this._getCoords(e), 'drop', e, this.element);
                }
    
                this.position   = false;
                this.zindex     = false;
                this.firstDrag  = true;
            }
    
            this.active         = false;
            this.dragged        = false;
        }
    };
    
    
    /*
     * Ink's Droppable component with fixes
     * 
     */
    
    // Higher order functions
    var hAddClassName = function (element) {
        return function (className) {return Css.addClassName(element, className);};
    };
    var hRemoveClassName = function (element) {
        return function (className) {return Css.removeClassName(element, className);};
    };

    /**
     * @namespace Ink.UI.Droppable
     * @version 1
     * @static
     */
    var Droppable = {
        /**
         * Flag to activate debug mode
         *
         * @property debug
         * @type {Boolean}
         * @private
         */
        debug: false,

        /**
         * Array with the data of each element (`{element: ..., data: ..., options: ...}`)
         * 
         * @property _droppables
         * @type {Array}
         * @private
         */
        _droppables: [],

        /**
         * Array of data for each draggable. (`{element: ..., data: ...}`)
         *
         * @property _draggables
         * @type {Array}
         * @private
         */
        _draggables: [],

        /**
         * Makes an element droppable.
         * This method adds it to the stack of droppable elements.
         * Can consider it a constructor of droppable elements, but where no Droppable object is returned.
         * 
         * In the following arguments, any events/callbacks you may pass, can be either functions or strings. If the 'move' or 'copy' strings are passed, the draggable gets moved into this droppable. If 'revert' is passed, an acceptable droppable is moved back to the element it came from.

         *
         * @method add
         * @param {String|DOMElement}   element                 Target element
         * @param {Object}              [options]               Options object
         * @param {String}              [options.hoverClass]    Classname(s) applied when an acceptable draggable element is hovering the element
         * @param {String}              [options.accept]        Selector for choosing draggables which can be dropped in this droppable.
         * @param {Function}            [options.onHover]       Callback when an acceptable draggable element is hovering the droppable. Gets the draggable and the droppable element as parameters.
         * @param {Function|String}     [options.onDrop]        Callback when an acceptable draggable element is dropped. Gets the draggable, the droppable and the event as parameters.
         * @param {Function|String}     [options.onDropOut]     Callback when a droppable is dropped outside this droppable. Gets the draggable, the droppable and the event as parameters. (see above for string options).
         * @public
         *
         * @sample Ink_UI_Droppable_1.html
         *
         */
        add: function(element, options) {
            element = Common.elOrSelector(element, 'Droppable.add target element');

            var opt = Ink.extendObj( {
                hoverClass:     options.hoverclass /* old name */ || false,
                accept:         false,
                onHover:        false,
                onDrop:         false,
                onDropOut:      false
            }, options || {}, InkElement.data(element));
            
            if (typeof opt.hoverClass === 'string') {
                opt.hoverClass = opt.hoverClass.split(/\s+/);
            }
            
            function cleanStyle(draggable) {
                draggable.style.position = 'inherit';
            }
            var that = this;
            var namedEventHandlers = {
                move: function (draggable, droppable/*, event*/) {
                    cleanStyle(draggable);
                    droppable.appendChild(draggable);
                },
                copy: function (draggable, droppable/*, event*/) {
                    cleanStyle(draggable);
                    droppable.appendChild(draggable.cloneNode);
                },
                revert: function (draggable/*, droppable, event*/) {
                    that._findDraggable(draggable).originalParent.appendChild(draggable);
                    cleanStyle(draggable);
                }
            };
            var name;

            if (typeof opt.onHover === 'string') {
                name = opt.onHover;
                opt.onHover = namedEventHandlers[name];
                if (opt.onHover === undefined) {
                    throw new Error('Unknown hover event handler: ' + name);
                }
            }
            if (typeof opt.onDrop === 'string') {
                name = opt.onDrop;
                opt.onDrop = namedEventHandlers[name];
                if (opt.onDrop === undefined) {
                    throw new Error('Unknown drop event handler: ' + name);
                }
            }
            if (typeof opt.onDropOut === 'string') {
                name = opt.onDropOut;
                opt.onDropOut = namedEventHandlers[name];
                if (opt.onDropOut === undefined) {
                    throw new Error('Unknown dropOut event handler: ' + name);
                }
            }

            var elementData = {
                element: element,
                data: {},
                options: opt
            };
            this._droppables.push(elementData);
            this._update(elementData);
        },
        
        /**
         * Finds droppable data about `element`. this data is added in `.add`
         *
         * @method _findData
         * @param {DOMElement} element  Needle
         * @return {object}             Droppable data of the element
         * @private
         */
        _findData: function (element) {
            var elms = this._droppables;
            for (var i = 0, len = elms.length; i < len; i++) {
                if (elms[i].element === element) {
                    return elms[i];
                }
            }
        },
        /**
         * Finds draggable data about `element`
         *
         * @method _findDraggable
         * @param {DOMElement} element  Needle
         * @return {Object}             Draggable data queried
         * @private
         */
        _findDraggable: function (element) {
            var elms = this._draggables;
            for (var i = 0, len = elms.length; i < len; i++) {
                if (elms[i].element === element) {
                    return elms[i];
                }
            }
        },

        /**
         * Invoke every time a drag starts
         * 
         * @method updateAll
         * @private
         */
        updateAll: function() {
            InkArray.each(this._droppables, Droppable._update);
        },

        /**
         * Updates location and size of droppable element
         * 
         * @method update
         * @param {String|DOMElement} element Target element
         * @public
         */
        update: function(element) {
            this._update(this._findData(element));
        },

        _update: function(elementData) {
            var data = elementData.data;
            var element = elementData.element;
            
            // PINK: This doesn't work with inner viewports 
            /*
            data.left   = InkElement.offsetLeft(element);
            data.top    = InkElement.offsetTop( element);
            data.right  = data.left + InkElement.elementWidth( element);
            data.bottom = data.top  + InkElement.elementHeight(element);
            */
            
            // This is better 
            var ps = [InkElement.scrollWidth(), InkElement.scrollHeight()];
            var clientRect = element.getBoundingClientRect();
            
            data.left = clientRect.left + ps [0];
            data.top = clientRect.top + ps[1];
            data.right = clientRect.right + ps[0];
            data.bottom = clientRect.bottom + ps[1];
        },

        /**
         * Removes an element from the droppable stack and removes the droppable behavior
         * 
         * @method remove
         * @param {String|DOMElement} elOrSelector  Droppable element to disable.
         * @return {Boolean} Whether the object was found and deleted
         * @public
         */
        remove: function(el) {
            el = Common.elOrSelector(el);
            var len = this._droppables.length;
            for (var i = 0; i < len; i++) {
                if (this._droppables[i].element === el) {
                    this._droppables.splice(i, 1);
                    break;
                }
            }
            return len !== this._droppables.length;
        },

        /**
         * Executes an action on a droppable
         * 
         * @method action
         * @param {Object} coords       Coordinates where the action happened
         * @param {String} type         Type of action. 'drag' or 'drop'.
         * @param {Object} ev           Event object
         * @param {Object} draggable    Draggable element
         * @private
         */
        action: function(coords, type, ev, draggable) {
            // check all droppable elements
            InkArray.each(this._droppables, Ink.bind(function(elementData) {
                var data = elementData.data;
                var opt = elementData.options;
                var element = elementData.element;

                if (opt.accept && !Selector.matches(opt.accept, [draggable]).length) {
                    return;
                }

                if (type === 'drag' && !this._findDraggable(draggable)) {
                    this._draggables.push({
                        element: draggable,
                        originalParent: draggable.parentNode
                    });
                }

                // check if our draggable is over our droppable
                if (coords.x >= data.left && coords.x <= data.right &&
                        coords.y >= data.top && coords.y <= data.bottom) {
                    // INSIDE
                    if (type === 'drag') {
                        if (opt.hoverClass) {
                            InkArray.each(opt.hoverClass,
                                hAddClassName(element));
                        }
                        if (opt.onHover) {
                            // PINK: Added event parameter 
                            opt.onHover(draggable, element, ev);
                        }
                    } else if (type === 'drop') {
                        if (opt.hoverClass) {
                            InkArray.each(opt.hoverClass,
                                hRemoveClassName(element));
                        }
                        if (opt.onDrop) {
                            opt.onDrop(draggable, element, ev);
                        }
                    }
                } else {
                    // OUTSIDE

                    if (type === 'drag' && opt.hoverClass) {
                        InkArray.each(opt.hoverClass, hRemoveClassName(element));
                    } else if (type === 'drop') {
                        if(opt.onDropOut){
                            opt.onDropOut(draggable, element, ev);
                        }
                    }
                }
            }, this));
        }
    };
    
    
    /*
     * Droppable binding handler
     * 
     * Description: A panel that accepts draggable drops
     * 
     * Binding value: {Object}
     * Binding value properties: 
     * - {string} hoverClass: class name to add to the element when a draggable hovers over it 
     * - {function} dropHandler: function to execute when a draggable is dropped in this droppable (receives selectedData as a parameter)
     * 
     * Binding example: {hoverClass: 'my-drop-panel', dropHandler: handleDrop)}
     * 
     */
    ko.bindingHandlers.droppable = {
        _handleDrop: function(binding, draggable, droppable, evt) {
            var receiverEl;
            var dataIndex;
            
            if (draggable.parentNode) {
                draggable.parentNode.removeChild(draggable);
            }
            
            if (typeof binding.dropHandler == 'function') {
                receiverEl=document.elementFromPoint(evt.clientX, evt.clientY);
                receiverEl=inkEl.findUpwardsByClass(receiverEl, 'drag-enabled');

                dataIndex=(receiverEl?parseInt(receiverEl.getAttribute('data-index'), 10):undefined);
                binding.dropHandler(dataTransfer, dataIndex);
            }
            dropSuccess=true;
        }, 

        _clearHints: function() {
        	var hints;
        	var i;

        	hints = Ink.ss('.drop-place-hint-before');
        	for (i=0; i < hints.length; i++) {
        		inkCss.removeClassName(hints[i], 'drop-place-hint-before');
        	}
        	hints = Ink.ss('.drop-place-hint-after');
        	for (i=0; i < hints.length; i++) {
        		inkCss.removeClassName(hints[i], 'drop-place-hint-after');
        	}
        },
        
        _handleHover: function(draggable, droppable, evt) {
        	var receiverEl;

        	ko.bindingHandlers.droppable._clearHints();
        	receiverEl=document.elementFromPoint(evt.clientX, evt.clientY);
            receiverEl=inkEl.findUpwardsByClass(receiverEl, 'drag-enabled');

        	if (receiverEl) {
        		inkCss.addClassName(receiverEl, 'drop-place-hint-before');
        	} else {
        		receiverEl=Ink.ss('.drag-enabled', droppable);
        		if (receiverEl.length>0) {
            		if (inkCss.hasClassName(receiverEl[receiverEl.length-1], 'draggable-proxy')) {
            			receiverEl.pop();
            		} 
            		receiverEl=receiverEl[receiverEl.length-1];
            		inkCss.addClassName(receiverEl, 'drop-place-hint-after');
        		}
        	}
        }, 

        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var attr;
            var binding = ko.unwrap(valueAccessor());
            var options = {hoverClass: 'drop-panel-active', onHover: ko.bindingHandlers.droppable._handleHover, onDrop: ko.bindingHandlers.droppable._handleDrop.bind(this, binding), onDropOut: ko.bindingHandlers.droppable._clearHints}; 
            
            if (typeof binding == 'object') {
                for (attr in binding) {
                    options[attr] = ko.unwrap(binding[attr]);
                }
            }
            
            inkCss.addClassName(element, 'disable-text-selection');
            
            // The droppable element must have a valid id
            element.id = element.id || 'droppable'+(unknownDropId++);
            Droppable.add(element, options);
        }
    };
    

    /*
     * Draggable container binding handler
     * 
     * Description: a panel that hosts a list of draggable objects (with multi-drag) support
     * 
     * Binding value: {Object}
     * Binding value properties: 
     * - {object} source: Array or ObservableArray that contains the draggable objects 
     * - {string} draggableTemplate: id of template to render the draggable
     * - {function} dropHandler: function to execute when a draggable from this container is dropped in a droppable (receives the selectedData as a parameter)
     * 
     * Binding example: {source: grayItems, draggableTemplate: 'veggieTemplate', dragOutHandler: onDragOut}
     * 
     */
    ko.bindingHandlers.draggableContainer = {
        _dragX: -1,
        _dragY: -1,
        _isMouseDown: false,
        _isDragging: false,
        _draggable: undefined,
        
        _handleDragStart: function(evt) {
            if (!ko.bindingHandlers.draggableContainer._isMouseDown) {
                ko.bindingHandlers.draggableContainer._isMouseDown = true;
                ko.bindingHandlers.draggableContainer._dragX = evt.screenX;
                ko.bindingHandlers.draggableContainer._dragY = evt.screenY;
            }
        },
        
        _handleDragEnd: function(evt) {
            ko.bindingHandlers.draggableContainer._isMouseDown = false;
            if (ko.bindingHandlers.draggableContainer._isDragging) {
                window.setTimeout(function() {
                    ko.bindingHandlers.draggableContainer._isDragging = false;

                    if (typeof ko.bindingHandlers.dragEndHandler == 'function') {
                        ko.bindingHandlers.dragEndHandler();
                    }
                }, 500);
            }
        },
        
        _clearSelection: function() {
            var selectedItems;
            var i;

            selectedItems = inkSel.select('.draggable-selected');
            for (i=0; i<selectedItems.length; i++) {
                inkCss.removeClassName(selectedItems[i], 'draggable-selected');
            }

            selectedData = [];
            lastSelectedContainer = undefined;
        },
        
        _handleDrop: function(binding, dragProxyElement) {
            window.setTimeout(function() {
                if (dropSuccess) {
                    if (typeof binding.dragOutHandler == 'function') {
                        binding.dragOutHandler(dataTransfer);
                    }
                } else {
                	if (dragProxyElement.parentNode) {
                        dragProxyElement.parentNode.removeChild(dragProxyElement);
                	}
                }
                ko.bindingHandlers.draggableContainer._clearSelection();
            }, 0);
        },
        
        _cloneEvent: function(evt) {
            return {
               target: evt.target,
               type: evt.type,
               button: evt.button,
               clientX: evt.clientX,
               clientY: evt.clientY,
               screenX: evt.screenX,
               screenY: evt.screenY,
               relatedTarget: evt.relatedTarget
            };
        },
        
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var binding = ko.unwrap(valueAccessor());
            var draggable;
            var draggableElement;
            var dragThreshold = (binding.dragThreshold || 4);
            var lastSelectedIndex=-1;

            var handleSelection = function(data, evt) {
                var draggableElement;
                var i, start, stop;
                var selectedIndex;
                var elements;
                var source = ko.unwrap(binding.source);

                if (!ko.bindingHandlers.draggableContainer._isDragging) {
                    // If the user selects an item from a different container let's clear the old selection
                    if (lastSelectedContainer != element) {
                        ko.bindingHandlers.draggableContainer._clearSelection();
                        lastSelectedContainer = element;
                        lastSelectedIndex=-1;
                    }
                    
                    draggableElement = inkEl.findUpwardsByClass(evt.target, 'drag-enabled');
                    selectedIndex = draggableElement.getAttribute('data-index');

                    if (evt.shiftKey && (selectedIndex!=lastSelectedIndex) && (lastSelectedIndex!=-1)) {
                        elements = inkSel.select('.drag-enabled', lastSelectedContainer);

                        if (lastSelectedIndex > selectedIndex) {
                            start=selectedIndex;
                            stop=lastSelectedIndex;
                        } else {
                            stop=selectedIndex;
                            start=lastSelectedIndex;
                        }
                        
                        for (i=start; i<=stop; i++) {
                            inkCss.addClassName(elements[i], 'draggable-selected');
                            
                            if (selectedData.indexOf(source[i])==-1) {
                                selectedData.push(source[i]);
                            }
                        }
                    } else {
                        inkCss.toggleClassName(draggableElement, 'draggable-selected');
                        i = selectedData.indexOf(data);
                        if (i !=-1) {
                            selectedData.splice(i, 1);
                        } else {
                            selectedData.push(data);
                        }
                    }
                    
                    lastSelectedIndex = selectedIndex;
                }
            };

            
            var handleDragMove = function(data, evt) {
                var draggableElement;
                var draggableProxy;
                var draggable;
                var clonedEvent;
                var localScroll;

                draggableElement = inkEl.findUpwardsByClass(evt.target, 'drag-enabled');
                
                if (ko.bindingHandlers.draggableContainer._isMouseDown && !ko.bindingHandlers.draggableContainer._isDragging) {
                    if ( (Math.abs(evt.screenX-ko.bindingHandlers.draggableContainer._dragX) > dragThreshold) ||
                         (Math.abs(evt.screenY-ko.bindingHandlers.draggableContainer._dragY) > dragThreshold) 
                       ) {
                        ko.bindingHandlers.draggableContainer._isDragging = true;

                        // If the dragged element isn't selected let's clear the selection
                        if (!inkCss.hasClassName(draggableElement, 'draggable-selected')) {
                            ko.bindingHandlers.draggableContainer._clearSelection();
                        }
                        
                        if (selectedData.length <= 1) {
                            draggableProxy = inkEl.htmlToFragment('<div>'+draggableElement.innerHTML+'</div>').firstChild;
                            dataTransfer = data;
                        } else {
                            draggableProxy = inkEl.htmlToFragment('<div>Multile elements selected</div>').firstChild;
                            dataTransfer = selectedData;
                        }

                        draggableProxy.style.position = 'absolute';
                        draggableProxy.style.width = inkEl.elementWidth(draggableElement) + 'px';
                        draggableProxy.style.height = inkEl.elementHeight(draggableElement) + 'px';
                        
                        draggableProxy.style.left = (evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - (inkEl.elementWidth(draggableElement) / 2)) + 'px';
                        draggableProxy.style.top = (evt.clientY + document.body.scrollTop + document.documentElement.scrollTop - (inkEl.elementHeight(draggableElement) / 2)) + 'px';
                        
                        inkCss.addClassName(draggableProxy, 'draggable-proxy');
                        
                        draggableProxy=document.body.appendChild(draggableProxy);
                        
                        clonedEvent = ko.bindingHandlers.draggableContainer._cloneEvent(evt);
                        clonedEvent.target=draggableProxy;
                        
                        dropSuccess = false;
                        draggable=new Draggable(draggableProxy, {cursor: 'move', onEnd: ko.bindingHandlers.draggableContainer._handleDrop.bind(this, binding)});
                        
                        draggable.handlers.start(clonedEvent);
                        ko.bindingHandlers.draggableContainer._draggable=draggable;
                        
                        if (typeof ko.bindingHandlers.dragStartHandler == 'function') {
                            ko.bindingHandlers.dragStartHandler();
                        }
                    }
                } 
            };
            
            inkCss.addClassName(element, 'draggable-container');
            inkCss.addClassName(element, 'disable-text-selection');
            
            ko.computed(function() {
                var source = ko.unwrap(binding.source);
                var childElements;
                var i;
                
                childElements = inkSel.select('.drag-enabled', element);
                
                for (i=0; i < childElements.length; i++) {
                    inkEvt.stopObserving(childElements[i], 'click');
                    inkEvt.stopObserving(childElements[i], 'mousemove');
                    inkEvt.stopObserving(childElements[i], 'mousedown');
                    inkEvt.stopObserving(childElements[i], 'mouseup');
                    
                    childElements[i].parentNode.removeChild(childElements[i]);
                }
                
                for (i=0; i < source.length; i++) {
                    draggable = source[i];
                    draggable.guid = guid();
                    draggable.afterRender = binding.afterDraggableRender;
                    
                    draggableElement = inkEl.htmlToFragment('<div data-index="'+i+'" class="drag-enabled disable-text-selection" style="cursor: move" data-bind="template: {afterRender: $data.afterRender, name: \''+binding.draggableTemplate+'\'}"/>').firstChild;
                    draggableElement.dataTransfer = {data: draggable};
                    
                    ko.applyBindings(draggable, draggableElement);
                    
                    element.appendChild(draggableElement);
                    inkEvt.observe(draggableElement, 'click', handleSelection.bind(this, draggable));
                    inkEvt.observe(draggableElement, 'mousemove', handleDragMove.bind(this, draggable));

                    inkEvt.observe(draggableElement, 'mousedown', ko.bindingHandlers.draggableContainer._handleDragStart);
                    inkEvt.observe(document, 'mouseup', ko.bindingHandlers.draggableContainer._handleDragEnd);
                }
                
            });
            
            return {controlsDescendantBindings: true};
        }
    };
    
    function guid() {
        function S4() {
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
        }
        return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();    
    }
    
    return {};
});
