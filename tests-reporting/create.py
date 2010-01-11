import datetime
import random
import couchdb
import couchdb.design

def create_initial_db(db):
    print "creating initial data in db"
    # create test tools and scenarios
    scenarios = []
    j = 0
    for t in ["test tool 1", "test tool 2", "test tool 3"]:
        j += 1
        tool_id = db.create({'type': 'tool', 'name': t})

        # create scenarios
        for i in range(3):
            scen_id = db.create({'type': 'scenario', 'tool': tool_id, 
                                 "name": "scenario %d-%d" % (j, i)})
            scenarios.append(scen_id)
        
    return scenarios

def create_design_doc(db):
    maps = {}
    maps['tools'] = """
    function(doc) {
      if (doc.type == 'tool') {
        emit([doc._id, 0], doc);
      } else if (doc.type == 'scenario') {
        emit([doc.tool, 1], doc);
      }
    }
    """

    maps['builds'] = """
    function(doc) {
      if (doc.type == 'build') {
        emit(doc.name, doc._id);
      }
    }
    """

    maps['results'] = """
    function(doc) {
      if (doc.type == 'job') {
        emit(doc.build, doc)
      }
    }
    """
    
    maps['passrate'] = """
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
  
    for name, mapf in maps.iteritems():
        v = couchdb.design.ViewDefinition("reporting", name, mapf)
        v.sync(db)

def test_build(db, build_name, scenarios):
    print "submitting build %s" % build_name
    build_id = db.create({'type': 'build', 'name': build_name})

    for s in scenarios:
        # create test job
        job_id = db.create({'type': 'job',
                            'build': build_id, 'scenario': s})
        # add test results
        j = db[job_id]
        results = {}
        for i in xrange(2000):
            results["testcase_%d" % i] = random.randint(0, 1)
        j["results"] = results
        db.update([j])

        # store test log
        log = "asdfas"*100000
        db.put_attachment(j, log, "log.txt")

if __name__ == "__main__":
    server = couchdb.Server('http://localhost:5984/')
    dbname = 'tests-reporting'
    print "creating database %s" % dbname
    if dbname in server:
        server.delete(dbname)
    db = server.create(dbname)
    scenarios = create_initial_db(db)

    for i in range(10):
        test_build(db, "build_%d" % i, scenarios)

    create_design_doc(db)
