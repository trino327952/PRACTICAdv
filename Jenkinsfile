pipeline {
    agent any
    stages {
       stage('Clonar') {
    steps {
        git branch: 'main', url: 'https://github.com/trino327952/PRACTICAdv.git'
    }
}


        stage('Prueba') {
            steps {
                echo 'Pipeline ejecutado correctamente!'
            }
        }
    }
}
