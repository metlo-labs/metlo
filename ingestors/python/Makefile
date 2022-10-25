env:
	virtualenv env

build:
	rm -rf dist metlo.egg-info && python -m build

release:
	twine upload dist/*