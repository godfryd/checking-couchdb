all: init create upload

init:
	virtualenv pyve && ./pyve/bin/easy_install couchapp

create:
	python tests-results/create.py

queries:
	python tests-results/queries.py tests-results

upload:
	./pyve/bin/couchapp push tests-reporting http://localhost:5984/tests-reporting

