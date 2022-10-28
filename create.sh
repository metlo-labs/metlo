kind create cluster --name test-deployment
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
kubectl apply -f kube.yaml
kubectl apply -f user.yaml
kubectl apply -f user-spec.yaml
kubectl -n kubernetes-dashboard create token admin-user
