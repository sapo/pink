/**
 * @module Pink.Data.Paginator
 * @desc Paginator view model class and binding handler
 * @author hlima, ecunha, ttt AT sapo.pt
 * @version 1
 */
Ink.createModule('Pink.Data.Paginator', '1', [ 'Pink.Data.Module_1' ], function(ko) {
    /*
     * Module parameters:
     * 
     * configuration: object {
     *   data: observableArray with the records to be paginated
     *   pageSize: default 5
     *   pageSizeOptionList: int array (eg. [5,10,50])
     * }
     * 
     */
    var Module = function(configuration) {
        var self = this;
        
        this.data = configuration.data;
        this.currentPageIndex = ko.observable(0);
        this.pageSize = ko.observable(configuration.pageSize || 5);
        this.pageSizeOptionList = configuration.pageSizeOptionList;
        this.showPageCaption = configuration.showPageCaption;
        this.maxPaginatorItems = configuration.maxPaginatorItems || 9;

        // If the backing data's record count changes,
        // let's navigate to the first page
        if (ko.isObservable(this.data)) {
            this.data.subscribe(function() {
                self.currentPageIndex(0);
            });
        }

        this.itemsOnCurrentPage = ko.computed(function() {
            var startIndex = self.pageSize() * self.currentPageIndex();
            return self.data.slice(startIndex, startIndex + self.pageSize());
        }, this);

        this.maxPageIndex = ko.computed(function() {
            return Math.ceil(ko.utils.unwrapObservable(self.data).length / self.pageSize()) - 1;
        }, this);
        
        this.pageCaption = ko.computed(function() {
            var startIndex = self.pageSize() * self.currentPageIndex() + 1;
            var endIndex = startIndex + self.pageSize() - 1;
            var itemsCount = self.data().length;
            
            endIndex = (endIndex>itemsCount?itemsCount:endIndex);

            return (itemsCount>0?''+startIndex+'-'+endIndex+'/'+itemsCount:'');
        });

        this._buildPages = function(pages, start, end) {
            var page;

            for (var i = start; i <= end; i++) {
                page = {};
                page['pageNum'] = i + 1;
                page['active'] = (i == self.currentPageIndex());
                page['dots'] = false;

                // vamos criar uma closure para ficarmos
                // com uma cópia do numero da página
                // para o click handler
                (function() {
                    var pageNum = i;

                    page['goTo'] = function() {
                        self.currentPageIndex(pageNum);
                    };
                })();

                pages.push(page);
            }
        };

        this.pages = ko.computed(function() {
            var pages = [];
            var page;
            var start = self.currentPageIndex() - ((self.maxPaginatorItems-3) / 2);
            var end = self.currentPageIndex() + ((self.maxPaginatorItems-3) / 2);

            // Caso extremo 1
            if (self.maxPageIndex() < self.maxPaginatorItems) {
                self._buildPages(pages, 0, self.maxPageIndex());
                return pages;
            }

            // Caso extremo 2
            if (self.currentPageIndex() <= ((self.maxPaginatorItems-1)/2)) {
                self._buildPages(pages, 0, self.maxPaginatorItems-2);
                if (self.maxPageIndex() >= self.maxPaginatorItems-3) {
                    page = {};
                    page['pageNum'] = '...';
                    page['active'] = false;
                    page['dots'] = true;
                    pages.push(page);

                    page = {};
                    page['pageNum'] = self.maxPageIndex() + 1;
                    page['active'] = (self.maxPageIndex() == self.currentPageIndex());
                    page['dots'] = false;
                    page['goTo'] = function() {
                        self.currentPageIndex(self.maxPageIndex());
                    };

                    pages.push(page);
                }
                return pages;
            }

            // Caso extremo 3
            if (self.currentPageIndex() >= self.maxPageIndex() - ((self.maxPaginatorItems-1)/2)) {
                page = {};
                page['pageNum'] = 1;
                page['active'] = (0 === self.currentPageIndex());
                page['dots'] = false;
                page['goTo'] = function() {
                    self.currentPageIndex(0);
                };
                pages.push(page);

                page = {};
                page['pageNum'] = '...';
                page['active'] = false;
                page['dots'] = true;
                pages.push(page);

                self._buildPages(pages, self.maxPageIndex() - (self.maxPaginatorItems-2), self.maxPageIndex());

                return pages;
            }

            // Todos os outros casos
            page = {};
            page['pageNum'] = 1;
            page['active'] = (0 === self.currentPageIndex());
            page['dots'] = false;
            page['goTo'] = function() {
                self.currentPageIndex(0);
            };
            pages.push(page);

            page = {};
            page['pageNum'] = '...';
            page['active'] = false;
            page['dots'] = true;
            pages.push(page);

            self._buildPages(pages, start, end);

            page = {};
            page['pageNum'] = '...';
            page['active'] = false;
            page['dots'] = true;
            pages.push(page);

            page = {};
            page['pageNum'] = self.maxPageIndex() + 1;
            page['active'] = (self.maxPageIndex() == self.currentPageIndex());
            page['dots'] = false;
            page['goTo'] = function() {
                self.currentPageIndex(self.maxPageIndex());
            };
            pages.push(page);

            return pages;
        });

        this.backDisabled = ko.computed(function() {
            return self.currentPageIndex() === 0;
        });

        this.forwardDisabled = ko.computed(function() {
            return self.currentPageIndex() == self.maxPageIndex();
        });

        this.stepForward = function() {
            if (self.currentPageIndex() < self.maxPageIndex())
                self.currentPageIndex(self.currentPageIndex() + 1);
        };

        this.stepBackward = function() {
            if (self.currentPageIndex() > 0)
                self.currentPageIndex(self.currentPageIndex() - 1);
        };
    };

    /* 
     * paginator binding handler
     * 
     */
    ko.bindingHandlers.paginator = {
        init : function() {
            return {
                'controlsDescendantBindings' : true
            };
        },
        
        update : function(element, viewModelAccessor, allBindingsAccessor) {
            var viewModel = viewModelAccessor(), allBindings = allBindingsAccessor();

            // Empty the element
            while (element.firstChild)
                ko.removeNode(element.firstChild);

            // Allow the default template to be overridden
            var pageLinksTemplateName = allBindings.pagerTemplate || 'Pink.Data.Paginator.InkPagerTemplate';

            // Render the page links
            var pageLinksContainer = element.appendChild(document.createElement('DIV'));
            ko.renderTemplate(pageLinksTemplateName, viewModel, {}, pageLinksContainer, 'replaceNode');
        }
    };
    
    return Module;
});