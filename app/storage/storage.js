var sqlite3 = require('sqlite3').verbose();

var Storage = function(filename){
	this.db = new sqlite3.Database(filename);

	this.insertLevel = function(level){
		db.serialize(function(){
			db.run("CREATE TABLE if not exists LEVELS (id TEXT PRIMARY KEY, content TEXT)");
			var stmt = db.prepare("INSERT INTO LEVELS (id, content) VALUES (?,?)");
			stmt.run(level.id, JSON.stringify(level));
			stmt.finalize();
		});
	}

	this.close = function(){
		this.db.close();
	}
}