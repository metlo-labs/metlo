env:
	virtualenv env

build:
	rm -rf dist && python -m build

release:
	twine upload dist/*