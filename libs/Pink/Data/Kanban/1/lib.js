/**
 * @module Pink.Data.Kanban
 * @desc Kanban widget
 * @author hlima, ecunha, ttt  AT sapo.pt
 * @version 1
 */    

Ink.createModule('Pink.Data.Kanban', '1', ['Pink.Data.Binding_1', 'Ink.Dom.Event_1', 'Ink.UI.Toggle_1', 'Pink.Data.DragDrop_1'], function(ko, inkEvt, Toggle) {
    'use strict';

    var Card = function(card) {
        Ink.extendObj(this, card);
    };
    
    var Section = function(section) {
        Ink.extendObj(this, section);
        this.dataFlavor = Card;
    };
    
    var Module = function(options) {
        var self = this;
        var multiSelection = options.multiSelection;
        
        this.sections = ko.computed(function() {
            var src = ko.unwrap(options.sections);
            var i;
            var sections = [];
            var section;
            
            for (i = 0; i < src.length; i++) {
                section = src[i];
                section.kanban = self;
                section.multiSelection = multiSelection;
                sections.push(section);
            }
            
            return sections;
        });

        this.afterRender = options.afterRender;
        this.cardsMovedHandler = options.cardsMovedHandler;
        this.previewMoveHandler = options.previewMoveHandler;
        this.preventDragout = false;
        this.sectionMovedHandler = options.sectionMovedHandler;
        
        this.sectionsContainer = {
            source: this.sections,
            draggableTemplate: 'Pink.Data.Kanban.SectionTemplate',
            afterDraggableRender: this.afterRender,
            dataFlavor: Section,
            horizontalLayout: true,
            dropHandler: function(section, index) {
                if (self.sectionMovedHandler) {
                    self.sectionMovedHandler(section, index);
                }
            },
            dragHandle: options.dragHandle || '.pink-drag-handle'
        };
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
        var oldItem;

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
    			self.cardsMovedHandler(source, data, newIndex);
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
    
    Module.Card = Card;
    Module.Section = Section;
    
    return Module;
});
