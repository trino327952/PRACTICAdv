stage('Publicación') {
    steps {
        withCredentials([usernamePassword(credentialsId: 'Practica-3',
                                          usernameVariable: 'DOCKER_USER',
                                          passwordVariable: 'DOCKER_TOKEN')]) {
            sh '''
                echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin

                docker tag proyecto-3-backend:latest $DOCKER_USER/proyecto-3-backend:latest
                docker push $DOCKER_USER/proyecto-3-backend:latest

                docker tag proyecto-3-frontend:latest $DOCKER_USER/proyecto-3-frontend:latest
                docker push $DOCKER_USER/proyecto-3-frontend:latest

                docker logout
            '''
        }
    }
}
