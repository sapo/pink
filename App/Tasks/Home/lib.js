Ink.createModule('App.Tasks.Home', '1', ['App.Tasks', 'Pink.Data.Binding_1', 'App.Tasks.DataProvider', 'Pink.Data.Grid_1', 'Pink.Data.Kanban_1'], function(app, ko, dataProvider, Grid, Kanban) {
    'use strict';

    var Module = function() {
        this.moduleName = 'App.Tasks.Home';
        this.tasks = ko.observableArray();
        this.todoTasks = ko.observableArray();
        this.completedTasks = ko.observableArray();        
        this.incompleteTasks = ko.observableArray();
        this.tasksModel = new Grid({
            data: this.tasks,
            pageSize: 10,
            pageSizeOptionList: [10, 20, 50, 100],
            showPageCaption: true,
            columns: [
              {headerText: ko.observable(''), rowTemplate: 'taskItemTemplate'},
            ]
        });
        this.tasksModel.parentModel = this;

        this.sections = ko.observableArray([new Kanban.Section({title: 'Todo', items: this.todoTasks}), 
                         new Kanban.Section({title: 'Incomplete', items: this.incompleteTasks}), 
                         new Kanban.Section({title: 'Complete', items: this.completedTasks})]);
        
        this.kanbanModel = {
            sections: this.sections, 
            cardsMovedHandler: this.tasksMovedHandler.bind(this),
            sectionMovedHandler: this.sectionMovedHandler.bind(this)
        };
        
        this.loadTasks();
        
        app.signals.taskAdded.add(this.taskAddedHandler.bind(this));
        app.signals.taskUpdated.add(this.taskUpdatedHandler.bind(this));
    };

    Module.prototype.initialize = function(data) {
    	if (!data.filter || data.filter == 'todo') {
    		this.tasksModel.columns[0].headerText('To-do');
    		this.tasks(this.todoTasks());
    	} else {
    		if (data.filter == 'complete') {
        		this.tasksModel.columns[0].headerText('Completed');
        		this.tasks(this.completedTasks());
    		} else {
        		this.tasksModel.columns[0].headerText('Incomplete');
        		this.tasks(this.incompleteTasks());
    		}
    	}
    };
    
    Module.prototype.loadTasks = function() {
    	var tasks = dataProvider.listTasks();
    	var task;
    	var todoTasks = [];
    	var completedTasks = [];
    	var incompleteTasks = [];

        this.todoTasks([]);
        this.completedTasks([]);        
        this.incompleteTasks([]);
    	
    	for (var i=0; i<tasks.length; i++) {
    		task = new Kanban.Card(tasks[i]);

    		task.title = task.subject;
    		task.content = task.description;
    		task.editHandler = this.editTask.bind(this, task);
    	
    		if (task.status=='todo') {
    			todoTasks.push(task);
    		}
    		
    		if (task.status=='completed') {
    			completedTasks.push(task);
    		}
    		
    		if (task.status=='incomplete') {
    			incompleteTasks.push(task);
    		}
    	}

        this.todoTasks(todoTasks);
        this.completedTasks(completedTasks);        
        this.incompleteTasks(incompleteTasks);
    };
    
    Module.prototype.tasksMovedHandler = function(source, tasks) {
    	var i;
    	var task;
    	var newStatus='todo';
    	
    	if (source==this.incompleteTasks) {
    		newStatus='incomplete';
    	} else if (source==this.completedTasks) {
    		newStatus='completed';
    	}

    	for (i=0; i<tasks.length; i++) {
    		task=tasks[i];
    		task.status=newStatus;
    	}

    	for (i=0; i<source().length; i++) {
    		task=source()[i];
    		dataProvider.deleteTask(task);
    		dataProvider.addTask(task);
    	}
    };
    
    Module.prototype.taskAddedHandler = function(task) {
    	this.loadTasks();
    };
    
    Module.prototype.taskUpdatedHandler = function(task) {
    	this.loadTasks();
    };
    
    Module.prototype.editTask = function(task) {
    	app.navigateTo('edit?id='+task._id);
    };

    Module.prototype.sectionMovedHandler = function(section, index) {
        var oldIndex = this.sections.indexOf(section);
        
        this.sections.splice(index, 0, section);
        
        if (oldIndex <= index) {
            this.sections.splice(oldIndex, 1);
        } else {
            this.sections.splice(oldIndex+1, 1);
        }
    };
    
    return new Module();
});
