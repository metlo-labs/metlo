DOCKER_IMAGE_TAG?=latest

build-dockers:
	docker build -f deploy/backend/Dockerfile -t metlo/backend:${DOCKER_IMAGE_TAG} .
	docker build -f deploy/frontend/Dockerfile -t metlo/frontend:${DOCKER_IMAGE_TAG} .
	docker build -f deploy/jobrunner/Dockerfile -t metlo/jobrunner:${DOCKER_IMAGE_TAG} .

push-dockers:
	docker push metlo/backend:${DOCKER_IMAGE_TAG}
	docker push metlo/frontend:${DOCKER_IMAGE_TAG}
	docker push metlo/jobrunner:${DOCKER_IMAGE_TAG}
	docker push metlo/agent:${DOCKER_IMAGE_TAG}