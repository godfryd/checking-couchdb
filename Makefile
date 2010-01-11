upload:
	cd tr && couchapp push http://localhost:5984/tr

create:
	python tests-reporting/create.py

queries:
	python ../tests-reporting/queries.py tests-reporting