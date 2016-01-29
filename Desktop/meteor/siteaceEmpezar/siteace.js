Websites = new Mongo.Collection("websites");

if (Meteor.isClient) {

	//


	//routing

	Router.configure({
		layoutTemplate: "layoutApplication"
	});

	Router.route('/', function () {
		this.render('navbar', {
			to:'navbar'
		});
		this.render('website_list',{
			to:'main'
		});
		this.render('website_form',{
			to:'form'
		})
	});

	Router.route('/details', function () {
		this.render('navbar', {
			to:'navbar'
		});
		this.render('details',{
			to:'main'
		})
	});
	///// accounts config

	Accounts.ui.config({
	passwordSignupFields: "USERNAME_AND_EMAIL"
	});


	Template.details.helpers({
		website:function () {
			return Websites.findOne({_id:Session.get("idDetails")});
		},
		getUser:function (user_id) {
			
			var user = Meteor.users.findOne({_id:user_id});
			if (user) {
				return user.username;
			}
			else {
				return "anon";
			}
		},
		getTime:function (CreatedOn) {
			return moment(CreatedOn).fromNow();
	}
	});


	// template helpers 
	/////
	

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			var search = Session.get("search");
			var regexValue='\.*'+search+'\.';
			console.log(search);
			if (search) {
				return Websites.find({title:new RegExp(regexValue, 'i')});
			}
			else{
			
				return Websites.find({}, {sort:{votesUp:-1}});
		}
	}
	});

	Template.website_list.events({
		

	});

	Template.details.events({
		"submit .js-save-comment":function (event) {
			if (Meteor.user()) {
				var commentForm = event.target.comment.value;
				var empty = true;
				console.log(empty);
				for (var i = 0; i < commentForm.length; i++) {
					if (commentForm[i] !== " ") {
						empty = false;
					}
				}
				console.log(empty);
				if (!empty){
					var websiteDetails = Websites.findOne({_id:Session.get("idDetails")});
					var coments= websiteDetails.comments;
					
					Websites.update(
						{_id:Session.get("idDetails")},
						{$push:{comments:{
							createdBy:Meteor.userId(),
							description:commentForm,
							createdOn:Date.now()
						}}
					});
					$("#comment").val("");
				}else{
					
				}

			}
			else{
				
				$('#modalComment').modal('show');

			}
			

			return false;
		}
		
	});

	//template events buscador

	Template.navbar.events({
		"keyup .js-search-input":function (event) {
			var search = $("#search").val();
			console.log(search);
			Session.set("search", search);

			return false;
		}
	});

	Template.website_item.events({
		"click .js-upvote":function(event){
			
			if (Meteor.user()) {
				var website_id = this._id;
			var website = Websites.findOne({_id:website_id});
			if (website) {
				var votos = website.votesUp + 1;
				Websites.update(
					{_id:website_id}, 
					{$set:{votesUp:votos}});
			}
			
			}
			else{
				//necesitas estar logeado
				console.log("no esta logeado")
				$('#modalWebsite').modal('show');

			}
	
			// put the code in here to add a vote to a website!

			return false;// prevent the button from reloading the page
		}, 
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
		if (Meteor.user()) {
				var website_id = this._id;
			var website = Websites.findOne({_id:website_id});
			if (website) {
				var votos = website.votesDown + 1;
				Websites.update(
					{_id:website_id}, 
					{$set:{votesDown:votos}});
				
			}	

		}else{
				//necesitas estar logeado
				console.log("//necesitas estar logeado");
				$('#modalWebsite').modal('show');
			}
			
			
			// put the code in here to remove a vote from a website!

			return false;// prevent the button from reloading the page
		},

		'click .js-get-details':function (event) {
			var idWeb = this._id;
			Session.set("idDetails", idWeb);
		}
	});

	Template.website_item.helpers({
		getDateCreated:function (createdOn) {
			return moment(createdOn).format('llll')
		}
	})

	Template.website_form.events({
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		}, 
		"submit .js-save-website-form":function(event){

			
			if (Meteor.user()) {

				var urlForm = event.target.url.value;
				var titleForm = event.target.title.value;
				var descriptionForm = event.target.description.value;
				
				if (urlForm != "" && descriptionForm != "" ) {
				var item = Websites.findOne({url:urlForm});
					console.log(item);
					if (!item) {

					Websites.insert({
					title: titleForm,
					url:urlForm,
					description:descriptionForm,
					createdOn:Date.now(),
					votesUp:0,
					votesDown: 0,
					comments:[{
						createdBy: "anon",
						description: "none",
						createdOn: Date.now()
					}]
				});
					$("#url").val("");
					$("#title").val("");
					$("#description").val("");
					$("#errorWebsite").hide("slow");
					}
					else{
						console.log("ya existe");
					$("#errorWebsite").val("The website already exists, try another one :)").show("slow");
				}
			
			 }
				
			}
			else{
				//necesitas estar logeado
				$('#modalFormWebsite').modal('show');
			}
			
			console.log("The url they entered is: "+urlForm);
			

			return false;// stop the form submit from reloading the page

		},
		'click .js-url-http':function (event) {
			var url = $("#url").val(); //this is a dummy url due to security reasons.
			console.log(url);
			console.log(Meteor.call('upload',url));
       		Meteor.call('upload', url, function(error, result){
       			var title = (result.content).match(/<title[^>]*>([^<]+)<\/title>/)[1];

       			$("#title").val(title);
       			console.log(title);

       			});
       		return false;
		}
	});
}


if (Meteor.isServer) {

	//methods server

	Meteor.methods({
	  	upload: function(url) {
	    this.unblock();
	    return Meteor.http.call("GET", url);

  }
});

	// start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
    	console.log("No websites yet. Creating starter data.");
    	  Websites.insert({
    		title:"Goldsmiths Computing Department", 
    		url:"http://www.gold.ac.uk/computing/", 
    		description:"This is where this course was developed.", 
    		createdOn:Date.now(),
    		votesUp:0,
    		votesDown:0,
    		comments:[{
						createdBy: "anon",
						description: "none",
						createdOn:Date.now()
					}]
    	});
    	 Websites.insert({
    		title:"University of London", 
    		url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route", 
    		description:"University of London International Programme.", 
    		createdOn:Date.now(),
    		votesUp:0,
    		votesDown:0,
    		comments:[]
    	});
    	 Websites.insert({
    		title:"Coursera", 
    		url:"http://www.coursera.org", 
    		description:"Universal access to the world’s best education.", 
    		createdOn:Date.now(),
    		votesUp:0,
    		votesDown:0,
    		comments:[{
						createdBy: "anon",
						description: "none",
						createdOn: Date.now()
					}]
    	});
    	Websites.insert({
    		title:"Google", 
    		url:"http://www.google.com", 
    		description:"Popular search engine.", 
    		createdOn:Date.now(),
    		votesUp:0,
    		votesDown:0,
    		comments:[{
						createdBy: "anon",
						description: "none",
						createdOn:Date.now()
					}]
    	});
    }
  });
}
