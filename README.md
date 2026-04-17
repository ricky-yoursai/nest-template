# Docker Push

1.  sudo docker build -t yoursai/common-auth:latest .
2.  sudo docker push yoursai/common-auth:latest
3.  docker-compose down && docker rmi yoursai/common-auth:latest && docker-compose up -d --force-recreate