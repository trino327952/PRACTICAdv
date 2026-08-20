pipeline {
    agent any
    stages {
        stage('Clonar') {
            steps {
                git 'https://github.com/trino327952/PRACTICAdv.git'
            }
        }
        stage('Prueba') {
            steps {
                echo 'Pipeline ejecutado correctamente!'
            }
        }
    }
}
