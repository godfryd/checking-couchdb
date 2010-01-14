
init:
	virtualenv pyve && ./pyve/bin/easy_install couchapp

upload:
	cd tests-reporting && couchapp push http://localhost:5984/tests-reporting

create:
	python tests-results/create.py

queries:
	python tests-results/queries.py tests-results