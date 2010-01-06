import datetime
import random
import couchdb

def create_initial_db(db):
    print "creating initial data in db"
    # create test tools and scenarios
    scenarios = []
    for t in ["test tool 1", "test tool 2", "test tool 3"]:
        tool_id = db.create({'type': 'tool', 'name': t})

        # create scenarios
        for i in range(3):
            scen_id = db.create({'type': 'scenario', 'tool': tool_id, 
                                 "cmd": "run %d" % i})
            scenarios.append(scen_id)
    return scenarios

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
        for i in xrange(10000):
            results["testcase_%d" % i] = random.randint(0, 1)
        j["results"] = results
        db.update([j])

        # store test log
        log = "asdfas"*100000
        db.put_attachment(j, log, "log.txt")

if __name__ == "__main__":
    server = couchdb.Server('http://localhost:5984/')
    dbname = 'tests-'+str(datetime.datetime.now())
    dbname = dbname.replace(" ", "_").replace(":", "-").replace(".", "_")
    print "creating database %s" % dbname
    db = server.create(dbname)
    scenarios = create_initial_db(db)

    for i in range(10):
        test_build(db, "build_%d" % i, scenarios)

    query_build(db)
