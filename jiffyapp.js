/*! Jiffy Application
 *  By: Matthew Robb
 */

(function(window, $, Jiffy){
	
	var App, body, tmpls, title, alerts, feed, display;
	
	// Application initialization object, will get fed into jQuery's DOMReady function
	App = function(){
		body = $("body");
		title = $("head title");
		alerts = $("#alerts");
		feed = $("#feed");
		display = $("#display");
		
		// We only want the App function to run ONCE
		if(body.hasClass("init")) return App;
		else body.addClass("init");
		
		// This object holds a reference to each of the jQuery Template's for this app
		tmpls = {
			title: $("#tmpl-jiffy-title"),
			updates: $("#tmpl-jiffy-updates"),
			photos: $("#tmpl-jiffy-photos"),
			alerts: $("#tmpl-jiffy-alerts")
		}
		
		// This function will get run after each photo request completes
		Jiffy("update", function(photos){
			document.title = "Jiffy" + ( Jiffy.updates > 0 ? " - " + Jiffy.updates : "");
			alerts.empty().append(tmpls.alerts.tmpl());
			tmpls.photos.tmpl({photos:photos}).prependTo(display);
			if(Jiffy.updates > 0) feed.addClass("new");
		});
		
		// This function will get run after each reset, adding 'updates' photos to 'all'
		Jiffy("reset", function(photos){
			feed.find("div.new").removeClass("new");
			document.title = "Jiffy" + ( Jiffy.updates > 0 ? " - " + Jiffy.updates : "");
			tmpls.updates.tmpl({photos:photos}).prependTo(feed);
			alerts.empty().append(tmpls.alerts.tmpl());
			if(Jiffy.updates < 1) feed.removeClass("new");
		});
		
		// Using event delegation we will trigger methods off the App object
		body.delegate('a[href*="#"]', "click", function(e){
			var target = ($(e.target).attr("href") || $(e.target).closest("a").attr("href")).split("#")[1];
			if(typeof App[target] === "function" && App[target].call(e.target, e)) e.preventDefault();
		});
		
		// Start the polling process
		App.start(function(){
			
			// We want to use the first request result for the initial display photos
			var init = function(){
				
				Jiffy.stop().reset().unbind("update",init).start();
				feed.find("input").last().closest("div").find("a").click();
			}
			
			Jiffy("update", init);
		});
	}
	
	// Using jQuery's extend method we add methods to the App object
	// These methods will be callable via A elements in the DOM
	// A link needs an href that starts with a hash and shares a name with a method
	$.extend(App, {
		
		// This will put the app into started mode and making image requests
		start: function(callback){
			Jiffy.start(callback);
			if(Jiffy.status === "started") {
				body.removeClass("stopped");
				body.addClass("started");
			}
		},
		
		// This puts the app into stopped mode and stops all requests
		stop: function(callback){
			Jiffy.stop(callback);
			if(Jiffy.status === "stopped") {
				body.removeClass("started");
				body.addClass("stopped");
			}
		},
		
		// Starts the process of taking the 'updates' photos and moving them to 'all'
		reset: function(){
			var status = Jiffy.status;
			
			Jiffy.stop().reset(function(){
				if(status === "started") setTimeout(Jiffy.start, Jiffy.delay);
			});
		},
		
		// Displays more information to the right of the feed for the chosen photo
		photo: function(e){
			var el = $(e.target).closest("div"),
				id = el.find("input").val();

			if(el.hasClass("current")) return;
			
			feed.find("div.current").removeClass("current");
			
			el.removeClass("new");
			display.find("div.current").removeClass("current");
			
			el.addClass("current");
			$("#"+id).addClass("current");
		}
		
	});
	
	
	// Put the App initializer function into the jQuery DOMReady method
	$(App);

})(this, jQuery, Jiffy);