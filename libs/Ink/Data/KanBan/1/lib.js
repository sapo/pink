/**
 * @module Ink.Data.KanBan
 * @desc KanBan widget
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */    

Ink.createModule('Ink.Data.KanBan', '1', ['Ink.Data.Binding_1', 'Ink.Dom.Event_1', 'Ink.UI.Toggle_1', 'Ink.Data.DragDrop_1'], function(ko, inkEvt, Toggle) {
    var Module = function(options) {
        this.moduleName = 'Ink.Data.KanBan';
        this.sections = options.sections;
        this.afterRender = options.afterRender;
        this.cardsMovedHandler = options.cardsMovedHandler;
        this.previewMoveHandler = options.previewMoveHandler;
        this.preventDragout = false;
    };

    // This handler is called after the dropHandler and containes the logic to remove/preserve the item from/in it's origin
    Module.prototype.dragOutHandler = function(source, data) {
        var i;
        var dataIndex;
        
        if (this.preventDragout) {
            this.preventDragout = false;
            return;
        }
        
        if (typeof data.length == 'undefined') {
            if ((typeof data.moveOnDrop=='undefined') || data.moveOnDrop) {
                i=source.indexOf(data);
                if (i != -1) {
                    source.splice(i, 1);
                }
            }
        } else {
            for (dataIndex=0; dataIndex < data.length; dataIndex++) {
                if ((typeof data[dataIndex].moveOnDrop=='undefined') || data[dataIndex].moveOnDrop) {
                    i=source.indexOf(data[dataIndex]);
                    if (i != -1) {
                        source.splice(i, 1);
                    }
                    
                }
            }
        }
    };
    
    Module.prototype.dropHandler = function(source, data, index) {
        var self=this;
    	var i;
        var oldItem = undefined;

        // The data array needs to be cloned to allow the client to modify the cards after the move 
        if (data.length === undefined) {
        	data = [data];
        } else {
            data = data.slice(0);
        }
        
        if (this.previewMoveHandler !== undefined) {
            if (!this.previewMoveHandler(source, data, index)) {
                this.preventDragout = true;
                return;
            }
        }
        
        if (index !== undefined) {
            oldItem = source()[index];

            // if the oldItem is equal to the dropped data item, then it's going to be removed
            // so, let's go to the next one
        	for (i=0; i < data.length; i++) {
            	if ( (data[i] === oldItem) && (++index<source().length) ) {
            		oldItem = source()[index];
            	}
        	}
            	
        	if (index==source().length) {
        		oldItem = undefined;
        	}
        }
        
        window.setTimeout(function() {
            var newIndex;
            var item;

            if (oldItem !== undefined) {
            	newIndex = source.indexOf(oldItem);
        	} else {
        		newIndex = source().length;
        	}
            
        	for (i=0; i < data.length; i++) {
        		item=data[data.length-1-i];
        		source.splice(newIndex, 0, item);
        	}

        	if (self.cardsMovedHandler) {
    			self.cardsMovedHandler(source, data);
    		}
        }, 0);
    };
    
    Module.prototype.afterCardRender = function(elements) {
        // Hack to wait for the elements to be attached to the DOM :(
        window.setTimeout(function() {
            var card=Ink.s('.toggle', elements[0]);
            if (card) {
                try {
                    new Toggle(card);
                } catch (error) {
                }
            }
        }, 50);
    };
    
    return Module;
});
