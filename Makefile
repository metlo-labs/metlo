build-dockers:
	docker build -f deploy/backend/Dockerfile -t metlo/backend:latest .
	docker build -f deploy/frontend/Dockerfile -t metlo/frontend:latest .
	docker build -f deploy/jobrunner/Dockerfile -t metlo/jobrunner:latest .
	docker build -f deploy/metlo-daemon-agent/Dockerfile -t metlo/agent:latest .

push-latest-dockers:
	docker push metlo/backend:latest
	docker push metlo/frontend:latest
	docker push metlo/jobrunner:latest
	docker push metlo/agent:latest