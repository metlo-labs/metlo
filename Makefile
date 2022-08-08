build-dockers:
	docker build -f deploy/backend/Dockerfile -t metlo/backend:latest .
	docker build -f deploy/frontend/Dockerfile -t metlo/frontend:latest .
	docker build -f deploy/jobrunner/Dockerfile -t metlo/jobrunner:latest .

push-latest-dockers:
	docker push metlo/backend:latest
	docker push metlo/frontend:latest
	docker push metlo/jobrunner:latest