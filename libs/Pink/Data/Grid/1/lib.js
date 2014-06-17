/**
 * @module Pink.Data.Grid
 * @desc Data grid widget
 * @author hlima, ecunha, ttt AT sapo.pt
 * @version 1
 */
Ink.createModule('Pink.Data.Grid', '1', ['Pink.Data.Module_1', 'Pink.Data.Paginator_1'],   function(ko, Paginator) {
    // Private function
    function getColumnsForScaffolding(data) {
        if ((typeof data.length !== 'number') || data.length === 0) {
            return [];
        }
        var columns = [];
        for ( var propertyName in data[0]) {
            columns.push({
                headerText : propertyName,
                rowText : propertyName
            });
        }
        return columns;
    }

    /*
     * Module parameters:
     * 
     * configuration: object {
     *   data: observableArray with the records to be paginated
     *   pageSize: default 5
     *   columns: array with the column info (eg. caption)
     * }
     * 
     */
    var Module = function(configuration) {
        Paginator.call(this, configuration); // Inherit from the Paginator's class

        var sortHandler;
        
        this.sortedColumn = undefined;

        // If you don't specify columns configuration,
        // we'll use scaffolding
        this.columns = configuration.columns || getColumnsForScaffolding(ko.utils.unwrapObservable(this.data));

        // Wrap the sort handler to introduce the
        // header icon update logic
        for (var columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
            sortHandler = this.columns[columnIndex].headerSortHandler;

            if (typeof sortHandler == 'function') {
                this.columns[columnIndex].headerSortHandler = (function() {
                    var wrappedHandler = sortHandler;

                    return function(column) {
                        if (self.sortedColumn && (self.sortedColumn != column)) {
                            self.sortedColumn.headerSortOrder('sort');
                        }
                        self.sortedColumn = column;

                        if (column.headerSortOrder() == 'sort')
                            column.headerSortOrder('asc');
                        else if (column.headerSortOrder() == 'asc')
                            column.headerSortOrder('desc');
                        else
                            column.headerSortOrder('sort');

                        wrappedHandler(column);
                    }
                })();
            }
        }
    };
    
    /* 
     * simpleGrid binding handler
     * 
     */
    ko.bindingHandlers.simpleGrid = {
        init : function() {
            return {
                'controlsDescendantBindings' : true
            };
        },
        
        // This method is called to initialize the node, and will also be called again if you change what the grid is bound to
        update : function(element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default templates to be overridden
            var gridTemplateName = allBindings.simpleGridTemplate || 'Pink.Data.Grid.InkGridTemplate';
            var pageLinksTemplateName = allBindings.simpleGridPagerTemplate || 'Pink.Data.Paginator.InkPagerTemplate';

            // Render the main grid
            var gridContainer = element.appendChild(document.createElement('DIV'));
            ko.renderTemplate(gridTemplateName, viewModel, {}, gridContainer, 'replaceNode');

            // Render the page links
            var pageLinksContainer = element.appendChild(document.createElement('DIV'));
            ko.renderTemplate(pageLinksTemplateName, viewModel, {}, pageLinksContainer, 'replaceNode');
        }
    };
    
    return Module;
});