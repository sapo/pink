Ink.createModule('App.Images.Search', '1', ['App.Images', 'Pink.Data.Binding', 'Ink.Net.JsonP_1', 'Pink.Data.Tabs_1', 'Pink.Data.Carousel_1'], function(app, ko, JsonP) {
    var Module = function() {
        var self=this;
        
        this.photos = ko.observableArray();
        this.noPhotos = ko.computed(function() {
        	return self.photos().length==0;
        });
        this.search = ko.observable('');
        this.searching = ko.observable(false);
        this.itemCount = ko.observable('10');
        this.carouselRefitHandler = ko.observable();
        this.apiKey = undefined;
        
        this.search.subscribe(this.searchChangeHandler.bind(this));
        this.itemCount.subscribe(this.searchChangeHandler.bind(this));
        app.signals.providerConfigUpdated.add(this.handleProviderConfig.bind(this));
    };
    
    Module.prototype.tabChangeHandler = function() {
    	if (this.carouselRefitHandler()) {
    		this.carouselRefitHandler()();
    	}
    };

    Module.prototype.handleProviderConfig = function(config) {
    	this.apiKey = config.key;
    	this.itemCount(config.itemCount);
    	this.searchChangeHandler();
    };
    
    Module.prototype.searchChangeHandler = function() {
    	var search = this.search();
    	var itemCount = ~~this.itemCount();
    	
    	if (this.timer) {
    		window.clearTimeout(this.timer);
    	}

    	if (search.length > 2) {
			this.timer = window.setTimeout(this.doSearch.bind(this, search, itemCount), 1000);
    	}
    };

    Module.prototype.showProviderConfig = function() {
		app.showMiniModalWindow('Search provider config', 'App.Images.ProviderConfig', {
			apiKey: this.apiKey,
			itemCount: this.itemCount()
		});
    };
    
    Module.prototype.doSearch = function(search, itemCount) {
    	var self=this;
		var uri = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json';

    	if (!this.apiKey) {
    		this.showProviderConfig();
    		return;
    	}
		
		this.searching(true);
		this.photos([]);
		
		new JsonP(uri, {
	        params: {
	        	tags: search,
	        	per_page: itemCount,
	        	api_key: this.apiKey,
	        }, 
	        callbackParam: 'jsoncallback',
	        onSuccess: function(data) {
	            var aItems;
	            var photos = [];
	            var i;
	            var item;

	            if (data.photos && data.photos.photo) {
	            	aItems = data.photos.photo
		            for(i=0, total=aItems.length; i < total; i++) {
		            	item=aItems[i];
		                photos.push({
		                	tbUrl: 'https://farm'+item.farm+'.staticflickr.com/'+item.server+'/'+item.id+'_'+item.secret+'_t.jpg',
		                	url: 'https://farm'+item.farm+'.staticflickr.com/'+item.server+'/'+item.id+'_'+item.secret+'_b.jpg',
		                	title: item.title,
		                	clickHandler: self.viewPhoto.bind(self)
		                });
		            }
	            } else {
		        	app.showErrorToast('Failure in photos service');
		        	self.apiKey = undefined;
	            }
	            
	    		self.searching(false);
	            self.photos(photos);
	        }, 
	        onFailure: function() {
	    		self.searching(false);
	        	app.showErrorToast('Failure in photos service');
	        }
	    });
    };

    Module.prototype.viewPhoto = function(photo) {
    	app.signals.viewPhoto.dispatch(photo);
    };

    return new Module();
});
