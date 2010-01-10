import sys
import couchdb

def query_tools(db):
    """list of tools and their scenarios"""
    mapf = """
    function(doc) {
      if (doc.type == 'tool') {
        emit([doc._id, 0], doc);
      } else if (doc.type == 'scenario') {
        emit([doc.tool, 1], doc);
      }
    }
    """
    tools = []
    print "tools"
    for r in db.query(mapf):
        tools.append(dict(key=r.key, value=r.value))
        print "\t", r.value
    return tools

def query_builds(db):
    """list of builds"""
    mapf = """
    function(doc) {
      if (doc.type == 'build') {
        emit(doc.name, doc._id);
      }
    }
    """
    builds = []
    print "builds"
    for r in db.query(mapf):
        builds.append(dict(name=r.key, id=r.value))
        #print "\t", r
    return builds

def query_build(db, build_id):
    """detailed test results for particular build"""
    mapf = """
    function(doc) {
      if (doc.type == 'build') {
        emit([doc._id, 0], doc);
      } else if (doc.type == 'job') {
        emit([doc.build, 1], {scenario: doc.scenario}); //, results: doc.results})
      }
    }
    """
    print "selected builds: %s" % str(build_id)
    for r in db.query(mapf, startkey=[build_id, 0], endkey=[build_id, 1]):
        print "\t", r.value

def query_passrate(db):
    """list of pass-rate for all or a range of builds for all their test jobs"""
    mapf = """
    function(doc) {
      if (doc.type == 'job') {
        var total = 0;
        var passed = 0;
        for (var tc in doc.results) {
           if (doc.results[tc] == 1) {
             passed += 1;
           }
           total += 1;
        }
        emit(doc.build, {scenario: doc.scenario, passed: passed, total: total});
      }
    }
    """
    print "passrate"
    for r in db.query(mapf):
        print "\t", r.key, r.value

def query_n_builds(db, builds_id):
    mapf = """
    function(doc) {
      if (doc.type == 'build') {
        emit(doc._id, doc);
      } else if (doc.type == 'job') {
        emit(doc.build, {scenario: doc.scenario, build: doc.build}); //, results: doc.results})
      }
    }
    """
    print "selected builds: %s" % str(builds_id)
    for r in db.query(mapf, keys=builds_id):
        print "\t", r.value

if __name__ == "__main__":
    server = couchdb.Server('http://localhost:5984/')
    dbname = sys.argv[1]
    print "connecting to database %s" % dbname
    db = server[dbname]

    tools = query_tools(db)
    builds = query_builds(db)
    query_build(db, builds[2]["id"])
    query_passrate(db)
    query_n_builds(db, [ b['id'] for b in builds[:2] ])
