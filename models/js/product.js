var rc = require('rhoconnect_helpers');

var dblite = require('dblite');

var Product = function(){

  // use a database in the root folder of our project
  var db = dblite(__dirname+'/../../database.db');
  
  // create a table to store products if we have not done so yet
  db.query('create table if not exists Products (id integer primary key, name text, brand text)');


  this.login = function(resp){
    // TODO: Login to your data source here if necessary
    resp.send(true);
  };

  this.query = function(resp){
      // fetch all rows from the Products table
      db.query("select * from Products", {id: Number, name:String, brand: String}, function(rows) {

        var result = {};
        // iterate over the rows
        for (var i=0; i<rows.length; i++) {
          var row = rows[i];
          // our result value must be a hash of hashes with the structure
          // identifier : { "property" : "value" }
          result[row.id] = {"name" : row.name, "brand": row.brand}; 
        }

        // return the result to the mobile app
        resp.send(result);      
      });
  };

  this.create = function(resp){
      // create the product in our database
      db.query("insert into Products values (:id, :name, :brand)",
        {
          id: null, // sqlite will populate this value automatically

          // for the rest, we use what we received from the mobile app,
          // or null if we didn't get anything for that property
          name: resp.params.create_object.name || null, 
          brand: resp.params.create_object.brand || null
        });

      // send back the new product's primary key
      db.lastRowID("Products", function(lastRowID) {
        resp.send(lastRowID);  
      });
  };

  this.update = function(resp){
      var query = "update Products set ";
      var values = {};

      var known_fields = ["name", "brand"];

      var should_prepend_comma = false;

      for (var i=0; i<known_fields.length; i++) {
        var field = known_fields[i];
        var value = resp.params.update_object[field]; 
        if (typeof(value)!=="undefined") {
          if (should_prepend_comma) {
            query+=", ";
          } else {
            // we will need it next time
            should_prepend_comma = true;
          }
          query+=field+"=:"+field;
          values[field]=resp.params.update_object[field];
        }
      }
      query+=" where id=:id";
      values.id = resp.params.update_object.id;
      db.query(query, values);
      resp.send(true);
  };
  
  this.del = function(resp){
    db.query("delete from Products where id=:id",
      {
        id: resp.params.delete_object.id
      });
    resp.send(true);
  };

  this.logoff = function(resp){
    // TODO: Logout from the data source if necessary.
    resp.send(true);
  };

  this.storeBlob = function(resp){
    // TODO: Handle post requests for blobs here.
    // Reference the blob object's path with resp.params.path.
    new rc.Exception(
      resp, "Please provide some code to handle blobs if you are using them."
    );
  };
};

module.exports = new Product();